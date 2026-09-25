/* HTML → 이미지 변환 (Log Studio)
 * - 미리보기 iframe(스크립트 실행 안 함)에 HTML을 그리고, 지금 보이는 DOM을 그대로 이미지로 만든다.
 * - <details> 접기는 사용자가 열고 닫을 때 브라우저가 open 속성을 갱신하므로, 캡처 시점의 상태가 그대로 저장된다.
 * - 캡처 엔진: html-to-image (vendor/html-to-image.js, MIT)
 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    src: $('src'), file: $('file'), openFile: $('openFile'), clearSrc: $('clearSrc'), drop: $('drop'), apply: $('apply'),
    width: $('width'), widthOut: $('widthOut'), widthPresets: $('widthPresets'),
    pad: $('pad'), padOut: $('padOut'),
    bgSeg: $('bgSeg'), bgColor: $('bgColor'), scaleSeg: $('scaleSeg'), fmtSeg: $('fmtSeg'), fname: $('fname'),
    expandAll: $('expandAll'), collapseAll: $('collapseAll'), foldCount: $('foldCount'),
    copyImg: $('copyImg'), save: $('save'),
    stage: $('stage'), empty: $('empty'), frameBox: $('frameBox'), frame: $('frame'), sizeInfo: $('sizeInfo'), toast: $('toast')
  };

  // 캔버스 한계(브라우저마다 다름). 넘으면 배율을 자동으로 낮춘다.
  var MAX_SIDE = 32000;
  var MAX_AREA = 120000000;
  var STORE_KEY = 'log_studio.html_to_image.options';
  var STYLE_ID = '__hti_style__';

  var state = { width: 800, pad: 0, bg: 'transparent', bgColor: '#f4f2f7', scale: 2, fmt: 'png', loaded: false, busy: false };
  var pollTimer = null;
  var lastHeight = 0;

  /* ---------- 옵션 저장/복원 (실패해도 동작에는 영향 없음) ---------- */
  function loadOptions() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        ['width', 'pad', 'scale'].forEach(function (k) { if (typeof saved[k] === 'number') state[k] = saved[k]; });
        ['bg', 'bgColor', 'fmt'].forEach(function (k) { if (typeof saved[k] === 'string') state[k] = saved[k]; });
      }
    } catch (e) { /* 저장소 사용 불가 */ }
  }
  function saveOptions() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        width: state.width, pad: state.pad, bg: state.bg, bgColor: state.bgColor, scale: state.scale, fmt: state.fmt
      }));
    } catch (e) { /* 무시 */ }
  }

  /* ---------- 공통 ---------- */
  var toastTimer = null;
  function toast(msg, ms) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('show'); }, ms || 2400);
  }
  function setSeg(seg, attr, value) {
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      b.classList.toggle('on', b.getAttribute(attr) === String(value));
    });
  }
  function bgValue() {
    if (state.bg === 'transparent') return null;
    if (state.bg === 'custom') return state.bgColor;
    return state.bg;
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function defaultName() {
    var d = new Date();
    return 'log-' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + pad2(d.getHours()) + pad2(d.getMinutes());
  }
  function safeName(s) {
    s = (s || '').trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\.(png|jpe?g)$/i, '');
    return s || defaultName();
  }
  function doc() {
    try { return els.frame.contentDocument; } catch (e) { return null; }
  }

  /* ---------- UI 반영 ---------- */
  function syncUI() {
    els.width.value = state.width;
    els.widthOut.textContent = state.width + 'px';
    setSeg(els.widthPresets, 'data-w', state.width);
    els.pad.value = state.pad;
    els.padOut.textContent = state.pad + 'px';
    setSeg(els.bgSeg, 'data-bg', state.bg);
    els.bgColor.value = state.bgColor;
    els.bgColor.hidden = state.bg !== 'custom';
    setSeg(els.scaleSeg, 'data-s', state.scale);
    setSeg(els.fmtSeg, 'data-f', state.fmt);
    var disabled = !state.loaded || state.busy;
    els.save.disabled = disabled;
    els.copyImg.disabled = disabled || state.fmt !== 'png';
    els.copyImg.title = state.fmt !== 'png' ? '클립보드 복사는 PNG만 지원합니다' : '';
    els.expandAll.disabled = !state.loaded;
    els.collapseAll.disabled = !state.loaded;
  }

  /* ---------- 미리보기 ---------- */
  function buildDoc(html) {
    var isFull = /<!doctype|<html[\s>]|<body[\s>]|<head[\s>]/i.test(html);
    var guard = '<base target="_blank">'; // sandbox에서 팝업이 막혀 있으므로 링크를 눌러도 이동하지 않음
    if (isFull) {
      if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, function (m) { return m + guard; });
      return html.replace(/<html[^>]*>/i, function (m) { return m + '<head>' + guard + '</head>'; });
    }
    return '<!doctype html><html><head><meta charset="utf-8">' + guard + '</head><body>' + html + '</body></html>';
  }

  function injectStyle(d) {
    if (!d || !d.documentElement) return;
    var st = d.getElementById(STYLE_ID);
    if (!st) {
      st = d.createElement('style');
      st.id = STYLE_ID;
      (d.head || d.documentElement).appendChild(st);
    }
    var bg = bgValue();
    st.textContent =
      ':root{color-scheme:light;background:' + (bg || 'transparent') + ' !important;}' +
      'body{margin:0 !important;padding:' + state.pad + 'px !important;display:flow-root !important;' +
      'min-height:0 !important;box-sizing:border-box !important;width:100% !important;}' +
      'summary{cursor:pointer;}';
  }

  function applyWidth() {
    els.frame.style.width = state.width + 'px';
    fitHeight(true);
  }

  function contentHeight(d) {
    if (!d || !d.body) return 0;
    return Math.ceil(Math.max(d.body.scrollHeight, d.body.getBoundingClientRect().height));
  }

  function fitHeight(force) {
    var d = doc();
    if (!d || !d.body) return;
    // 한 번 작게 만든 뒤 재야 접었을 때 줄어든 높이가 반영된다
    if (force) els.frame.style.height = '0px';
    var h = contentHeight(d);
    if (force || h !== lastHeight) {
      lastHeight = h;
      els.frame.style.height = Math.max(h, 40) + 'px';
      updateInfo();
    }
  }

  function updateFolds() {
    var d = doc();
    if (!d) { els.foldCount.textContent = ''; return; }
    var all = d.querySelectorAll('details');
    if (!all.length) { els.foldCount.textContent = '접기 블록 없음'; return; }
    var open = 0;
    Array.prototype.forEach.call(all, function (x) { if (x.open) open++; });
    els.foldCount.textContent = '접기 ' + all.length + '개 · 펼침 ' + open + '개';
  }

  function plannedScale(w, h) {
    var s = state.scale;
    if (w * s > MAX_SIDE) s = MAX_SIDE / w;
    if (h * s > MAX_SIDE) s = Math.min(s, MAX_SIDE / h);
    if (w * h * s * s > MAX_AREA) s = Math.min(s, Math.sqrt(MAX_AREA / (w * h)));
    return s;
  }

  function updateInfo() {
    var d = doc();
    if (!state.loaded || !d || !d.body) { els.sizeInfo.textContent = ''; return; }
    var w = d.body.offsetWidth, h = contentHeight(d);
    var s = plannedScale(w, h);
    var W = Math.round(w * s), H = Math.round(h * s);
    var text = '저장 크기: ' + W.toLocaleString() + ' × ' + H.toLocaleString() + ' px';
    if (s < state.scale) {
      els.sizeInfo.innerHTML = text + ' — <span class="warn">내용이 길어 배율을 ' + s.toFixed(2) + 'x로 낮춰 저장합니다.</span>';
    } else {
      els.sizeInfo.textContent = text + ' (배율 ' + state.scale + 'x)';
    }
  }

  function startWatch() {
    clearInterval(pollTimer);
    // 이미지 로딩·접기 전환 등으로 높이가 바뀌는 것을 따라간다
    pollTimer = setInterval(function () { fitHeight(false); updateFolds(); }, 400);
  }

  function load(html) {
    html = (html || '').trim();
    if (!html) { toast('먼저 HTML을 넣어주세요.'); return; }
    state.loaded = false;
    syncUI();
    els.empty.hidden = true;
    els.frameBox.hidden = false;
    els.frame.style.width = state.width + 'px';
    els.frame.onload = function () {
      var d = doc();
      if (!d) { toast('미리보기를 열지 못했습니다.'); return; }
      injectStyle(d);
      d.addEventListener('toggle', function () { setTimeout(function () { fitHeight(true); updateFolds(); }, 0); }, true);
      d.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (a) e.preventDefault();
      }, true);
      state.loaded = true;
      syncUI();
      fitHeight(true);
      updateFolds();
      startWatch();
      if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { fitHeight(true); });
    };
    els.frame.srcdoc = buildDoc(html);
  }

  /* ---------- 캡처 ---------- */
  function capture(asBlob) {
    var d = doc();
    if (!d || !d.body || !window.htmlToImage) return Promise.reject(new Error('미리보기가 준비되지 않았습니다.'));
    fitHeight(true);
    var node = d.body;
    var w = node.offsetWidth, h = contentHeight(d);
    var s = plannedScale(w, h);
    var bg = bgValue();
    var isJpg = state.fmt === 'jpg';
    var opts = {
      width: w,
      height: h,
      pixelRatio: s,
      skipAutoScale: true,
      cacheBust: false,
      backgroundColor: bg || (isJpg ? '#ffffff' : undefined),
      imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      filter: function (n) { return !(n && n.id === STYLE_ID); },
      style: { margin: '0' }
    };
    var lib = window.htmlToImage;
    if (asBlob) return lib.toBlob(node, opts);
    return isJpg ? lib.toJpeg(node, Object.assign({ quality: 0.92 }, opts)) : lib.toPng(node, opts);
  }

  function setBusy(b, label) {
    state.busy = b;
    els.save.textContent = b ? (label || '만드는 중…') : '이미지 저장';
    syncUI();
  }

  function doSave() {
    if (!state.loaded || state.busy) return;
    setBusy(true);
    capture(false).then(function (dataUrl) {
      var a = document.createElement('a');
      a.href = dataUrl;
      a.download = safeName(els.fname.value) + (state.fmt === 'jpg' ? '.jpg' : '.png');
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast('이미지를 저장했습니다.');
    }).catch(function (err) {
      console.error(err);
      toast('이미지를 만들지 못했습니다. 외부 이미지·폰트가 막혔거나 내용이 너무 길 수 있습니다.', 4200);
    }).then(function () { setBusy(false); });
  }

  function doCopy() {
    if (!state.loaded || state.busy) return;
    if (!navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
      toast('이 브라우저는 이미지 복사를 지원하지 않습니다. 저장을 이용해주세요.', 3600);
      return;
    }
    setBusy(true, '복사 중…');
    // Safari 호환을 위해 Promise를 그대로 넘긴다
    var item = new ClipboardItem({ 'image/png': capture(true) });
    navigator.clipboard.write([item]).then(function () {
      toast('클립보드에 복사했습니다.');
    }).catch(function (err) {
      console.error(err);
      toast('복사하지 못했습니다. 저장을 이용해주세요.', 3600);
    }).then(function () { setBusy(false); });
  }

  /* ---------- 파일 불러오기 ---------- */
  function readFile(f) {
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      els.src.value = String(r.result || '');
      if (!els.fname.value) els.fname.value = f.name.replace(/\.(html?|txt)$/i, '');
      load(els.src.value);
    };
    r.onerror = function () { toast('파일을 읽지 못했습니다.'); };
    r.readAsText(f, 'utf-8');
  }

  /* ---------- 이벤트 ---------- */
  els.apply.addEventListener('click', function () { load(els.src.value); });
  els.src.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); load(els.src.value); }
  });
  els.openFile.addEventListener('click', function () { els.file.click(); });
  els.file.addEventListener('change', function () { readFile(els.file.files[0]); els.file.value = ''; });
  els.clearSrc.addEventListener('click', function () { els.src.value = ''; els.src.focus(); });

  ['dragenter', 'dragover'].forEach(function (t) {
    els.drop.addEventListener(t, function (e) {
      if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) {
        e.preventDefault();
        els.drop.classList.add('over');
      }
    });
  });
  ['dragleave', 'drop'].forEach(function (t) {
    els.drop.addEventListener(t, function () { els.drop.classList.remove('over'); });
  });
  els.drop.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      e.preventDefault();
      readFile(e.dataTransfer.files[0]);
    }
  });

  els.widthPresets.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-w]');
    if (!b) return;
    state.width = +b.getAttribute('data-w');
    syncUI(); saveOptions(); applyWidth();
  });
  els.width.addEventListener('change', function () {
    var v = Math.round(+els.width.value);
    if (!isFinite(v) || v < 200) v = 200;
    if (v > 3000) v = 3000;
    state.width = v;
    syncUI(); saveOptions(); applyWidth();
  });
  els.pad.addEventListener('input', function () {
    state.pad = +els.pad.value;
    syncUI(); injectStyle(doc()); fitHeight(true);
  });
  els.pad.addEventListener('change', saveOptions);
  els.bgSeg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-bg]');
    if (!b) return;
    state.bg = b.getAttribute('data-bg');
    syncUI(); saveOptions(); injectStyle(doc());
  });
  els.bgColor.addEventListener('input', function () {
    state.bgColor = els.bgColor.value;
    injectStyle(doc());
  });
  els.bgColor.addEventListener('change', saveOptions);
  els.scaleSeg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-s]');
    if (!b) return;
    state.scale = +b.getAttribute('data-s');
    syncUI(); saveOptions(); updateInfo();
  });
  els.fmtSeg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-f]');
    if (!b) return;
    state.fmt = b.getAttribute('data-f');
    syncUI(); saveOptions();
  });

  function setAllFolds(open) {
    var d = doc();
    if (!d) return;
    Array.prototype.forEach.call(d.querySelectorAll('details'), function (x) { x.open = open; });
    setTimeout(function () { fitHeight(true); updateFolds(); }, 0);
  }
  els.expandAll.addEventListener('click', function () { setAllFolds(true); });
  els.collapseAll.addEventListener('click', function () { setAllFolds(false); });
  els.save.addEventListener('click', doSave);
  els.copyImg.addEventListener('click', doCopy);

  loadOptions();
  els.fname.placeholder = defaultName();
  syncUI();
})();

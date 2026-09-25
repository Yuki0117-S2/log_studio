/* HTML → 이미지 변환 (Log Studio) — 1b 교정지 테마
 * - 원고(CodeMirror) ↔ 교정지(iframe) 위치 연결: source-map.js
 * - 교정지는 스크립트를 실행하지 않는다(sandbox). 접기 상태는 DOM의 open 속성 그대로 캡처된다.
 * - 캡처: html-to-image (vendor/html-to-image.js, MIT)
 * - 다른 서버 그림은 서버가 CORS를 허용해야 캡처된다. 허용하지 않는 그림은 목록으로 알리고 로컬 파일로 대체할 수 있다.
 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var CMX = window.CM, SM = window.HtiSourceMap;
  var els = {
    desk: $('desk'), editorWrap: $('editorWrap'), editorHost: $('editor'), dropHint: $('dropHint'),
    file: $('file'), openFile: $('openFile'), clearSrc: $('clearSrc'), crumb: $('crumb'), apply: $('apply'), gutter: $('gutter'),
    expandAll: $('expandAll'), collapseAll: $('collapseAll'), foldCount: $('foldCount'), zoomBtn: $('zoomBtn'), boxBtn: $('boxBtn'),
    stage: $('stage'), empty: $('empty'), crop: $('crop'), paper: $('paper'), frame: $('frame'), sizeInfo: $('sizeInfo'),
    errata: $('errata'), errataTitle: $('errataTitle'), errataList: $('errataList'), errataPick: $('errataPick'),
    errataToggle: $('errataToggle'), errataFiles: $('errataFiles'), errataOne: $('errataOne'),
    width: $('width'), widthOut: $('widthOut'), widthPresets: $('widthPresets'), widthCustomBtn: $('widthCustomBtn'),
    pad: $('pad'), padOut: $('padOut'), bgSeg: $('bgSeg'), bgColor: $('bgColor'), bgColorRow: $('bgColorRow'), customSwatch: $('customSwatch'),
    scaleSeg: $('scaleSeg'), fmtSeg: $('fmtSeg'), fname: $('fname'), save: $('save'), copyImg: $('copyImg'), toast: $('toast')
  };

  var MAX_SIDE = 32000, MAX_AREA = 120000000;
  var STORE_KEY = 'log_studio.html_to_image.options';
  var WORK_KEY = 'log_studio.html_to_image.work';   // 마지막 원고(이어하기)
  var THEME_KEY = 'log_studio.html_to_image.theme';
  var STYLE_ID = '__hti_style__';
  var EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  var FETCH_INIT = { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' };

  var state = { width: 800, pad: 0, bg: 'transparent', bgColor: '#f2eee5', scale: 2, fmt: 'png', fit: true, msW: 460, boxes: true,
                customWidth: false, loaded: false, busy: false, dirty: false };
  var model = null;          // 현재 교정지에 앉힌 원고의 위치 정보
  var selId = null, hoverId = null;
  var viewScale = 1, lastHeight = 0, pollTimer = null, renderTimer = null, loadWaiters = [];
  var imgStatus = new Map();   // url -> 'pending' | 'ok' | 'fail'
  var replacements = new Map(); // url -> { data, name }
  var failList = [];           // 이번 원고에서 캡처할 수 없는 그림 url(순서대로)
  var errataTarget = null;
  var pendingFolds = null, pendingCursor = null, workTimer = null, workWarned = false;

  /* ================= 공통 ================= */
  var toastTimer = null;
  function toast(msg, ms) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('show'); }, ms || 2600);
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
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function doc() { try { return els.frame.contentDocument; } catch (e) { return null; } }
  function bgValue() { return state.bg === 'transparent' ? null : state.bg === 'custom' ? state.bgColor : state.bg; }

  function loadOptions() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (s && typeof s === 'object') {
        ['width', 'pad', 'scale', 'msW'].forEach(function (k) { if (typeof s[k] === 'number' && isFinite(s[k])) state[k] = s[k]; });
        ['bg', 'bgColor', 'fmt'].forEach(function (k) { if (typeof s[k] === 'string') state[k] = s[k]; });
        if (typeof s.fit === 'boolean') state.fit = s.fit;
        if (typeof s.boxes === 'boolean') state.boxes = s.boxes;
      }
    } catch (e) { /* 저장소 사용 불가 */ }
  }
  function saveOptions() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ width: state.width, pad: state.pad, bg: state.bg, bgColor: state.bgColor,
        scale: state.scale, fmt: state.fmt, fit: state.fit, msW: state.msW, boxes: state.boxes }));
    } catch (e) { /* 무시 */ }
  }

  /* ================= 원고 편집기 (CodeMirror) ================= */
  var setMarks = CMX.StateEffect.define();
  var markField = CMX.StateField.define({
    create: function () { return CMX.Decoration.none; },
    update: function (v, tr) {
      v = v.map(tr.changes);
      for (var i = 0; i < tr.effects.length; i++) if (tr.effects[i].is(setMarks)) v = tr.effects[i].value;
      return v;
    },
    provide: function (f) { return CMX.EditorView.decorations.from(f); }
  });

  var paperHighlight = CMX.HighlightStyle.define([
    { tag: CMX.tags.tagName, color: 'var(--cm-tag)', fontWeight: '500' },
    { tag: CMX.tags.attributeName, color: 'var(--cm-attr)' },
    { tag: CMX.tags.attributeValue, color: 'var(--cm-value)' },
    { tag: CMX.tags.string, color: 'var(--cm-value)' },
    { tag: CMX.tags.comment, color: 'var(--cm-comment)', fontStyle: 'italic' },
    { tag: [CMX.tags.angleBracket, CMX.tags.punctuation, CMX.tags.separator], color: 'var(--cm-punct)' },
    { tag: [CMX.tags.propertyName, CMX.tags.variableName], color: 'var(--cm-attr)' },
    { tag: [CMX.tags.number, CMX.tags.unit, CMX.tags.color], color: 'var(--cm-num)' },
    { tag: [CMX.tags.keyword, CMX.tags.processingInstruction, CMX.tags.documentMeta], color: 'var(--cm-kw)', fontWeight: '600' },
    { tag: CMX.tags.invalid, color: '#ee1166' }
  ]);

  // 색은 style.css의 --cm-* 변수로 정의해 라이트/다크를 함께 따른다
  var paperTheme = CMX.EditorView.theme({
    '&': { height: '100%', backgroundColor: 'var(--cm-bg)', color: 'var(--cm-text)', fontSize: '12.5px' },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': { fontFamily: '"JetBrains Mono", ui-monospace, Consolas, monospace', lineHeight: '22px' },
    '.cm-content': { padding: '12px 0 90px', caretColor: 'var(--cm-caret)',
      backgroundImage: 'repeating-linear-gradient(transparent 0 21px, var(--cm-rule) 21px 22px)', backgroundPosition: '0 12px' },
    '.cm-line': { padding: '0 14px 0 10px' },
    '.cm-gutters': { backgroundColor: 'var(--cm-gutter)', color: 'var(--cm-gutter-text)', borderRight: '1px solid var(--line)' },
    '.cm-activeLineGutter': { backgroundColor: 'var(--cm-active)', color: 'var(--ink)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--cm-caret)', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'var(--cm-sel) !important' },
    '.cm-selectionMatch': { backgroundColor: 'var(--cm-hover)' },
    '.cm-matchingBracket': { backgroundColor: 'var(--cm-mark)', outline: 'none' },
    '.cm-placeholder': { color: 'var(--cm-gutter-text)', fontStyle: 'italic' },
    '.cm-hti-range': { backgroundColor: 'var(--cm-range)' },
    '.cm-hti-tag': { backgroundColor: 'var(--cm-mark)', borderRadius: '2px', boxShadow: 'inset 0 -2px 0 var(--cm-tag)' },
    '.cm-hti-hover': { backgroundColor: 'var(--cm-hover)', borderRadius: '2px' },
    '.cm-panels': { backgroundColor: 'var(--paper)', color: 'var(--ink)', borderColor: 'var(--line)' },
    '.cm-panels input, .cm-panels button': { color: 'var(--ink)' },
    '.cm-textfield': { backgroundColor: 'var(--cm-bg)', border: '1px solid var(--pill)' },
    '.cm-button': { backgroundImage: 'none', backgroundColor: 'var(--paper-2)', border: '1px solid var(--pill)' },
    '.cm-searchMatch': { backgroundColor: 'rgba(221,170,204,.45)' },
    '.cm-searchMatch-selected': { backgroundColor: 'rgba(187,102,136,.55)' }
  });

  var editor = new CMX.EditorView({
    parent: els.editorHost,
    state: CMX.EditorState.create({
      doc: '',
      extensions: [
        CMX.lineNumbers(), CMX.highlightActiveLineGutter(), CMX.history(), CMX.drawSelection(),
        CMX.indentOnInput(), CMX.bracketMatching(), CMX.highlightSelectionMatches(),
        CMX.html(), CMX.syntaxHighlighting(paperHighlight), paperTheme, CMX.EditorView.lineWrapping,
        CMX.placeholder('여기에 HTML을 붙여넣으세요…'),
        CMX.keymap.of([{ key: 'Mod-Enter', run: function () { renderNow(); return true; } }, { key: 'Escape', run: function () { clearSelection(); return false; } }]
          .concat([CMX.indentWithTab], CMX.defaultKeymap, CMX.historyKeymap, CMX.searchKeymap)),
        markField,
        CMX.EditorView.updateListener.of(onEditorUpdate)
      ]
    })
  });

  function source() { return editor.state.doc.toString(); }
  function setSource(text) {
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text } });
  }

  function onEditorUpdate(u) {
    if (u.docChanged) {
      state.dirty = true;
      els.dropHint.hidden = u.state.doc.length > 0;
      clearTimeout(renderTimer);
      renderTimer = setTimeout(renderNow, 450);
      queueSaveWork();
      return;
    }
    if (u.selectionSet) queueSaveWork();
    if (u.selectionSet && !state.dirty) {
      var byUser = u.transactions.some(function (tr) { return tr.isUserEvent('select'); });
      if (byUser) {
        var rec = model ? model.atOffset(u.state.selection.main.head) : null;
        select(rec, 'code');
      }
    }
  }

  function markRange(list, from, to, cls) {
    var len = editor.state.doc.length;
    from = Math.max(0, Math.min(from, len)); to = Math.max(0, Math.min(to, len));
    if (to > from) list.push(CMX.Decoration.mark({ class: cls }).range(from, to));
  }
  function refreshCodeMarks() {
    var list = [];
    if (model && !state.dirty) {
      var s = selId != null ? model.byId(selId) : null;
      var h = hoverId != null && hoverId !== selId ? model.byId(hoverId) : null;
      if (s) {
        markRange(list, s.start, s.end, 'cm-hti-range');
        markRange(list, s.start, s.openEnd, 'cm-hti-tag');
        if (!s.implicit && s.closeStart < s.end) markRange(list, s.closeStart, s.end, 'cm-hti-tag');
      }
      if (h) markRange(list, h.start, h.openEnd, 'cm-hti-hover');
    }
    editor.dispatch({ effects: setMarks.of(CMX.Decoration.set(list, true)) });
  }

  /* ================= 교정지 ================= */
  function buildDoc(html) {
    var guard = '<base target="_blank">'; // sandbox에서 팝업이 막혀 있어 링크를 눌러도 이동하지 않음
    if (/<!doctype|<html[\s>]|<body[\s>]|<head[\s>]/i.test(html)) {
      if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, function (m) { return m + guard; });
      return html.replace(/<html[^>]*>/i, function (m) { return m + '<head>' + guard + '</head>'; });
    }
    return '<!doctype html><html><head><meta charset="utf-8">' + guard + '</head><body>' + html + '</body></html>';
  }

  function injectStyle(d) {
    if (!d || !d.documentElement) return;
    var st = d.getElementById(STYLE_ID);
    if (!st) { st = d.createElement('style'); st.id = STYLE_ID; (d.head || d.documentElement).appendChild(st); }
    var bg = bgValue();
    st.textContent =
      ':root{color-scheme:light;background:' + (bg || 'transparent') + ' !important;}' +
      'body{margin:0 !important;padding:' + state.pad + 'px !important;display:flow-root !important;min-height:0 !important;' +
      'box-sizing:border-box !important;width:100% !important;}' +
      'summary{cursor:pointer;}' +
      '[data-hti-hover]{outline:1px dashed #2f6b55 !important;outline-offset:1px !important;}' +
      '[data-hti-sel]{outline:2px solid #2f6b55 !important;outline-offset:2px !important;}' +
      'html[data-hti-sel],body[data-hti-sel]{outline-offset:-2px !important;}';
  }

  function contentHeight(d) {
    if (!d || !d.body) return 0;
    return Math.ceil(Math.max(d.body.scrollHeight, d.body.getBoundingClientRect().height));
  }

  function layout() {
    var d = doc();
    if (!state.loaded || !d) return;
    var cs = getComputedStyle(els.stage);
    var avail = els.stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 4;
    viewScale = state.fit ? Math.min(1, Math.max(0.1, avail / state.width)) : 1;
    var h = lastHeight || contentHeight(d);
    els.frame.style.width = state.width + 'px';
    els.frame.style.height = Math.max(h, 40) + 'px';
    els.frame.style.transform = viewScale === 1 ? '' : 'scale(' + viewScale + ')';
    els.paper.style.width = Math.round(state.width * viewScale) + 'px';
    els.paper.style.height = Math.round(Math.max(h, 40) * viewScale) + 'px';
    els.zoomBtn.textContent = state.fit ? '맞춤 ' + Math.round(viewScale * 100) + '%' : '실제 크기';
  }

  function fitHeight(force) {
    var d = doc();
    if (!d || !d.body) return;
    if (force) els.frame.style.height = '0px';
    var h = contentHeight(d);
    if (force || h !== lastHeight) {
      lastHeight = h;
      layout();
      updateInfo();
      drawBoxes();
    }
  }

  function updateFolds() {
    var d = doc();
    if (!state.loaded || !d) { els.foldCount.textContent = ''; return; }
    var all = d.querySelectorAll('details');
    if (!all.length) { els.foldCount.textContent = '접기 없음'; return; }
    var open = 0;
    Array.prototype.forEach.call(all, function (x) { if (x.open) open++; });
    els.foldCount.textContent = '접기 ' + all.length + ' · 펼침 ' + open;
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
    if (!state.loaded || !d || !d.body) { els.sizeInfo.textContent = '그림 1. 원고를 기다리는 중'; return; }
    var w = d.body.offsetWidth, h = contentHeight(d), s = plannedScale(w, h);
    var text = '그림 1. 저장 크기 ' + Math.round(w * s).toLocaleString() + ' × ' + Math.round(h * s).toLocaleString() + ' px';
    if (s < state.scale) els.sizeInfo.innerHTML = esc(text) + ' <span class="warn">— 길어서 배율을 ' + s.toFixed(2) + 'x로 낮춤</span>';
    else els.sizeInfo.textContent = text + ' (배율 ' + state.scale + 'x)';
  }

  function isOpenInSource(m, rec) {
    return /\sopen(?=[\s=>\/]|$)/i.test(m.source.slice(rec.start, rec.openEnd));
  }
  function summaryKey(el) {
    var s = el.querySelector(':scope > summary');
    return s ? s.textContent.replace(/\s+/g, ' ').trim() : '';
  }
  // 다시 앉힐 때 사용자가 열고 닫아 둔 접기 상태를 이어받는다
  function captureFolds() {
    var d = doc();
    if (!state.loaded || !d || !model) return null;
    return Array.prototype.map.call(d.querySelectorAll('details'), function (el) {
      var rec = model.byId(el.getAttribute(model.attr));
      return { key: summaryKey(el), open: el.open, sourceOpen: rec ? isOpenInSource(model, rec) : el.hasAttribute('open') };
    });
  }
  function restoreFolds(d, saved) {
    if (!saved || !saved.length) return;
    var list = Array.prototype.slice.call(d.querySelectorAll('details'));
    var used = [];
    list.forEach(function (el, i) {
      var key = summaryKey(el), match = -1;
      if (key) {
        var cands = [];
        saved.forEach(function (s, j) { if (!used[j] && s.key === key) cands.push(j); });
        var same = list.filter(function (x) { return summaryKey(x) === key; }).length;
        if (cands.length === 1 && same === 1) match = cands[0];
        else if (cands.length) {
          var nth = list.slice(0, i).filter(function (x) { return summaryKey(x) === key; }).length;
          var all = []; saved.forEach(function (s, j) { if (s.key === key) all.push(j); });
          if (all[nth] != null && !used[all[nth]]) match = all[nth];
        }
      }
      if (match < 0 && saved.length === list.length && !used[i]) match = i;
      if (match < 0) return;
      used[match] = true;
      var rec = model.byId(el.getAttribute(model.attr));
      var nowSourceOpen = rec ? isOpenInSource(model, rec) : el.hasAttribute('open');
      if (nowSourceOpen === saved[match].sourceOpen) el.open = saved[match].open; // 원고에서 open을 직접 바꿨다면 원고를 따른다
    });
  }

  function renderNow() {
    clearTimeout(renderTimer);
    var src = source();
    var p = new Promise(function (res) { loadWaiters.push(res); });
    if (!src.trim()) {
      state.loaded = false; state.dirty = false; model = null; selId = hoverId = null;
      els.empty.hidden = false; els.crop.hidden = true; els.frame.removeAttribute('srcdoc');
      failList = []; renderErrata(); updateFolds(); updateInfo(); refreshCodeMarks(); syncUI();
      setCrumb(null);
      flushWaiters();
      return p;
    }
    var folds = captureFolds() || pendingFolds;
    pendingFolds = null;
    var scrollTop = els.stage.scrollTop;
    var next = SM.parse(src);
    els.empty.hidden = true; els.crop.hidden = false;
    els.frame.onload = function () { bindFrame(next, folds, scrollTop); };
    els.frame.srcdoc = buildDoc(next.annotated);
    return p;
  }
  function flushWaiters() { var w = loadWaiters; loadWaiters = []; w.forEach(function (f) { f(); }); }

  function bindFrame(next, folds, scrollTop) {
    var d = doc();
    if (!d || !d.body) { flushWaiters(); return; }
    model = next;
    state.dirty = source() !== next.source;
    state.loaded = true;
    selId = hoverId = null;
    injectStyle(d);
    restoreFolds(d, folds);
    applyReplacements(d);

    var moveRaf = 0, lastMove = null;
    d.addEventListener('mousemove', function (e) {
      lastMove = e;
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(function () {
        moveRaf = 0;
        var el = pick(lastMove);
        setHover(el ? el.getAttribute(model.attr) : null);
      });
    }, true);
    d.addEventListener('mouseleave', function () { setHover(null); }, true);
    d.documentElement.addEventListener('mouseleave', function () { setHover(null); });
    d.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (a) e.preventDefault();
      var el = pick(e);
      if (el) select(model.byId(el.getAttribute(model.attr)), 'preview');
    }, true);
    d.addEventListener('toggle', function () { setTimeout(function () { fitHeight(true); updateFolds(); queueSaveWork(); }, 0); }, true);
    d.addEventListener('load', function () { fitHeight(false); }, true);

    syncUI();
    lastHeight = 0;
    fitHeight(true);
    updateFolds();
    els.stage.scrollTop = scrollTop;
    clearInterval(pollTimer);
    pollTimer = setInterval(function () { fitHeight(false); updateFolds(); }, 500);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { fitHeight(true); });
    refreshCodeMarks();
    probeImages(d);
    // 원고에 커서가 있으면 그 위치를 다시 표시
    if (pendingCursor != null) {
      var at = Math.min(pendingCursor, editor.state.doc.length);
      pendingCursor = null;
      editor.dispatch({ selection: { anchor: at }, effects: CMX.EditorView.scrollIntoView(at, { y: 'center' }) });
      select(model.atOffset(at), 'code');
    } else if (editor.hasFocus) select(model.atOffset(editor.state.selection.main.head), 'code-quiet');
    else setCrumb(null);
    flushWaiters();
  }

  /* ================= 선택 / 표시 ================= */
  function elById(id) {
    var d = doc();
    return d && model && id != null ? d.querySelector('[' + model.attr + '="' + id + '"]') : null;
  }
  function clearAttr(name) {
    var d = doc();
    if (!d) return;
    Array.prototype.forEach.call(d.querySelectorAll('[' + name + ']'), function (x) { x.removeAttribute(name); });
  }
  function closedAncestor(el) {
    var hidden = null;
    for (var p = el.parentElement; p; p = p.parentElement) {
      if (p.localName === 'details' && !p.open) {
        var sum = p.querySelector(':scope > summary');
        if (!(sum && (sum === el || sum.contains(el)))) hidden = p;
      }
    }
    return hidden;
  }

  /* ---- 여백(margin/padding) 색 표시 ----
   * 표시층은 <html> 바로 아래(body 밖)에 두어 저장되는 이미지(body)에는 들어가지 않는다. */
  var OV_ID = '__hti_boxes__';
  function px(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function boxOf(el) {
    var cs = el.ownerDocument.defaultView.getComputedStyle(el), r = el.getBoundingClientRect();
    return {
      r: r, disp: cs.display,
      m: [px(cs.marginTop), px(cs.marginRight), px(cs.marginBottom), px(cs.marginLeft)],
      b: [px(cs.borderTopWidth), px(cs.borderRightWidth), px(cs.borderBottomWidth), px(cs.borderLeftWidth)],
      p: [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)]
    };
  }
  // 커서가 자식 요소의 "바깥 여백" 위에 있으면 부모 대신 그 자식을 고른다(작은 margin도 잡히도록)
  function pick(e) {
    var t = e && e.target && e.target.closest ? e.target.closest('[' + model.attr + ']') : null;
    var d = doc();
    if (!d || !model) return t;
    var base = t || d.body;
    var kids = base ? base.children : [];
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (!k.hasAttribute(model.attr)) continue;
      var bx = boxOf(k);
      if (bx.disp === 'none' || bx.disp === 'inline' || bx.disp === 'contents') continue;
      var x = e.clientX, y = e.clientY, r = bx.r;
      var inMargin = x >= r.left - bx.m[3] && x <= r.right + bx.m[1] && y >= r.top - bx.m[0] && y <= r.bottom + bx.m[2];
      var inBorder = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      if (inMargin && !inBorder) return k;
    }
    return t;
  }
  function drawBoxes() {
    var d = doc();
    if (!d || !d.documentElement) return;
    var ov = d.getElementById(OV_ID);
    var id = hoverId != null ? hoverId : selId;
    var el = state.boxes ? elById(id) : null;
    if (el && closedAncestor(el)) el = null;
    if (!el) { if (ov) ov.style.display = 'none'; return; }
    if (!ov) {
      ov = d.createElement('div');
      ov.id = OV_ID;
      ov.setAttribute('aria-hidden', 'true');
      ov.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483647;';
      d.documentElement.appendChild(ov);
    }
    ov.style.display = '';
    var bx = boxOf(el), r = bx.r, sx = d.defaultView.scrollX, sy = d.defaultView.scrollY;
    var m = bx.m, b = bx.b, p = bx.p, rects = [];
    var MC = 'rgba(246,178,107,.55)', PC = 'rgba(147,196,125,.55)';
    function add(x, y, w, h, c) { if (w > 0.5 && h > 0.5) rects.push([x + sx, y + sy, w, h, c]); }
    var inline = bx.disp === 'inline';
    if (!inline) {
      add(r.left - Math.max(m[3], 0), r.top - m[0], r.width + Math.max(m[3], 0) + Math.max(m[1], 0), m[0], MC);
      add(r.left - Math.max(m[3], 0), r.bottom, r.width + Math.max(m[3], 0) + Math.max(m[1], 0), m[2], MC);
    }
    add(r.left - m[3], r.top, m[3], r.height, MC);
    add(r.right, r.top, m[1], r.height, MC);
    var il = r.left + b[3], it = r.top + b[0], iw = r.width - b[3] - b[1], ih = r.height - b[0] - b[2];
    add(il, it, iw, p[0], PC);
    add(il, it + ih - p[2], iw, p[2], PC);
    add(il, it + p[0], p[3], ih - p[0] - p[2], PC);
    add(il + iw - p[1], it + p[0], p[1], ih - p[0] - p[2], PC);
    var html = rects.map(function (q) {
      return '<div style="position:absolute;left:' + q[0] + 'px;top:' + q[1] + 'px;width:' + q[2] + 'px;height:' + q[3] + 'px;background:' + q[4] + ';"></div>';
    }).join('');
    function four(a) { a = a.map(function (n) { return Math.round(n * 10) / 10; }); return a[0] === a[1] && a[1] === a[2] && a[2] === a[3] ? String(a[0]) : a.join(' '); }
    var info = el.localName + ' · ' + Math.round(r.width) + '×' + Math.round(r.height);
    if (m.some(function (n) { return n; })) info += ' · 바깥 ' + four(m);
    if (p.some(function (n) { return n; })) info += ' · 안쪽 ' + four(p);
    var ly = r.top - Math.max(m[0], 0) + sy - 22;
    if (ly < sy + 2) ly = r.top + sy + 4; // 위쪽에 자리가 없으면 요소 안쪽 위에 표시
    html += '<div style="position:absolute;left:' + Math.max(2, r.left - Math.max(m[3], 0) + sx) + 'px;top:' + ly + 'px;padding:2px 7px;background:#27231f;color:#f2eee5;' +
      'font:500 11px/16px ui-monospace,Consolas,monospace;white-space:nowrap;border-radius:3px;box-shadow:0 2px 6px rgba(0,0,0,.25);">' + esc(info) + '</div>';
    ov.innerHTML = html;
  }

  function setHover(id) {
    if (id === hoverId) return;
    hoverId = id;
    clearAttr('data-hti-hover');
    var el = elById(id);
    if (el && id !== selId) el.setAttribute('data-hti-hover', '');
    drawBoxes();
    refreshCodeMarks();
    setCrumb(id != null ? id : selId, id != null);
  }

  function select(rec, from) {
    if (state.dirty) return;
    selId = rec ? rec.id : null;
    clearAttr('data-hti-sel');
    clearAttr('data-hti-hover');
    var el = elById(selId), hiddenIn = null;
    if (el) {
      hiddenIn = closedAncestor(el);
      var mark = hiddenIn ? (hiddenIn.querySelector(':scope > summary') || hiddenIn) : el;
      mark.setAttribute('data-hti-sel', '');
      if (from === 'code') scrollPreviewTo(mark);
    }
    drawBoxes();
    refreshCodeMarks();
    if (rec && from === 'preview') {
      editor.dispatch({
        selection: { anchor: rec.start },
        effects: CMX.EditorView.scrollIntoView(rec.start, { y: 'center' })
      });
    }
    setCrumb(selId);
  }
  function clearSelection() { if (selId != null) select(null, 'none'); }

  function scrollPreviewTo(el) {
    var r = el.getBoundingClientRect();
    var fr = els.frame.getBoundingClientRect(), st = els.stage.getBoundingClientRect();
    var top = fr.top - st.top + r.top * viewScale, bottom = top + r.height * viewScale;
    var left = fr.left - st.left + r.left * viewScale;
    if (top < 24 || bottom > els.stage.clientHeight - 24) els.stage.scrollTop += top - Math.min(80, els.stage.clientHeight / 4);
    if (left < 0 || left > els.stage.clientWidth - 40) els.stage.scrollLeft += left - 40;
  }

  function setCrumb(id, isHover) {
    var el = elById(id), rec = model && id != null ? model.byId(id) : null;
    if (!el || !rec) {
      els.crumb.textContent = state.loaded ? '교정지를 누르거나 원고에 커서를 두면 서로의 위치가 표시됩니다.' : '원고를 넣으면 교정지와 위치가 연결됩니다.';
      return;
    }
    var chain = [];
    for (var p = el; p && p.nodeType === 1; p = p.parentElement) {
      if (p.localName === 'html' || p.localName === 'head') break;
      chain.unshift(p.localName);
      if (p.localName === 'body') break;
    }
    if (chain.length > 5) chain = ['…'].concat(chain.slice(-4));
    var html = chain.map(function (t, i) { return i === chain.length - 1 ? '<b>' + esc(t) + '</b>' : esc(t); }).join('<span class="sep">›</span>');
    var line = model.lineAt(rec.start), endLine = model.lineAt(Math.max(rec.start, rec.end - 1));
    html += ' · 원고 ' + line + (endLine > line ? '–' + endLine : '') + '행';
    if (isHover) html = '가리킴: ' + html;
    else if (closedAncestor(el)) html += ' <span class="warn">— 접힌 블록 안에 있어 제목에 표시했어요</span>';
    els.crumb.innerHTML = html;
  }

  /* ================= 그림 점검 (CORS) ================= */
  function imgKey(el) { return el.getAttribute('data-hti-src') || el.currentSrc || el.src || ''; }
  function isRemote(url) { return /^https?:/i.test(url); }
  function bgUrls(el) {
    var out = [], re = /url\(\s*(['"]?)(.*?)\1\s*\)/g, m, v = el.style && el.style.backgroundImage;
    while (v && (m = re.exec(v))) out.push(m[2]);
    return out;
  }
  function collectImages(d) {
    var urls = [], seen = {};
    function add(u) {
      try { u = new URL(u, d.baseURI).href; } catch (e) { return; }
      if (isRemote(u) && !seen[u]) { seen[u] = 1; urls.push(u); }
    }
    Array.prototype.forEach.call(d.querySelectorAll('img'), function (img) { var u = imgKey(img); if (u) add(u); });
    Array.prototype.forEach.call(d.querySelectorAll('[style*="url("]'), function (el) {
      el.hasAttribute('data-hti-bg') ? JSON.parse(el.getAttribute('data-hti-bg')).forEach(add) : bgUrls(el).forEach(add);
    });
    return urls;
  }
  function probe(url) {
    if (imgStatus.has(url) && imgStatus.get(url) !== 'fail-retry') return Promise.resolve();
    imgStatus.set(url, 'pending');
    return fetch(url, FETCH_INIT).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.blob();
    }).then(function (b) {
      imgStatus.set(url, b && b.size ? 'ok' : 'fail');
    }).catch(function () { imgStatus.set(url, 'fail'); });
  }
  function probeImages(d) {
    var urls = collectImages(d);
    failList = urls.filter(function (u) { return imgStatus.get(u) === 'fail'; });
    renderErrata();
    Promise.all(urls.map(probe)).then(function () {
      if (doc() !== d) return;
      failList = urls.filter(function (u) { return imgStatus.get(u) === 'fail'; });
      renderErrata();
    });
  }

  function applyReplacements(d) {
    d = d || doc();
    if (!d) return;
    Array.prototype.forEach.call(d.querySelectorAll('img'), function (img) {
      var key = imgKey(img), abs = key;
      try { abs = new URL(key, d.baseURI).href; } catch (e) { /* 그대로 */ }
      var rep = replacements.get(abs);
      if (rep) {
        if (!img.hasAttribute('data-hti-src')) img.setAttribute('data-hti-src', abs);
        if (img.getAttribute('src') !== rep.data) { img.removeAttribute('srcset'); img.setAttribute('src', rep.data); }
      } else if (img.hasAttribute('data-hti-src')) {
        img.setAttribute('src', img.getAttribute('data-hti-src'));
        img.removeAttribute('data-hti-src');
      }
    });
    Array.prototype.forEach.call(d.querySelectorAll('[style*="url("]'), function (el) {
      var orig = el.hasAttribute('data-hti-bg') ? JSON.parse(el.getAttribute('data-hti-bg')) : bgUrls(el);
      var bg = el.style.backgroundImage, changed = false;
      if (el.hasAttribute('data-hti-bg')) {
        bg = el.getAttribute('data-hti-bgv');
      }
      var nextBg = bg.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, function (m, q, u) {
        var abs = u; try { abs = new URL(u, d.baseURI).href; } catch (e) { /* 그대로 */ }
        var rep = replacements.get(abs);
        if (rep) { changed = true; return 'url("' + rep.data + '")'; }
        return m;
      });
      if (changed) {
        if (!el.hasAttribute('data-hti-bg')) { el.setAttribute('data-hti-bg', JSON.stringify(orig)); el.setAttribute('data-hti-bgv', bg); }
        el.style.backgroundImage = nextBg;
      } else if (el.hasAttribute('data-hti-bg')) {
        el.style.backgroundImage = el.getAttribute('data-hti-bgv');
        el.removeAttribute('data-hti-bg'); el.removeAttribute('data-hti-bgv');
      }
    });
    setTimeout(function () { fitHeight(true); }, 60);
  }

  function hostOf(u) { try { return new URL(u).host; } catch (e) { return u; } }
  function tailOf(u) { try { var p = new URL(u).pathname.split('/'); return decodeURIComponent(p[p.length - 1] || '') || u; } catch (e) { return u; } }
  function expiresText(u) {
    var m = /[?&]expires=(\d{9,11})/.exec(u);
    if (!m) return '';
    var t = new Date(+m[1] * 1000);
    var left = t - Date.now();
    var hhmm = pad2(t.getHours()) + ':' + pad2(t.getMinutes());
    return left <= 0 ? ' · 주소 만료됨(' + hhmm + ')' : ' · 주소 만료 ' + (t.getMonth() + 1) + '/' + t.getDate() + ' ' + hhmm;
  }
  function brokenInPreview(u) {
    var d = doc();
    if (!d) return false;
    var hit = Array.prototype.filter.call(d.querySelectorAll('img'), function (img) { return imgKey(img) === u || img.src === u; });
    return hit.length > 0 && hit.every(function (img) { return img.complete && img.naturalWidth === 0; });
  }

  function renderErrata() {
    if (!failList.length) { els.errata.hidden = true; els.errataList.innerHTML = ''; return; }
    var left = failList.filter(function (u) { return !replacements.has(u); }).length;
    els.errata.hidden = false;
    els.errataTitle.textContent = left
      ? '교정 메모 — 저장하면 빠지는 그림 ' + left + '개' + (left < failList.length ? ' (대체 ' + (failList.length - left) + '개)' : '')
      : '교정 메모 — 그림 ' + failList.length + '개 모두 파일로 대체됨';
    els.errataList.innerHTML = failList.map(function (u, i) {
      var rep = replacements.get(u);
      var status = rep ? '<span class="ok">대체됨 · ' + esc(rep.name) + '</span>'
        : (brokenInPreview(u) ? '미리보기에서도 안 보임(주소 만료·삭제 가능)' : '서버가 읽기를 허용하지 않음') + esc(expiresText(u));
      return '<li data-i="' + i + '" class="' + (rep ? 'done' : '') + '">' +
        '<img alt="" referrerpolicy="no-referrer" src="' + esc(rep ? rep.data : u) + '">' +
        '<div class="meta"><b title="' + esc(u) + '">' + esc(hostOf(u)) + ' / ' + esc(tailOf(u)) + '</b>' + status + '</div>' +
        '<div class="acts"><button type="button" class="text-btn accent" data-act="pick">' + (rep ? '다시 고르기' : '파일로 대체') + '</button>' +
        (rep ? '<button type="button" class="text-btn" data-act="undo">되돌리기</button>' : '') + '</div></li>';
    }).join('');
  }

  function readAsDataURL(f) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result || '')); };
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  }
  function replaceWith(urls, files) {
    files = Array.prototype.filter.call(files || [], function (f) { return /^image\//.test(f.type); });
    if (!files.length) { toast('그림 파일을 골라주세요.'); return; }
    var pairs = [];
    for (var i = 0; i < urls.length && i < files.length; i++) pairs.push([urls[i], files[i]]);
    Promise.all(pairs.map(function (p) {
      return readAsDataURL(p[1]).then(function (data) { replacements.set(p[0], { data: data, name: p[1].name }); });
    })).then(function () {
      applyReplacements();
      renderErrata();
      toast('그림 ' + pairs.length + '개를 파일로 대체했습니다.' + (files.length > pairs.length ? ' (남는 파일 ' + (files.length - pairs.length) + '개는 쓰지 않음)' : ''));
    }).catch(function () { toast('파일을 읽지 못했습니다.'); });
  }
  function unresolved() { return failList.filter(function (u) { return !replacements.has(u); }); }

  /* ================= 캡처 ================= */
  function capture(asBlob) {
    var d = doc();
    if (!d || !d.body || !window.htmlToImage) return Promise.reject(new Error('교정지가 준비되지 않았습니다.'));
    clearAttr('data-hti-sel'); clearAttr('data-hti-hover');
    var ov0 = d.getElementById(OV_ID); if (ov0) ov0.style.display = 'none';
    fitHeight(true);
    var node = d.body, w = node.offsetWidth, h = contentHeight(d), s = plannedScale(w, h), bg = bgValue(), isJpg = state.fmt === 'jpg';
    var opts = {
      width: w, height: h, pixelRatio: s, skipAutoScale: true, cacheBust: false,
      backgroundColor: bg || (isJpg ? '#ffffff' : undefined),
      imagePlaceholder: EMPTY_GIF,
      fetchRequestInit: FETCH_INIT,
      style: { margin: '0' }
    };
    var lib = window.htmlToImage;
    var job = asBlob ? lib.toBlob(node, opts) : isJpg ? lib.toJpeg(node, Object.assign({ quality: 0.92 }, opts)) : lib.toPng(node, opts);
    return job.then(function (r) { restoreMarks(); return r; }, function (e) { restoreMarks(); throw e; });
  }
  function restoreMarks() {
    drawBoxes();
    if (selId != null) {
      var el = elById(selId);
      if (el) { var hid = closedAncestor(el); ((hid && (hid.querySelector(':scope > summary') || hid)) || el).setAttribute('data-hti-sel', ''); }
    }
  }
  function ready() { return state.dirty ? renderNow() : Promise.resolve(); }
  function afterSaveNote() {
    var n = unresolved().length;
    return n ? ' 그림 ' + n + '개는 서버가 막아 빠졌습니다 — 교정 메모에서 파일로 대체할 수 있어요.' : '';
  }

  function setBusy(b, label) {
    state.busy = b;
    els.save.textContent = b ? (label || '인쇄 중…') : '이미지로 인쇄하기';
    syncUI();
  }
  function doSave() {
    if (!state.loaded || state.busy) return;
    setBusy(true);
    ready().then(function () { return capture(false); }).then(function (dataUrl) {
      var a = document.createElement('a');
      a.href = dataUrl;
      a.download = safeName(els.fname.value) + (state.fmt === 'jpg' ? '.jpg' : '.png');
      document.body.appendChild(a); a.click(); a.remove();
      toast('이미지를 저장했습니다.' + afterSaveNote(), unresolved().length ? 5200 : 2400);
    }).catch(function (err) {
      console.error(err);
      toast('이미지를 만들지 못했습니다. 내용이 너무 길거나 브라우저가 막았을 수 있습니다.', 4200);
    }).then(function () { setBusy(false); });
  }
  function doCopy() {
    if (!state.loaded || state.busy) return;
    if (!navigator.clipboard || typeof window.ClipboardItem === 'undefined') { toast('이 브라우저는 이미지 복사를 지원하지 않습니다. 인쇄하기를 이용해주세요.', 3600); return; }
    setBusy(true, '복사 중…');
    var item = new ClipboardItem({ 'image/png': ready().then(function () { return capture(true); }) });
    navigator.clipboard.write([item]).then(function () {
      toast('클립보드에 복사했습니다.' + afterSaveNote(), unresolved().length ? 5200 : 2400);
    }).catch(function (err) { console.error(err); toast('복사하지 못했습니다. 인쇄하기를 이용해주세요.', 3600); })
      .then(function () { setBusy(false); });
  }

  /* ================= 이어하기(마지막 원고) ================= */
  function queueSaveWork() {
    clearTimeout(workTimer);
    workTimer = setTimeout(saveWork, 700);
  }
  function saveWork() {
    var src = source(), folds = null;
    try {
      if (!src.trim()) { localStorage.removeItem(WORK_KEY); return; }
      if (state.dirty || !state.loaded) { // 아직 앉히는 중이면 직전에 기억한 접기 상태를 유지
        try { var old = JSON.parse(localStorage.getItem(WORK_KEY) || 'null'); folds = old && old.folds || null; } catch (e2) { folds = null; }
      } else folds = captureFolds();
      localStorage.setItem(WORK_KEY, JSON.stringify({
        v: 1, src: src, fname: els.fname.value, cursor: editor.state.selection.main.head,
        folds: folds, savedAt: Date.now()
      }));
    } catch (e) {
      if (!workWarned) { workWarned = true; toast('원고가 커서 이어하기용으로 기억하지 못했습니다. 작업은 그대로 할 수 있어요.', 4200); }
    }
  }
  function restoreWork() {
    var w = null;
    try { w = JSON.parse(localStorage.getItem(WORK_KEY) || 'null'); } catch (e) { w = null; }
    if (!w || typeof w.src !== 'string' || !w.src.trim()) return false;
    if (typeof w.fname === 'string') els.fname.value = w.fname;
    pendingFolds = Array.isArray(w.folds) ? w.folds : null;
    pendingCursor = typeof w.cursor === 'number' ? w.cursor : null;
    setSource(w.src);
    renderNow();
    var t = new Date(w.savedAt || Date.now());
    toast('지난 원고를 이어서 열었습니다 (' + (t.getMonth() + 1) + '/' + t.getDate() + ' ' + pad2(t.getHours()) + ':' + pad2(t.getMinutes()) + ')');
    return true;
  }
  window.addEventListener('pagehide', function () { clearTimeout(workTimer); saveWork(); });

  /* ================= 테마 ================= */
  var themeBtn = $('themeBtn');
  function currentTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncThemeBtn() {
    var dark = currentTheme() === 'dark';
    themeBtn.textContent = dark ? '☼ 라이트' : '☾ 다크';
    themeBtn.title = dark ? '밝은 종이로 바꾸기' : '어두운 작업대로 바꾸기';
    themeBtn.setAttribute('aria-pressed', String(dark));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#1c1a17' : '#f2eee5');
  }
  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { toast('테마는 바뀌었지만 브라우저 설정 때문에 기억하지 못했습니다.'); }
    syncThemeBtn();
  });
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', syncThemeBtn);
  }

  /* ================= 인쇄 사양 UI ================= */
  function setOn(box, attr, value) {
    Array.prototype.forEach.call(box.querySelectorAll('[' + attr + ']'), function (b) { b.classList.toggle('on', b.getAttribute(attr) === String(value)); });
  }
  function syncUI() {
    els.width.value = state.width;
    els.widthOut.textContent = state.width + ' px';
    setOn(els.widthPresets, 'data-w', state.customWidth ? '' : state.width);
    var preset = [420, 640, 800, 1000].indexOf(state.width) >= 0;
    els.widthCustomBtn.classList.toggle('on', state.customWidth || !preset);
    els.width.hidden = !(state.customWidth || !preset);
    els.pad.value = state.pad;
    els.padOut.textContent = state.pad + ' px';
    setOn(els.bgSeg, 'data-bg', state.bg);
    els.bgColor.value = state.bgColor;
    els.customSwatch.style.background = state.bgColor;
    els.bgColorRow.hidden = state.bg !== 'custom';
    setOn(els.scaleSeg, 'data-s', state.scale);
    setOn(els.fmtSeg, 'data-f', state.fmt);
    var off = !state.loaded || state.busy;
    els.save.disabled = off;
    els.copyImg.disabled = off || state.fmt !== 'png';
    els.copyImg.title = state.fmt !== 'png' ? '클립보드 복사는 PNG만 지원합니다' : '';
    els.expandAll.disabled = els.collapseAll.disabled = !state.loaded;
    els.zoomBtn.disabled = !state.loaded;
    els.boxBtn.classList.toggle('on', state.boxes);
    els.boxBtn.setAttribute('aria-pressed', String(state.boxes));
    els.boxBtn.title = state.boxes ? '여백 표시 끄기 (주황: 바깥 여백 · 초록: 안쪽 여백)' : '여백 표시 켜기';
  }

  els.widthPresets.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b === els.widthCustomBtn) { state.customWidth = true; syncUI(); els.width.focus(); els.width.select(); return; }
    state.customWidth = false;
    state.width = +b.getAttribute('data-w');
    syncUI(); saveOptions(); layout(); fitHeight(true);
  });
  els.width.addEventListener('change', function () {
    var v = Math.round(+els.width.value);
    if (!isFinite(v) || v < 200) v = 200;
    if (v > 3000) v = 3000;
    state.width = v;
    syncUI(); saveOptions(); layout(); fitHeight(true);
  });
  els.pad.addEventListener('input', function () { state.pad = +els.pad.value; syncUI(); injectStyle(doc()); fitHeight(true); });
  els.pad.addEventListener('change', saveOptions);
  els.bgSeg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-bg]');
    if (!b) return;
    state.bg = b.getAttribute('data-bg');
    syncUI(); saveOptions(); injectStyle(doc());
  });
  els.bgColor.addEventListener('input', function () { state.bgColor = els.bgColor.value; els.customSwatch.style.background = state.bgColor; injectStyle(doc()); });
  els.bgColor.addEventListener('change', saveOptions);
  els.scaleSeg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-s]');
    if (!b) return;
    state.scale = +b.getAttribute('data-s'); syncUI(); saveOptions(); updateInfo();
  });
  els.fmtSeg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-f]');
    if (!b) return;
    state.fmt = b.getAttribute('data-f'); syncUI(); saveOptions();
  });
  els.zoomBtn.addEventListener('click', function () { state.fit = !state.fit; saveOptions(); layout(); });
  els.boxBtn.addEventListener('click', function () { state.boxes = !state.boxes; saveOptions(); syncUI(); drawBoxes(); });

  function setAllFolds(open) {
    var d = doc();
    if (!d) return;
    Array.prototype.forEach.call(d.querySelectorAll('details'), function (x) { x.open = open; });
    setTimeout(function () { fitHeight(true); updateFolds(); queueSaveWork(); if (selId != null) select(model.byId(selId), 'none'); }, 0);
  }
  els.expandAll.addEventListener('click', function () { setAllFolds(true); });
  els.collapseAll.addEventListener('click', function () { setAllFolds(false); });
  els.save.addEventListener('click', doSave);
  els.copyImg.addEventListener('click', doCopy);
  els.apply.addEventListener('click', function () { renderNow(); });

  /* ================= 원고 파일 ================= */
  function readFile(f) {
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      setSource(String(r.result || ''));
      if (!els.fname.value) els.fname.value = f.name.replace(/\.(html?|txt)$/i, '');
      renderNow();
    };
    r.onerror = function () { toast('파일을 읽지 못했습니다.'); };
    r.readAsText(f, 'utf-8');
  }
  els.openFile.addEventListener('click', function () { els.file.click(); });
  els.file.addEventListener('change', function () { readFile(els.file.files[0]); els.file.value = ''; });
  els.clearSrc.addEventListener('click', function () { setSource(''); editor.focus(); });

  function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; }
  ['dragenter', 'dragover'].forEach(function (t) {
    els.editorWrap.addEventListener(t, function (e) { if (hasFiles(e)) { e.preventDefault(); e.stopPropagation(); els.editorWrap.classList.add('over'); } }, true);
  });
  els.editorWrap.addEventListener('dragleave', function (e) { if (!els.editorWrap.contains(e.relatedTarget)) els.editorWrap.classList.remove('over'); }, true);
  els.editorWrap.addEventListener('drop', function (e) {
    els.editorWrap.classList.remove('over');
    if (hasFiles(e) && e.dataTransfer.files.length) { e.preventDefault(); e.stopPropagation(); readFile(e.dataTransfer.files[0]); }
  }, true);

  /* ================= 교정 메모(빠진 그림) ================= */
  els.errataPick.addEventListener('click', function () { els.errataFiles.click(); });
  els.errataFiles.addEventListener('change', function () {
    var targets = unresolved();
    if (!targets.length) targets = failList.slice();
    replaceWith(targets, els.errataFiles.files);
    els.errataFiles.value = '';
  });
  els.errataOne.addEventListener('change', function () {
    if (errataTarget) replaceWith([errataTarget], els.errataOne.files);
    els.errataOne.value = ''; errataTarget = null;
  });
  els.errataToggle.addEventListener('click', function () {
    var f = els.errata.classList.toggle('folded');
    els.errataToggle.textContent = f ? '펼치기' : '접기';
  });
  els.errataList.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'), li = e.target.closest('li[data-i]');
    if (!b || !li) return;
    var u = failList[+li.getAttribute('data-i')];
    if (b.getAttribute('data-act') === 'pick') { errataTarget = u; els.errataOne.click(); }
    else { replacements.delete(u); applyReplacements(); renderErrata(); }
  });
  ['dragenter', 'dragover'].forEach(function (t) {
    els.errata.addEventListener(t, function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      var li = e.target.closest('li[data-i]');
      Array.prototype.forEach.call(els.errataList.children, function (x) { x.classList.toggle('over', x === li); });
    });
  });
  els.errata.addEventListener('dragleave', function (e) {
    if (!els.errata.contains(e.relatedTarget)) Array.prototype.forEach.call(els.errataList.children, function (x) { x.classList.remove('over'); });
  });
  els.errata.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    Array.prototype.forEach.call(els.errataList.children, function (x) { x.classList.remove('over'); });
    var li = e.target.closest('li[data-i]'), files = e.dataTransfer.files;
    if (li && files.length === 1) replaceWith([failList[+li.getAttribute('data-i')]], files);
    else {
      var start = li ? +li.getAttribute('data-i') : 0;
      var targets = li ? failList.slice(start) : (unresolved().length ? unresolved() : failList.slice());
      replaceWith(targets, files);
    }
  });

  /* ================= 원고 칸 너비 조절 ================= */
  function setMsW(px) {
    var deskW = els.desk.clientWidth;
    var specW = window.innerWidth > 1180 ? 290 + 20 : 0;
    var max = Math.max(300, deskW - specW - 16 - 20 * 2 - 320);
    state.msW = Math.round(Math.max(280, Math.min(px, max)));
    els.desk.style.setProperty('--ms-w', state.msW + 'px');
    layout();
  }
  var dragging = false;
  els.gutter.addEventListener('pointerdown', function (e) {
    dragging = true; els.gutter.classList.add('drag'); els.gutter.setPointerCapture(e.pointerId);
    els.frame.style.pointerEvents = 'none';
  });
  els.gutter.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    setMsW(e.clientX - els.desk.getBoundingClientRect().left);
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false; els.gutter.classList.remove('drag'); els.frame.style.pointerEvents = '';
    saveOptions();
  }
  els.gutter.addEventListener('pointerup', endDrag);
  els.gutter.addEventListener('pointercancel', endDrag);
  els.gutter.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); setMsW(state.msW + (e.key === 'ArrowLeft' ? -24 : 24)); saveOptions();
    }
  });

  if (window.ResizeObserver) new ResizeObserver(function () { layout(); }).observe(els.stage);
  window.addEventListener('resize', function () { setMsW(state.msW); });
  window.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !editor.hasFocus) { e.preventDefault(); renderNow(); }
  });

  /* ================= 시작 ================= */
  loadOptions();
  els.fname.placeholder = defaultName();
  els.fname.addEventListener('input', queueSaveWork);
  syncThemeBtn();
  setMsW(state.msW);
  syncUI();
  setCrumb(null);
  restoreWork();
})();

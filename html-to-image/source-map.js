/* 원고(HTML 소스) ↔ 교정지(미리보기 DOM) 위치 연결
 * 같은 저장소의 arca-builder/core.js parse() 방식을 참고했다.
 * 원본 문자열은 고치지 않고, 각 시작 태그에 번호 속성을 끼운 "표시용 사본"만 만든다.
 * 교정지의 요소 → 속성 번호 → 원고의 [start, end) 위치로 찾아간다.
 */
(function () {
  'use strict';
  var VOID = { area:1, base:1, br:1, col:1, embed:1, hr:1, img:1, input:1, link:1, meta:1, param:1, source:1, track:1, wbr:1 };
  var RAW = /^(script|style|textarea|title|xmp|iframe|noembed|noframes)$/;

  function tagEnd(src, from) {
    var quote = null;
    for (var i = from; i < src.length; i++) {
      var c = src[i];
      if (quote) { if (c === quote) quote = null; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '>') return i + 1;
    }
    return src.length;
  }

  function parse(src) {
    var attr = 'data-hti-n';
    while (src.indexOf(attr) >= 0) attr += 'x';
    var records = [], stack = [], inserts = [], i = 0;

    function closeImplicit(tags, stops, at) {
      for (var k = stack.length - 1; k >= 0; k--) {
        if (stops.indexOf(stack[k].tag) >= 0) return;
        if (tags.indexOf(stack[k].tag) >= 0) {
          while (stack.length > k) { var r = stack.pop(); r.closeStart = r.end = at; r.implicit = true; }
          return;
        }
      }
    }

    while (i < src.length) {
      var start = src.indexOf('<', i);
      if (start < 0) break;
      if (src.substr(start, 4) === '<!--') {
        var ce = src.indexOf('-->', start + 4);
        i = ce < 0 ? src.length : ce + 3;
        continue;
      }
      var m = /^<\s*(\/?)\s*([a-zA-Z][\w:-]*)/.exec(src.slice(start, start + 80));
      if (!m) { i = start + 1; continue; }
      var end = tagEnd(src, start + m[0].length);
      var tag = m[2].toLowerCase();
      if (m[1]) {
        var tags = stack.map(function (r) { return r.tag; });
        var k = tags.lastIndexOf(tag);
        if (k >= 0) {
          while (stack.length - 1 > k) { var r1 = stack.pop(); r1.closeStart = r1.end = start; r1.implicit = true; }
          var r2 = stack.pop(); r2.closeStart = start; r2.end = end;
        }
        i = end; continue;
      }
      if (/^(div|p|h[1-6]|table|ul|ol|blockquote|details|pre|hr|section|article|header|footer|figure)$/.test(tag)) closeImplicit(['p'], ['td', 'th', 'div', 'body', 'li'], start);
      if (tag === 'li') closeImplicit(['li'], ['ul', 'ol'], start);
      if (tag === 'tr') closeImplicit(['tr'], ['table', 'tbody', 'thead', 'tfoot'], start);
      if (tag === 'td' || tag === 'th') closeImplicit(['td', 'th'], ['tr'], start);

      var rec = { id: String(records.length), tag: tag, start: start, openEnd: end, closeStart: end, end: end, implicit: false };
      records.push(rec);
      var point = end - 1;
      if (src[point - 1] === '/') point--;
      inserts.push({ point: point, text: ' ' + attr + '="' + rec.id + '"' });
      i = end;
      if (VOID[tag]) continue;
      if (RAW.test(tag)) {
        var re = new RegExp('</\\s*' + tag + '\\s*>', 'ig');
        re.lastIndex = end;
        var close = re.exec(src);
        rec.closeStart = close ? close.index : src.length;
        rec.end = close ? re.lastIndex : src.length;
        i = rec.end;
        continue;
      }
      stack.push(rec);
    }
    while (stack.length) { var r3 = stack.pop(); r3.closeStart = r3.end = src.length; r3.implicit = true; }

    var out = '', last = 0;
    for (var n = 0; n < inserts.length; n++) {
      out += src.slice(last, inserts[n].point) + inserts[n].text;
      last = inserts[n].point;
    }
    out += src.slice(last);

    var lines = [0];
    for (var p = 0; p < src.length; p++) if (src.charCodeAt(p) === 10) lines.push(p + 1);

    return {
      source: src,
      attr: attr,
      records: records,
      annotated: out,
      byId: function (id) { return records[+id] || null; },
      lineAt: function (offset) {
        var lo = 0, hi = lines.length;
        while (lo + 1 < hi) { var mid = (lo + hi) >> 1; if (lines[mid] <= offset) lo = mid; else hi = mid; }
        return lo + 1;
      },
      // 커서 위치를 감싸는 가장 안쪽 요소
      atOffset: function (offset) {
        var found = null;
        for (var q = 0; q < records.length; q++) {
          var r = records[q];
          if (r.start <= offset && offset < Math.max(r.end, r.openEnd) &&
              (!found || (r.end - r.start) <= (found.end - found.start))) found = r;
        }
        return found;
      }
    };
  }

  window.HtiSourceMap = { parse: parse };
})();

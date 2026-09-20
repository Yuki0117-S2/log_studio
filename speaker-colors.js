/* Optional **name** "speech" formatting shared by Log Cupcake and Mosaic Log.
 * Source text and existing speaker syntax are left untouched. */
(function (root) {
  'use strict';
  const palette = ['#8888CC', '#DDAACC', '#CCAA88', '#BB6688', '#884499', '#EE1166', '#FF6699', '#00BBDD', '#FF7722', '#0077DD'];
  const assigned = new Map();
  const rgb = hex => hex.slice(1).match(/../g).map(v => parseInt(v, 16));
  const hex = values => '#' + values.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  function extraColor(index) {
    const hue = (index * 137.508) % 360;
    const channel = n => {
      const k = (n + hue / 30) % 12;
      return 255 * (0.55 - 0.3 * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
    };
    return hex([channel(0), channel(8), channel(4)]);
  }
  function colors(name) {
    const key = name.normalize('NFC').trim().replace(/\s+/g, ' ');
    if (!assigned.has(key)) {
      const base = palette[assigned.size] || extraColor(assigned.size);
      assigned.set(key, {
        base,
        ink: hex(rgb(base).map(v => v * 0.48)),
        paper: hex(rgb(base).map(v => v * 0.18 + 255 * 0.82))
      });
    }
    return assigned.get(key);
  }
  const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  function format(text, render, inlineRender) {
    const source = String(text);
    const inline = inlineRender || render;
    // Protect code, links and images; only a bold name immediately followed by
    // a complete quoted speech is new syntax. Incomplete quotes stay unchanged.
    const pattern = /```[\s\S]*?```|~~~[\s\S]*?~~~|`+[^`\n]*`+|!?\[[^\]\n]*\]\([^\)\n]*\)|(?<![\\*])\*\*([^*\r\n]{1,80})\*\*([ \t]*(?:[:：][ \t]*)?)("(?:\\[^\r\n]|[^"\\\r\n])*"|“[^”\r\n]*”|「[^」\r\n]*」|『[^』\r\n]*』)/g;
    let prefix = '\uE210LS';
    while (source.includes(prefix)) prefix += 'X';
    const replacements = [];
    const masked = source.replace(pattern, (match, name, gap, speech) => {
      if (name === undefined || !name.trim()) return match;
      const color = colors(name);
      const token = prefix + replacements.length + '\uE211';
      // Only inline, literal CSS is exported. No stylesheet, class or JS is
      // required in the copied Arca HTML. Keep both ink and paper explicit.
      const style = `color:${color.ink} !important;background-color:${color.paper};border-radius:4px;padding:1px 3px;`;
      const rendered = `<span style='${style}'><strong style='color:${color.ink} !important;'>${escape(name)}</strong>${escape(gap)}${inline(speech)}</span>`;
      replacements.push(rendered);
      return token;
    });
    let html = render(masked);
    replacements.forEach((replacement, i) => {
      html = html.split(prefix + i + '\uE211').join(replacement);
    });
    return html;
  }
  function starts(text) {
    return /^\*\*[^*\r\n]{1,80}\*\*[ \t]*(?:[:：][ \t]*)?(?:"(?:\\[^\r\n]|[^"\\\r\n])*"|“[^”\r\n]*”|「[^」\r\n]*」|『[^』\r\n]*』)/.test(text);
  }
  root.LogSpeakerColors = Object.freeze({ format, colors, starts });
})(globalThis);

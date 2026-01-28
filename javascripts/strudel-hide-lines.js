(function () {
  function injectCss(cssText) {
    // Ein eigenes <style> ist sauberer als "an alle style-Tags anhängen"
    const style = document.createElement("style");
    style.textContent = cssText;
    document.head.appendChild(style);
  }

  // Beispiele: Klassen -> wie viele Zeilen verstecken
  const rules = [
    // erste Zeilen verstecken
    { cls: "hide-first-3", css: "strudel-editor.hide-first-3 .cm-line:nth-of-type(-n+3){display:none !important;}" },
    { cls: "hide-first-6", css: "strudel-editor.hide-first-6 .cm-line:nth-of-type(-n+6){display:none !important;}" },
    { cls: "hide-first-10", css:"strudel-editor.hide-first-10 .cm-line:nth-of-type(-n+10){display:none !important;}" },

    // letzte Zeilen verstecken (falls du das brauchst)
    { cls: "hide-last-3",  css: "strudel-editor.hide-last-3  .cm-line:nth-last-of-type(-n+3){display:none !important;}" },
  ];

  // Nur CSS injizieren, wenn es auch passende Editor-Elemente gibt
  const hasAny = rules.some(r => document.querySelector(`strudel-editor.${r.cls}`));
  if (!hasAny) return;

  injectCss(rules.map(r => r.css).join("\n"));
})();

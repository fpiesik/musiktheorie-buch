(() => {
  const MARKER = "// ---";           // Marker-Zeile
  const CLASS_NAME = "hide-until-marker";
  const HIDE_MARKER_LINE_TOO = true; // true = Markerzeile wird auch ausgeblendet

  function getCodeFromElement(el) {
    // 1) bevorzugt: code="..." Attribut (falls du es nutzt)
    const attr = el.getAttribute("code");
    if (attr && attr.trim()) return attr;

    // 2) sonst: Inhalt aus dem Kommentarblock im Custom Element
    //    (textContent enthält auch Whitespace; das ist ok)
    return (el.textContent || "").trim();
  }

  function markerLineIndex(code) {
    const lines = code.split(/\r?\n/);
    const idx0 = lines.findIndex(l => l.trim() === MARKER);
    if (idx0 === -1) return -1;
    // CodeMirror nth-of-type ist 1-basiert
    const line1 = idx0 + 1;
    return HIDE_MARKER_LINE_TOO ? line1 : (line1 - 1);
  }

  function ensureId(el, i) {
    if (el.id) return el.id;
    el.id = `strudel-${i}`;
    return el.id;
  }

  function injectRuleFor(el, nLines, id) {
    // Wichtig: Regel auf genau dieses Element scopen, sonst betrifft sie alle Editoren
    const css = `
      strudel-editor#${CSS.escape(id)} .cm-line:nth-of-type(-n+${nLines}) {
        display: none !important;
      }
    `;

    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function tryApply() {
    const editors = [...document.querySelectorAll(`strudel-editor.${CLASS_NAME}`)];
    if (!editors.length) return;

    editors.forEach((el, i) => {
      const id = ensureId(el, i);

      // Nur einmal pro Element arbeiten
      if (el.dataset.markerHideApplied === "1") return;

      const code = getCodeFromElement(el);
      if (!code) return;

      const n = markerLineIndex(code);
      if (n <= 0) return; // kein Marker oder Marker in Zeile 1 (nichts zu verstecken)

      // Warten, bis CodeMirror-Lines im DOM existieren
      const hasLines = el.querySelector(".cm-line");
      if (!hasLines) return;

      injectRuleFor(el, n, id);
      el.dataset.markerHideApplied = "1";
    });
  }

  // 1) sofort probieren
  tryApply();

  // 2) nach dem Laden nochmal (Web Components initialisieren manchmal später)
  window.addEventListener("load", () => {
    tryApply();
    // 3) ein kurzes Polling-Fenster für späte Initialisierung
    let tries = 0;
    const t = setInterval(() => {
      tryApply();
      if (++tries > 40) clearInterval(t); // ~4 Sekunden
    }, 100);
  });
})();

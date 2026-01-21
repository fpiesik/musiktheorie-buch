(() => {
  const CLASS_NAME = "hide-until-marker";

  function isMarkerLine(lineEl) {
    const t = (lineEl.textContent || "").replace(/\s+/g, " ").trim();
    return t.includes("//") && t.includes("---");
  }

  function findRenderedContainer(editorEl) {
    // Strudel hängt den gerenderten Editor offenbar NACH dem Custom Element an.
    // Wir laufen ein paar Geschwister ab, bis wir etwas mit .cm-editor/.cm-line finden.
    let n = editorEl.nextElementSibling;
    for (let i = 0; i < 8 && n; i++) {
      if (n.querySelector?.(".cm-line, .cm-editor, .cm-content")) return n;
      n = n.nextElementSibling;
    }
    return null;
  }

  function applyToEditor(editorEl) {
    const container = findRenderedContainer(editorEl);
    if (!container) return false;

    const lines = container.querySelectorAll(".cm-content .cm-line, .cm-line");
    if (!lines.length) return false;

    let markerIndex = -1;
    lines.forEach((line, i) => {
      if (isMarkerLine(line)) markerIndex = i;
    });

    if (markerIndex === -1) return false;

    for (let i = 0; i <= markerIndex; i++) {
      lines[i].style.display = "none";
    }

    // Optional: Zeilennummern/Gutter verstecken
    const gutters = container.querySelector(".cm-gutters");
    if (gutters) gutters.style.display = "none";

    return true;
  }

  function process() {
    document.querySelectorAll(`strudel-editor.${CLASS_NAME}`).forEach((el) => {
      applyToEditor(el);
    });
  }

  // Polling, weil Strudel/CodeMirror asynchron rendert und "Update" neu rendert
  let tries = 0;
  const timer = setInterval(() => {
    process();
    if (++tries > 120) clearInterval(timer); // ~12s
  }, 100);

  window.addEventListener("load", () => {
    process();
    setTimeout(process, 250);
    setTimeout(process, 1000);
  });

  // Nach Klick auf Update nochmal anwenden
  document.addEventListener("click", (e) => {
    if ((e.target?.textContent || "").trim() === "Update") {
      setTimeout(process, 50);
      setTimeout(process, 250);
    }
  });
})();

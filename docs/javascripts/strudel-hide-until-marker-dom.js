(() => {
  const MARKER = "// ---";
  const CLASS_NAME = "hide-until-marker";

  function hideUntilMarker(editorEl) {
    const lines = editorEl.querySelectorAll(".cm-line");
    if (!lines.length) return false;

    let markerIndex = -1;

    lines.forEach((line, i) => {
      if (line.textContent.trim() === MARKER) {
        markerIndex = i;
      }
    });

    if (markerIndex === -1) return false;

    // Alles bis inkl. Marker ausblenden
    for (let i = 0; i <= markerIndex; i++) {
      lines[i].style.display = "none";
    }

    return true;
  }

  function processEditors() {
    document
      .querySelectorAll(`strudel-editor.${CLASS_NAME}`)
      .forEach((el) => {
        if (el.dataset.markerHideApplied === "1") return;

        const applied = hideUntilMarker(el);
        if (applied) el.dataset.markerHideApplied = "1";
      });
  }

  // Mehrfach versuchen, da Web Components / CodeMirror verzögert laden
  let tries = 0;
  const timer = setInterval(() => {
    processEditors();
    if (++tries > 60) clearInterval(timer); // ~6 Sekunden
  }, 100);

  window.addEventListener("load", processEditors);
})();

(() => {
  const MARKER = "// ---";
  const CLASS_NAME = "hide-until-marker";

  function getRoots(el) {
    // Manche Komponenten nutzen Shadow DOM, andere nicht
    // Wir prüfen beides, sicher ist sicher.
    const roots = [];
    if (el.shadowRoot) roots.push(el.shadowRoot);
    roots.push(el);
    return roots;
  }

  function findLines(el) {
    for (const root of getRoots(el)) {
      const lines = root.querySelectorAll?.(".cm-line");
      if (lines && lines.length) return lines;
    }
    return null;
  }

  function hideUntilMarker(el) {
    const lines = findLines(el);
    if (!lines) return false;

    let markerIndex = -1;
    lines.forEach((line, i) => {
      if (line.textContent.trim() === MARKER) markerIndex = i;
    });

    if (markerIndex === -1) return false;

    for (let i = 0; i <= markerIndex; i++) {
      lines[i].style.display = "none";
    }

    return true;
  }

  function process() {
    document.querySelectorAll(`strudel-editor.${CLASS_NAME}`).forEach((el) => {
      // nicht "einmalig", weil CodeMirror beim Update DOM neu rendert
      hideUntilMarker(el);
    });
  }

  // Erst versuchen, dann ein bisschen poll-en (weil Web Component + CM verzögert)
  let tries = 0;
  const t = setInterval(() => {
    process();
    if (++tries > 80) clearInterval(t); // ~8s
  }, 100);

  window.addEventListener("load", process);

  // Optional: nach jedem Klick auf "Update" nochmal anwenden
  document.addEventListener("click", (e) => {
    if (e.target && (e.target.textContent || "").trim() === "Update") {
      setTimeout(process, 50);
      setTimeout(process, 250);
    }
  });
})();

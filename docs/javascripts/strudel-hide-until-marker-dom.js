(() => {
  const CLASS_NAME = "hide-until-marker";

  // Marker-Erkennung: robust gegen Tokenisierung/Whitespace
  function isMarkerLine(lineEl) {
    const t = (lineEl.textContent || "").replace(/\s+/g, " ").trim();
    // erkennt z.B. "// ---", "//---", "//  ---", etc.
    return t.includes("//") && t.includes("---");
  }

  function applyToEditor(el) {
    const lines = el.querySelectorAll(".cm-content .cm-line");
    if (!lines.length) return false;

    let markerIndex = -1;
    lines.forEach((line, i) => {
      if (isMarkerLine(line)) markerIndex = i;
    });

    if (markerIndex === -1) return false;

    for (let i = 0; i <= markerIndex; i++) {
      lines[i].style.display = "none";
    }

    return true;
  }

  function process() {
    document.querySelectorAll(`strudel-editor.${CLASS_NAME}`).forEach((el) => {
      applyToEditor(el);
    });
  }

  // wiederholt anwenden, weil "Update" den DOM neu rendert
  let tries = 0;
  const timer = setInterval(() => {
    process();
    if (++tries > 100) clearInterval(timer); // ~10s
  }, 100);

  window.addEventListener("load", () => {
    process();
    setTimeout(process, 250);
    setTimeout(process, 1000);
  });

  // Nach Klick auf Update nochmal
  document.addEventListener("click", (e) => {
    if ((e.target?.textContent || "").trim() === "Update") {
      setTimeout(process, 50);
      setTimeout(process, 250);
    }
  });
})();

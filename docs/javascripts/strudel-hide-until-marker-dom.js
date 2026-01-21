(() => {
  const MARKER = "// ---";

  console.log("✅ Strudel marker hider running");

  function isMarkerLine(lineEl) {
    const t = (lineEl.textContent || "").replace(/\s+/g, " ").trim();
    return t.includes("//") && t.includes("---");
  }

  function applyOne(customEl) {
    // Strudel rendert den CodeMirror-Editor bei dir offenbar außerhalb des Custom Elements.
    // Wir suchen im Parent nach dem *nächsten* .cm-editor nach diesem <strudel-editor>.
    const parent = customEl.parentElement;
    if (!parent) return false;

    const cm = parent.querySelector(".cm-editor");
    if (!cm) return false;

    const lines = cm.querySelectorAll(".cm-line");
    if (!lines.length) return false;

    let markerIndex = -1;
    lines.forEach((line, i) => { if (isMarkerLine(line)) markerIndex = i; });

    console.log("editor", customEl.id || "(no id)", "lines:", lines.length, "markerIndex:", markerIndex);

    if (markerIndex === -1) return false;

    for (let i = 0; i <= markerIndex; i++) {
      lines[i].style.display = "none";
    }

    const gutters = cm.querySelector(".cm-gutters");
    if (gutters) gutters.style.display = "none";

    return true;
  }

  function process() {
    document.querySelectorAll("strudel-editor.hide-until-marker").forEach(applyOne);
  }

  // Polling, weil Strudel asynchron mountet und Update neu rendert
  let tries = 0;
  const t = setInterval(() => {
    process();
    if (++tries > 120) clearInterval(t);
  }, 100);

  window.addEventListener("load", process);
})();

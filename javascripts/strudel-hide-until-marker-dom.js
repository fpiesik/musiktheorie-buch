(() => {
  const CLASS_NAME = "hide-until-marker";

  function isMarkerLine(lineEl) {
    const t = (lineEl.textContent || "").replace(/\s+/g, " ").trim();
    return t.includes("//") && t.includes("---");
  }

  function findRenderedCmRoot(customEl) {
    // Suche in den nächsten Geschwistern nach einem Element, das .cm-editor enthält
    let n = customEl.nextElementSibling;
    for (let i = 0; i < 12 && n; i++) {
      const cm = n.querySelector?.(".cm-editor");
      if (cm) return cm;
      n = n.nextElementSibling;
    }
    return null;
  }

  function ensureStyleTag() {
    let tag = document.getElementById("strudel-marker-hide-style");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "strudel-marker-hide-style";
      document.head.appendChild(tag);
    }
    return tag;
  }

  function applyOne(customEl, idx) {
    const cmRoot = findRenderedCmRoot(customEl);
    if (!cmRoot) return false;

    // Jede Instanz bekommt eine eindeutige Klasse, damit wir gezielt stylen können
    const uniq = customEl.id ? `sm-${customEl.id}` : `sm-auto-${idx}`;
    cmRoot.classList.add("strudel-cm", uniq);

    const lines = cmRoot.querySelectorAll(".cm-line");
    if (!lines.length) return false;

    let markerIndex = -1;
    lines.forEach((line, i) => { if (isMarkerLine(line)) markerIndex = i; });
    if (markerIndex === -1) return false;

    // Wir wollen bis inkl. Marker ausblenden => Anzahl = markerIndex + 1
    const hideCount = markerIndex + 1;

    // CSS-Regel: erste hideCount Zeilen ausblenden (mit !important)
    const css = `
/* ${uniq}: hide first ${hideCount} lines */
.cm-editor.${uniq} .cm-content .cm-line:nth-of-type(-n+${hideCount}) {
  display: none !important;
}

/* optional: gutters (Zeilennummern) weg */
.cm-editor.${uniq} .cm-gutters {
  display: none !important;
}
`;

    const tag = ensureStyleTag();

    // Verhindern, dass wir dieselbe Regel 100x anhängen
    if (!tag.textContent.includes(`/* ${uniq}:`)) {
      tag.appendChild(document.createTextNode(css));
    }

    return true;
  }

  function process() {
    document.querySelectorAll(`strudel-editor.${CLASS_NAME}`).forEach((el, i) => {
      applyOne(el, i);
    });
  }

  // Polling, weil Strudel initial und nach "Update" neu rendert
  let tries = 0;
  const timer = setInterval(() => {
    process();
    if (++tries > 120) clearInterval(timer);
  }, 100);

  window.addEventListener("load", () => {
    process();
    setTimeout(process, 250);
    setTimeout(process, 1000);
  });

  document.addEventListener("click", (e) => {
    if ((e.target?.textContent || "").trim() === "Update") {
      setTimeout(process, 50);
      setTimeout(process, 250);
    }
  });
})();

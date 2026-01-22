(() => {
  const CLASS_BASE = "hide-until-marker";
  const CLASS_ONLY_VIZ = "only-viz";

  // Marker (ohne Leerzeichen)
  const RE_BLOCK_MARKER = /\/\/---\s*$/;  // //--- am Zeilenende
  const RE_HIDE_LINE    = /\/\/-!-\s*$/;  // //-!- am Zeilenende

  function text(lineEl) {
    return (lineEl.textContent || "").trim();
  }

  function isBlockMarker(lineEl) {
    return RE_BLOCK_MARKER.test(text(lineEl));
  }

  function isHideLine(lineEl) {
    return RE_HIDE_LINE.test(text(lineEl));
  }

  function findRenderedCmRoot(customEl) {
    // Bei dir wird der gerenderte Bereich nach <strudel-editor> als Geschwister angehängt
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

  function buildNthList(indices1Based) {
    return indices1Based
      .map(n => `.cm-content .cm-line:nth-of-type(${n})`)
      .join(", ");
  }

  function applyOne(customEl, idx) {
    const cmRoot = findRenderedCmRoot(customEl);
    if (!cmRoot) return false;

    const uniq = customEl.id ? `sm-${customEl.id}` : `sm-auto-${idx}`;
    cmRoot.classList.add("strudel-cm", uniq);

    const lines = cmRoot.querySelectorAll(".cm-line");
    if (!lines.length) return false;

    // 1) Block: bis //--- verstecken (inkl. Markerzeile)
    let blockMarkerIndex0 = -1;

    // 2) Einzelzeilen: Zeilen mit //-!- verstecken
    const hideLineNums1 = [];

    // 3) Markerzeilen immer verstecken (auch wenn kein Block-Modus aktiv)
    const hideMarkerNums1 = [];

    lines.forEach((line, i) => {
      if (isBlockMarker(line)) {
        blockMarkerIndex0 = i;
        hideMarkerNums1.push(i + 1); // Markerzeile selbst
      }
      if (isHideLine(line)) hideLineNums1.push(i + 1);
    });

    const hideFirstCount = blockMarkerIndex0 >= 0 ? (blockMarkerIndex0 + 1) : 0;

    // CSS bauen
    let css = "";

    if (hideFirstCount > 0) {
      css += `
/* ${uniq}: hide first ${hideFirstCount} lines (until //---) */
.cm-editor.${uniq} .cm-content .cm-line:nth-of-type(-n+${hideFirstCount}) {
  display: none !important;
}
`;
    }

    if (hideLineNums1.length > 0) {
      css += `
/* ${uniq}: hide lines marked with //-!- */
.cm-editor.${uniq} ${buildNthList(hideLineNums1)} {
  display: none !important;
}
`;
    }

    if (hideMarkerNums1.length > 0) {
      css += `
/* ${uniq}: always hide //--- marker line itself */
.cm-editor.${uniq} ${buildNthList(hideMarkerNums1)} {
  display: none !important;
}
`;
    }

    // Gutter (Zeilennummern) nur ausblenden, wenn wir wirklich was ausblenden
    if (hideFirstCount > 0 || hideLineNums1.length > 0 || hideMarkerNums1.length > 0) {
      css += `
.cm-editor.${uniq} .cm-gutters { display: none !important; }
`;
    }

    // Optional: only-viz => CodeMirror komplett ausblenden (Visual bleibt)
    if (customEl.classList.contains(CLASS_ONLY_VIZ)) {
      css += `
/* ${uniq}: only-viz -> hide code editor */
.cm-editor.${uniq} { display: none !important; }
`;
    }

    if (!css) return false;

    const tag = ensureStyleTag();
    if (!tag.textContent.includes(`/* ${uniq}:`)) {
      tag.appendChild(document.createTextNode(css));
    }

    return true;
  }

  function process() {
    document.querySelectorAll(`strudel-editor.${CLASS_BASE}`).forEach((el, i) => {
      applyOne(el, i);
    });
  }

  // wiederholt anwenden (Mount + Update)
  let tries = 0;
  const timer = setInterval(() => {
    process();
    if (++tries > 60) clearInterval(timer);
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

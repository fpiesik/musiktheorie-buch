(() => {
  const CLASS_NAME = "hide-until-marker";
  const UNTIL_MARKER_A = "// ---";   // block marker
  const LINE_HIDE_MARK = "-!-";      // inline marker for single-line hide

  function norm(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function isUntilMarkerLine(lineEl) {
    const t = norm(lineEl.textContent);
    // robust: erkennt auch "//---" etc.
    return t.includes("//") && t.includes("---");
  }

  function isHideLine(lineEl) {
    const t = norm(lineEl.textContent);
    return t.includes(LINE_HIDE_MARK);
  }

  function findRenderedCmRoot(customEl) {
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
    // z.B. [3,5,9] -> ".cm-line:nth-of-type(3), .cm-line:nth-of-type(5), ..."
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

    let markerIndex0 = -1;              // 0-based
    const hideLineNums1 = [];           // 1-based indices for nth-of-type

    lines.forEach((line, i) => {
      if (isUntilMarkerLine(line)) markerIndex0 = i;
      if (isHideLine(line)) hideLineNums1.push(i + 1);
    });

    // block hide: hide 1..(markerIndex+1) (inkl. Markerzeile)
    const hideFirstCount = markerIndex0 >= 0 ? (markerIndex0 + 1) : 0;

    // CSS zusammenbauen (nur wenn nötig)
    let css = "";

    if (hideFirstCount > 0) {
      css += `
/* ${uniq}: hide first ${hideFirstCount} lines (until marker) */
.cm-editor.${uniq} .cm-content .cm-line:nth-of-type(-n+${hideFirstCount}) {
  display: none !important;
}
`;
    }

    if (hideLineNums1.length > 0) {
      css += `
/* ${uniq}: hide marked lines containing "${LINE_HIDE_MARK}" */
.cm-editor.${uniq} ${buildNthList(hideLineNums1)} {
  display: none !important;
}
`;
    }

    // Optional: wenn du die Marker-Zeilen NICHT im Text sehen willst, ist das schon erledigt,
    // weil die Zeilen selbst verschwinden. Falls du nur den Marker-Teil entfernen willst,
    // wäre das ein anderes (komplizierteres) Thema.

    // Optional: Gutter ausblenden, wenn irgendwas versteckt wird
    if (hideFirstCount > 0 || hideLineNums1.length > 0) {
      css += `
.cm-editor.${uniq} .cm-gutters {
  display: none !important;
}
`;
    }

    if (!css) return false;

    const tag = ensureStyleTag();
    // Regel nur einmal anhängen
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

  // wiederholt anwenden (Mount + Update)
  let tries = 0;
  const timer = setInterval(() => {
    process();
    if (++tries > 60) clearInterval(timer); // ~6s
  }, 100);

  window.addEventListener("load", () => {
    process();
    setTimeout(process, 250);
    setTimeout(process, 1000);
  });

  document.addEventListener("click", (e) => {
    if ((e.target?.textContent || "").trim() === "Update") {
      // Update rendert neu -> erneut anwenden
      setTimeout(process, 50);
      setTimeout(process, 250);
    }
  });
})();

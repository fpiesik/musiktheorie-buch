(() => {
  const CLASS_BASE = "hide-until-marker";
  const CLASS_NO_VIZ = "no-viz";

  // Marker (wie gehabt, Leerzeichen optional)
  const RE_BLOCK_MARKER = /\/\/\s*---\s*$/; // z.B. //--- oder // ---
  const RE_HIDE_LINE    = /\/\/\s*-\!-\s*$/; // z.B. //-!- oder // -!-

  function text(lineEl) {
    return (lineEl.textContent || "").trim();
  }

  function isBlockMarker(lineEl) {
    return RE_BLOCK_MARKER.test(text(lineEl));
  }

  function isHideLine(lineEl) {
    return RE_HIDE_LINE.test(text(lineEl));
  }

  // Bei dir wird der gerenderte Bereich nach <strudel-editor> als Geschwister angehängt
  function findRenderedContainer(customEl) {
    let n = customEl.nextElementSibling;
    for (let i = 0; i < 12 && n; i++) {
      if (n.querySelector?.(".cm-editor")) return n;
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

  function escapeCssIdent(s) {
    // CSS.escape ist nicht überall garantiert; einfache Fallback-Variante
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function buildNthList(indices1Based) {
    return indices1Based
      .map(n => `.cm-content .cm-line:nth-of-type(${n})`)
      .join(", ");
  }

  function buildCssForEditor(uniqClass, hideFirstCount, hideLineNums1, hideMarkerNums1, noViz) {
    let css = "";

    if (hideFirstCount > 0) {
      css += `
/* ${uniqClass}: hide first ${hideFirstCount} lines (until marker) */
.cm-editor.${uniqClass} .cm-content .cm-line:nth-of-type(-n+${hideFirstCount}) { display: none !important; }
`;
    }

    if (hideLineNums1.length > 0) {
      css += `
/* ${uniqClass}: hide lines marked with //-!- */
.cm-editor.${uniqClass} ${buildNthList(hideLineNums1)} { display: none !important; }
`;
    }

    if (hideMarkerNums1.length > 0) {
      css += `
/* ${uniqClass}: always hide marker line itself */
.cm-editor.${uniqClass} ${buildNthList(hideMarkerNums1)} { display: none !important; }
`;
    }

    // Gutter (Zeilennummern) nur ausblenden, wenn wir wirklich was ausblenden
    if (hideFirstCount > 0 || hideLineNums1.length > 0 || hideMarkerNums1.length > 0) {
      css += `
.cm-editor.${uniqClass} .cm-gutters { display: none !important; }
`;
    }

    // no-viz: Visualizer/Canvas ausblenden (wenn vorhanden)
    // (Wir zielen breit auf canvas/SVG im gerenderten Container. Das betrifft NICHT den Editor selbst.)
    if (noViz) {
      css += `
/* ${uniqClass}: no-viz -> hide visual output (canvas/svg) */
.${uniqClass}-container canvas, .${uniqClass}-container svg { display: none !important; }
`;
    }

    return css;
  }

  function applyOne(customEl, idx) {
    const container = findRenderedContainer(customEl);
    if (!container) return false;

    const cmRoot = container.querySelector(".cm-editor");
    if (!cmRoot) return false;

    // eindeutige Klassen pro Instanz
    const uniq = customEl.id ? `sm-${customEl.id}` : `sm-auto-${idx}`;
    cmRoot.classList.add(uniq);

    // zusätzlich eine Klasse am Container, falls wir no-viz darauf anwenden wollen
    const uniqContainerClass = `${uniq}-container`;
    container.classList.add(uniqContainerClass);

    const lines = cmRoot.querySelectorAll(".cm-line");
    if (!lines.length) return false;

    let blockMarkerIndex0 = -1;
    const hideLineNums1 = [];
    const hideMarkerNums1 = [];

    lines.forEach((line, i) => {
      if (isBlockMarker(line)) {
        blockMarkerIndex0 = i;
        hideMarkerNums1.push(i + 1);
      }
      if (isHideLine(line)) hideLineNums1.push(i + 1);
    });

    const hideFirstCount = blockMarkerIndex0 >= 0 ? (blockMarkerIndex0 + 1) : 0;
    const noViz = customEl.classList.contains(CLASS_NO_VIZ);

    const styleTag = ensureStyleTag();

    // ✅ WICHTIG: Regeln pro Editor *aktualisieren*, nicht nur einmal anhängen.
    // Wir ersetzen den Block für diese uniq-Klasse per Regex.
    const start = `/*BEGIN:${uniq}*/`;
    const end   = `/*END:${uniq}*/`;
    const blockCss = `${start}\n${buildCssForEditor(uniq, hideFirstCount, hideLineNums1, hideMarkerNums1, noViz)}\n${end}\n`;

    const re = new RegExp(`/\\*BEGIN:${uniq}\\*/[\\s\\S]*?/\\*END:${uniq}\\*/\\n?`, "g");
    const current = styleTag.textContent || "";
    const next = current.match(re)
      ? current.replace(re, blockCss)
      : current + "\n" + blockCss;

    if (next !== current) styleTag.textContent = next;

    return true;
  }

  function process() {
    document.querySelectorAll(`strudel-editor.${CLASS_BASE}`).forEach((el, i) => {
      applyOne(el, i);
    });
  }

  // Performance: kurzes Polling-Fenster, dann nur Events
  function start() {
    process();

    let tries = 0;
    const maxTries = 18;     // 18 * 200ms = 3.6s
    const timer = setInterval(() => {
      process();
      if (++tries >= maxTries) clearInterval(timer);
    }, 200);

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
  }

  start();
})();

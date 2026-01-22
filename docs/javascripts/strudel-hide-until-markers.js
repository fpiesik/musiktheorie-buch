(() => {
  const CLASS_BASE = "hide-until-marker";
  const CLASS_NO_VIZ = "no-viz";

  // Marker (ohne Leerzeichen empfohlen)
  const BLOCK_MARK = "//---";
  const HIDE_MARK  = "//-!-";

  /* ------------------------------------------------------------
     Marker-Erkennung (robust für CodeMirror)
  ------------------------------------------------------------ */

  function commentPart(lineEl) {
    const t = (lineEl.textContent || "");
    const idx = t.indexOf("//");
    if (idx === -1) return "";
    return t.slice(idx);
  }

  function isBlockMarker(lineEl) {
    return commentPart(lineEl).includes(BLOCK_MARK);
  }

  function isHideLine(lineEl) {
    return commentPart(lineEl).includes(HIDE_MARK);
  }

  /* ------------------------------------------------------------
     Gerenderten CodeMirror-Container finden
  ------------------------------------------------------------ */

  function findRenderedContainer(customEl) {
    let n = customEl.nextElementSibling;
    for (let i = 0; i < 12 && n; i++) {
      if (n.querySelector?.(".cm-editor")) return n;
      n = n.nextElementSibling;
    }
    return null;
  }

  /* ------------------------------------------------------------
     Style-Tag verwalten
  ------------------------------------------------------------ */

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

  /* ------------------------------------------------------------
     CSS für einen Editor erzeugen
  ------------------------------------------------------------ */

  function buildCss(uniq, hideFirstCount, hideLineNums1, hideMarkerNums1, noViz) {
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
/* ${uniq}: hide marker line itself */
.cm-editor.${uniq} ${buildNthList(hideMarkerNums1)} {
  display: none !important;
}
`;
    }

    if (hideFirstCount > 0 || hideLineNums1.length > 0 || hideMarkerNums1.length > 0) {
      css += `
.cm-editor.${uniq} .cm-gutters {
  display: none !important;
}
`;
    }

    if (noViz) {
      css += `
/* ${uniq}: no-viz -> hide visual output */
.${uniq}-container canvas,
.${uniq}-container svg {
  display: none !important;
}
`;
    }

    return css;
  }

  /* ------------------------------------------------------------
     Einen Editor verarbeiten
  ------------------------------------------------------------ */

  function applyOne(customEl, idx) {
    const container = findRenderedContainer(customEl);
    if (!container) return false;

    const cmRoot = container.querySelector(".cm-editor");
    if (!cmRoot) return false;

    const uniq = customEl.id ? `sm-${customEl.id}` : `sm-auto-${idx}`;
    const uniqContainer = `${uniq}-container`;

    cmRoot.classList.add(uniq);
    container.classList.add(uniqContainer);

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

    const hideFirstCount =
      blockMarkerIndex0 >= 0 ? (blockMarkerIndex0 + 1) : 0;

    const noViz = customEl.classList.contains(CLASS_NO_VIZ);

    const styleTag = ensureStyleTag();
    const start = `/*BEGIN:${uniq}*/`;
    const end   = `/*END:${uniq}*/`;
    const blockCss = `${start}\n${buildCss(
      uniq,
      hideFirstCount,
      hideLineNums1,
      hideMarkerNums1,
      noViz
    )}\n${end}\n`;

    const re = new RegExp(`/\\*BEGIN:${uniq}\\*/[\\s\\S]*?/\\*END:${uniq}\\*/\\n?`, "g");
    const current = styleTag.textContent || "";
    const next = current.match(re)
      ? current.replace(re, blockCss)
      : current + "\n" + blockCss;

    if (next !== current) styleTag.textContent = next;

    return true;
  }

  /* ------------------------------------------------------------
     Verarbeitung aller Strudel-Editoren
  ------------------------------------------------------------ */

  function process() {
    document
      .querySelectorAll(`strudel-editor.${CLASS_BASE}`)
      .forEach((el, i) => applyOne(el, i));
  }

  /* ------------------------------------------------------------
     Lifecycle & Performance
  ------------------------------------------------------------ */

  function start() {
    process();

    // kurzes Polling-Fenster (Web Components / CM async)
    let tries = 0;
    const maxTries = 18; // ~3.6s
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

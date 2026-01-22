(() => {
  const CLASS_BASE = "hide-until-marker";
  const CLASS_ONLY_VIZ = "only-viz";

  // Marker (ohne Leerzeichen gedacht)
  const BLOCK_MARK = "//---";
  const HIDE_MARK  = "//-!-";

  /* ------------------------------------------------------------
     Hilfsfunktionen
  ------------------------------------------------------------ */

  // entfernt Zero-Width, BOM, Whitespace → robuste Vergleichsbasis
  function normalize(s) {
    return (s || "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, "");
  }

  function hasMarker(lineEl, marker) {
    const raw = lineEl.textContent || "";
    const norm = normalize(raw);
    return norm.includes(normalize(marker));
  }

  function isBlockMarker(lineEl) {
    return hasMarker(lineEl, BLOCK_MARK);
  }

  function isHideLine(lineEl) {
    return hasMarker(lineEl, HIDE_MARK);
  }

  // Strudel hängt den CodeMirror-Block als Geschwister an
  function findRenderedCmRoot(customEl) {
    let n = customEl.nextElementSibling;
    for (let i = 0; i < 12 && n; i++) {
      const cm = n.querySelector?.(".cm-editor");
      if (cm) return cm;
      n = n.nextElementSibling;
    }
    return null;
  }

  /* ------------------------------------------------------------
     Kernlogik
  ------------------------------------------------------------ */

  function applyOne(customEl) {
    const cmRoot = findRenderedCmRoot(customEl);
    if (!cmRoot) return false;

    const lines = cmRoot.querySelectorAll(".cm-line");
    if (!lines.length) return false;

    // letztes Vorkommen von //--- gewinnt
    let blockMarkerIndex = -1;
    lines.forEach((line, i) => {
      if (isBlockMarker(line)) blockMarkerIndex = i;
    });

    let hidesSomething = false;

    lines.forEach((line, i) => {
      const hide =
        (blockMarkerIndex >= 0 && i <= blockMarkerIndex) || // bis //---
        isHideLine(line) ||                                 // //-!-
        isBlockMarker(line);                                // Markerzeile selbst

      if (hide) {
        hidesSomething = true;
        line.style.setProperty("display", "none", "important");
      } else {
        line.style.removeProperty("display");
      }
    });

    // Zeilennummern (Gutter) nur ausblenden, wenn nötig
    const gutters = cmRoot.querySelector(".cm-gutters");
    if (gutters) {
      if (hidesSomething) {
        gutters.style.setProperty("display", "none", "important");
      } else {
        gutters.style.removeProperty("display");
      }
    }

    // only-viz: CodeMirror komplett ausblenden, Visual bleibt
    if (customEl.classList.contains(CLASS_ONLY_VIZ)) {
      cmRoot.style.setProperty("display", "none", "important");
    } else {
      cmRoot.style.removeProperty("display");
    }

    return true;
  }

  function process() {
    document
      .querySelectorAll(`strudel-editor.${CLASS_BASE}`)
      .forEach(applyOne);
  }

  /* ------------------------------------------------------------
     Lifecycle & Performance
  ------------------------------------------------------------ */

  function start() {
    process();

    // kurzes Initial-Polling (Web Components / CodeMirror sind async)
    let tries = 0;
    const maxTries = 18;   // ~3.6s
    const interval = 200;

    const poll = setInterval(() => {
      process();
      if (++tries >= maxTries) clearInterval(poll);
    }, interval);

    // nach load nochmal
    window.addEventListener("load", () => {
      process();
      setTimeout(process, 250);
      setTimeout(process, 1000);
    });

    // nach Strudel-"Update"
    document.addEventListener("click", (e) => {
      if ((e.target?.textContent || "").trim() === "Update") {
        setTimeout(process, 50);
        setTimeout(process, 250);
      }
    });
  }

  start();
})();

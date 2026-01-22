(() => {
  const CLASS_BASE = "hide-until-marker";

  // Marker (ohne Leerzeichen empfohlen)
  const BLOCK_MARK = "//---"; // block: alles bis inkl. Marker
  const HIDE_MARK  = "//-!-"; // einzelne Zeile

  function hasMarker(lineEl, marker) {
    const t = (lineEl.textContent || "");
    const idx = t.indexOf("//");
    if (idx === -1) return false;
    return t.slice(idx).includes(marker);
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

  function applyToEditor(customEl) {
    const cmRoot = findRenderedCmRoot(customEl);
    if (!cmRoot) return false;

    const lines = cmRoot.querySelectorAll(".cm-line");
    if (!lines.length) return false;

    // Block-Marker finden (letztes Vorkommen gewinnt)
    let blockIdx = -1;
    lines.forEach((line, i) => {
      if (hasMarker(line, BLOCK_MARK)) blockIdx = i;
    });

    let hidesSomething = false;

    lines.forEach((line, i) => {
      const hide =
        (blockIdx >= 0 && i <= blockIdx) ||  // bis //---
        hasMarker(line, HIDE_MARK) ||        // //-!-
        hasMarker(line, BLOCK_MARK);         // Markerzeile selbst

      if (hide) {
        hidesSomething = true;
        line.style.setProperty("display", "none", "important");
      } else {
        line.style.removeProperty("display");
      }
    });

    // Zeilennummern nur ausblenden wenn nötig
    const gutters = cmRoot.querySelector(".cm-gutters");
    if (gutters) {
      if (hidesSomething) gutters.style.setProperty("display", "none", "important");
      else gutters.style.removeProperty("display");
    }

    return true;
  }

  // Debounce, damit wir bei vielen Mutations nicht dauernd rechnen
  function debounce(fn, ms) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  const observers = new WeakMap();

  function ensureObserver(customEl) {
    const cmRoot = findRenderedCmRoot(customEl);
    if (!cmRoot) return false;

    if (observers.has(cmRoot)) return true;

    const run = debounce(() => applyToEditor(customEl), 30);

    const obs = new MutationObserver(run);
    obs.observe(cmRoot, { childList: true, subtree: true, characterData: true });

    observers.set(cmRoot, obs);

    // initial anwenden
    applyToEditor(customEl);
    return true;
  }

  function processAll() {
    document.querySelectorAll(`strudel-editor.${CLASS_BASE}`).forEach((el) => {
      // falls cmRoot noch nicht existiert, später nochmal versuchen
      ensureObserver(el);
      applyToEditor(el);
    });
  }

  function start() {
    processAll();

    // kurzes Bootstrapping: Editor taucht manchmal verzögert auf
    let tries = 0;
    const maxTries = 40; // 40 * 200ms = 8s (nur initial)
    const t = setInterval(() => {
      processAll();
      if (++tries >= maxTries) clearInterval(t);
    }, 200);

    window.addEventListener("load", () => {
      processAll();
      setTimeout(processAll, 250);
      setTimeout(processAll, 1000);
    });

    // Nach "Update" ebenfalls neu anwenden
    document.addEventListener("click", (e) => {
      if ((e.target?.textContent || "").trim() === "Update") {
        setTimeout(processAll, 50);
        setTimeout(processAll, 250);
      }
    });
  }

  start();
})();

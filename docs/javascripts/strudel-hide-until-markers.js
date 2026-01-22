(() => {
  const CLASS_BASE = "hide-until-marker";

  // Marker (ohne Leerzeichen empfohlen)
  const BLOCK_MARK = "//---"; // block: alles bis inkl. Marker
  const HIDE_MARK  = "//-!-"; // einzelne Zeile

  // Debounce
  function debounce(fn, ms) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function commentPart(lineEl) {
    const t = (lineEl.textContent || "");
    const idx = t.indexOf("//");
    if (idx === -1) return "";
    return t.slice(idx);
  }

  function isBlockMarker(lineEl) {
    // bewusst robust: nicht ans Zeilenende gebunden
    return commentPart(lineEl).includes(BLOCK_MARK);
  }

  function isHideLine(lineEl) {
    return commentPart(lineEl).includes(HIDE_MARK);
  }

  function findRenderedContainer(customEl) {
    // Strudel hängt gerenderten Bereich nach <strudel-editor> an
    let n = customEl.nextElementSibling;
    for (let i = 0; i < 12 && n; i++) {
      if (n.querySelector?.(".cm-editor")) return n;
      n = n.nextElementSibling;
    }
    return null;
  }

  function findRenderedCmRoot(customEl) {
    const container = findRenderedContainer(customEl);
    if (!container) return null;
    return container.querySelector(".cm-editor");
  }

  function apply(customEl) {
    const cmRoot = findRenderedCmRoot(customEl);
    if (!cmRoot) return false;

    const lines = cmRoot.querySelectorAll(".cm-line");
    if (!lines.length) return false;

    // letztes //--- gewinnt
    let blockIdx = -1;
    lines.forEach((line, i) => {
      if (isBlockMarker(line)) blockIdx = i;
    });

    let hidesSomething = false;

    lines.forEach((line, i) => {
      const hide =
        (blockIdx >= 0 && i <= blockIdx) || // bis //---
        isHideLine(line) ||                 // //-!-
        isBlockMarker(line);                // Markerzeile selbst

      if (hide) {
        hidesSomething = true;
        line.style.setProperty("display", "none", "important");
      } else {
        line.style.removeProperty("display");
      }
    });

    // optional: gutters verstecken, wenn wir Zeilen verstecken
    const gutters = cmRoot.querySelector(".cm-gutters");
    if (gutters) {
      if (hidesSomething) gutters.style.setProperty("display", "none", "important");
      else gutters.style.removeProperty("display");
    }

    return true;
  }

  // --- Beobachter-Management ---
  // Pro <strudel-editor> merken wir uns:
  // - aktuell beobachteten cmRoot (kann wechseln!)
  // - Observer für cmRoot
  // - Observer für container/parent (um Wechsel zu erkennen)
  const state = new WeakMap();

  function attach(customEl) {
    const container = findRenderedContainer(customEl);
    const cmRoot = container?.querySelector?.(".cm-editor") || null;
    if (!container || !cmRoot) return false;

    let s = state.get(customEl);
    if (!s) {
      s = { cmRoot: null, cmObs: null, containerObs: null };
      state.set(customEl, s);
    }

    // Wenn cmRoot neu ist (Play remount!), Observer neu setzen
    if (s.cmRoot !== cmRoot) {
      if (s.cmObs) s.cmObs.disconnect();
      s.cmRoot = cmRoot;

      const reapply = debounce(() => apply(customEl), 30);

      s.cmObs = new MutationObserver(reapply);
      s.cmObs.observe(cmRoot, { childList: true, subtree: true, characterData: true });

      // sofort anwenden
      apply(customEl);
    }

    // Container observer nur einmal: merkt, wenn Strudel cmRoot austauscht
    if (!s.containerObs) {
      const reattach = debounce(() => {
        // Bei Änderungen im Container: ggf. neuen cmRoot finden und attachen
        attach(customEl);
        apply(customEl);
      }, 30);

      s.containerObs = new MutationObserver(reattach);
      s.containerObs.observe(container, { childList: true, subtree: true });
    }

    return true;
  }

  function processAll() {
    document.querySelectorAll(`strudel-editor.${CLASS_BASE}`).forEach((el) => {
      attach(el);
      apply(el);
    });
  }

  function start() {
    processAll();

    // Bootstrapping: falls cmRoot erst später erscheint
    let tries = 0;
    const maxTries = 60;   // 60 * 200ms = 12s (nur initial)
    const t = setInterval(() => {
      processAll();
      if (++tries >= maxTries) clearInterval(t);
    }, 200);

    window.addEventListener("load", () => {
      processAll();
      setTimeout(processAll, 250);
      setTimeout(processAll, 1000);
    });

    // Wenn du Play drückst, passiert oft ein Remount: nochmal kurz nachziehen
    document.addEventListener("click", (e) => {
      const txt = (e.target?.textContent || "").trim();
      // trifft auf deinen Toggle-Button (▶/■) und ggf. Strudel-Controls
      if (txt === "▶" || txt === "■" || txt === "▶/■") {
        setTimeout(processAll, 50);
        setTimeout(processAll, 250);
        setTimeout(processAll, 800);
      }
      if (txt === "Update") {
        setTimeout(processAll, 50);
        setTimeout(processAll, 250);
        setTimeout(processAll, 800);
      }
    });
  }

  start();
})();

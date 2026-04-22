(() => {
  const CLS_NO_CONTROLS = "no-controls";
  const CLS_NO_UPDATE   = "no-update";
  const CLS_NO_TOGGLE   = "no-toggle";

  function setBtnIcon(btn, isPlaying) {
    btn.textContent = isPlaying ? "■" : "▶";
    btn.setAttribute("aria-label", isPlaying ? "Stop" : "Play");
  }

  function ensureControlsFor(editorEl) {
    if (editorEl.classList.contains(CLS_NO_CONTROLS)) return;

    // Schon vorhanden?
    if (editorEl.previousElementSibling?.classList?.contains("strudel-controls")) return;

    const controls = document.createElement("div");
    controls.className = "strudel-controls";

    // Buttons optional je nach Klassen
    const wantToggle = !editorEl.classList.contains(CLS_NO_TOGGLE);
    const wantUpdate = !editorEl.classList.contains(CLS_NO_UPDATE);

    let btnToggle = null;
    let btnUpdate = null;

    if (wantToggle) {
      btnToggle = document.createElement("button");
      btnToggle.type = "button";
      btnToggle.className = "strudel-btn-toggle";
      setBtnIcon(btnToggle, false);
      controls.appendChild(btnToggle);
    }

    if (wantUpdate) {
      btnUpdate = document.createElement("button");
      btnUpdate.type = "button";
      btnUpdate.className = "strudel-btn-update";
      btnUpdate.textContent = "Update";
      controls.appendChild(btnUpdate);
    }

    // Vor den Editor setzen (in denselben Wrapper)
    editorEl.parentElement?.insertBefore(controls, editorEl);

    // Bindings: warten, bis editorEl.editor existiert
    const bind = () => {
      const ed = editorEl.editor;
      if (!ed) return false;

      // --- Toggle (Play/Stop) ---
      if (btnToggle) {
        // Wir tracken Zustand lokal (robust, auch wenn keine API für "isPlaying" existiert)
        let playing = false;
        setBtnIcon(btnToggle, playing);

        btnToggle.onclick = () => {
          // Strudel-API: toggle() ist bei dir vorhanden
          ed.toggle?.();

          // Zustand umschalten (optimistisch)
          playing = !playing;
          setBtnIcon(btnToggle, playing);

          // Fallback: Falls es eine echte Abfrage gibt, nutz sie (optional)
          // Manche Implementationen bieten ed.isPlaying() oder ed.playing
          try {
            if (typeof ed.isPlaying === "function") {
              playing = !!ed.isPlaying();
              setBtnIcon(btnToggle, playing);
            } else if (typeof ed.playing === "boolean") {
              playing = ed.playing;
              setBtnIcon(btnToggle, playing);
            }
          } catch (_) {}
        };
      }

      // --- Update ---
      if (btnUpdate) {
        btnUpdate.onclick = () => (ed.evaluate?.() || ed.eval?.());
      }

      return true;
    };

    if (bind()) return;

    let tries = 0;
    const t = setInterval(() => {
      if (bind() || ++tries > 80) clearInterval(t);
    }, 100);
  }

  function processAll() {
    document.querySelectorAll("strudel-editor").forEach(ensureControlsFor);
  }

  // Initial + nach load + kurzes Polling (Web Components)
  processAll();
  window.addEventListener("load", processAll);

  let tries = 0;
  const poll = setInterval(() => {
    processAll();
    if (++tries > 40) clearInterval(poll);
  }, 200);
})();

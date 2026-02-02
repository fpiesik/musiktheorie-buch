/* abc-render.js
 *
 * Renders ABC notation blocks in MkDocs pages and adds abcjs playback UI.
 *
 * Requirements in mkdocs.yml:
 *   extra_javascript:
 *     - javascripts/vendor/abcjs-basic-min.js
 *     - javascripts/abc-render.js
 *
 *   extra_css:
 *     - stylesheets/vendor/abcjs-audio.css
 */

(function () {
  "use strict";

  // --- Helpers --------------------------------------------------------------

  function whenAbcjsReady(cb, retries = 80) {
    if (window.ABCJS && window.ABCJS.renderAbc && window.ABCJS.synth) return cb();
    if (retries <= 0) {
      console.error("abcjs not loaded: window.ABCJS is missing or incomplete");
      return;
    }
    setTimeout(() => whenAbcjsReady(cb, retries - 1), 100);
  }

  function findAbcBlocks(root = document) {
    // MkDocs fenced code blocks usually render as: <pre><code class="language-abc">...</code></pre>
    return Array.from(root.querySelectorAll("pre > code.language-abc, pre > code.lang-abc"));
  }

  function createContainer() {
    const wrap = document.createElement("div");
    wrap.className = "abc-wrap";

    const audioDiv = document.createElement("div");
    audioDiv.className = "abc-audio";

    const notationDiv = document.createElement("div");
    notationDiv.className = "abc-notation";

    wrap.appendChild(audioDiv);
    wrap.appendChild(notationDiv);

    return { wrap, audioDiv, notationDiv };
  }

  // --- Main rendering -------------------------------------------------------

  async function renderOne(codeEl) {
    if (!codeEl || codeEl.dataset.abcProcessed === "1") return;

    const abcText = (codeEl.textContent || "").trim();
    if (!abcText) return;

    const pre = codeEl.closest("pre");
    if (!pre) return;

    // Mark as processed before we start (prevents double init on fast nav)
    codeEl.dataset.abcProcessed = "1";

    const { wrap, audioDiv, notationDiv } = createContainer();

    // Replace the <pre> block with our container
    pre.replaceWith(wrap);

    // Render notation
    let visualObj;
    try {
      const visualObjs = ABCJS.renderAbc(notationDiv, abcText, {
        responsive: "resize",
        add_classes: true,
      });
      visualObj = visualObjs && visualObjs[0];
    } catch (e) {
      console.error("ABC render error:", e);
      audioDiv.textContent = "ABC render error (see console).";
      return;
    }

    if (!visualObj) {
      audioDiv.textContent = "Could not render ABC notation.";
      return;
    }

    // Create audio UI (IMPORTANT: load into audioDiv ONLY, never into wrap/notationDiv)
    try {
      const synthCtrl = new ABCJS.synth.SynthController();

      // This will create the built-in Play button + progress bar
      synthCtrl.load(audioDiv, null, {
        displayPlay: true,
        displayProgress: true,
        displayLoop: false,
        displayRestart: false,
      });

      // Prepare tune for playback
      await synthCtrl.setTune(visualObj, false, {
        chordsOff: true,
      });

      // Optional: make sure the audio UI is visible even if empty styles exist
      audioDiv.style.display = "";
    } catch (e) {
      console.error("ABC Playback error:", e);
      audioDiv.textContent = "Playback error (see console).";
    }
  }

  function renderAll() {
    const blocks = findAbcBlocks(document);
    blocks.forEach((codeEl) => {
      // renderOne is async; we intentionally don't await so it doesn't block UI
      renderOne(codeEl);
    });
  }

  // --- MkDocs Material integration -----------------------------------------

  function boot() {
    whenAbcjsReady(() => {
      renderAll();
    });
  }

  // MkDocs Material "Instant navigation": rerun on every page swap if available
  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(() => boot());
  } else {
    // Classic full-page load
    window.addEventListener("DOMContentLoaded", boot);
  }
})();

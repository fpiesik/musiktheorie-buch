/* abc-render.js
 *
 * Renders ABC notation blocks in MkDocs pages and optionally adds abcjs playback UI.
 *
 * Playback is DEFAULT OFF.
 * Enable per block by adding a directive line anywhere in the ABC text:
 *   %%playback: on
 * Disable explicitly:
 *   %%playback: off
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
      remindMissingAbcjs();
      return;
    }
    setTimeout(() => whenAbcjsReady(cb, retries - 1), 100);
  }

  function remindMissingAbcjs() {
    console.error("abcjs not loaded: window.ABCJS is missing or incomplete");
  }

  function findAbcBlocks(root = document) {
    // MkDocs fenced code blocks usually render as: <pre><code class="language-abc">...</code></pre>
    return Array.from(root.querySelectorAll("pre > code.language-abc, pre > code.lang-abc"));
  }

  function parsePlaybackDirective(abcText) {
    // DEFAULT OFF
    let playback = false;

    const lines = abcText.split(/\r?\n/);
    const directiveRe = /^\s*%%\s*playback\s*:\s*(on|off)\s*$/i;

    const cleanedLines = [];
    for (const line of lines) {
      const m = line.match(directiveRe);
      if (m) {
        playback = m[1].toLowerCase() === "on";
        continue; // strip directive from the ABC text
      }
      cleanedLines.push(line);
    }

    return { playback, cleanedAbcText: cleanedLines.join("\n").trim() };
  }

  function createContainer(withAudio) {
    const wrap = document.createElement("div");
    wrap.className = "abc-wrap";

    const notationDiv = document.createElement("div");
    notationDiv.className = "abc-notation";

    wrap.appendChild(notationDiv);

    let audioDiv = null;
    if (withAudio) {
      audioDiv = document.createElement("div");
      audioDiv.className = "abc-audio";
      // Audio UI should be UNDER the notation:
      wrap.appendChild(audioDiv);
    }

    return { wrap, notationDiv, audioDiv };
  }

  // --- Main rendering -------------------------------------------------------

  async function renderOne(codeEl) {
    if (!codeEl || codeEl.dataset.abcProcessed === "1") return;

    const rawText = (codeEl.textContent || "").trim();
    if (!rawText) return;

    const pre = codeEl.closest("pre");
    if (!pre) return;

    // Mark as processed early to avoid double init during fast nav
    codeEl.dataset.abcProcessed = "1";

    const { playback, cleanedAbcText } = parsePlaybackDirective(rawText);

    const { wrap, notationDiv, audioDiv } = createContainer(playback);

    // Replace the <pre> block with our container
    pre.replaceWith(wrap);

    // Render notation
    let visualObj;
    try {
      const visualObjs = ABCJS.renderAbc(notationDiv, cleanedAbcText, {
        responsive: "resize",
        add_classes: true,
      });
      visualObj = visualObjs && visualObjs[0];
    } catch (e) {
      console.error("ABC render error:", e);
      notationDiv.textContent = "ABC render error (see console).";
      return;
    }

    if (!visualObj) {
      notationDiv.textContent = "Could not render ABC notation.";
      return;
    }

    // If playback is disabled for this block, we're done.
    if (!playback) return;

    // Create audio UI (IMPORTANT: load into audioDiv ONLY)
    try {
      const synthCtrl = new ABCJS.synth.SynthController();

      // Built-in Play button + progress bar
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
    } catch (e) {
      console.error("ABC Playback error:", e);
      audioDiv.textContent = "Playback error (see console).";
    }
  }

  function renderAll() {
    const blocks = findAbcBlocks(document);
    blocks.forEach((codeEl) => {
      // Fire and forget; avoids blocking the UI
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

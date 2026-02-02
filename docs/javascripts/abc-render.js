document.addEventListener("DOMContentLoaded", () => {
  const blocks = document.querySelectorAll("pre code.language-abc");

  blocks.forEach((code, i) => {
    const abcText = code.textContent;

    // Wrapper ersetzen den Codeblock
    const wrapper = document.createElement("div");
    wrapper.className = "abc-wrap";

    const notationDiv = document.createElement("div");
    notationDiv.className = "abc-notation";

    const controlsDiv = document.createElement("div");
    controlsDiv.className = "abc-controls";

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.textContent = "▶ Play";
    controlsDiv.appendChild(playBtn);

    wrapper.appendChild(controlsDiv);
    wrapper.appendChild(notationDiv);

    // Codeblock ersetzen
    const pre = code.parentElement;
    pre.replaceWith(wrapper);

    // 1) Render Notation + Tune referenzieren
    // renderAbc gibt ein Array zurück, wir nehmen das erste Tune-Objekt
    const visualObjs = ABCJS.renderAbc(notationDiv, abcText, {
      responsive: "resize",
      add_classes: true
    });

    const visualObj = visualObjs && visualObjs[0];
    if (!visualObj) {
      playBtn.disabled = true;
      playBtn.textContent = "Playback nicht verfügbar";
      return;
    }

    // 2) Playback (Synth) – lazy init on first click
    let synthReady = false;
    let synthCtrl = null;
    let isPlaying = false;

    async function initSynthIfNeeded() {
      if (synthReady) return;

      // SynthController erzeugt die UI (wir verwenden aber unseren Button)
      synthCtrl = new ABCJS.synth.SynthController();

      // Wir "laden" ihn in unseren Wrapper, ohne abcjs-eigene Buttons zu zeigen
      synthCtrl.load(wrapper, null, {
        displayPlay: false,
        displayProgress: true,
        displayLoop: false,
        displayRestart: false
      });

      // AudioEngine vorbereiten
      const synth = new ABCJS.synth.CreateSynth();
      await synth.init({
        visualObj,
        options: {
          // Du kannst hier später Tempo/Instrument etc. anpassen
        }
      });

      // Audio-Kontext initialisieren (muss durch User-Geste passieren)
      await synthCtrl.setTune(visualObj, false, {
        chordsOff: true
      });

      // Der Controller nutzt intern den Synth; "prime" ist wichtig in manchen Browsern
      if (ABCJS.synth.supportsAudio()) {
        await synthCtrl.prime();
      }

      synthReady = true;
    }

    async function togglePlay() {
      try {
        await initSynthIfNeeded();

        if (!synthCtrl) return;

        if (!isPlaying) {
          synthCtrl.play();
          isPlaying = true;
          playBtn.textContent = "■ Stop";
        } else {
          synthCtrl.pause(); // pause toggelt zuverlässig
          isPlaying = false;
          playBtn.textContent = "▶ Play";
        }
      } catch (err) {
        console.error("ABC Playback error:", err);
        playBtn.textContent = "Playback Fehler (Console)";
      }
    }

    playBtn.addEventListener("click", togglePlay);
  });
});

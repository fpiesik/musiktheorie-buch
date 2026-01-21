<div class="strudel-window" id="ex-groove">
  <iframe
    src="https://strudel.cc/#bGV0IGdyb292ZSA9IHAgPT4gc291bmQocCkuZmFzdCgyKQpncm9vdmUoImJkIHNkIikK"
    class="strudel-iframe"
    loading="lazy"
  ></iframe>
</div>

<script>
  // Scrollt den *Container* nach unten, nicht den Inhalt im iframe.
  // Das ist cross-origin-sicher.
  (function () {
    const box = document.getElementById("ex-groove");
    if (!box) return;

    // nach dem Rendern einmal nach unten springen
    requestAnimationFrame(() => {
      box.scrollTop = box.scrollHeight;
    });

    // optional nochmal, falls Layout nachlädt
    setTimeout(() => { box.scrollTop = box.scrollHeight; }, 400);
  })();
</script>

<style>
  .strudel-window {
    width: 100%;
    height: 220px;            /* <- dein "kleines Fenster" */
    overflow: auto;           /* <- scrollbar hier */
    border: 1px solid #ccc;
    border-radius: 12px;
  }

  .strudel-iframe {
    width: 100%;
    height: 900px;            /* <- bewusst groß, damit es was zu scrollen gibt */
    border: 0;
    display: block;
  }
</style>

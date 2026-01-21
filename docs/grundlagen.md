# Rhythmus – Puls und Wiederholung

## Der musikalische Puls

In der Musik ist der **Puls** das regelmäßige Zeitraster, auf dem Klänge erscheinen.
Im folgenden Beispiel hören wir einen gleichmäßigen Puls mit zwei verschiedenen
Schlägen.

👉 Achte nur auf **Reihenfolge** und **Wiederholung**, nicht auf Technik.

---
<div style="display:flex; gap:.5rem; align-items:center; margin:.5rem 0;">
  <button type="button" onclick="window.__strudelToggle?.()">▶/■</button>
  <button type="button" onclick="window.__strudelEval?.()">Update</button>
</div>

<strudel-editor class="strudel hide-until-marker" id="ex1">
  <!--
setcpm(90/4)
// ---
sound("bd sd").fast(2)
  -->
</strudel-editor>

<script>
  (function () {
    const el = document.getElementById("ex1");
    // warte kurz, bis das Web Component initialisiert ist
    const tryBind = () => {
      if (!el || !el.editor) return false;

      // diese Namen sind Beispiele – bitte per DevTools prüfen und anpassen:
      window.__strudelToggle = () => el.editor.toggle?.();
      window.__strudelEval   = () => el.editor.evaluate?.() || el.editor.eval?.();

      return true;
    };

    if (tryBind()) return;
    const t = setInterval(() => { if (tryBind()) clearInterval(t); }, 100);
  })();
</script>


---

## Was hörst du?

- Welche Klänge wiederholen sich?
- Entsteht ein Gefühl von „vorwärts gehen“?
- Kannst du mitzählen?

---

## Aufgabe

Verändere **nur** die Zeichenfolge im Klammerausdruck:

```text
bd sd

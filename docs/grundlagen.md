# Klang & Ton

## Ein erster Klang

Ein einzelner Ton kann mit Strudel sehr einfach erzeugt werden:

<script src="https://unpkg.com/@strudel/repl@latest"></script>
<strudel-editor>
  <!--
setcps(1)
n("<0 1 2 3 4>*8").scale('G4 minor')
.s("gm_lead_6_voice")
.clip(sine.range(.2,.8).slow(8))
.jux(rev)
.room(2)
.sometimes(add(note("12")))
.lpf(perlin.range(200,20000).slow(4))
-->
</strudel-editor>

### Beobachtung
- Der Klang wiederholt sich periodisch
- Tempo und Klangfarbe lassen sich verändern

A multiplayer experiment using trystero (https://github.com/dmotz/trystero).

Basically, you choose a trainer, a pkmn, walk around with it, see their diferent sizes and cries.

Everyone will join a single room using trystero, meaning anyone opening this website will appear to others and vice versa.

## Map

The world is a fixed 32x24 tile map (64px tiles) with dirt paths and little houses, defined in `js/mapa.js` (`LAYOUT`) and drawn from `img/overworld/scenary/tileset.png`. Trainers can only walk on the paths; the camera follows your trainer and a minimap in the top-right corner shows where you and the other players are.

## Tests

```
node --test tests/
uv run --with playwright python tests/smoke_mapa.py   # browser smoke test + screenshot
```

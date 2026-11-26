A multiplayer experiment using trystero (https://github.com/dmotz/trystero).

Basically, you choose a trainer, a pkmn, walk around with it, see their diferent sizes and cries.

Everyone will join a single room using trystero, meaning anyone opening this website will appear to others and vice versa.

## Map

The world is a fixed 32x24 tile map (64px tiles) with dirt paths and little houses, defined in `js/mapa.js` (`LAYOUT`) and drawn from `img/overworld/scenary/tileset.png` (8x4 tiles of 32px). Trainers can only walk on the paths; when a click/tap path hits grass or a house, the trainer tries the other axis before stopping. The pokémon follower has no map collision on purpose. The camera follows your trainer and a minimap in the top-right corner shows the map, the visible area and an arrow for you. Markers for other players exist but are off (`MOSTRAR_OUTROS_JOGADORES` in `js/minimapa.js`).

## Tests

```
npm test               # unit tests (node --test tests/)
npm run test:browser   # browser smoke test, needs uv; screenshot in tests/output/
```

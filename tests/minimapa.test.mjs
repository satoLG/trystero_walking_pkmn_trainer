import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.Image = class { constructor() { this.complete = false; this.naturalWidth = 0; } };
globalThis.document = { createElement() { return { width: 0, height: 0, getContext() { return { fillRect() {}, set fillStyle(v) {} }; } }; } };
const { Minimapa, posicaoNoMinimapa } = await import('../js/minimapa.js');
const { setConnection } = await import('../js/connectionSingleton.js');

test('posicaoNoMinimapa no canto superior esquerdo', () => {
    assert.deepEqual(posicaoNoMinimapa(0, 0, 4, 100, 50), { x: 100, y: 50 });
});

test('posicaoNoMinimapa no canto inferior direito', () => {
    assert.deepEqual(posicaoNoMinimapa(2048, 1536, 4, 100, 50), { x: 100 + 128, y: 50 + 96 });
});

test('posicaoNoMinimapa no centro do mundo', () => {
    assert.deepEqual(posicaoNoMinimapa(1024, 768, 4, 0, 0), { x: 64, y: 48 });
});

test('posicaoNoMinimapa prende valores fora do mundo na borda', () => {
    assert.deepEqual(posicaoNoMinimapa(-500, 99999, 4, 100, 50), { x: 100, y: 50 + 96 });
    assert.deepEqual(posicaoNoMinimapa(99999, -500, 4, 100, 50), { x: 100 + 128, y: 50 });
});

function contextoFalso() {
    return {
        vermelhos: 0,
        _fill: null,
        set fillStyle(v) { this._fill = v; },
        get fillStyle() { return this._fill; },
        fillRect() { if (this._fill === 'red') this.vermelhos++; },
        save() {}, restore() {}, drawImage() {}, strokeRect() {}, translate() {}, rotate() {},
        imageSmoothingEnabled: true, globalAlpha: 1, strokeStyle: '', lineWidth: 1
    };
}

const cenario = {
    _comprimento: 800, _altura: 600, camera: { x: 0, y: 0 },
    personagem: { centroX: 500, centroY: 500, sprite: { atualDirecao: 'up' } }
};

test('não desenha outros jogadores por padrão', () => {
    setConnection({ remotePlayers: { a: { centroX: 100, centroY: 100 } } });
    try {
        const desligado = contextoFalso();
        new Minimapa('x.png').desenhar(desligado, cenario);
        assert.equal(desligado.vermelhos, 0);

        const ligado = contextoFalso();
        new Minimapa('x.png', { mostrarOutros: true }).desenhar(ligado, cenario);
        assert.equal(ligado.vermelhos, 1);
    } finally {
        setConnection(null);
    }
});

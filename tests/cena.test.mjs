import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
globalThis.Image = class {};
globalThis.document = { createElement() { return { getContext() { return { drawImage() {} }; } }; } };
const { Cena } = await import('../js/cena.js');
const { Cenario } = await import('../js/cenario.js');

let chamado;
const mundo = { listeners: {}, addEventListener(t, f) { this.listeners[t] = f; } };
const personagem = {
    centroX: 1024, centroY: 768, follower: undefined,
    obterAcaoParaTecla() { return undefined; },
    iniciarComandoTouch(x, y) { chamado = [x, y]; }
};

const cena = new Cena({ requestAnimationFrame() {} }, mundo, {});
const cenario = new Cenario('x.png', 800, 600);
cenario.personagem = personagem;
cena.cenario = cenario;
cena.prepararMundo();

test('clique converte tela para mundo antes do primeiro desenhar', () => {
    mundo.listeners.mousedown({ pageX: 10, pageY: 20 });
    assert.deepEqual(chamado, [10 + 624, 20 + 468]);
});

test('clique segue a câmera quando o personagem anda', () => {
    personagem.centroX = 2000;
    mundo.listeners.mousedown({ pageX: 10, pageY: 20 });
    assert.deepEqual(chamado, [10 + (2048 - 800), 20 + 468]);
});

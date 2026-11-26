import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularCamera, telaParaMundo, mundoParaTela } from '../js/camera.js';

test('calcularCamera centraliza o alvo', () => {
    assert.deepEqual(calcularCamera(1024, 768, 800, 600, 2048, 1536), { x: 624, y: 468 });
});

test('calcularCamera limita no canto superior esquerdo', () => {
    assert.deepEqual(calcularCamera(0, 0, 800, 600, 2048, 1536), { x: 0, y: 0 });
});

test('calcularCamera limita no canto inferior direito', () => {
    assert.deepEqual(calcularCamera(2048, 1536, 800, 600, 2048, 1536), { x: 1248, y: 936 });
});

test('calcularCamera centraliza o mapa quando a tela é maior que o mundo', () => {
    assert.deepEqual(calcularCamera(1000, 700, 2448, 1636, 2048, 1536), { x: -200, y: -50 });
});

test('telaParaMundo soma a câmera', () => {
    assert.deepEqual(telaParaMundo(10, 20, { x: 100, y: 200 }), { x: 110, y: 220 });
});

test('mundoParaTela subtrai a câmera', () => {
    assert.deepEqual(mundoParaTela(110, 220, { x: 100, y: 200 }), { x: 10, y: 20 });
});

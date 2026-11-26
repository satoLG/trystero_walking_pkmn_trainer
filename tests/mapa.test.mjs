import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as m from '../js/mapa.js';
import { spriteWidth, spriteHeight } from '../js/constants.js';

test('LAYOUT tem 24 linhas de 32 chars válidos', () => {
    assert.equal(m.LAYOUT.length, 24);
    for (const linha of m.LAYOUT) {
        assert.equal(linha.length, 32);
        assert.match(linha, /^[T.,*#FAB]+$/);
    }
});

test('tamanho do mundo', () => {
    assert.equal(m.MUNDO_LARGURA, 2048);
    assert.equal(m.MUNDO_ALTURA, 1536);
});

test('tileEm fora do mapa é árvore', () => {
    assert.equal(m.tileEm(-1, 0), 'T');
    assert.equal(m.tileEm(32, 5), 'T');
});

test('ehCaminhavel', () => {
    assert.equal(m.ehCaminhavel(15, 1), true);
    assert.equal(m.ehCaminhavel(1, 1), false);
});

test('indiceDoTile', () => {
    assert.equal(m.indiceDoTile(5, 3), 8);
    assert.equal(m.indiceDoTile(6, 5), 25); // porta casa A
    assert.equal(m.indiceDoTile(10, 3), 12);
    assert.equal(m.indiceDoTile(11, 5), 29); // porta casa B
    assert.equal(m.indiceDoTile(8, 16), 31); // célula (col 8, row 16): canto inferior direito da Casa B que começa em (5,14)
    assert.equal(m.indiceDoTile(0, 0), 4);
    assert.equal(m.indiceDoTile(15, 11), 3);
});

test('podeOcupar', () => {
    assert.equal(m.podeOcupar(15 * 64, 11 * 64 - 20), true);
    assert.equal(m.podeOcupar(1 * 64, 1 * 64 - 20), false); // grama
    assert.equal(m.podeOcupar(6 * 64, 4 * 64), false); // casa
});

test('posicaoInicialAleatoria cai sempre em caminho', () => {
    for (const r of [0, 0.5, 0.999]) {
        const p = m.posicaoInicialAleatoria(() => r);
        assert.equal(m.podeOcupar(p.posX, p.posY), true);
    }
});

test('todas as 8 portas têm caminho logo abaixo', () => {
    let portas = 0;
    for (let row = 0; row < m.LINHAS; row++) {
        for (let col = 0; col < m.COLUNAS; col++) {
            const i = m.indiceDoTile(col, row);
            if (i === 25 || i === 29) {
                portas++;
                assert.equal(m.ehCaminhavel(col, row + 1), true, `porta em (${col},${row})`);
            }
        }
    }
    assert.equal(portas, 8);
});

test('indiceDoTile fica dentro do tileset (0..31)', () => {
    for (let row = 0; row < m.LINHAS; row++) {
        for (let col = 0; col < m.COLUNAS; col++) {
            const i = m.indiceDoTile(col, row);
            assert.ok(Number.isInteger(i), `(${col},${row}) -> ${i}`);
            assert.ok(0 <= i && i <= 31, `(${col},${row}) -> ${i}`);
        }
    }
});

test('tileset.png tem 256x128 (8x4 tiles de TILE_ORIGEM)', () => {
    const buf = readFileSync(new URL('../img/overworld/scenary/tileset.png', import.meta.url));
    // cabeçalho IHDR do PNG: largura em 16, altura em 20 (big-endian)
    const largura = buf.readUInt32BE(16);
    const altura = buf.readUInt32BE(20);
    assert.equal(largura, 8 * m.TILE_ORIGEM);
    assert.equal(altura, 4 * m.TILE_ORIGEM);
    assert.ok(8 * 4 > 31, 'tileset precisa cobrir o índice máximo do teste (0..31)');
});

test('caixa dos pés cabe no sprite do trainer', () => {
    assert.equal(spriteWidth, 64);
    assert.equal(spriteHeight, 64);
    assert.ok(m.PE_OFFSET_X >= 0);
    assert.ok(m.PE_OFFSET_X + m.PE_LARGURA <= spriteWidth);
    assert.ok(m.PE_OFFSET_Y >= 0);
    assert.ok(m.PE_OFFSET_Y + m.PE_ALTURA <= spriteHeight);
});

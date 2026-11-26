import test from 'node:test';
import assert from 'node:assert/strict';

// personagem.js só aplica colisão com o mapa quando existe window
globalThis.window = globalThis.window || {};
globalThis.Image = class { constructor() { this.src = ''; } };
const { Personagem, Sprite } = await import('../js/personagem.js');
const m = await import('../js/mapa.js');
const { setConnection } = await import('../js/connectionSingleton.js');

function criar(posX, posY, isRemote, isFollower) {
    const sprite = new Sprite({
        mode: 'sheet', src: 'x.png',
        codigosDirecao: { up: 200, down: 8, right: 138, left: 74 },
        comprimento: 64, altura: 64, qtdAnimacoes: 4
    });
    const p = new Personagem(sprite, { KeyW: 'up', KeyS: 'down', KeyD: 'right', KeyA: 'left' }, 3, isRemote, isFollower);
    p.posX = posX;
    p.posY = posY;
    return p;
}

function passo(p, n = 1) {
    for (let i = 0; i < n; i++) p._prepararProximoMovimento(false, false, false, false);
}

test('anda no caminho pelo teclado', () => {
    const p = criar(512, 684);
    p.iniciarComandoTeclado('KeyD');
    passo(p, 10);
    assert.equal(p.posX, 542);
    assert.equal(p.posY, 684);
    p.finalizarComando('');
});

test('teclado não entra na grama', () => {
    const p = criar(512, 684);
    p.iniciarComandoTeclado('KeyW');
    passo(p, 40);
    assert.equal(m.podeOcupar(p.posX, p.posY), true);
    assert.ok(p.posY >= 660);
    assert.ok(p.posY < 684);
    p.finalizarComando('');
});

test('remoto e follower ignoram o mapa', () => {
    for (const [remoto, follower] of [[true, false], [false, true]]) {
        const p = criar(512, 684, remoto, follower);
        p.iniciarComandoTeclado('KeyW');
        passo(p, 40);
        assert.equal(p.posY, 684 - 120);
        p.finalizarComando('');
        clearInterval(p._contadorDePassosIdle); // follower cria intervalo idle no construtor
    }
});

test('clique para dentro de uma casa para limpo', () => {
    const p = criar(512, 684);
    p.iniciarComandoTouch(p.centroX, 3 * 64 + 32);
    passo(p, 40);
    assert.equal(p._andando, false);
    assert.equal(p.posDestinoX, undefined);
    assert.equal(p.posDestinoY, undefined);
    assert.equal(m.podeOcupar(p.posX, p.posY), true);
    assert.equal(p._contadorDePassos, undefined);
    passo(p, 1);
    assert.equal(p._proximaAnimacao, 0);
    p.finalizarComando('');
});

test('broadcast continua após bloqueio', () => {
    let chamadas = 0;
    setConnection({ remotePlayers: {}, broadcastLocalState() { chamadas++; } });
    const ctx = { globalAlpha: 1, drawImage() {} };
    const p = criar(512, 684);
    p.iniciarComandoTouch(p.centroX, 3 * 64 + 32);
    for (let i = 0; i < 40; i++) p.desenhar(ctx, false, false, false, false);
    assert.equal(chamadas, 40);
    p.finalizarComando('');
    setConnection(null);
});

test('clique desvia pelo outro eixo', () => {
    const p = criar(512, 684);
    p.iniciarComandoTouch(256, 440);
    for (let i = 0; i < 400 && p._andando; i++) {
        passo(p);
        assert.equal(m.podeOcupar(p.posX, p.posY), true);
    }
    assert.equal(p.centroX, 256);
    assert.equal(p.centroY, 440);
    p.finalizarComando('');
});

test('clique sem saída para sem oscilar', () => {
    const p = criar(512, 684);
    p.iniciarComandoTouch(6 * 64 + 32, 4 * 64 + 32);
    passo(p, 150);
    const x = p.posX, y = p.posY;
    passo(p, 50);
    assert.equal(p._andando, false);
    assert.equal(p.posX, x);
    assert.equal(p.posY, y);
    p.finalizarComando('');
});

// Câmera que segue o jogador. Coordenadas da câmera = canto superior esquerdo da tela no mundo.
// Quando a tela é maior que o mundo num eixo, o valor fica negativo para centralizar o mapa.
function eixoCamera(alvo, tela, mundo) {
    if (tela >= mundo) {
        return -Math.floor((tela - mundo) / 2);
    }
    return Math.max(0, Math.min(Math.round(alvo - tela / 2), mundo - tela));
}

export function calcularCamera(alvoX, alvoY, larguraTela, alturaTela, larguraMundo, alturaMundo) {
    return {
        x: eixoCamera(alvoX, larguraTela, larguraMundo),
        y: eixoCamera(alvoY, alturaTela, alturaMundo)
    };
}

export function telaParaMundo(xTela, yTela, camera) {
    return { x: xTela + camera.x, y: yTela + camera.y };
}

export function mundoParaTela(xMundo, yMundo, camera) {
    return { x: xMundo - camera.x, y: yMundo - camera.y };
}

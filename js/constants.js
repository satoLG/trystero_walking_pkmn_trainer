const trainerSprites = [
    'treinador.png',
    'fantasma.png',
    'maleiro.png',
    'jardineiro.png',
    'mulher.png',
    'policia.png',
    // 'loirinho.png',
    'chapeuzinho.png', 
    // 'popstar.png', 
    // 'professor.png', 
    'nadadora.png', 
    // 'diego.png', 
    'fazendeiro.png',
    // 'gordin.png',
    // 'chiquinha.png'
];

const configuracaoDeTeclas = {
    KeyW : 'up',
    KeyS : 'down',
    KeyD : 'right',
    KeyA : 'left'
}

const directionToMethod = {
    up: "paraCima",
    down: "paraBaixo",
    left: "paraEsquerda",
    right: "paraDireita"
};

export { trainerSprites, configuracaoDeTeclas, directionToMethod };
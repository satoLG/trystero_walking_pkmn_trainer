import {Cena} from './cena.js'
import {Cenario} from './cenario.js'
import {Personagem, Sprite} from './personagem.js'
import {joinRoom} from './trystero-nostr.min.js'

let canvas = document.querySelector('.myCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let contexto = canvas.getContext('2d');

let cena = new Cena(window, document, contexto);

cena.cenario = new Cenario('img/grass.png', canvas.width, canvas.height);

let configuracaoDeTeclas = {
    KeyW : 'cima',
    KeyS : 'baixo',
    KeyD : 'direita',
    KeyA : 'esquerda'
}

cena.cenario.personagem = new Personagem(new Sprite('img/sprite.png', 200, 8, 138, 74, 'baixo', 64, 64, 4), configuracaoDeTeclas, 3);

cena.prepararMundo();

cena.reproduzir();


// Store all players by peerId
const remotePlayers = {};

// Setup Trystero room
// const {joinRoom} = window.trystero;
const room = joinRoom({appId: 'walking-pkmn-trainer'}, 'main-room');

// Broadcast local player state
const [sendState, onState] = room.makeAction('player-state');

function generateRandomName() {
    const adjectives = ['Rápido', 'Bravo', 'Calmo', 'Feroz', 'Ligeiro', 'Alegre', 'Sábio'];
    const animals = ['Cara'];
    return animals[Math.floor(Math.random() * animals.length)] + ' ' +
           adjectives[Math.floor(Math.random() * adjectives.length)];
}
const myName = generateRandomName();

// Helper: create a new remote Personagem
function createRemotePersonagem(peerId, initialState) {
    // Array of possible sprites for remote players
    const spriteOptions = [
        'img/gh_sprite.png'
    ];
    // Pick one at random
    const spriteFile = spriteOptions[Math.floor(Math.random() * spriteOptions.length)];
    const remoteSprite = new Sprite(spriteFile, 200, 8, 138, 74, 'baixo', 64, 64, 4);
    const remotePersonagem = new Personagem(remoteSprite, configuracaoDeTeclas, 3);
    remotePersonagem.posX = initialState.posX;
    remotePersonagem.posY = initialState.posY;
    remotePersonagem.remoteName = initialState.name || "Trainer";
    return remotePersonagem;
}

// Send local player state on movement
function broadcastLocalState() {
    sendState({
        posX: cena.cenario.personagem.posX,
        posY: cena.cenario.personagem.posY,
        direcao: cena.cenario.personagem._sprite.atualDirecao,
        animFrame: cena.cenario.personagem._proximaAnimacao,
        andando: cena.cenario.personagem._andando,
        name: myName, // send the name
        // ...add more fields if needed
    });
}
setInterval(broadcastLocalState, 200);

// Listen for remote player states
onState((state, peerId) => {
    if (!remotePlayers[peerId]) {
        remotePlayers[peerId] = createRemotePersonagem(peerId, state);
    } else {
        // Update remote player position/state
        remotePlayers[peerId].posX = state.posX;
        remotePlayers[peerId].posY = state.posY;
        remotePlayers[peerId]._sprite.atualDirecao = state.direcao;
        // Update animation state
        remotePlayers[peerId]._proximaAnimacao = state.animFrame;
        remotePlayers[peerId]._andando = state.andando;
    }
});

room.onPeerLeave(peerId => {
    delete remotePlayers[peerId];
});

// Draw remote players in the scene
const originalCenarioDesenhar = cena.cenario.desenhar.bind(cena.cenario);
cena.cenario.desenhar = function(contexto) {
    originalCenarioDesenhar(contexto);
    // Draw all remote players (no tint needed)
    Object.values(remotePlayers).forEach(remotePersonagem => {
        remotePersonagem.desenhar(contexto, false, false, false, false);

        contexto.font = "15px Comicsans";
        const text = remotePersonagem.remoteName;
        const textWidth = contexto.measureText(text).width;
        const x = remotePersonagem.posX;
        const y = remotePersonagem.posY;

        // Draw semi-transparent black background
        contexto.save();
        contexto.globalAlpha = 0.6;
        contexto.fillStyle = "black";
        contexto.fillRect(x-3, y - 12, textWidth + 6, 14);
        contexto.restore();

        // Draw white text
        contexto.fillStyle = "white";
        contexto.globalAlpha = 1.0;
        contexto.fillText(text, x, y); 
    });
};

// Patch movement to broadcast state
const originalDesenhar = cena.cenario.personagem.desenhar.bind(cena.cenario.personagem);
cena.cenario.personagem.desenhar = function(...args) {
    originalDesenhar(...args);
    broadcastLocalState();
};
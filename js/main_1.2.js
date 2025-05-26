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

// ...existing code...

function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

if (isMobile()) {
    // Create joystick container
    const joystickContainer = document.createElement('div');
    joystickContainer.style.position = 'fixed';
    joystickContainer.style.left = '20px';
    joystickContainer.style.bottom = '20px';
    joystickContainer.style.zIndex = '10';

    // Create joystick base
    const joystickBase = document.createElement('div');
    joystickBase.style.width = '80px';
    joystickBase.style.height = '80px';
    joystickBase.style.background = 'rgba(0,0,0,0.2)';
    joystickBase.style.borderRadius = '50%';
    joystickBase.style.position = 'relative';

    // Create joystick knob
    const joystickKnob = document.createElement('div');
    joystickKnob.style.width = '40px';
    joystickKnob.style.height = '40px';
    joystickKnob.style.background = '#888';
    joystickKnob.style.borderRadius = '50%';
    joystickKnob.style.position = 'absolute';
    joystickKnob.style.left = '20px';
    joystickKnob.style.top = '20px';

    joystickBase.appendChild(joystickKnob);
    joystickContainer.appendChild(joystickBase);
    document.body.appendChild(joystickContainer);

    // Create dash button
    const dashBtn = document.createElement('button');
    dashBtn.textContent = 'DASH';
    dashBtn.style.position = 'fixed';
    dashBtn.style.right = '20px';
    dashBtn.style.bottom = '25px';
    dashBtn.style.zIndex = '10';
    dashBtn.style.width = '70px';
    dashBtn.style.height = '70px';
    dashBtn.style.borderRadius = '50%';
    dashBtn.style.background = '#2196f3';
    dashBtn.style.color = '#fff';
    dashBtn.style.fontSize = '20px';
    dashBtn.style.border = 'none';
    dashBtn.style.boxShadow = '0 2px 8px #0006';
    document.body.appendChild(dashBtn);

    // Joystick logic
    let joystickActive = false;
    let joystickDir = {cima: false, baixo: false, esquerda: false, direita: false};
    let joystickTouchId = null;

    function getJoystickDirection(dx, dy) {
        const threshold = 15;
        let dir = {cima: false, baixo: false, esquerda: false, direita: false};
        if (dy < -threshold) dir.cima = true;
        if (dy > threshold) dir.baixo = true;
        if (dx < -threshold) dir.esquerda = true;
        if (dx > threshold) dir.direita = true;
        return dir;
    }

    joystickBase.addEventListener('touchstart', function(e) {
        joystickActive = true;
        joystickTouchId = e.changedTouches[0].identifier;
    }, {passive: false});

    joystickBase.addEventListener('touchmove', function(e) {
        for (let touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId) {
                const rect = joystickBase.getBoundingClientRect();
                const centerX = rect.left + rect.width/2;
                const centerY = rect.top + rect.height/2;
                const dx = touch.clientX - centerX;
                const dy = touch.clientY - centerY;
                // Move knob
                const maxDist = 30;
                const dist = Math.min(Math.sqrt(dx*dx+dy*dy), maxDist);
                const angle = Math.atan2(dy, dx);
                joystickKnob.style.left = (rect.width/2 - 20 + Math.cos(angle)*dist) + "px";
                joystickKnob.style.top = (rect.height/2 - 20 + Math.sin(angle)*dist) + "px";
                // Set direction
                joystickDir = getJoystickDirection(dx, dy);
                e.preventDefault();
            }
        }
    }, {passive: false});

    joystickBase.addEventListener('touchend', function(e) {
        for (let touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId) {
                joystickActive = false;
                joystickTouchId = null;
                joystickKnob.style.left = "20px";
                joystickKnob.style.top = "20px";
                joystickDir = {cima: false, baixo: false, esquerda: false, direita: false};
            }
        }
    }, {passive: false});

    // Joystick movement for mobile
    let joystickControlling = false;

    setInterval(() => {
        if (joystickActive) {
            joystickControlling = true;
            if (joystickDir.cima) cena.cenario.personagem.iniciarComando('cima');
            else if (joystickDir.baixo) cena.cenario.personagem.iniciarComando('baixo');
            else if (joystickDir.esquerda) cena.cenario.personagem.iniciarComando('esquerda');
            else if (joystickDir.direita) cena.cenario.personagem.iniciarComando('direita');
            else cena.cenario.personagem.finalizarComando('');
        } else if (joystickControlling) {
            // Only stop movement if joystick was controlling before
            cena.cenario.personagem.finalizarComando('');
            joystickControlling = false;
        }
    }, 50);

    // DASH button logic
    dashBtn.addEventListener('touchstart', function(e) {
        cena.cenario.personagem.modificadorVelocidade = 8;
        dashBtn.style.background = "#f44336";
    });
    dashBtn.addEventListener('touchend', function(e) {
        cena.cenario.personagem.modificadorVelocidade = 3;
        dashBtn.style.background = "#2196f3";
    });
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (cena.cenario) {
        cena.cenario._comprimento = canvas.width;
        cena.cenario._altura = canvas.height;
    }
}

window.addEventListener('resize', resizeCanvas);

// Call once at start to ensure correct size
resizeCanvas();
import {Cena} from './cena.js'
import {Cenario} from './cenario.js'
import {Personagem, Sprite} from './personagem_1.0.js'
import {joinRoom} from './trystero-nostr.min.js'

// At the top of your main JS file
let sessionId = sessionStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 16);
    sessionStorage.setItem('sessionId', sessionId);
}

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

const spriteWidth = 64;
const spriteHeight = 64;
const margin = 10; // Optional: keep a margin from the edge

const startX = Math.floor(
    Math.random() * (canvas.width - spriteWidth - margin * 2)
) + margin;
const startY = Math.floor(
    Math.random() * (canvas.height - spriteHeight - margin * 2)
) + margin;

const localPersonagem = new Personagem(
    new Sprite('img/sprite.png', 200, 8, 138, 74, 'baixo', spriteWidth, spriteHeight, 4),
    configuracaoDeTeclas,
    3
);
localPersonagem.posX = startX;
localPersonagem.posY = startY;
cena.cenario.personagem = localPersonagem;

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

// Make myName accessible globally for updates
window.myName = myName;

// Add after your canvas setup and before cena initialization

// Create status container
const statusContainer = document.createElement('div');
statusContainer.style.position = 'fixed';
statusContainer.style.left = '10px';
statusContainer.style.top = '10px';
statusContainer.style.padding = '10px';
statusContainer.style.background = 'rgba(0, 0, 0, 0.7)';
statusContainer.style.color = 'white';
statusContainer.style.borderRadius = '5px';
statusContainer.style.fontFamily = 'Verdana, sans-serif';
statusContainer.style.fontSize = '14px';
statusContainer.style.zIndex = '1000';
// statusContainer.style.minWidth = '200px';

// Add player name to status
const nameElement = document.createElement('div');
nameElement.textContent = `You: ${window.myName}`;
// nameElement.style.marginBottom = '5px';
statusContainer.appendChild(nameElement);

// Add to document
document.body.appendChild(statusContainer);

// Export for future use
window.statusContainer = statusContainer;

// Add after the nameElement creation

// Make name editable
nameElement.style.cursor = 'pointer';
nameElement.title = 'Click to edit name';

nameElement.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = window.myName;
    input.style.background = 'rgba(0, 0, 0, 0.5)';
    input.style.border = '1px solid white';
    input.style.color = 'white';
    input.style.padding = '2px 5px';
    input.style.borderRadius = '3px';
    input.style.width = '150px';
    input.style.fontSize = '14px';

    // Replace name with input
    nameElement.textContent = '';
    nameElement.appendChild(input);
    input.focus();

    // Handle name change
    const saveName = () => {
        const newName = input.value.trim() || window.myName;
        window.myName = newName; // Update global name
        nameElement.textContent = `You: ${newName}`;
        // Broadcast name change
        broadcastLocalState();
    };

    input.addEventListener('blur', saveName);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveName();
        }
    });
});

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
     remotePersonagem.peerId = peerId;
    remotePersonagem.sessionId = initialState.sessionId;
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
        name: window.myName,
        sessionId: sessionId
    });
}
setInterval(broadcastLocalState, 200);

// Listen for remote player states
// Update the onState handler
onState((state, peerId) => {
    const key = state.sessionId || peerId;
    if (!remotePlayers[key]) {
        remotePlayers[key] = createRemotePersonagem(peerId, state);
        hideJoinMessage();
    } else {
        // Update remote player position/state
        remotePlayers[key].posX = state.posX;
        remotePlayers[key].posY = state.posY;
        remotePlayers[key]._sprite.atualDirecao = state.direcao;
        remotePlayers[key]._proximaAnimacao = state.animFrame;
        remotePlayers[key]._andando = state.andando;
        // Update the remote player's name
        remotePlayers[key].remoteName = state.name || "Trainer";
    }
});

// Show a message when someone joins
room.onPeerJoin(peerId => {
    showJoinMessage();
    // Optionally, hide the message after a few seconds
    setTimeout(hideJoinMessage, 1000);
});

// Helper functions to show/hide the message
function showJoinMessage() {
    let msg = document.getElementById('join-msg');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'join-msg';
        msg.style.position = 'fixed';
        msg.style.top = '20px';
        msg.style.left = '50%';
        msg.style.transform = 'translateX(-50%)';
        msg.style.background = 'rgba(0,0,0,0.7)';
        msg.style.color = '#fff';
        msg.style.padding = '16px 32px';
        msg.style.borderRadius = '12px';
        msg.style.fontSize = '20px';
        msg.style.zIndex = '1000';
        msg.style.whiteSpace = 'nowrap';
        document.body.appendChild(msg);
    }
    msg.textContent = "Someone is joining the room...";
    msg.style.display = '';
}

function hideJoinMessage() {
    const msg = document.getElementById('join-msg');
    if (msg) msg.style.display = 'none';
}

room.onPeerLeave(peerId => {
    // Remove all remotePlayers that were created by this peerId
    for (const key in remotePlayers) {
        if (remotePlayers[key].peerId === peerId) {
            delete remotePlayers[key];
        }
    }
});

// Draw remote players in the scene
const originalCenarioDesenhar = cena.cenario.desenhar.bind(cena.cenario);
cena.cenario.desenhar = function(contexto) {
    // Clear the canvas first!
    contexto.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background and everything else
    originalCenarioDesenhar(contexto);

    // Draw all remote players (no tint needed)
    Object.values(remotePlayers).forEach(remotePersonagem => {
        remotePersonagem.desenhar(contexto, false, false, false, false);

        contexto.font = "15px Verdana";
        const text = remotePersonagem.remoteName;
        const textWidth = contexto.measureText(text).width;
        // Calculate center point of character (add half sprite width)
        const centerX = remotePersonagem.posX + (spriteWidth / 2);
        const y = remotePersonagem.posY;

        // Draw semi-transparent black background
        contexto.save();
        contexto.globalAlpha = 0.6;
        contexto.fillStyle = "black";
        // Center the background rectangle
        contexto.fillRect(centerX - (textWidth / 2) - 3, y - 14, textWidth + 6, 16);
        contexto.restore();

        // Draw white text
        contexto.fillStyle = "white";
        contexto.globalAlpha = 1.0;
        // Center the text
        contexto.fillText(text, centerX - (textWidth / 2), y);
    });
};

// Patch movement to broadcast state
const originalDesenhar = cena.cenario.personagem.desenhar.bind(cena.cenario.personagem);
cena.cenario.personagem.desenhar = function(...args) {
    originalDesenhar(...args);
    broadcastLocalState();
};

// Create pop sound
const popSound = new Audio('audio/pop.mp3');

// Create emoji button (visible on all devices)
const emojiBtn = document.createElement('button');
emojiBtn.textContent = '😊';
emojiBtn.style.position = 'fixed';
emojiBtn.style.right = '100px';
emojiBtn.style.bottom = '25px';
emojiBtn.style.zIndex = '10';
emojiBtn.style.width = '70px';
emojiBtn.style.height = '70px';
emojiBtn.style.borderRadius = '50%';
emojiBtn.style.background = '#2196f3';
emojiBtn.style.fontSize = '30px';
emojiBtn.style.border = 'none';
emojiBtn.style.boxShadow = '0 2px 8px #0006';

document.body.appendChild(emojiBtn);

// Setup emoji broadcasting
const [sendEmoji, onEmoji] = room.makeAction('emoji');

// Array of emojis to cycle through
const emojis = ['😊', '👋', '❤️', '🎮', '⭐', '🎉'];
let currentEmojiIndex = 0;

// Handle emoji button click
emojiBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Send current emoji
    sendEmoji({
        emoji: emojis[currentEmojiIndex],
        x: cena.cenario.personagem.posX,
        y: cena.cenario.personagem.posY,
        sessionId: sessionId
    });
    
    // Show emoji locally
    showEmoji(emojis[currentEmojiIndex], cena.cenario.personagem.posX, cena.cenario.personagem.posY);

    // Cycle to next emoji
    currentEmojiIndex = (currentEmojiIndex + 1) % emojis.length;
    emojiBtn.textContent = emojis[currentEmojiIndex];    
});

// Handle received emojis
onEmoji((data, peerId) => {
    showEmoji(data.emoji, data.x, data.y);
});

// Function to show floating emoji
function showEmoji(emoji, x, y) {
    // Play pop sound
    popSound.currentTime = 0;
    popSound.play();
    
    // Create floating emoji element
    const emojiEl = document.createElement('div');
    emojiEl.textContent = emoji;
    emojiEl.style.position = 'fixed';
    emojiEl.style.left = `${x}px`;
    emojiEl.style.top = `${y - 50}px`; // Show above character
    emojiEl.style.fontSize = '40px';
    emojiEl.style.zIndex = '1000';
    emojiEl.style.transition = 'all 1s ease-out';
    document.body.appendChild(emojiEl);
    
    // Animate emoji floating up and fading
    setTimeout(() => {
        emojiEl.style.transform = 'translateY(-50px)';
        emojiEl.style.opacity = '0';
    }, 50);
    
    // Remove emoji element after animation
    setTimeout(() => {
        document.body.removeChild(emojiEl);
    }, 1000);
}

// Add touch support for mobile
if (isMobile()) {
    // Remove the old touchstart listener
    emojiBtn.removeEventListener('touchstart', () => {});
    
    // Add new touch handlers
    emojiBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    emojiBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Trigger emoji action without affecting movement
        emojiBtn.click();
    }, { passive: false });
}

function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

const joystickContainer = document.createElement('div');
let joystickControlling = false;
let joystickActive = false;
const dashBtn = document.createElement('button');


if (isMobile()) {
    // Create joystick container
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

function isColliding(p1, p2, size = 30) {
    // Simple AABB collision detection
    return (
        p1.posX < p2.posX + size &&
        p1.posX + size > p2.posX &&
        p1.posY < p2.posY + size &&
        p1.posY + size > p2.posY
    );
}
window.isColliding = isColliding;

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

window.remotePlayers = remotePlayers;
window.cena = cena;

// Update the preventInteractionStyles object to exclude text selection prevention
const preventInteractionStyles = {
    pointerEvents: 'auto',
    touchAction: 'none',
    zIndex: '1000'
};

// Separate styles for non-status elements (keeps text selection prevention)
const nonStatusStyles = {
    ...preventInteractionStyles,
    userSelect: 'none',
    webkitUserSelect: 'none',
    msUserSelect: 'none'
};

// Function to prevent all interactions from reaching canvas
function preventCanvasInteraction(element, allowTextSelection = false) {
    const events = ['mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend'];
    events.forEach(eventName => {
        element.addEventListener(eventName, (e) => {
            e.stopPropagation();
            if (!allowTextSelection) {
                e.preventDefault();
            }
        }, { passive: false });
    });
}

// Apply different styles based on element type
const uiElements = [emojiBtn, statusContainer];
if (isMobile()) {
    uiElements.push(dashBtn, joystickContainer);
}

uiElements.forEach(element => {
    if (element) {
        // Apply appropriate styles based on element type
        if (element === statusContainer) {
            Object.assign(element.style, preventInteractionStyles);
            preventCanvasInteraction(element, true); // Allow text selection
        } else {
            Object.assign(element.style, nonStatusStyles);
            preventCanvasInteraction(element, false);
        }
        
        // Apply to children (except status container children)
        if (element !== statusContainer) {
            Array.from(element.children).forEach(child => {
                Object.assign(child.style, nonStatusStyles);
                preventCanvasInteraction(child, false);
            });
        }
    }
});

// Add these styles to the emoji button
Object.assign(emojiBtn.style, {
    ...nonStatusStyles,
    touchAction: 'none',
    userSelect: 'none',
    pointerEvents: 'auto'
});

// Update name element event listeners to handle both click and touch
nameElement.addEventListener('click', handleNameEdit);
nameElement.addEventListener('touchend', handleNameEdit);

function handleNameEdit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = window.myName;
    input.style.background = 'rgba(0, 0, 0, 0.5)';
    input.style.border = '1px solid white';
    input.style.color = 'white';
    input.style.padding = '2px 5px';
    input.style.borderRadius = '3px';
    input.style.width = '150px';
    input.style.fontSize = '14px';

    // Temporarily disable movement commands
    const originalIniciarComando = cena.cenario.personagem.iniciarComando;
    cena.cenario.personagem.iniciarComando = () => {};

    nameElement.textContent = '';
    nameElement.appendChild(input);
    input.focus();

    const saveName = () => {
        const newName = input.value.trim() || window.myName;
        window.myName = newName;
        nameElement.textContent = `You: ${newName}`;
        broadcastLocalState();
        // Restore movement commands
        cena.cenario.personagem.iniciarComando = originalIniciarComando;
    };

    input.addEventListener('blur', saveName);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveName();
        }
    });
}

// Update the joystick movement interval to clear destination
setInterval(() => {
    if (joystickActive) {
        joystickControlling = true;
        // Clear any existing destination when using joystick
        cena.cenario.personagem._posDestinoX = null;
        cena.cenario.personagem._posDestinoY = null;
        
        if (joystickDir.cima) cena.cenario.personagem.iniciarComando('cima');
        else if (joystickDir.baixo) cena.cenario.personagem.iniciarComando('baixo');
        else if (joystickDir.esquerda) cena.cenario.personagem.iniciarComando('esquerda');
        else if (joystickDir.direita) cena.cenario.personagem.iniciarComando('direita');
        else cena.cenario.personagem.finalizarComando('');
    } else if (joystickControlling) {
        cena.cenario.personagem.finalizarComando('');
        joystickControlling = false;
    }
}, 50);

// Also update the keyboard event handling
// Add this after your configuracaoDeTeclas definition
document.addEventListener('keydown', (e) => {
    if (configuracaoDeTeclas[e.code]) {
        // Clear any existing destination when using keyboard
        cena.cenario.personagem._posDestinoX = null;
        cena.cenario.personagem._posDestinoY = null;
    }
});

// Create background music
const bgMusic = new Audio('audio/pallet_town.mp3');
bgMusic.loop = true;
let isMusicMuted = true;

// Start playing when user interacts with the page
// Function to safely handle music state
function handleMusicState() {
    if (isMusicMuted) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    } else {
        bgMusic.volume = 0.05;
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.log('Audio playback failed:', e));
        }
    }
}

// Handle first interaction
document.addEventListener('click', () => {
    // Initial setup - keep muted but prepare audio
    bgMusic.volume = 0;
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                bgMusic.pause(); // Pause immediately since we start muted
                bgMusic.currentTime = 0;
            })
            .catch(e => console.log('Audio playback failed:', e));
    }
}, { once: true });

// Create audio controls container
const audioControls = document.createElement('div');
audioControls.style.position = 'fixed';
audioControls.style.right = '10px';
audioControls.style.top = '10px';
audioControls.style.zIndex = '1000';
audioControls.style.display = 'flex';
audioControls.style.gap = '10px';

// Create music mute button
const musicMuteBtn = document.createElement('button');
musicMuteBtn.innerHTML = '🔇'; // Start with muted icon
musicMuteBtn.style.background = 'rgba(255, 0, 0, 0.3)'; // Start with muted style
musicMuteBtn.style.border = 'none';
musicMuteBtn.style.borderRadius = '5px';
musicMuteBtn.style.color = 'white';
musicMuteBtn.style.padding = '5px 10px';
musicMuteBtn.style.fontSize = '20px';
musicMuteBtn.style.cursor = 'pointer';
musicMuteBtn.title = 'Toggle Background Music';

// Add buttons to container
audioControls.appendChild(musicMuteBtn);
document.body.appendChild(audioControls);

// Handle music mute toggle
musicMuteBtn.addEventListener('click', () => {
    isMusicMuted = !isMusicMuted;
    handleMusicState();
    musicMuteBtn.innerHTML = isMusicMuted ? '🔇' : '🎵';
    musicMuteBtn.style.background = isMusicMuted ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.7)';
});

// Add to prevent interaction list
Object.assign(audioControls.style, preventInteractionStyles);
preventCanvasInteraction(audioControls, true);
[musicMuteBtn].forEach(btn => {
    Object.assign(btn.style, preventInteractionStyles);
    preventCanvasInteraction(btn, true);
});
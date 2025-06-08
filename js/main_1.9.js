import {Cena} from './cena.js'
import {Cenario} from './cenario.js'
import {Personagem, Sprite} from './personagem_1.1.js'
import {joinRoom} from './trystero-nostr.min.js'

let pokedex = {};
fetch('json/pokedex.json')
    .then(res => res.json())
    .then(data => { pokedex = data; });

// At the top of your main JS file
let sessionId = sessionStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 16);
    sessionStorage.setItem('sessionId', sessionId);
}

let musicPrimed = false;

let canvas = document.querySelector('.myCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let contexto = canvas.getContext('2d');

let cena = new Cena(window, document, contexto);

cena.cenario = new Cenario('img/overworld/scenary/grass.png', canvas.width, canvas.height);

let configuracaoDeTeclas = {
    KeyW : 'up',
    KeyS : 'down',
    KeyD : 'right',
    KeyA : 'left'
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
    new Sprite({
        mode: "sheet",
        src: 'img/overworld/trainer/maleiro.png',
        codigosDirecao: {
            up: 200,
            down: 8,
            right: 138,
            left: 74
        },
        atualDirecao: 'down',
        comprimento: spriteWidth,
        altura: spriteHeight,
        qtdAnimacoes: 4
    }),
    configuracaoDeTeclas,
    3
);
localPersonagem.posX = startX;
localPersonagem.posY = startY;
cena.cenario.personagem = localPersonagem;

// Add after local character creation
const followerPersonagem = new Personagem(
    new Sprite({
        mode: "overworld",
        spriteCode: "1",
        comprimento: 64,
        altura: 64
    }),
    configuracaoDeTeclas,
    6,
    true
);

// Set initial position next to leader
followerPersonagem.posX = startX - spriteWidth;
followerPersonagem.posY = startY;

function updateFollower() {
    const leader = cena.cenario.personagem;
    const follower = followerPersonagem;
    let minDistance = 50;
    if (follower._heightStr) {
        minDistance = getSpriteSizeFromHeight(follower._heightStr) * 0.7; // 0.8 is a good multiplier for spacing, tweak as needed
    } else if (follower._sprite && follower._sprite.comprimento) {
        minDistance = follower._sprite.comprimento * 0.7;
    }
    minDistance = Math.max(minDistance, 50); // Ensure a minimum distance

    // Calculate centers
    const leaderCenterX = leader.centroX;
    const leaderCenterY = leader.centroY;

    let targetX, targetY;

    targetX = leaderCenterX - 0;
    targetY = leaderCenterY - minDistance;

    const direcaoAtual = leader._sprite.atualDirecao;
    // console.log("Direção do líder:", direcaoAtual);
    // console.log("Direção atual do seguidor:", follower._sprite._codigosDirecao);
    switch (direcaoAtual) {
        case 'up':
            targetX = leaderCenterX - 0;
            targetY = leaderCenterY + minDistance;
            break;
        case 'down':
            targetX = leaderCenterX - 0;
            targetY = leaderCenterY - minDistance;
            break;
        case 'left':
            targetX = leaderCenterX + minDistance;
            targetY = leaderCenterY - getSpriteSizeFromHeight(follower._heightStr) * 0.2;
            break;
        case 'right':
            targetX = leaderCenterX - minDistance;
            targetY = leaderCenterY - getSpriteSizeFromHeight(follower._heightStr) * 0.2;
            break;
    }

    follower.iniciarComandoTouch(targetX, targetY);

    const followerCenterX = follower.centroX;
    const followerCenterY = follower.centroY;
    const dx = targetX - followerCenterX;
    const dy = targetY - followerCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= 2) {
        // follower._sprite.atualDirecao = leader._sprite.atualDirecao;
        const method = directionToMethod[leader._sprite.atualDirecao];
        if (method && typeof follower._sprite[method] === "function") {
            follower._sprite[method]();
        }    
    }
}

cena.prepararMundo();

cena.reproduzir();

let room;
let trysteroAvailable = typeof joinRoom === "function";
// Store all players by peerId
const remotePlayers = {};

// Setup Trystero room
// const {joinRoom} = window.trystero;
try {
    room = joinRoom({appId: 'walking-pkmn-trainer'}, 'main-room');
    [sendState, onState] = room.makeAction('player-state');
    [sendEmoji, onEmoji] = room.makeAction('emoji');
} catch (e) {
    console.warn("Trystero connection failed:", e);
    trysteroAvailable = false;
}

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
statusContainer.id = 'status-container';
statusContainer.style.display = 'flex';
statusContainer.style.flexDirection = 'column';
statusContainer.style.position = 'fixed';
statusContainer.style.left = '10px';
statusContainer.style.top = '10px';
statusContainer.style.padding = '10px';
statusContainer.style.background = 'rgba(0, 0, 0, 0.7)';
statusContainer.style.color = 'white';
statusContainer.style.borderRadius = '5px';
statusContainer.style.fontFamily = 'Verdana, sans-serif';
statusContainer.style.fontSize = '14px';
statusContainer.style.zIndex = '9';
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

const followerMenuBtn = document.createElement('button');
followerMenuBtn.textContent = 'Change Pkmn';
followerMenuBtn.style.marginTop = '8px';
followerMenuBtn.style.display = 'block';
statusContainer.appendChild(followerMenuBtn);

const followerMenu = document.createElement('div');
followerMenu.style.position = 'fixed';
followerMenu.style.left = '50vw';
followerMenu.style.top = '50vh';
followerMenu.style.transform = 'translate(-50%, -50%)';
followerMenu.style.background = '#000000bd';
followerMenu.style.padding = '10px';
followerMenu.style.borderRadius = '12px';
followerMenu.style.zIndex = '1000';
followerMenu.style.display = 'none';
followerMenu.style.height = '80vh';
followerMenu.style.width = '80vw';
// followerMenu.style.overflowY = 'scroll';

followerMenu.style.flexDirection = 'column';
followerMenu.style.boxShadow = '0 2px 24px #000b';

preventCanvasInteraction(followerMenu, false, true); // allowTouchMove = true

const menuHeader = document.createElement('div');
const searchInput = document.createElement('input');
const closeBtn = document.createElement('button');
closeBtn.textContent = 'X';
closeBtn.style.fontSize = '16px';
closeBtn.style.fontWeight = 'bold';
closeBtn.style.width = '40px';
closeBtn.style.border = '1px solid #00000059';
closeBtn.style.borderRadius = '.5em';
closeBtn.style.color = 'white';
closeBtn.style.background = '#0000005c';
closeBtn.style.lineHeight = '2';
closeBtn.onclick = () => followerMenu.style.display = 'none';
searchInput.placeholder = 'Search Pkmn...';
searchInput.id = 'follower-search';
searchInput.name = 'follower-search';
searchInput.style.lineHeight = '2';
searchInput.style.background = '#0a0a0abf';
searchInput.style.border = 'none';
searchInput.style.borderRadius = '.5em';
searchInput.style.color = 'white';
searchInput.style.padding = '5px 10px';
menuHeader.appendChild(searchInput);
menuHeader.appendChild(closeBtn);
menuHeader.style.display = 'flex';
menuHeader.style.position = 'sticky';
menuHeader.style.top = '0';
menuHeader.style.justifyContent = 'space-between';
menuHeader.style.marginBottom = '15px';
menuHeader.style.position = 'sticky';
menuHeader.style.top = '0';
followerMenu.appendChild(menuHeader);

preventCanvasInteraction(searchInput, true);
preventCanvasInteraction(closeBtn, true);

closeBtn.addEventListener('touchstart', e => {
    e.stopPropagation();
    // Do NOT call e.preventDefault() so the button works as expected
}, { passive: false });

const spriteGridContainer = document.createElement('div');
const spriteGrid = document.createElement('div');
spriteGrid.style.display = 'grid';
spriteGrid.style.gridTemplateColumns = 'repeat(auto-fit, 64px)';
spriteGrid.style.columnGap = '50px';
spriteGrid.style.rowGap = '25px';
spriteGrid.style.justifyContent = 'center';
spriteGridContainer.style.padding = '18px';
spriteGridContainer.style.flex = '1 1 auto';
spriteGridContainer.style.overflowY = 'auto';
spriteGridContainer.style.height = '0'; // Ensures flexbox gives it the remaining space
// spriteGrid.style.overflowY = 'scroll';
// spriteGrid.style.overflowX = 'visible';
// spriteGrid.style.height = '75vh';
spriteGrid.style.justifyContent = 'space-around';
spriteGridContainer.appendChild(spriteGrid);
followerMenu.appendChild(spriteGridContainer);

document.body.appendChild(followerMenu);

function renderPokemonGrid(filter = "") {
    spriteGrid.innerHTML = '';
    Object.entries(pokedex).forEach(([num, poke]) => {
        // Filter by name (case-insensitive)
        if (
            filter &&
            !poke.name.english.toLowerCase().includes(filter.toLowerCase())
        ) return;

        const pokeDiv = document.createElement('div');
        pokeDiv.style.textAlign = 'center';
        pokeDiv.style.display = 'flex';
        pokeDiv.style.flexDirection = 'column';
        pokeDiv.style.alignItems = 'center';
        pokeDiv.style.cursor = 'pointer';
        pokeDiv.style.userSelect = 'none';
        pokeDiv.style.gap = '5px';
        const pokeName = document.createElement('span');
        pokeName.style.color = '#fff';
        pokeName.textContent = poke.name.english;
        const pokeTypes = document.createElement('div');
        pokeTypes.style.display = 'flex';
        poke.type.forEach(typeName => {
            const typeImg = document.createElement('img');
            typeImg.src = `img/types/${typeName}.png`;
            typeImg.alt = typeName;
            typeImg.title = typeName.charAt(0).toUpperCase() + typeName.slice(1);
            typeImg.style.margin = '0 2px';
            pokeTypes.appendChild(typeImg);
        });
        const icon = document.createElement('img');
        icon.src = `img/icons/pokemon/${poke.id}.png`;
        icon.alt = poke.name.english;
        icon.title = poke.name.english;
        icon.style.width = '64px';
        icon.style.height = '64px';
        icon.style.imageRendering = 'pixelated';
        icon.style.cursor = 'pointer';
        icon.style.background = '#222';
        icon.style.borderRadius = '8px';
        icon.style.transition = 'box-shadow 0.2s';
        icon.onclick = () => selectFollowerSprite(poke.id, poke.name.english);

        pokeDiv.appendChild(icon);
        pokeDiv.appendChild(pokeName);
        pokeDiv.appendChild(pokeTypes);
        spriteGrid.appendChild(pokeDiv); 
    });
}

followerMenuBtn.onclick = () => {
    followerMenu.style.display = 'flex';
    renderPokemonGrid(searchInput.value);
};

searchInput.addEventListener('input', () => {
    renderPokemonGrid(searchInput.value);
});
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchInput.blur(); // This will close the keyboard on mobile
    }
});

followerMenuBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    e.stopPropagation();
}, { passive: false });

followerMenuBtn.addEventListener('touchend', e => {
    e.preventDefault();
    e.stopPropagation();
    followerMenuBtn.click(); // Triggers the menu open logic
}, { passive: false });

function getSpriteSizeFromHeight(heightStr) {
    // If heightStr is missing, return a default large size
    if (!heightStr) return 64; // or whatever you want as a fallback

    // Extract the number (in meters) from the string, e.g., "3.5 m"
    const match = /([\d.]+)\s*m/.exec(heightStr);
    let meters = match ? parseFloat(match[1]) : 1;
    // Convert meters to pixels (adjust 48 as needed for your game)
    let px = Math.round(meters * 48);
    // Clamp to reasonable sprite sizes (min 64px, max 256px for huge Pokémon)
    px = Math.max(64, Math.min(px, 256));
    return px;
}

function selectFollowerSprite(spriteCode, pokeName) {
    // Find the pokedex entry by id (spriteCode)
    const pokeEntry = Object.values(pokedex).find(p => String(p.id) === String(spriteCode));
    let size = 64; // Default size
    if (pokeEntry && pokeEntry.profile && pokeEntry.profile.height) {
        size = getSpriteSizeFromHeight(pokeEntry.profile.height);
    }

    followerPersonagem._heightStr = pokeEntry && pokeEntry.profile && pokeEntry.profile.height
        ? pokeEntry.profile.height
        : null;

    // Change follower sprite with dynamic size
    followerPersonagem._sprite = new Sprite({
        mode: "overworld",
        spriteCode: spriteCode,
        comprimento: size,
        altura: size
    });
    followerPersonagem._spriteCode = spriteCode; // For broadcasting

    followerIconImg.src = `img/icons/pokemon/${spriteCode}.png`;
    // Play cry
    playCry(spriteCode);

    // Optionally show feedback
    // followerMenu.style.display = 'none';
    // Broadcast new follower sprite
    broadcastLocalState();
}

function playCry(spriteCode) {
    const cry = new Audio(`audio/pokemon/cries/${spriteCode}.ogg`);
    cry.volume = 0.7;
    cry.play();
}

const followerCryBtn = document.createElement('button');
followerCryBtn.style.position = 'fixed';
followerCryBtn.style.right = '100px';
followerCryBtn.style.bottom = '25px';
followerCryBtn.style.zIndex = '9';
followerCryBtn.style.width = '70px';
followerCryBtn.style.height = '70px';
followerCryBtn.style.borderRadius = '50%';
followerCryBtn.style.background = '#4caf50';
followerCryBtn.style.border = 'none';
followerCryBtn.style.boxShadow = '0 2px 8px #0006';
followerCryBtn.style.display = 'flex';
followerCryBtn.style.alignItems = 'center';
followerCryBtn.style.justifyContent = 'center';
followerCryBtn.style.padding = '0';

const followerIconImg = document.createElement('img');
followerIconImg.src = `img/icons/pokemon/${followerPersonagem._sprite.spriteCode}.png`;
followerIconImg.loading = 'lazy';
followerIconImg.style.width = '48px';
followerIconImg.style.height = '48px';
followerIconImg.style.imageRendering = 'pixelated';
followerCryBtn.appendChild(followerIconImg);

document.body.appendChild(followerCryBtn);

followerCryBtn.onclick = () => {
    playCry(followerPersonagem._sprite.spriteCode);
};

followerCryBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    e.stopPropagation();
}, { passive: false });

followerCryBtn.addEventListener('touchend', e => {
    e.preventDefault();
    e.stopPropagation();
    followerCryBtn.click(); // Triggers the sound play logic
}, { passive: false });

// Helper: create a new remote Personagem
function createRemotePersonagem(peerId, initialState) {
    // Array of possible sprites for remote players
    const spriteOptions = [
        'img/overworld/trainer/fantasma.png'
    ];
    // Pick one at random
    const spriteFile = spriteOptions[Math.floor(Math.random() * spriteOptions.length)];
    const remoteSprite = new Sprite({
        mode: "sheet",
        src: spriteFile,
        codigosDirecao: {
            up: 200,
            down: 8,
            right: 138,
            left: 74
        },
        atualDirecao: 'down',
        comprimento: spriteWidth,
        altura: spriteHeight,
        qtdAnimacoes: 4
    });
    const remotePersonagem = new Personagem(remoteSprite, configuracaoDeTeclas, 3);
    remotePersonagem.posX = initialState.posX;
    remotePersonagem.posY = initialState.posY;
    remotePersonagem.remoteName = initialState.name || "Trainer";
     remotePersonagem.peerId = peerId;
    remotePersonagem.sessionId = initialState.sessionId;

    // Add follower for remote player
    if (initialState.follower) {
        const followerSprite = new Sprite({
            mode: "overworld",
            spriteCode: "225",
            comprimento: 64,
            altura: 64
        });
        const remoteFollower = new Personagem(followerSprite, configuracaoDeTeclas, 6, true);
        remoteFollower.posX = initialState.follower.posX;
        remoteFollower.posY = initialState.follower.posY;
        // console.log("Follower direction:", initialState.follower.direcao);
        remoteFollower._sprite.atualDirecao = initialState.follower.direcao;
        remoteFollower._proximaAnimacao = initialState.follower.animFrame;
        remoteFollower._andando = initialState.follower.andando;
        remotePersonagem.follower = remoteFollower;
    }    

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
        sessionId: sessionId,
        follower: {
            posX: followerPersonagem.posX,
            posY: followerPersonagem.posY,
            direcao: followerPersonagem._sprite.atualDirecao,
            movimento: followerPersonagem._andando ? (followerPersonagem._lastMoveDirection || followerPersonagem._sprite.atualDirecao) : null,
            animFrame: followerPersonagem._proximaAnimacao,
            andando: followerPersonagem._andando,
            spriteCode: followerPersonagem._sprite.spriteCode,
            comprimento: followerPersonagem._sprite.comprimento,
            altura: followerPersonagem._sprite.altura
        }
    });
}
setInterval(broadcastLocalState, 200);

const directionToMethod = {
    up: "paraCima",
    down: "paraBaixo",
    left: "paraEsquerda",
    right: "paraDireita"
};

// Listen for remote player states
// Update the onState handler
onState((state, peerId) => {
    const key = state.sessionId || peerId;
    if (!remotePlayers[key]) {
        remotePlayers[key] = createRemotePersonagem(peerId, state);
        hideJoinMessage();
    } else {
        // Update remote player position/state
        const remote = remotePlayers[key];
        remote.posX = state.posX;
        remote.posY = state.posY;
        // console.log("Remote player direction:", state.direcao);
        // remote._sprite.atualDirecao = state.direcao;
        const method = directionToMethod[state.direcao];
        if (method && typeof remote._sprite[method] === "function") {
            remote._sprite[method]();
        } else {
            remote._sprite.paraBaixo();
        }
        remote._proximaAnimacao = state.animFrame;
        remote._andando = state.andando;
        remote.remoteName = state.name || "Trainer";

        // Update follower if present
        if (state.follower) {
            if (
                !remote.follower ||
                remote.follower._sprite.spriteCode !== state.follower.spriteCode ||
                remote.follower._sprite.comprimento !== state.follower.comprimento ||
                remote.follower._sprite.altura !== state.follower.altura
            ) {
                // Create or update follower with correct sprite and size
                const followerSprite = new Sprite({
                    mode: "overworld",
                    spriteCode: state.follower.spriteCode,
                    comprimento: state.follower.comprimento || 64,
                    altura: state.follower.altura || 64
                });
                if (!remote.follower) {
                    remote.follower = new Personagem(followerSprite, configuracaoDeTeclas, 6);
                } else {
                    remote.follower._sprite = followerSprite;
                }
            }
            remote.follower.posX = state.follower.posX;
            remote.follower.posY = state.follower.posY;

            // Only set direction if not moving
            if (state.follower.andando && state.follower.movimento) {
                const followerMethod = directionToMethod[state.follower.movimento];
                if (followerMethod && typeof remote.follower._sprite[followerMethod] === "function") {
                    remote.follower._sprite[followerMethod]();
                }
            } else if (!state.follower.andando) {
                const followerMethod = directionToMethod[state.follower.direcao];
                if (followerMethod && typeof remote.follower._sprite[followerMethod] === "function") {
                    remote.follower._sprite[followerMethod]();
                } else {
                    remote.follower._sprite.paraBaixo();
                }
            }

            remote.follower._proximaAnimacao = state.follower.animFrame;
            remote.follower._andando = state.follower.andando;
        }
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

    const SHADOW_OFFSET = {x: -1, y: 49};

    function drawShadow(character, isFollower = false) {
        // Use the character's actual sprite size
        const width = character._sprite?.comprimento || spriteWidth;
        const height = character._sprite?.altura || spriteHeight;

        // Shadow offset: place it under the feet, scale with height
        const shadowOffsetY = isFollower ? height * 0.87 : height * 0.77; // tweak as needed for your art

        contexto.save();
        contexto.beginPath();
        contexto.ellipse(
            character.posX + width / 2, // center X
            character.posY + shadowOffsetY, // center Y (under feet)
            width / 4.5, // horizontal radius
            height / 8,  // vertical radius, scales with sprite
            0,
            0,
            2 * Math.PI
        );
        contexto.fillStyle = 'rgba(0, 0, 0, 0.2)';
        contexto.fill();
        contexto.restore();
    }

    // Draw shadows first (so they appear under characters)
    Object.values(remotePlayers).forEach(remotePersonagem => {
        if (remotePersonagem.follower) {
            drawShadow(remotePersonagem.follower, true);        
        }
        drawShadow(remotePersonagem);
    });
    
    // Draw local player shadow
    drawShadow(cena.cenario.personagem);
    drawShadow(followerPersonagem, true);

    // Draw remote players and their names
    Object.values(remotePlayers).forEach(remotePersonagem => {
        if (remotePersonagem.follower) {
            remotePersonagem.follower.desenhar(contexto, false, false, false, false);
        }
        
        remotePersonagem.desenhar(contexto, false, false, false, false);

        // Name drawing code...
        contexto.font = "15px Verdana";
        const text = remotePersonagem.remoteName;
        const textWidth = contexto.measureText(text).width;
        const centerX = remotePersonagem.posX + (spriteWidth / 2);
        const y = remotePersonagem.posY;

        contexto.save();
        contexto.globalAlpha = 0.6;
        contexto.fillStyle = "black";
        contexto.fillRect(centerX - (textWidth / 2) - 3, y - 14, textWidth + 6, 16);
        contexto.restore();

        contexto.fillStyle = "white";
        contexto.globalAlpha = 1.0;
        contexto.fillText(text, centerX - (textWidth / 2), y);
    });

    // Draw follower before leader
    contexto.imageSmoothingEnabled = false;
    followerPersonagem.desenhar(contexto, false, false, false, false);

    // Draw leader last (on top)
    cena.cenario.personagem.desenhar(contexto, false, false, false, false);

    // Update follower position
    updateFollower();
}

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
emojiBtn.style.right = '20px';
emojiBtn.style.bottom = '25px';
emojiBtn.style.zIndex = '999';
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
const emojis = ['😊'];
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
    emojiEl.style.zIndex = '999';
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


if (isMobile()) {
    // Create joystick container
    joystickContainer.style.position = 'fixed';
    joystickContainer.style.left = '20px';
    joystickContainer.style.bottom = '20px';
    joystickContainer.style.zIndex = '999';

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

    // Joystick logic
    let joystickDir = {up: false, down: false, left: false, right: false};
    let joystickTouchId = null;

    function getJoystickDirection(dx, dy) {
        const threshold = 15;
        let dir = {up: false, down: false, left: false, right: false};
        if (dy < -threshold) dir.up = true;
        if (dy > threshold) dir.down = true;
        if (dx < -threshold) dir.left = true;
        if (dx > threshold) dir.right = true;
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
                joystickDir = {up: false, down: false, left: false, right: false};
            }
        }
    }, {passive: false});

    setInterval(() => {
        if (joystickActive) {
            joystickControlling = true;
            if (joystickDir.up) cena.cenario.personagem.iniciarComando('up');
            else if (joystickDir.down) cena.cenario.personagem.iniciarComando('down');
            else if (joystickDir.left) cena.cenario.personagem.iniciarComando('left');
            else if (joystickDir.right) cena.cenario.personagem.iniciarComando('right');
            else cena.cenario.personagem.finalizarComando('');
        } else if (joystickControlling) {
            // Only stop movement if joystick was controlling before
            cena.cenario.personagem.finalizarComando('');
            joystickControlling = false;
        }
    }, 50);
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
    // zIndex: '999'
};

// Separate styles for non-status elements (keeps text selection prevention)
const nonStatusStyles = {
    ...preventInteractionStyles,
    userSelect: 'none',
    webkitUserSelect: 'none',
    msUserSelect: 'none'
};

// Function to prevent all interactions from reaching canvas
function preventCanvasInteraction(element, allowTextSelection = false, allowTouchMove = false) {
    const events = ['mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend'];
    events.forEach(eventName => {
        element.addEventListener(eventName, (e) => {
            // Allow all touch events for scrolling if requested
            if (allowTouchMove && eventName.startsWith('touch')) return;
            e.stopPropagation();
            if (!allowTextSelection) {
                e.preventDefault();
            }
        }, { passive: false });
    });
}

// Apply different styles based on element type
const uiElements = [emojiBtn, statusContainer, followerCryBtn, followerMenuBtn];
if (isMobile()) {
    uiElements.push(joystickContainer);
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
        // if (
        //     element !== statusContainer &&
        //     element !== followerMenu // <--- skip followerMenu's children!
        // ) {
        //     Array.from(element.children).forEach(child => {
        //         Object.assign(child.style, nonStatusStyles);
        //         preventCanvasInteraction(child, false);
        //     });
        // }
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
        
        if (joystickDir.up) cena.cenario.personagem.iniciarComando('up');
        else if (joystickDir.down) cena.cenario.personagem.iniciarComando('down');
        else if (joystickDir.left) cena.cenario.personagem.iniciarComando('left');
        else if (joystickDir.right) cena.cenario.personagem.iniciarComando('right');
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
const bgMusic = new Audio('audio/pkmn_center.mp3');
bgMusic.loop = true;
let isMusicMuted = true;

// Start playing when user interacts with the page
// Function to safely handle music state
function handleMusicState() {
    if (isMusicMuted) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    } else {
        if (bgMusic.paused) {
            if (!/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                bgMusic.volume = 0.05;
            }
            const playPromise = bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => console.log('Audio playback failed:', e));
            }
        }
    }
}

function primeMusicIfNeeded() {
    if (!musicPrimed) {
        bgMusic.load();
        musicPrimed = true;
    }
}
document.addEventListener('click', primeMusicIfNeeded, { once: true });

// Create audio controls container
const audioControls = document.createElement('div');
audioControls.style.position = 'fixed';
audioControls.style.right = '10px';
audioControls.style.top = '10px';
audioControls.style.zIndex = '999';
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
    primeMusicIfNeeded();
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
import {Cena} from './cena.js'
import {Cenario} from './cenario.js'
import {Personagem, Sprite} from './personagem_1.1.js'
import {joinRoom} from './trystero-nostr.min.js'
import {isMobile,resizeCanvas} from './utils.js'
import {trainerSprites,configuracaoDeTeclas,directionToMethod} from './constants.js'

document.addEventListener('DOMContentLoaded', () => {
    initializeVars();
    initializeMultiplayer();
    initializeCanvas();
    initializeScene();
    initializeUiEvents();

    // Ensure the window.canvas is resized after the DOM is fully loaded
    resizeCanvas();
    setInterval(broadcastLocalState, 200);
    setInterval(updateStatusIcons, 200);
});

function initializeVars(){
    window.isMusicMuted = true;
    window.musicPrimed = false;
    window.shinyMode = false;

    window.pokedex = {};
    fetch('json/pokedex.json')
        .then(res => res.json())
        .then(data => { window.pokedex = data; });

    window.myName = generateRandomName();
}

function initializeCanvas() {
    window.canvas = document.querySelector('.myCanvas');
    window.canvas.width = window.innerWidth;
    window.canvas.height = window.innerHeight;
    window.contexto = window.canvas.getContext('2d');
}

function initializeScene(){
    let cena = new Cena(window, document, window.contexto);
    window.cena = cena

    cena.cenario = new Cenario('img/overworld/scenary/grass.png', window.canvas.width, window.canvas.height);

    window.spriteWidth = 64;
    window.spriteHeight = 64;
    const margin = 10; // Optional: keep a margin from the edge

    const startX = Math.floor(
        Math.random() * (window.canvas.width - spriteWidth - margin * 2)
    ) + margin;
    const startY = Math.floor(
        Math.random() * (window.canvas.height - spriteHeight - margin * 2)
    ) + margin;

    let localSpriteFile = 'treinador.png'; // Default sprite file
    window.localPersonagem = new Personagem(
        new Sprite({
            mode: "sheet",
            src: `img/overworld/trainer/${localSpriteFile}`,
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
    window.localPersonagem.posX = startX;
    window.localPersonagem.posY = startY;
    cena.cenario.personagem = window.localPersonagem;
    window.localPersonagem._spriteFile = localSpriteFile;

    // Add after local character creation
    window.followerPersonagem = new Personagem(
        new Sprite({
            mode: "overworld",
            spriteCode: "25",
            comprimento: 64,
            altura: 64
        }),
        configuracaoDeTeclas,
        6,
        true
    );

    // Set initial position next to leader
    window.followerPersonagem.posX = startX - spriteWidth;
    window.followerPersonagem.posY = startY;

    cena.prepararMundo();

    cena.reproduzir();

    // Draw remote players in the scene
    const originalCenarioDesenhar = cena.cenario.desenhar.bind(cena.cenario);
    cena.cenario.desenhar = function(contexto) {
        // Clear the window.canvas first!
        contexto.clearRect(0, 0, window.canvas.width, window.canvas.height);

        // Draw background and everything else
        originalCenarioDesenhar(contexto);

        // Draw shadows first (so they appear under characters)
        Object.values(window.remotePlayers).forEach(remotePersonagem => {
            if (remotePersonagem.follower) {
                drawShadow(remotePersonagem.follower, true);        
            }
            drawShadow(remotePersonagem);
        });
        
        // Draw local player shadow
        drawShadow(cena.cenario.personagem);
        drawShadow(window.followerPersonagem, true);

        // Draw remote players and their names
        Object.values(window.remotePlayers).forEach(remotePersonagem => {
            if (remotePersonagem.follower) {
                remotePersonagem.follower.desenhar(contexto, false, false, false, false);
            }
            
            remotePersonagem.desenhar(contexto, false, false, false, false);

            // Name drawing code...
            contexto.font = "15px PKMN";
            const text = remotePersonagem.remoteName;
            const textWidth = contexto.measureText(text).width;
            const centerX = remotePersonagem.posX + (spriteWidth / 2);
            const y = remotePersonagem.posY;

            contexto.save();
            contexto.globalAlpha = 0.6;
            contexto.fillStyle = "black";
            contexto.fillRect(centerX - (textWidth / 2) - 3, y - 17, textWidth + 6, 20);
            contexto.restore();

            contexto.fillStyle = "white";
            contexto.globalAlpha = 1.0;
            contexto.fillText(text, centerX - (textWidth / 2), y);
        });

        // Draw follower before leader
        contexto.imageSmoothingEnabled = false;
        window.followerPersonagem.desenhar(contexto, false, false, false, false);

        // Draw leader last (on top)
        cena.cenario.personagem.desenhar(contexto, false, false, false, false);

        // Update follower position
        updateFollower();
    };

    // Patch movement to broadcast state
    const originalDesenhar = cena.cenario.personagem.desenhar.bind(cena.cenario.personagem);
    cena.cenario.personagem.desenhar = function(...args) {
        originalDesenhar(...args);
        broadcastLocalState();
    };
}

function initializeUiEvents(){
    // Create status container
    window.statusContainer = document.getElementById('status-container');

    // Trainer icon (top left)
    window.trainerIconBtn = document.getElementById('trainer-icon-btn');

    window.trainerIconImg = document.getElementById('trainer-icon-img');
    trainerIconImg.src = `img/overworld/trainer/${window.localPersonagem._spriteFile || 'maleiro.png'}`;

    window.nameElement = document.getElementById('name-element');

    // Pokemon icon (left)
    window.pkmnIconBtn = document.getElementById('pkmn-icon-btn');

    window.pkmnIconImg = document.getElementById('pkmn-icon-img');
    pkmnIconImg.src = `img/icons/pokemon/${window.followerPersonagem._sprite.spriteCode}.png`;

    // Pokemon name (right)
    window.pkmnName = document.getElementById('pkmn-name');
    window.pokeEntry = Object.values(window.pokedex).find(p => String(p.id) === String(window.followerPersonagem._sprite.spriteCode));
    pkmnName.textContent = pokeEntry ? pokeEntry.name.english : '';

    // --- BUTTON LOGIC ---
    trainerIconBtn.onclick = () => {
        // Open trainer menu, close follower menu
        trainerMenu.style.display = 'flex';
        followerMenu.style.display = 'none';
        renderTrainerGrid();
    };

    pkmnIconBtn.onclick = () => {
        // Open follower menu, close trainer menu
        followerMenu.style.display = 'flex';
        trainerMenu.style.display = 'none';
        renderPokemonGrid(searchInput.value);
    };

    trainerIconBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    trainerIconBtn.addEventListener('touchend', e => {
        e.preventDefault();
        e.stopPropagation();
        trainerIconBtn.click(); // Triggers the menu open logic
    }, { passive: false });

    pkmnIconBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    pkmnIconBtn.addEventListener('touchend', e => {
        e.preventDefault();
        e.stopPropagation();
        pkmnIconBtn.click(); // Triggers the menu open logic
    }, { passive: false });

    // Make name editable (reuse your logic)
    nameElement.addEventListener('click', handleNameEdit);
    nameElement.addEventListener('touchend', handleNameEdit);

    // Trainer Sprite Selector Modal
    window.trainerMenu = document.getElementById('trainer-menu');

    preventCanvasInteraction(trainerMenu, false, true);

    window.trainerMenuCloseBtn = document.getElementById('trainer-menu-close-btn');
    trainerMenuCloseBtn.onclick = () => trainerMenu.style.display = 'none';

    preventCanvasInteraction(trainerMenuCloseBtn, true);

    // Export for future use
    window.statusContainer = statusContainer;

    window.followerMenu = document.getElementById('follower-menu');

    preventCanvasInteraction(followerMenu, false, true); // allowTouchMove = true

    window.searchInput = document.getElementById('follower-search');
    window.closeBtn = document.getElementById('follower-menu-close-btn');
    closeBtn.onclick = () => followerMenu.style.display = 'none';

    window.shinyToggleBtn = document.getElementById('shiny-toggle-btn');
    shinyToggleBtn.textContent = '✨';

    shinyToggleBtn.onclick = () => {
        window.shinyMode = !window.shinyMode;
        shinyToggleBtn.textContent = window.shinyMode ? '🌚' : '✨';
        renderPokemonGrid(searchInput.value); // re-render with new icons
    };

    preventCanvasInteraction(searchInput, true);
    preventCanvasInteraction(closeBtn, true);

    closeBtn.addEventListener('touchstart', e => {
        e.stopPropagation();
        // Do NOT call e.preventDefault() so the button works as expected
    }, { passive: false });

    searchInput.addEventListener('input', () => {
        renderPokemonGrid(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchInput.blur(); // This will close the keyboard on mobile
        }
    });

    window.followerCryBtn = document.getElementById('follower-cry-btn');

    window.followerIconImg = document.getElementById('follower-icon-img');
    followerIconImg.src = `img/icons/pokemon/${window.followerPersonagem._sprite.spriteCode}.png`;

    followerCryBtn.onclick = () => {
        playCry(window.followerPersonagem._sprite.spriteCode);
        sendCry({ spriteCode: window.followerPersonagem._sprite.spriteCode });
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

    // Create emoji button (visible on all devices)
    window.emojiBtn = document.getElementById('emoji-btn');
    emojiBtn.textContent = '😊';

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
            sessionId: window.sessionId
        });
        
        // Show emoji locally
        showEmoji(emojis[currentEmojiIndex], cena.cenario.personagem.posX, cena.cenario.personagem.posY);

        // Cycle to next emoji
        currentEmojiIndex = (currentEmojiIndex + 1) % emojis.length;
        emojiBtn.textContent = emojis[currentEmojiIndex];    
    });

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

    window.joystickContainer = document.getElementById('joystick-container');
    let joystickControlling = false;
    let joystickActive = false;

    if (isMobile()) {
        joystickContainer.style.display = ''; // Show joystick on mobile
        // Create joystick base
        const joystickBase = document.getElementById('joystick-base');

        // Create joystick knob
        const joystickKnob = document.getElementById('joystick-knob');

        // Joystick logic
        let joystickDir = {up: false, down: false, left: false, right: false};
        let joystickTouchId = null;

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

    // Apply different styles based on element type
    const uiElements = [emojiBtn, statusContainer, followerCryBtn, trainerIconBtn, pkmnIconBtn, searchInput];
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
    window.bgMusic = new Audio('audio/pkmn_center.mp3');
    bgMusic.loop = true;

    // Start playing when user interacts with the page
    document.addEventListener('click', primeMusicIfNeeded, { once: true });

    // Create audio controls container
    window.audioControls = document.getElementById('audio-controls');

    // Create music mute button
    window.musicMuteBtn = document.getElementById('music-mute-btn');
    musicMuteBtn.innerHTML = '🔇'; // Start with muted icon
    musicMuteBtn.title = 'Toggle Background Music';

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

    window.addEventListener('resize', resizeCanvas);
}

function initializeMultiplayer(){
    // At the top of your main JS file
    window.sessionId = sessionStorage.getItem('sessionId');
    if (!window.sessionId) {
        window.sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 16);
        sessionStorage.setItem('sessionId', window.sessionId);
    }

    window.trysteroAvailable = typeof joinRoom === "function";
    window.remotePlayers = {};

    // Setup Trystero room
    // const {joinRoom} = window.trystero;
    try {
        window.room = joinRoom({appId: 'walking-pkmn-trainer'}, 'main-room');
        [window.sendState, window.onState] = window.room.makeAction('player-state');
        [window.sendEmoji, window.onEmoji] = window.room.makeAction('emoji');
        [window.sendCry, window.onCry] = window.room.makeAction('follower-cry');
    } catch (e) {
        console.warn("Trystero connection failed:", e);
        window.trysteroAvailable = false;
    }

    onState((state, peerId) => {
        const key = state.window.sessionId || peerId;
        if (!window.remotePlayers[key]) {
            window.remotePlayers[key] = createRemotePersonagem(peerId, state);
            hideJoinMessage();
        } else {
            // Update remote player position/state
            const remote = window.remotePlayers[key];
            remote.posX = state.posX;
            remote.posY = state.posY;
            const method = directionToMethod[state.direcao];
            if (method && typeof remote._sprite[method] === "function") {
                remote._sprite[method]();
            } else {
                remote._sprite.paraBaixo();
            }
            remote._proximaAnimacao = state.animFrame;
            remote._andando = state.andando;
            remote.remoteName = state.name || "Trainer";

            if (state.spriteFile && remote._spriteFile !== state.spriteFile) {
                remote._sprite = new Sprite({
                    mode: "sheet",
                    src: `img/overworld/trainer/${state.spriteFile}`,
                    codigosDirecao: {
                        up: 200,
                        down: 8,
                        right: 138,
                        left: 74
                    },
                    atualDirecao: state.direcao || 'down',
                    comprimento: spriteWidth,
                    altura: spriteHeight,
                    qtdAnimacoes: 4
                });
                remote._spriteFile = state.spriteFile;
            }

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
                        altura: state.follower.altura || 64,
                        basePath: state.follower.isShiny
                            ? `img/overworld/pokemon/shiny`
                            : `img/overworld/pokemon`
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

    onEmoji((data, peerId) => {
        showEmoji(data.emoji, data.x, data.y);
    });

    onCry((data, peerId) => {
        playCry(data.spriteCode);
    });

    // Show a message when someone joins
    room.onPeerJoin(peerId => {
        showJoinMessage();
        // Optionally, hide the message after a few seconds
        setTimeout(hideJoinMessage, 1000);
        broadcastLocalState();
    });

    room.onPeerLeave(peerId => {
        // Remove all window.remotePlayers that were created by this peerId
        for (const key in window.remotePlayers) {
            if (window.remotePlayers[key].peerId === peerId) {
                delete window.remotePlayers[key];
            }
        }
    });
}

function updateFollower() {
    const leader = cena.cenario.personagem;
    const follower = window.followerPersonagem;
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
    if (!window.musicPrimed) {
        bgMusic.load();
        window.musicPrimed = true;
    }
}

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
    input.style.width = 'calc(100% - 20px)'; // Full width minus padding
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
        nameElement.textContent = `${newName}`;
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

function showEmoji(emoji, x, y) {
    // Play pop sound
    const popSound = new Audio('audio/pop.mp3');
    popSound.currentTime = 0;
    if (!isMusicMuted) popSound.play();
    
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

function getJoystickDirection(dx, dy) {
    const threshold = 15;
    let dir = {up: false, down: false, left: false, right: false};
    if (dy < -threshold) dir.up = true;
    if (dy > threshold) dir.down = true;
    if (dx < -threshold) dir.left = true;
    if (dx > threshold) dir.right = true;
    return dir;
}

function generateRandomName() {
    const adjectives = ['Rápido', 'Bravo', 'Calmo', 'Feroz', 'Ligeiro', 'Alegre', 'Sábio'];
    const animals = ['Cara'];
    return animals[Math.floor(Math.random() * animals.length)] + ' ' +
           adjectives[Math.floor(Math.random() * adjectives.length)];
}

function updateStatusIcons() {
    trainerIconImg.src = window.shinyMode ? `img/overworld/trainer/${window.localPersonagem._spriteFile || 'maleiro.png'}` : `img/overworld/trainer/${window.localPersonagem._spriteFile || 'maleiro.png'}`;
    pkmnIconImg.src = window.shinyMode ? `img/icons/pokemon/shiny/${window.followerPersonagem._sprite.spriteCode}.png` : `img/icons/pokemon/${window.followerPersonagem._sprite.spriteCode}.png`;
    const pokeEntry = Object.values(window.pokedex).find(p => String(p.id) === String(window.followerPersonagem._sprite.spriteCode));
    pkmnName.textContent = pokeEntry ? pokeEntry.name.english : '';

    nameElement.textContent = window.myName;
}

function renderTrainerGrid() {
    const trainerGrid = document.getElementById('trainer-grid');
    trainerGrid.innerHTML = '';
    trainerSprites.forEach(filename => {
        const option = document.createElement('div');
        option.style.display = 'flex';
        option.style.flexDirection = 'column';
        option.style.alignItems = 'center';
        option.style.cursor = 'pointer';
        option.style.userSelect = 'none';

        // Preview icon (cropped first frame)
        const icon = document.createElement('img');
        icon.src = `img/overworld/trainer/${filename}`;
        icon.loading = 'lazy';
        icon.style.width = '64px'; // Adjust size as needed
        icon.style.height = '64px';
        // icon.style.imageRendering = 'pixelated'; // Keep pixel art sharp
        icon.style.padding = '5px';
        icon.style.objectPosition = '0px -5px'; // Adjust if needed for your sprite sheet
        icon.style.objectFit = 'none';
        icon.style.borderRadius = '4px';
        icon.style.background = '#222';
        icon.style.marginBottom = '2px';

        // Option label (file name, no extension)
        const label = document.createElement('span');
        label.textContent = filename.replace('.png', '');
        label.style.fontSize = '12px';
        label.style.color = '#fff';

        option.appendChild(icon);
        option.appendChild(label);

        // Click handler to change trainer sprite
        option.onclick = () => {
            // Update the entire sprite object so direction codes and animation work
            window.localPersonagem._sprite = new Sprite({
                mode: "sheet",
                src: `img/overworld/trainer/${filename}`,
                codigosDirecao: {
                    up: 200,
                    down: 8,
                    right: 138,
                    left: 74
                },
                atualDirecao: window.localPersonagem._sprite.atualDirecao || 'down',
                comprimento: spriteWidth,
                altura: spriteHeight,
                qtdAnimacoes: 4
            });
            window.localPersonagem._spriteFile = filename; // Save for broadcasting
            broadcastLocalState();
            updateStatusIcons();
        };
        option.ontouchstart = (e) => {
            e.preventDefault(); // Prevent default touch behavior
            e.stopPropagation(); // Prevent event bubbling
            // Same click handler as above
            e.target.click(); // Trigger the click logic
        };
        trainerGrid.appendChild(option);
    });
}

function renderPokemonGrid(filter = "") {
    let spriteGrid = document.getElementById('sprite-grid');
    spriteGrid.innerHTML = '';
    Object.entries(window.pokedex).forEach(([num, poke]) => {
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
        pokeDiv.style.position = 'relative';
        const pokeName = document.createElement('span');
        pokeName.style.color = '#fff';
        pokeName.style.fontSize = '12px';
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
        if (window.shinyMode) {
            icon.src = `img/icons/pokemon/shiny/${poke.id}.png`;
        } else {
            icon.src = `img/icons/pokemon/${poke.id}.png`;
        }
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
        icon.ontouchstart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectFollowerSprite(poke.id, poke.name.english);
        };
        // <span style="
        //     position: absolute;
        //     top: 5px;
        //     left: 5px;
        //     color: white;
        //     font-size: x-small;
        // ">1</span>
        const spriteNumber = document.createElement('span');
        spriteNumber.style.position = 'absolute';
        spriteNumber.style.top = '5px';
        spriteNumber.style.left = '5px';
        spriteNumber.style.color = 'white';
        spriteNumber.style.fontSize = 'x-small';
        spriteNumber.textContent = poke.id;
        pokeDiv.appendChild(spriteNumber);
        pokeDiv.appendChild(icon);
        pokeDiv.appendChild(pokeName);
        pokeDiv.appendChild(pokeTypes);
        spriteGrid.appendChild(pokeDiv); 
    });
}

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

function selectFollowerSprite(spriteCode) {
    // Find the pokedex entry by id (spriteCode)
    const pokeEntry = Object.values(window.pokedex).find(p => String(p.id) === String(spriteCode));
    let size = 64; // Default size
    if (pokeEntry && pokeEntry.profile && pokeEntry.profile.height) {
        size = getSpriteSizeFromHeight(pokeEntry.profile.height);
    }

    window.followerPersonagem._heightStr = pokeEntry && pokeEntry.profile && pokeEntry.profile.height
        ? pokeEntry.profile.height
        : null;

    // Change follower sprite with dynamic size and shiny support
    window.followerPersonagem._sprite = new Sprite({
        mode: "overworld",
        spriteCode: spriteCode,
        comprimento: size,
        altura: size,
        basePath: window.shinyMode
            ? `img/overworld/pokemon/shiny`
            : `img/overworld/pokemon`
    });
    window.followerPersonagem._spriteCode = spriteCode; // For broadcasting
    window.followerPersonagem._isShiny = window.shinyMode;     // Track shiny state for broadcasting

    followerIconImg.src = window.shinyMode
        ? `img/icons/pokemon/shiny/${spriteCode}.png`
        : `img/icons/pokemon/${spriteCode}.png`;
    // Play cry
    playCry(spriteCode);

    broadcastLocalState();
    updateStatusIcons();
}

function playCry(spriteCode) {
    const cry = new Audio(`audio/pokemon/cries/${spriteCode}.ogg`);
    cry.volume = 0.7;
    if (!isMusicMuted) cry.play();
}

function createRemotePersonagem(peerId, initialState) {
    const spriteFile = initialState.spriteFile
        ? `img/overworld/trainer/${initialState.spriteFile}`
        : 'img/overworld/trainer/fantasma.png';

    const remoteSprite = new Sprite({
        mode: "sheet",
        src: spriteFile,
        codigosDirecao: {
            up: 200,
            down: 8,
            right: 138,
            left: 74
        },
        atualDirecao: initialState.direcao || 'down',
        comprimento: spriteWidth,
        altura: spriteHeight,
        qtdAnimacoes: 4
    });
    const remotePersonagem = new Personagem(remoteSprite, configuracaoDeTeclas, 3);
    remotePersonagem.posX = initialState.posX;
    remotePersonagem.posY = initialState.posY;
    remotePersonagem.remoteName = initialState.name || "Trainer";
     remotePersonagem.peerId = peerId;
    remotePersonagem.window.sessionId = initialState.window.sessionId;

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
        remoteFollower._sprite.atualDirecao = initialState.follower.direcao;
        remoteFollower._proximaAnimacao = initialState.follower.animFrame;
        remoteFollower._andando = initialState.follower.andando;
        remotePersonagem.follower = remoteFollower;
    }    

    return remotePersonagem;
}

function broadcastLocalState() {
    sendState({
        posX: cena.cenario.personagem.posX,
        posY: cena.cenario.personagem.posY,
        direcao: cena.cenario.personagem._sprite.atualDirecao,
        animFrame: cena.cenario.personagem._proximaAnimacao,
        andando: cena.cenario.personagem._andando,
        name: window.myName,
        sessionId: window.sessionId,
        spriteFile: window.localPersonagem._spriteFile,
        follower: {
            posX: window.followerPersonagem.posX,
            posY: window.followerPersonagem.posY,
            direcao: window.followerPersonagem._sprite.atualDirecao,
            movimento: window.followerPersonagem._andando ? (window.followerPersonagem._lastMoveDirection || window.followerPersonagem._sprite.atualDirecao) : null,
            animFrame: window.followerPersonagem._proximaAnimacao,
            andando: window.followerPersonagem._andando,
            spriteCode: window.followerPersonagem._sprite.spriteCode,
            comprimento: window.followerPersonagem._sprite.comprimento,
            altura: window.followerPersonagem._sprite.altura,
            isShiny: window.followerPersonagem._isShiny || false,
        }
    });
}

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

function drawShadow(character, isFollower = false) {
    // Use the character's actual sprite size
    const width = character._sprite?.comprimento || spriteWidth;
    const height = character._sprite?.altura || spriteHeight;

    // Shadow offset: place it under the feet, scale with height
    const shadowOffsetY = isFollower ? height * 0.87 : height * 0.77; // tweak as needed for your art

    window.contexto.save();
    window.contexto.beginPath();
    window.contexto.ellipse(
        character.posX + width / 2, // center X
        character.posY + shadowOffsetY, // center Y (under feet)
        width / 4.5, // horizontal radius
        height / 8,  // vertical radius, scales with sprite
        0,
        0,
        2 * Math.PI
    );
    window.contexto.fillStyle = 'rgba(0, 0, 0, 0.2)';
    window.contexto.fill();
    window.contexto.restore();
}

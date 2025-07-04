import { isMobile } from "./utils.js";
import { trainerSprites,configuracaoDeTeclas,spriteWidth,spriteHeight} from './constants.js'
import {getSpriteSizeFromHeight,resizeCanvas} from './utils.js'
import {Sprite} from './personagem.js'
import { getConnection } from './connectionSingleton.js';
import {saveUserPreferences} from './utils.js';

window.isMusicMuted = true;
window.musicPrimed = false;
window.shinyMode = false;
window.isTyping = false;

function initializeUiEvents(){
    const connection = getConnection();
    // Create status container
    window.statusContainer = document.getElementById('status-container');

    // Trainer icon (top left)
    window.trainerIconBtn = document.getElementById('trainer-icon-btn');

    window.trainerIconImg = document.getElementById('trainer-icon-img');
    trainerIconImg.src = `img/overworld/trainer/${connection.localPersonagem.sprite.spriteCode || 'maleiro.png'}`;

    window.nameElement = document.getElementById('name-element');

    // Pokemon icon (left)
    window.pkmnIconBtn = document.getElementById('pkmn-icon-btn');

    window.pkmnIconImg = document.getElementById('pkmn-icon-img');
    
    pkmnIconImg.src = `img/icons/pokemon/${connection.followerPersonagem._sprite.spriteCode}.png`;

    // Pokemon name (right)
    window.pkmnName = document.getElementById('pkmn-name');
    window.pokeEntry = Object.values(window.pokedex).find(p => String(p.id) === String(connection.followerPersonagem._sprite.spriteCode));
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
        window.isTyping = true;
        renderPokemonGrid(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchInput.blur(); // This will close the keyboard on mobile
        }
    });

    searchInput.addEventListener('blur', () => {
        window.isTyping = false;
    });

    window.followerCryBtn = document.getElementById('follower-cry-btn');

    window.followerIconImg = document.getElementById('follower-icon-img');
    followerIconImg.src = window.shinyMode
        ? `img/icons/pokemon/shiny/${connection.followerPersonagem._sprite.spriteCode}.png`
        : `img/icons/pokemon/${connection.followerPersonagem._sprite.spriteCode}.png`;

    followerCryBtn.onclick = () => {
        playCry(connection.followerPersonagem._sprite.spriteCode);
        connection.sendCry({ spriteCode: connection.followerPersonagem._sprite.spriteCode });
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
        
        const connection = getConnection();
        // Send current emoji
        connection.sendEmoji({
            emoji: emojis[currentEmojiIndex],
            x: connection.localPersonagem.posX,
            y: connection.localPersonagem.posY,
            sessionId: window.sessionId
        });
        
        // Show emoji locally
        showEmoji(emojis[currentEmojiIndex], connection.localPersonagem.posX, connection.localPersonagem.posY);

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
                if (joystickDir.up) connection.localPersonagem.iniciarComando('up');
                else if (joystickDir.down) connection.localPersonagem.iniciarComando('down');
                else if (joystickDir.left) connection.localPersonagem.iniciarComando('left');
                else if (joystickDir.right) connection.localPersonagem.iniciarComando('right');
                else connection.localPersonagem.finalizarComando('');
            } else if (joystickControlling) {
                // Only stop movement if joystick was controlling before
                connection.localPersonagem.finalizarComando('');
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
    const uiElements = [emojiBtn, statusContainer, followerCryBtn, trainerIconBtn, pkmnIconBtn, searchInput, nameElement];
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
                preventCanvasInteraction(element, true);
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

    // Update the joystick movement interval to clear destination
    setInterval(() => {
        if (joystickActive) {
            joystickControlling = true;
            // Clear any existing destination when using joystick
            connection.localPersonagem._posDestinoX = null;
            connection.localPersonagem._posDestinoY = null;
            
            if (joystickDir.up) connection.localPersonagem.iniciarComando('up');
            else if (joystickDir.down) connection.localPersonagem.iniciarComando('down');
            else if (joystickDir.left) connection.localPersonagem.iniciarComando('left');
            else if (joystickDir.right) connection.localPersonagem.iniciarComando('right');
            else connection.localPersonagem.finalizarComando('');
        } else if (joystickControlling) {
            connection.localPersonagem.finalizarComando('');
            joystickControlling = false;
        }
    }, 50);

    // Also update the keyboard event handling
    // Add this after your configuracaoDeTeclas definition
    document.addEventListener('keydown', (e) => {
        if (configuracaoDeTeclas[e.code]) {
            // Clear any existing destination when using keyboard
            connection.localPersonagem._posDestinoX = null;
            connection.localPersonagem._posDestinoY = null;
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
        option.onclick = () => selectTrainerSprite(filename);
        
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
            e.stopPropagation(); // Keep this to prevent canvas interaction
            // Remove e.preventDefault() to allow scrolling
        };

        icon.ontouchend = (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectFollowerSprite(poke.id, poke.name.english);
        };
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
    
    const connection = getConnection();

    const input = document.createElement('input');
    input.type = 'text';
    input.value = connection.myName;
    input.style.background = 'rgba(0, 0, 0, 0.5)';
    input.style.border = '1px solid white';
    input.style.color = 'white';
    input.style.padding = '2px 5px';
    input.style.borderRadius = '3px';
    input.style.width = 'calc(100% - 20px)'; // Full width minus padding
    input.style.fontSize = '14px';

    nameElement.textContent = '';
    nameElement.appendChild(input);
    input.focus();

    const saveName = () => {
        const newName = input.value.trim();
        nameElement.textContent = `${newName}`;
        
        if (connection) {
            connection.myName = newName;
            connection.broadcastLocalState();
        }

        window.isTyping = false;
        saveUserPreferences({ name: newName });
    };

    input.addEventListener('blur', saveName);
    input.addEventListener('keypress', (e) => {
        window.isTyping = true;
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

function getJoystickDirection(dx, dy) {
    const threshold = 15;
    let dir = {up: false, down: false, left: false, right: false};
    if (dy < -threshold) dir.up = true;
    if (dy > threshold) dir.down = true;
    if (dx < -threshold) dir.left = true;
    if (dx > threshold) dir.right = true;
    return dir;
}

function selectFollowerSprite(spriteCode) {
    const connection = getConnection();
    
    // Find the pokedex entry by id (spriteCode)
    const pokeEntry = Object.values(window.pokedex).find(p => String(p.id) === String(spriteCode));
    let size = 64; // Default size
    if (pokeEntry && pokeEntry.profile && pokeEntry.profile.height) {
        size = getSpriteSizeFromHeight(pokeEntry.profile.height);
    }

    connection.followerPersonagem._heightStr = pokeEntry && pokeEntry.profile && pokeEntry.profile.height
        ? pokeEntry.profile.height
        : null;

    // Change follower sprite with dynamic size and shiny support
    connection.followerPersonagem._sprite = new Sprite({
        mode: "overworld",
        spriteCode: spriteCode,
        comprimento: size,
        altura: size,
        basePath: window.shinyMode
            ? `img/overworld/pokemon/shiny`
            : `img/overworld/pokemon`
    });
    connection.followerPersonagem._spriteCode = spriteCode; // For broadcasting
    connection.followerPersonagem._isShiny = window.shinyMode;     // Track shiny state for broadcasting

    followerIconImg.src = window.shinyMode
        ? `img/icons/pokemon/shiny/${spriteCode}.png`
        : `img/icons/pokemon/${spriteCode}.png`;
    // Play cry
    playCry(spriteCode);

    if (connection) {
        connection.broadcastLocalState();
    }
    updateStatusIcons();
    saveUserPreferences({
        followerSprite: spriteCode,
        isFollowerShiny: window.shinyMode,
    });
}

function selectTrainerSprite(spriteFile) {
    const connection = getConnection();

    // Update the entire sprite object so direction codes and animation work
    connection.localPersonagem._sprite = new Sprite({
        mode: "sheet",
        src: `img/overworld/trainer/${spriteFile}`,
        codigosDirecao: {
            up: 200,
            down: 8,
            right: 138,
            left: 74
        },
        atualDirecao: connection.localPersonagem._sprite.atualDirecao || 'left',
        comprimento: spriteWidth,
        altura: spriteHeight,
        qtdAnimacoes: 4
    });
    connection.localPersonagem.sprite.spriteCode = spriteFile; // Save for broadcasting

    if (connection) {
        connection.broadcastLocalState();
    }
    updateStatusIcons();
    saveUserPreferences({trainerSprite: spriteFile});
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

function playCry(spriteCode) {
    const cry = new Audio(`audio/pokemon/cries/${spriteCode}.ogg`);
    cry.volume = 0.7;
    if (!isMusicMuted) cry.play();
}

function updateStatusIcons() {
    const connection = getConnection();

    window.trainerIconImg.src = window.shinyMode ? `img/overworld/trainer/${connection.localPersonagem.sprite.spriteCode || 'maleiro.png'}` : `img/overworld/trainer/${connection.localPersonagem.sprite.spriteCode || 'maleiro.png'}`;
    pkmnIconImg.src = window.shinyMode ? `img/icons/pokemon/shiny/${connection.followerPersonagem._sprite.spriteCode}.png` : `img/icons/pokemon/${connection.followerPersonagem._sprite.spriteCode}.png`;
    const pokeEntry = Object.values(window.pokedex).find(p => String(p.id) === String(connection.followerPersonagem._sprite.spriteCode));
    pkmnName.textContent = pokeEntry ? pokeEntry.name.english : '';

    nameElement.textContent = connection.myName;
}

function showJoinMessage() {
    let msg = document.getElementById('join-msg');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'join-msg';
        msg.style.position = 'fixed';
        msg.style.top = '50%';
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
    msg.textContent = "Someone is joining...";
    msg.style.display = 'block';
}

function hideJoinMessage() {
    const msg = document.getElementById('join-msg');
    if (msg) msg.style.display = 'none';
}

export { initializeUiEvents };
export { showEmoji };
export { updateStatusIcons };
export { playCry };
export { showJoinMessage };
export { hideJoinMessage };

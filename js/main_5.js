import {Cena} from './cena.js'
import {Cenario} from './cenario.js'
import {Personagem, Sprite} from './personagem_1.2.js'
import { initializeUiEvents,updateStatusIcons } from './ui.js'
import {getSpriteSizeFromHeight,resizeCanvas,generateRandomName} from './utils_1.js'
import {configuracaoDeTeclas,directionToMethod} from './constants.js'
import {initializeMultiplayer,broadcastLocalState} from './multiplayer.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeVars();
    initializeMultiplayer();
    initializeCanvas();
    initializeScene();
    initializeUiEvents();

    // Ensure the window.canvas is resized after the DOM is fully loaded
    resizeCanvas();
    setInterval(broadcastLocalState, 200);
});

function initializeVars(){
    window.isMusicMuted = true;
    window.musicPrimed = false;
    window.shinyMode = false;

    window.pokedex = {};
    fetch('json/pokedex.json')
        .then(res => res.json())
        .then(data => { 
            window.pokedex = data; 
            updateStatusIcons();
        });

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
            atualDirecao: 'left',
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
        false,
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
}

function updateFollower() {
    const leader = cena.cenario.personagem;
    const follower = window.followerPersonagem;
    let minDistance = 50;

    if (follower._heightStr) {
        minDistance = getSpriteSizeFromHeight(follower._heightStr) * 0.65; // 0.8 is a good multiplier for spacing, tweak as needed
    } else if (follower._sprite && follower._sprite.comprimento) {
        minDistance = follower._sprite.comprimento * 0.65;
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

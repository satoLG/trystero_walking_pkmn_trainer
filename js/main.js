import {Cena} from './cena.js'
import {Cenario} from './cenario.js?v=1'
import {Personagem, Sprite} from './personagem.js?v=1'
import {initializeUiEvents,updateStatusIcons} from './ui.js?v=2';
import {loadUserPreferences,resizeCanvas,generateRandomName,getSpriteSizeFromHeight} from './utils.js?v=1';
import {configuracaoDeTeclas,spriteWidth,spriteHeight} from './constants.js'
import {ConnectionManager} from './connection.js?v=1';
import { setConnection } from './connectionSingleton.js';
import {} from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const prefs = loadUserPreferences();
    initializePage(prefs);
});

function initializePage(prefs = {}) {
    window.shinyMode = prefs.isFollowerShiny || false;
    
    window.pokedex = {};
    fetch('json/pokedex.json')
        .then(res => res.json())
        .then(data => { 
            window.pokedex = data; 
    
            const cena = initializeScene(prefs);
            const connection = new ConnectionManager({
                cena: cena,
                localPersonagem: cena.cenario.personagem,
                followerPersonagem: cena.cenario.personagem.follower,
                myName: prefs.name ? prefs.name : generateRandomName()
            });
            connection.initialize();
            setConnection(connection);

            initializeUiEvents();

            // Ensure the canvas is resized after the DOM is fully loaded
            resizeCanvas();
            setInterval(connection.broadcastLocalState, 200);

            updateStatusIcons();
        });
}

function initializeCanvas() {
    let canvas = document.querySelector('.myCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let contexto = canvas.getContext('2d');

    return [canvas, contexto];
}

function initializeScene(prefs = {}){
    let canvas, contexto;
    [canvas, contexto] = initializeCanvas();

    let cena = new Cena(window, document, contexto);

    cena.cenario = new Cenario('img/overworld/scenary/grass.png', canvas.width, canvas.height);

    const margin = 10; // Optional: keep a margin from the edge

    const startX = Math.floor(
        Math.random() * (canvas.width - spriteWidth - margin * 2)
    ) + margin;
    const startY = Math.floor(
        Math.random() * (canvas.height - spriteHeight - margin * 2)
    ) + margin;

    let localSpriteFile = prefs.trainerSprite || 'treinador.png'; // Default sprite file
    let localPersonagem = new Personagem(
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
    localPersonagem.posX = startX;
    localPersonagem.posY = startY;
    localPersonagem.sprite.spriteCode = localSpriteFile;

    let spriteCode = prefs.followerSprite || '25'; // Default sprite code

    // Find the pokedex entry by id (spriteCode)
    const pokeEntry = Object.values(window.pokedex).find(p => String(p.id) === String(spriteCode));
    let size = 64; // Default size
    if (pokeEntry && pokeEntry.profile && pokeEntry.profile.height) {
        size = getSpriteSizeFromHeight(pokeEntry.profile.height);
    }
    console.log(`Follower sprite size: ${size}px for sprite code ${spriteCode}`);

    // Add after local character creation
    let followerPersonagem = new Personagem(
        new Sprite({
            mode: "overworld",
            spriteCode: spriteCode,
            basePath: prefs.isFollowerShiny
            ? `img/overworld/pokemon/shiny`
            : `img/overworld/pokemon`,
            comprimento: size,
            altura: size
        }),
        configuracaoDeTeclas,
        6,
        false,
        true
    );

    // Set initial position next to leader
    followerPersonagem.posX = startX - spriteWidth;
    followerPersonagem.posY = startY;
    followerPersonagem._isShiny = prefs.isFollowerShiny; 

    localPersonagem.follower = followerPersonagem;

    cena.cenario.personagem = localPersonagem;

    cena.prepararMundo();

    cena.reproduzir();

    return cena;
}

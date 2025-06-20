import {joinRoom} from './trystero-nostr.min.js'
import {Personagem, Sprite} from './personagem_1.2.js'
import {configuracaoDeTeclas,directionToMethod} from './constants.js'
import {showEmoji, playCry, hideJoinMessage, showJoinMessage} from './ui.js'

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

    window.onState((state, peerId) => {
        const key = state.sessionId || peerId;
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
                remote._sprite.paraEsquerda();
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
                    atualDirecao: state.direcao || 'left',
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
                        remote.follower = new Personagem(followerSprite, configuracaoDeTeclas, 6, true, true);
                    } else {
                        remote.follower._sprite = followerSprite;
                    }
                }
                remote.follower.posX = state.follower.posX;
                remote.follower.posY = state.follower.posY;

                // Only set direction if not moving
                if (state.follower.andando && state.follower.direcao) {
                    const followerMethod = directionToMethod[state.follower.direcao];
                    if (followerMethod && typeof remote.follower._sprite[followerMethod] === "function") {
                        remote.follower._sprite.atualDirecao = state.follower.direcao;
                        // remote.follower._sprite[followerMethod]();
                    }
                } else if (!state.follower.andando) {
                    const followerMethod = directionToMethod[state.follower.direcao];
                    if (followerMethod && typeof remote.follower._sprite[followerMethod] === "function") {
                        // remote.follower._sprite[followerMethod]();
                    } else {
                        // remote.follower._sprite.paraEsquerda();
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
        atualDirecao: initialState.direcao || 'left',
        comprimento: spriteWidth,
        altura: spriteHeight,
        qtdAnimacoes: 4
    });
    const remotePersonagem = new Personagem(remoteSprite, configuracaoDeTeclas, 3, true);
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
        const remoteFollower = new Personagem(followerSprite, configuracaoDeTeclas, 6, true, true);
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
            animFrame: window.followerPersonagem._proximaAnimacao,
            andando: window.followerPersonagem._andando,
            spriteCode: window.followerPersonagem._sprite.spriteCode,
            comprimento: window.followerPersonagem._sprite.comprimento,
            altura: window.followerPersonagem._sprite.altura,
            isShiny: window.followerPersonagem._isShiny || false,
        }
    });
}

export { initializeMultiplayer, broadcastLocalState };
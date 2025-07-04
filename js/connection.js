import {joinRoom} from './trystero-nostr.min.js'
import {Personagem, Sprite} from './personagem.js'
import {configuracaoDeTeclas,directionToMethod,spriteWidth,spriteHeight} from './constants.js'
import {showEmoji, playCry, hideJoinMessage, showJoinMessage} from './ui.js'

class ConnectionManager {
    /**
     * @param {Object} options
     * @param {string} [options.appId]
     * @param {string} [options.roomName]
     * @param {Object} [options.cena] - The game scene instance
     * @param {Object} [options.localPersonagem] - The local player character instance
     * @param {Object} [options.followerPersonagem] - The local follower character instance
     * @param {string} [options.myName] - The local player's name
     */
    constructor(options = {}) {
        this.appId = options.appId || 'walking-pkmn-trainer';
        this.roomName = options.roomName || 'main-room';
        this.sessionId = sessionStorage.getItem('sessionId');
        if (!this.sessionId) {
            this.sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 16);
            sessionStorage.setItem('sessionId', this.sessionId);
        }
        this.trysteroAvailable = typeof joinRoom === "function";
        this._remotePlayers = {};
        this.room = null;
        this.sendState = null;
        this.onState = null;
        this.sendEmoji = null;
        this.onEmoji = null;
        this.sendCry = null;
        this.onCry = null;

        // Store references to game objects
        this._cena = options.cena;
        this._localPersonagem = options.localPersonagem;
        this._followerPersonagem = options.followerPersonagem;
        this._myName = options.myName || "Trainer";
    }

    get myName() {
        return this._myName || "Trainer";
    }

    set myName(name) {
        this._myName = name;
        if (this.sendState) {
            this.sendState({ name: name });
        }
    }

    get remotePlayers() {
        return this._remotePlayers;
    }

    get localPersonagem() {
        return this._localPersonagem;
    }

    set localPersonagem(personagem) {
        this._localPersonagem = personagem;
    }

    get followerPersonagem() {
        return this._followerPersonagem;
    }

    set followerPersonagem(followerPersonagem) {
        this._followerPersonagem = followerPersonagem;
    }

    get cena() {
        return this._cena;
    }

    set cena(cena) {
        this._cena = cena;
    }

    initialize() {
        try {
            this.room = joinRoom({ appId: this.appId }, this.roomName);
            [this.sendState, this.onState] = this.room.makeAction('player-state');
            [this.sendEmoji, this.onEmoji] = this.room.makeAction('emoji');
            [this.sendCry, this.onCry] = this.room.makeAction('follower-cry');
        } catch (e) {
            console.warn("Trystero connection failed:", e);
            this.trysteroAvailable = false;
        }

        // Ensure _remotePlayers is updated after modifying remote
        // (in JS, objects are by reference, but for clarity and future-proofing)
        this.onState((state, peerId) => {
            const key = state.sessionId || peerId;
            if (!this._remotePlayers[key]) {
            this._remotePlayers[key] = this.createRemotePersonagem(peerId, state);
            hideJoinMessage();
            } else {
            const remote = this._remotePlayers[key];
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

            if (state.spriteFile && remote.sprite.spriteCode !== state.spriteFile) {
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
                remote.sprite.spriteCode = state.spriteFile;
            }

            if (state.follower) {
                if (
                !remote.follower ||
                remote.follower._sprite.spriteCode !== state.follower.spriteCode ||
                remote.follower._sprite.comprimento !== state.follower.comprimento ||
                remote.follower._sprite.altura !== state.follower.altura
                ) {
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

                if (state.follower.andando && state.follower.direcao) {
                const followerMethod = directionToMethod[state.follower.direcao];
                if (followerMethod && typeof remote.follower._sprite[followerMethod] === "function") {
                    remote.follower._sprite.atualDirecao = state.follower.direcao;
                }
                } else if (!state.follower.andando) {
                const followerMethod = directionToMethod[state.follower.direcao];
                if (followerMethod && typeof remote.follower._sprite[followerMethod] === "function") {
                    // remote.follower._sprite[followerMethod]();
                }
                }

                remote.follower._proximaAnimacao = state.follower.animFrame;
                remote.follower._andando = state.follower.andando;
            }
            // Explicitly update the _remotePlayers entry
            this._remotePlayers[key] = remote;
            }
        });

        this.onEmoji((data, peerId) => {
            showEmoji(data.emoji, data.x, data.y);
        });

        this.onCry((data, peerId) => {
            playCry(data.spriteCode);
        });

        this.room.onPeerJoin(peerId => {
            showJoinMessage();
            setTimeout(hideJoinMessage, 1000);
            this.broadcastLocalState();
        });

        this.room.onPeerLeave(peerId => {
            for (const key in this._remotePlayers) {
                if (this._remotePlayers[key].peerId === peerId) {
                    delete this._remotePlayers[key];
                }
            }
        });
    }

    createRemotePersonagem(peerId, initialState) {
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

    broadcastLocalState() {
        if (!this.sendState) return;
        if (!this._cena || !this._localPersonagem || !this._followerPersonagem) return;
        this.sendState({
            posX: this._cena.cenario.personagem.posX,
            posY: this._cena.cenario.personagem.posY,
            direcao: this._cena.cenario.personagem._sprite.atualDirecao,
            animFrame: this._cena.cenario.personagem._proximaAnimacao,
            andando: this._cena.cenario.personagem._andando,
            name: this.myName,
            sessionId: this.sessionId,
            spriteFile: this._localPersonagem.sprite.spriteCode,
            follower: {
                posX: this._followerPersonagem.posX,
                posY: this._followerPersonagem.posY,
                direcao: this._followerPersonagem._sprite.atualDirecao,
                animFrame: this._followerPersonagem._proximaAnimacao,
                andando: this._followerPersonagem._andando,
                spriteCode: this._followerPersonagem._sprite.spriteCode,
                comprimento: this._followerPersonagem._sprite.comprimento,
                altura: this._followerPersonagem._sprite.altura,
                isShiny: this._followerPersonagem._isShiny || false,
            }
        });
    }
}

export { ConnectionManager };
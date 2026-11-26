import {TILE, COLUNAS, LINHAS, tileEm} from './mapa.js';
import {getConnection} from './connectionSingleton.js';

const CORES = {
    '#': '#d8b878',
    '.': '#58a848',
    ',': '#58a848',
    '*': '#70c060',
    'T': '#2f6b2f',
    'F': '#a0784a',
    'A': '#c84040',
    'B': '#4068c8'
};

const ROTACAO = {up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2};

const MARGEM_DIREITA = 12;
const TOPO = 64;

// Marcadores de outros jogadores no mini-mapa: fora do escopo do card 5 até o Sato responder a dúvida 1. Mude para true para ligar.
export const MOSTRAR_OUTROS_JOGADORES = false;

const prender = (valor, min, max) => Math.min(max, Math.max(min, valor));

export function posicaoNoMinimapa(xMundo, yMundo, px, origemX, origemY){
    return {
        x: prender(origemX + xMundo / TILE * px, origemX, origemX + COLUNAS * px),
        y: prender(origemY + yMundo / TILE * px, origemY, origemY + LINHAS * px)
    };
}

export class Minimapa {
    constructor(srcIcones, opcoes = {}){
        this.mostrarOutros = opcoes.mostrarOutros ?? MOSTRAR_OUTROS_JOGADORES;
        this._icones = new Image();
        this._icones.src = srcIcones;
        this._fundo = null;
        this._px = 0;
    }

    _preRender(px){
        const fundo = document.createElement('canvas');
        fundo.width = COLUNAS * px;
        fundo.height = LINHAS * px;
        const ctx = fundo.getContext('2d');
        for (let row = 0; row < LINHAS; row++) {
            for (let col = 0; col < COLUNAS; col++) {
                ctx.fillStyle = CORES[tileEm(col, row)] || CORES['.'];
                ctx.fillRect(col * px, row * px, px, px);
            }
        }
        this._fundo = fundo;
        this._px = px;
    }

    desenhar(contexto, cenario){
        const larguraTela = cenario._comprimento;
        const px = larguraTela >= 600 ? 6 : 4;
        if (!this._fundo || this._px !== px) this._preRender(px);

        const largura = COLUNAS * px;
        const altura = LINHAS * px;
        const x = larguraTela - largura - MARGEM_DIREITA;
        const y = TOPO;
        const iconesProntos = this._icones.complete && this._icones.naturalWidth > 0;

        contexto.save();
        contexto.imageSmoothingEnabled = false;
        contexto.globalAlpha = 0.9;

        // moldura estilo pixel
        contexto.fillStyle = '#203020';
        contexto.fillRect(x - 3, y - 3, largura + 6, altura + 6);
        contexto.fillStyle = '#e8f0d8';
        contexto.fillRect(x - 1, y - 1, largura + 2, altura + 2);

        contexto.drawImage(this._fundo, x, y);

        // area visivel da camera
        const camera = cenario.camera || {x: 0, y: 0};
        const vx1 = Math.max(x, x + camera.x / TILE * px);
        const vy1 = Math.max(y, y + camera.y / TILE * px);
        const vx2 = Math.min(x + largura, x + (camera.x + cenario._comprimento) / TILE * px);
        const vy2 = Math.min(y + altura, y + (camera.y + cenario._altura) / TILE * px);
        if (vx2 > vx1 && vy2 > vy1) {
            contexto.strokeStyle = '#ffffff';
            contexto.lineWidth = 1;
            contexto.strokeRect(Math.round(vx1) + 0.5, Math.round(vy1) + 0.5,
                                Math.round(vx2 - vx1) - 1, Math.round(vy2 - vy1) - 1);
        }

        // outros jogadores
        if (this.mostrarOutros) {
            const conexao = getConnection();
            const remotos = conexao && conexao.remotePlayers ? Object.values(conexao.remotePlayers) : [];
            for (const remoto of remotos) {
                if (!remoto || typeof remoto.centroX !== 'number' || typeof remoto.centroY !== 'number') continue;
                const {x: rx, y: ry} = posicaoNoMinimapa(remoto.centroX, remoto.centroY, px, x, y);
                if (iconesProntos) {
                    contexto.drawImage(this._icones, 16, 0, 16, 16, Math.round(rx) - 8, Math.round(ry) - 8, 16, 16);
                } else {
                    contexto.fillStyle = 'red';
                    contexto.fillRect(Math.round(rx) - 3, Math.round(ry) - 3, 6, 6);
                }
            }
        }

        // jogador local por ultimo
        const personagem = cenario.personagem;
        if (personagem && typeof personagem.centroX === 'number' && typeof personagem.centroY === 'number') {
            const {x: lx, y: ly} = posicaoNoMinimapa(personagem.centroX, personagem.centroY, px, x, y);
            if (iconesProntos) {
                const direcao = personagem.sprite && personagem.sprite.atualDirecao;
                contexto.translate(Math.round(lx), Math.round(ly));
                contexto.rotate(ROTACAO[direcao] || 0);
                contexto.drawImage(this._icones, 0, 0, 16, 16, -8, -8, 16, 16);
            } else {
                contexto.fillStyle = 'yellow';
                contexto.fillRect(Math.round(lx) - 3, Math.round(ly) - 3, 6, 6);
            }
        }

        contexto.restore();
    }
}

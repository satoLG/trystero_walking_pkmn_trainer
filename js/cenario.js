import {getSpriteSizeFromHeight} from './utils.js'
import {directionToMethod,spriteWidth,spriteHeight} from './constants.js';
import {getConnection} from './connectionSingleton.js';
import {COLUNAS, LINHAS, TILE, TILE_ORIGEM, MUNDO_LARGURA, MUNDO_ALTURA, indiceDoTile} from './mapa.js';
import {calcularCamera} from './camera.js';

export class Cenario{
	constructor(img, comprimento, altura){
        this._personagem;

        this._comprimento = comprimento;
        this._altura = altura;

        this._camera = {x: 0, y: 0};
        this._mapaPronto = null;
        this.minimapa = undefined;

        this._imagem = new Image();
        this._imagem.onload = () => this._prerenderizarMapa();
        this._imagem.src = img;
	}

    _prerenderizarMapa(){
        const c = document.createElement('canvas');
        c.width = MUNDO_LARGURA;
        c.height = MUNDO_ALTURA;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const desenharTile = (i, col, row) => {
            ctx.drawImage(this._imagem,
                          (i % 8) * TILE_ORIGEM, Math.floor(i / 8) * TILE_ORIGEM, TILE_ORIGEM, TILE_ORIGEM,
                          col * TILE, row * TILE, TILE, TILE);
        };

        for (let row = 0; row < LINHAS; row++){
            for (let col = 0; col < COLUNAS; col++){
                desenharTile(0, col, row);
                const idx = indiceDoTile(col, row);
                if (idx !== 0) desenharTile(idx, col, row);
            }
        }

        this._mapaPronto = c;
    }

    desenharCirculo(contexto, tamanho, preenchido){
        contexto.lineWidth = 3;
        contexto.globalAlpha = 0.4;

        contexto.beginPath();
        contexto.setLineDash([]);
        contexto.arc((this._personagem.posDestinoX) ? this._personagem.posDestinoX  : this._personagem.centroX , 
                     (this._personagem.posDestinoY) ? this._personagem.posDestinoY : this._personagem.centroY , 
                     tamanho, 
                     0, 
                     2 * Math.PI);
        
        if (preenchido){
            contexto.fillStyle = 'darkslategray';
            contexto.fill();          
        }
        else{
            contexto.strokeStyle = 'darkslategray';
            contexto.stroke();
        }      
    }

    desenharAlvoDoDestino(contexto){
        this.desenharCirculo(contexto, 15, true);
        this.desenharCirculo(contexto, 15, false);
    }

    atualizarCamera(){
        if (this._personagem){
            this._camera = calcularCamera(this._personagem.centroX, this._personagem.centroY,
                                          this._comprimento, this._altura,
                                          MUNDO_LARGURA, MUNDO_ALTURA);
        }
        return this._camera;
    }

    desenhar(contexto) {
        let canvas = document.querySelector('.myCanvas');
        contexto.clearRect(0, 0, canvas.width, canvas.height);

        this.atualizarCamera();

        // Background outside the map
        contexto.globalAlpha = 1;
        contexto.fillStyle = '#2f5a2f';
        contexto.fillRect(0, 0, canvas.width, canvas.height);

        contexto.save();
        try {
        contexto.translate(-this._camera.x, -this._camera.y);

        // Draw tile map and everything else (world coordinates)
        contexto.globalAlpha = 1;
        contexto.imageSmoothingEnabled = false;
        if (this._mapaPronto){
            contexto.drawImage(this._mapaPronto, 0, 0);
        }
        else{
            contexto.fillStyle = '#78c850';
            contexto.fillRect(0, 0, MUNDO_LARGURA, MUNDO_ALTURA);
        }

        if(this._personagem){
            if(this._personagem.posDestinoY || this._personagem.posDestinoX){
                this.desenharAlvoDoDestino(contexto);
            }

            this._personagem.desenhar(contexto, (this._personagem.centroY > MUNDO_ALTURA), 
                                                (this._personagem.centroY < 0), 
                                                (this._personagem.centroX > MUNDO_LARGURA), 
                                                (this._personagem.centroX < 0));
        }

        const connection = getConnection();
        if (connection){
            const remotePlayers = connection.remotePlayers || {};
            Object.values(remotePlayers).forEach(remotePersonagem => {
                if (remotePersonagem.follower) {
                    this.drawShadow(contexto, remotePersonagem.follower, true);        
                }
                this.drawShadow(contexto, remotePersonagem);
            });
            
            // Draw local player shadow
            this.drawShadow(contexto, this.personagem);
            this.drawShadow(contexto, connection.followerPersonagem, true);

            // Draw remote players and their names
            Object.values(remotePlayers).forEach(remotePersonagem => {
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
        }

        // Draw follower before leader
        contexto.imageSmoothingEnabled = false;
        if (this.personagem.follower) this.personagem.follower.desenhar(contexto, false, false, false, false);

        // Draw leader last (on top)
        this.personagem.desenhar(contexto, false, false, false, false);

        // Update follower position
        this.updateFollower();
        } finally {
            contexto.restore();
        }

        if (this.minimapa) this.minimapa.desenhar(contexto, this);
    }

    updateFollower() {
        const leader = this.personagem;
        const follower = leader.follower;
        let minDistance = 50;

        if (!follower || !leader) return;

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

    drawShadow(contexto, character, isFollower = false) {
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

    set personagem(personagem){
        this._personagem = personagem;
        this.atualizarCamera();
    }

    get personagem(){
        return this._personagem;
    }

    get camera(){
        return this._camera;
    }
}
import {getSpriteSizeFromHeight} from './utils_1.js'
import {directionToMethod,spriteWidth,spriteHeight} from './constants.js';
import {getConnection} from './connectionSingleton.js';

export class Cenario{
	constructor(img, comprimento, altura){
        this._personagem;

        this._comprimento = comprimento;
        this._altura = altura;

        this._imagem = new Image();
        this._imagem.src = img;
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

    desenhar(contexto) {
        let canvas = document.querySelector('.myCanvas');
        contexto.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background and everything else
        contexto.globalAlpha = 1;
        contexto.drawImage(this._imagem, 0, 0, this._comprimento, this._altura, 0, 0, this._comprimento, this._altura);

        if(this._personagem){
            if(this._personagem.posDestinoY || this._personagem.posDestinoX){
                this.desenharAlvoDoDestino(contexto);
            }

            this._personagem.desenhar(contexto, (this._personagem.centroY > this._altura), 
                                                (this._personagem.centroY < 0), 
                                                (this._personagem.centroX > this._comprimento), 
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
        this.personagem.follower.desenhar(contexto, false, false, false, false);

        // Draw leader last (on top)
        this.personagem.desenhar(contexto, false, false, false, false);

        // Update follower position
        this.updateFollower();
    }

    updateFollower() {
        const leader = this.personagem;
        const follower = leader.follower;
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
    }

    get personagem(){
        return this._personagem;
    }
}
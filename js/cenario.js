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

	desenhar(contexto){
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
	}

    set personagem(personagem){
        this._personagem = personagem;
    }

    get personagem(){
        return this._personagem;
    }
}
export class Cenario{
	constructor(img, comprimento, altura){
        this._personagem;

        this._comprimento = comprimento;
        this._altura = altura;

        this._imagem = new Image();
        this._imagem.src = img;
        
        this._quadro = 1;
	}

	desenhar(contexto){
        contexto.drawImage(this._imagem, 0, 0, this._comprimento, this._altura, 0, 0, this._comprimento, this._altura);
        
        contexto.lineWidth = 1;
        contexto.strokeStyle = 'darkred';
        contexto.fillStyle = 'darkred'; 
        contexto.setLineDash([5, 15]);
        contexto.lineDashOffset = -this._quadro;

        if(this._personagem){
            if(this._personagem.posDestinoY){
                if(this._personagem.velY != 0){
                    contexto.beginPath();                  
                    contexto.moveTo(this._personagem.centroX, this._personagem.centroY);
                    contexto.lineTo(this._personagem.centroX, this._personagem.posDestinoY);
                    contexto.stroke();
                }
                else{
                    contexto.beginPath();
                    contexto.moveTo(this._personagem.posDestinoX, this._personagem.centroY);
                    contexto.lineTo(this._personagem.posDestinoX, this._personagem.posDestinoY);
                    contexto.stroke();
                }
            }

            if(this._personagem.posDestinoX){
                if(this._personagem.velX != 0){
                    contexto.beginPath();
                    contexto.moveTo(this._personagem.centroX, this._personagem.centroY);
                    contexto.lineTo(this._personagem.posDestinoX, this._personagem.centroY);
                    contexto.stroke();
                }
                else{
                    contexto.beginPath();
                    contexto.moveTo(this._personagem.centroX, this._personagem.posDestinoY);
                    contexto.lineTo(this._personagem.posDestinoX, this._personagem.posDestinoY);
                    contexto.stroke();
                }
            }

            if(this._personagem.posDestinoY || this._personagem.posDestinoX){
                contexto.lineWidth = 3;
                contexto.beginPath();
                contexto.setLineDash([]);
                contexto.arc((this._personagem.posDestinoX) ? this._personagem.posDestinoX  : this._personagem.centroX , 
                             (this._personagem.posDestinoY) ? this._personagem.posDestinoY : this._personagem.centroY , 
                             15, 
                             0, 
                             2 * Math.PI);
                contexto.fill();                 
                
                contexto.beginPath();
                contexto.setLineDash([]);
                contexto.arc((this._personagem.posDestinoX) ? this._personagem.posDestinoX  : this._personagem.centroX, 
                             (this._personagem.posDestinoY) ? this._personagem.posDestinoY : this._personagem.centroY, 
                             15+this._quadro/2, 
                             0, 
                             2 * Math.PI);
                contexto.stroke();                
            }

            this._personagem.desenhar(contexto,
                                     (this._personagem.centroY > this._altura), (this._personagem.centroY < 0), 
                                     (this._personagem.centroX > this._comprimento), (this._personagem.centroX < 0));
        }
        this._quadro += (this._quadro > 45) ? -this._quadro + 1 : 1;
	}

    set personagem(personagem){
        this._personagem = personagem;
    }

    get personagem(){
        return this._personagem;
    }
}
export class Cenario{
	constructor(img, comprimento, altura){
        this._personagem;

        this._comprimento = comprimento;
        this._altura = altura;

        this._imagem = new Image();
        this._imagem.src = img;       
	}

	desenhar(contexto){
        contexto.drawImage(this._imagem, 0, 0, this._comprimento, this._altura, 0, 0, this._comprimento, this._altura);
        
        if(this._personagem){        
            this._personagem.desenhar(contexto,
                                     (this._personagem.posY > this._altura - this._personagem.altura), (this._personagem.posY < -1), 
                                     (this._personagem.posX > this._comprimento - this._personagem.comprimento), (this._personagem.posX < -15));
        } 
	}

    set personagem(personagem){
        this._personagem = personagem;
    }

    get personagem(){
        return this._personagem;
    }
}
export class Cenario{
	constructor(img){
        this._personagem;

        this._imagem = new Image();
        this._imagem.src = img;       
	}

	desenhar(contexto, comprimento, altura){
        contexto.drawImage(this._imagem, 0, 0, comprimento, altura, 0, 0, comprimento, altura);
        if(this._personagem) this._personagem.desenhar(contexto, comprimento, altura);
	}

    set personagem(personagem){
        this._personagem = personagem;
    }

    get personagem(){
        return this._personagem;
    }
}
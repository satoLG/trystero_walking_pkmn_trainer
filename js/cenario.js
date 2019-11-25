class Cenario{
	constructor(contexto){
        this._contexto = contexto;
        this._personagem;

        this._imagem = new Image();
        this._imagem.src = 'img/grass.png';       
	}

	desenhar(){
        this._contexto.drawImage(this._imagem, 0, 0, this._imagem.width, this._imagem.height, 0, 0, this._imagem.width, this._imagem.height); //cenario
        this._personagem.desenhar(this._imagem.width, this._imagem.height);
	}

    set personagem(personagem){
        this._personagem = personagem;
    }

    get personagem(){
        return this._personagem;
    }
}
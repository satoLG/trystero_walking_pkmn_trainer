export default class Cenario{
	constructor(contexto){
        this._contexto = contexto;
        this._personagem;

        this._imagem = new Image();
        this._imagem.src = 'img/grass.png';       
	}

	desenhar(comprimento, altura){
        this._contexto.drawImage(this._imagem, 0, 0, comprimento, altura, 0, 0, comprimento, altura);
        if(this._personagem) this._personagem.desenhar(comprimento, altura);
	}

    set personagem(personagem){
        this._personagem = personagem;
    }

    get personagem(){
        return this._personagem;
    }
}
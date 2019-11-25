export default class Cena{
	constructor(universo, mundo, contexto){
        this._universo = universo;
        this._mundo = mundo;
        this._contexto = contexto;
        this._cenario;
	}

    prepararMundo(){
        if(this._cenario && this._cenario.personagem)
        {
            this._mundo.addEventListener('keydown', (event) => this._cenario.personagem.iniciarComando(event));
        
            this._mundo.addEventListener('keyup', (event) => this._cenario.personagem.finalizarComando(event));            
        }
    }

	reproduzir(){
        this._contexto.fillRect(0, 0, this._universo.width, this._universo.height);

        if(this._cenario) this._cenario.desenhar();

        this._universo.requestAnimationFrame(() => this.reproduzir());
	}

    get cenario(){
        return this._cenario;
    }

    set cenario(cenario){
        this._cenario = cenario;
    }
}
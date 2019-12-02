export class Cena{
	constructor(universo, mundo, contexto){
        this._universo = universo;
        this._mundo = mundo;
        this._contexto = contexto;
        this._cenario;
        this._teclasPressionadas = [];
	}

    prepararMundo(){
        if(this._cenario && this._cenario.personagem)
        {
            this._mundo.addEventListener('keydown', (event) => {
                if (this._teclasPressionadas.includes(event.code))
                    this._teclasPressionadas.splice(this._teclasPressionadas.indexOf(event.code), 1);	
                this._teclasPressionadas.push(event.code);
                
                this._cenario.personagem.iniciarComando(this._teclasPressionadas[this._teclasPressionadas.length - 1]);
            });

            this._mundo.addEventListener('keyup', (event) => {
                this._teclasPressionadas.splice(this._teclasPressionadas.indexOf(event.code), 1);

                this._cenario.personagem.finalizarComando(this._teclasPressionadas[this._teclasPressionadas.length - 1]);
            });            
        }
    }

	reproduzir(){
        if(this._cenario) this._cenario.desenhar(this._contexto);

        this._universo.requestAnimationFrame(() => this.reproduzir());
	}

    get cenario(){
        return this._cenario;
    }

    set cenario(cenario){
        this._cenario = cenario;
    }
}
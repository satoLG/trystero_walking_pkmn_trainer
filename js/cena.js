export class Cena{
	constructor(universo, mundo, contexto){
        this._universo = universo;
        this._mundo = mundo;
        this._contexto = contexto;
        this._cenario;
        this._teclasPressionadas = [];
        this._movimentandoComTeclas;
	}

    _realizarMovimento(tecla){
        if (this._teclasPressionadas.includes(tecla))
            this._teclasPressionadas.splice(this._teclasPressionadas.indexOf(tecla), 1);	
        this._teclasPressionadas.push(tecla);

        this._cenario.personagem.posDestinoX = undefined;
        this._cenario.personagem.posDestinoY = undefined;            

        this._cenario.personagem.iniciarComandoTeclado(this._teclasPressionadas[this._teclasPressionadas.length - 1]);
    }

    _pararMovimento(tecla){
        this._teclasPressionadas.splice(this._teclasPressionadas.indexOf(tecla), 1);

        this._cenario.personagem.finalizarComandoTeclado(this._teclasPressionadas[this._teclasPressionadas.length - 1]);
    } 

    prepararMundo(){
        if(this._cenario && this._cenario.personagem)
        {
            this._mundo.addEventListener('keydown', (event) => {
                if (window.isTyping) return;
                if (this._cenario.personagem.obterAcaoParaTecla(event.code)){
                    this._realizarMovimento(event.code);
                    this._movimentandoComTeclas = true;                    
                }                                   
            });

            this._mundo.addEventListener('keyup', (event) => {
                if (this._movimentandoComTeclas){
                    this._pararMovimento(event.code);
                    if (this._teclasPressionadas.length == 0)
                        this._movimentandoComTeclas = false;
                }
            });

            this._mundo.addEventListener('mousedown', (event) => {
                if(!this._movimentandoComTeclas){
                    this._cenario.personagem.iniciarComandoTouch(event.pageX, event.pageY);
                }             
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
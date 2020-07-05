export class Cena{
	constructor(universo, mundo, contexto){
        this._universo = universo;
        this._mundo = mundo;
        this._contexto = contexto;
        this._cenario;
        this._teclasPressionadas = [];
        this._teclaProximoMovimentoX;
        this._teclaProximoMovimentoY;
        this._movimentandoComTeclas;
	}

    _realizarMovimento(tecla){
        if (this._teclasPressionadas.includes(tecla))
            this._teclasPressionadas.splice(this._teclasPressionadas.indexOf(tecla), 1);	
        this._teclasPressionadas.push(tecla);
                
        this._cenario.personagem.iniciarComando(this._teclasPressionadas[this._teclasPressionadas.length - 1]);
    }

    _pararMovimento(tecla){
        this._teclasPressionadas.splice(this._teclasPressionadas.indexOf(tecla), 1);

        this._cenario.personagem.finalizarComando(this._teclasPressionadas[this._teclasPressionadas.length - 1]);
    }

    _definirDestinoTouch(event){
        this._cenario.personagem.posDestinoX = event.pageX ;
        this._cenario.personagem.posDestinoY = event.pageY;
    }

    _iniciarMovimentoTouch(){       
        if ((this._cenario.personagem.posDestinoX != this._cenario.personagem.centroX))
        {        
            this._pararMovimento(this._teclaProximoMovimentoX);
            this._teclaProximoMovimentoX = (this._cenario.personagem.centroX > this._cenario.personagem.posDestinoX) ? 'KeyA':'KeyD';
        } 

        if ((this._cenario.personagem.posDestinoY != this._cenario.personagem.centroY))
        {
            this._pararMovimento(this._teclaProximoMovimentoY);
            this._teclaProximoMovimentoY = (this._cenario.personagem.centroY > this._cenario.personagem.posDestinoY) ? 'KeyW':'KeyS';              
        }                 

        let distanciaDestinoX = Math.abs(this._cenario.personagem.posDestinoX - this._cenario.personagem.centroX);
        let distanciaDestinoY = Math.abs(this._cenario.personagem.posDestinoY - this._cenario.personagem.centroY);

        (distanciaDestinoX > distanciaDestinoY) ? this._realizarMovimento(this._teclaProximoMovimentoY) : this._realizarMovimento(this._teclaProximoMovimentoX);
    }

    _verificarProgressoMovimentoTouch(){
        if((this._cenario.personagem.posDestinoY == this._cenario.personagem.centroY) && (this._cenario.personagem.posDestinoY)){
            this._pararMovimento(this._teclaProximoMovimentoY);
            this._cenario.personagem.posDestinoY = undefined;
            if(this._cenario.personagem.posDestinoX){
                this._realizarMovimento(this._teclaProximoMovimentoX);
            }            
        }

        if((this._cenario.personagem.posDestinoX == this._cenario.personagem.centroX) && (this._cenario.personagem.posDestinoX)){
            this._pararMovimento(this._teclaProximoMovimentoX);
            this._cenario.personagem.posDestinoX = undefined;
            if(this._cenario.personagem.posDestinoY){
                this._realizarMovimento(this._teclaProximoMovimentoY);
            }                        
        }        
    }

    prepararMundo(){
        if(this._cenario && this._cenario.personagem)
        {
            this._mundo.addEventListener('keydown', (event) => {
                if (this._cenario.personagem.posDestinoX || this._cenario.personagem.posDestinoY){
                    this._cenario.personagem.posDestinoY = undefined;
                    this._cenario.personagem.posDestinoX = undefined;
                    this._teclasPressionadas = [];
                }                                   
                this._realizarMovimento(event.code);
                this._movimentandoComTeclas = true;
            });

            this._mundo.addEventListener('keyup', (event) => {
                this._pararMovimento(event.code);
                if (this._teclasPressionadas.length == 0)
                    this._movimentandoComTeclas = false;
            });

            this._mundo.addEventListener('mousedown', (event) => {
                if(!this._movimentandoComTeclas){
                    this._definirDestinoTouch(event);
                    this._iniciarMovimentoTouch();   
                }             
            });           
        }
    }

	reproduzir(){
        this._verificarProgressoMovimentoTouch();

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
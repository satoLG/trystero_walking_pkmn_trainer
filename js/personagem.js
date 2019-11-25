const codigosDirecao = {
    'cima': 200,
    'baixo': 8,
    'direita': 138,
    'esquerda': 74
}

const movimentos = {
	KeyW(personagem){
		personagem.velX = 0;
		personagem.velY = -3;
		personagem.direcaoSprite = codigosDirecao['cima'];
	},
	KeyA(personagem){
		personagem.velX = -3;
		personagem.velY = 0;
		personagem.direcaoSprite = codigosDirecao['esquerda'];
	},
	KeyS(personagem){
		personagem.velX = 0;
		personagem.velY = +3;
		personagem.direcaoSprite = codigosDirecao['baixo'];
	},
	KeyD(personagem){
		personagem.velX = +3;
		personagem.velY = 0;
		personagem.direcaoSprite = codigosDirecao['direita'];
	}	
}

class Personagem{
	constructor(contexto){
        this._contexto = contexto;
        
        this._sprite = new Image();
        this._sprite.src = 'img/sprite.png';

        this._proximaAnimacao = 0; 
        this._posX = 0; 
        this._posY = 0; 
        this._velX = 0; 
        this._velY = 0;
        
        this._direcaoSprite = codigosDirecao['baixo'];
        
        this._tamanhoSprite = 64;
        
        this._teclasPressionadas = [];
        this._andando = false;        
	}

    set velX(velX){
        this._velX = velX;
    }

    set velY(velY){
        this._velY = velY;
    }
    
    set direcaoSprite(direcaoSprite){
        this._direcaoSprite = direcaoSprite;
    }

	desenhar(comprimentoCenario, alturaCenario){
		this._contexto.drawImage(this._sprite, (this._proximaAnimacao * this._tamanhoSprite), this._direcaoSprite, 65, 65, 0 + this._posX, 0 + this._posY, 75, 75);
        this._prepararProximoMovimento(comprimentoCenario, alturaCenario);
    }

    _prepararProximoMovimento(comprimentoCenario, alturaCenario){
		if (this._andando) {
			if ((this._posX % 11 === 0) && (this._velX != 0) || (this._posY % 11 === 0) && (this._velY != 0)) {
				if (this._proximaAnimacao === 3) {
					this._proximaAnimacao = 0;
				} else {
					this._proximaAnimacao++;
				}
			}

            let newStartPos;

			if (this._posX < -this._tamanhoSprite/1.2 && this._velX < 0) {
				//console.log('aparece na direita');
				newStartPos = comprimentoCenario-this._tamanhoSprite/2;
				this._posX = Math.ceil(newStartPos / 11) * 11;
			} else if (this._posX > comprimentoCenario-this._tamanhoSprite/2.5 && this._velX > 0) {
				//console.log('aparece na esquerda');
				newStartPos = -this._tamanhoSprite/1.2;
				this._posX = Math.ceil(newStartPos / 11) * 11;
			} else if (this._posY < -this._tamanhoSprite/1.2 && this._velY < 0) {
				//console.log('aparece embaixo');
				newStartPos = alturaCenario-this._tamanhoSprite/3;
				this._posY = Math.ceil(newStartPos / 11) * 11;
			} else if (this._posY > alturaCenario-this._tamanhoSprite/3 && this._velY > 0) {
				//console.log('aparece em cima');
				newStartPos = -this._tamanhoSprite;
				this._posY = Math.ceil(newStartPos / 11) * 11;
			} else {
				this._posX += this._velX;
				this._posY += this._velY;
			}
		} else {
			this._proximaAnimacao = 0;
		}	
    }
    
    _defineDirecao(tecla) {
        let movimentar = movimentos[tecla];
        movimentar ? movimentar(this) : this._andando = false;
    }
    
    iniciarComando(event){
        this._andando = true;
        if ((this._teclasPressionadas.includes(event.code)))
        this._teclasPressionadas.splice(this._teclasPressionadas.indexOf(event.code), 1);	
        this._teclasPressionadas.push(event.code);
        this._defineDirecao(this._teclasPressionadas[this._teclasPressionadas.length - 1]);
    }
    
    finalizarComando(event){
        this._andando = !(this._teclasPressionadas.length < 1);
        this._teclasPressionadas.splice(this._teclasPressionadas.indexOf(event.code), 1);
        this._defineDirecao(this._teclasPressionadas[this._teclasPressionadas.length - 1]);
    }    
}
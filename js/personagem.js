const movimentos = {
	KeyW(personagem){
		personagem.velX = 0;
		personagem.velY = -personagem.modificadorVelocidade;
		personagem._sprite.paraCima();
	},
	KeyA(personagem){
		personagem.velX = -personagem.modificadorVelocidade;
		personagem.velY = 0;
		personagem._sprite.paraEsquerda();
	},
	KeyS(personagem){
		personagem.velX = 0;
		personagem.velY = +personagem.modificadorVelocidade;
		personagem._sprite.paraBaixo();
	},
	KeyD(personagem){
		personagem.velX = +personagem.modificadorVelocidade;
		personagem.velY = 0;
		personagem._sprite.paraDireita();
	}	
}

export class Sprite{
	constructor(img, cima, baixo, direita, esquerda, direcaoInicial, comprimento, altura, qtdAnimacoes){
		this._codigosDirecao = {
			'cima': cima,
			'baixo': baixo,
			'direita': direita,
			'esquerda': esquerda			
		};
		this.atualDirecao = this._codigosDirecao[direcaoInicial];

		this.comprimento = comprimento;
		this.altura = altura;
		this.qtdAnimacoes = qtdAnimacoes;

		this.imagem = new Image();
		this.imagem.src = img;
	}

	paraCima(){
		this.atualDirecao = this._codigosDirecao['cima'];
	}

	paraBaixo(){
		this.atualDirecao = this._codigosDirecao['baixo'];
	}

	paraDireita(){
		this.atualDirecao = this._codigosDirecao['direita'];
	}

	paraEsquerda(){
		this.atualDirecao = this._codigosDirecao['esquerda'];
	}
}

export class Personagem{
	constructor(sprite, modificadorVelocidade){       
        this._sprite = sprite;

        this._proximaAnimacao = 0; 
        this._posX = 0; 
        this._posY = 0; 
        this._velX = 0; 
        this._velY = 0;
		
		this.modificadorVelocidade = modificadorVelocidade;

        this._teclasPressionadas = [];
        this._andando = false;        
	}

    set velX(velX){
        this._velX = velX;
    }

    set velY(velY){
        this._velY = velY;
    }

	desenhar(contexto, comprimentoCenario, alturaCenario){
		contexto.drawImage(this._sprite.imagem, 
						   (this._proximaAnimacao * this._sprite.comprimento), 
						   this._sprite.atualDirecao, 
						   this._sprite.comprimento, this._sprite.altura, 
						   0 + this._posX, 0 + this._posY, 
						   this._sprite.comprimento*1.2, this._sprite.altura*1.2);

        this._prepararProximoMovimento(comprimentoCenario, alturaCenario);
    }

    _prepararProximoMovimento(comprimentoCenario, alturaCenario){
		if (this._andando) {
			if ((this._posX % 11 === 0) && (this._velX != 0) || (this._posY % 11 === 0) && (this._velY != 0)) {
				if (this._proximaAnimacao === this._sprite.qtdAnimacoes-1) {
					this._proximaAnimacao = 0;
				} else {
					this._proximaAnimacao++;
				}
			}

            let newStartPos;

			if (this._posX < -this._sprite.comprimento/1.2 && this._velX < 0) {
				//console.log('aparece na direita');
				newStartPos = comprimentoCenario-this._sprite.comprimento/2;
				this._posX = Math.ceil(newStartPos / 11) * 11;
			} else if (this._posX > comprimentoCenario-this._sprite.comprimento/2.5 && this._velX > 0) {
				//console.log('aparece na esquerda');
				newStartPos = -this._sprite.comprimento/1.2;
				this._posX = Math.ceil(newStartPos / 11) * 11;
			} else if (this._posY < -this._sprite.comprimento/1.2 && this._velY < 0) {
				//console.log('aparece embaixo');
				newStartPos = alturaCenario-this._sprite.comprimento/3;
				this._posY = Math.ceil(newStartPos / 11) * 11;
			} else if (this._posY > alturaCenario-this._sprite.comprimento/4 && this._velY > 0) {
				//console.log('aparece em cima');
				newStartPos = -this._sprite.comprimento;
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
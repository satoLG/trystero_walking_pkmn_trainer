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

		this._andando = false;
		this._contadorDePassos;        
	}

    set velX(velX){
        this._velX = velX;
    }

    set velY(velY){
        this._velY = velY;
	}
	
    get posX(){
        return this._posX;
    }

    get posY(){
        return this._posY;
	}
	
    get comprimento(){
        return this._sprite.comprimento;
    }

    get altura(){
        return this._sprite.altura;
    }	

	desenhar(contexto, limiteBaixo, limiteCima, limiteDireita, limiteEsquerda){
		contexto.drawImage(this._sprite.imagem, 
						   (this._proximaAnimacao * this._sprite.comprimento), 
						   this._sprite.atualDirecao, 
						   this._sprite.comprimento, this._sprite.altura, 
						   0 + this._posX, 0 + this._posY, 
						   this._sprite.comprimento*1.2, this._sprite.altura*1.2);

        this._prepararProximoMovimento(limiteBaixo, limiteCima, limiteDireita, limiteEsquerda);
    }

    _prepararProximoMovimento(limiteBaixo, limiteCima, limiteDireita, limiteEsquerda){
		if (this._andando) {
			if (!limiteDireita && this._velX >= 0 || !limiteEsquerda && this._velX <= 0) this._posX += this._velX;
			if (!limiteBaixo && this._velY >= 0 || !limiteCima && this._velY <= 0) this._posY += this._velY;
		} else {
			this._proximaAnimacao = 0;
		}	
	}
	
	_trocarAnimacao(){
		if (this._proximaAnimacao === this._sprite.qtdAnimacoes-1) {
			this._proximaAnimacao = 0;
		} else {	
			this._proximaAnimacao++;
		}	
	}
    
    _defineDirecao(tecla) {
        let movimentar = movimentos[tecla];
		if(movimentar) movimentar(this);
		return movimentar;
    }
    
    iniciarComando(comando){
		this._andando = !!this._defineDirecao(comando);
		if(!this._contadorDePassos && this._andando){
			this._trocarAnimacao();
			this._contadorDePassos = setInterval(() => this._trocarAnimacao(), 200);
		}	
    }
    
    finalizarComando(comando){
		this._andando = !!this._defineDirecao(comando);
		if(!this._andando){
			clearInterval(this._contadorDePassos)
			this._contadorDePassos = undefined;
		}
        
    }    
}
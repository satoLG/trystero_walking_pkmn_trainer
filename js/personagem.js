const comandos = {
	cima(personagem){
		personagem.velX = 0;
		personagem.velY = -personagem.modificadorVelocidade;
		personagem._sprite.paraCima();
	},
	baixo(personagem){
		personagem.velX = 0;
		personagem.velY = +personagem.modificadorVelocidade;
		personagem._sprite.paraBaixo();
	},
	direita(personagem){
		personagem.velX = +personagem.modificadorVelocidade;
		personagem.velY = 0;
		personagem._sprite.paraDireita();
	},			
	esquerda(personagem){
		personagem.velX = -personagem.modificadorVelocidade;
		personagem.velY = 0;
		personagem._sprite.paraEsquerda();
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
	constructor(sprite, teclasConfiguradasPorComando, modificadorVelocidade){       
        this._sprite = sprite;

		this._teclasDeComandos = teclasConfiguradasPorComando;

		this._proximaAnimacao = 0;
		this._posX = 0; 
		this._posY = 0; 
        this._posDestinoX = 0; 
        this._posDestinoY = 0;		
        this._velX = 0; 
        this._velY = 0;
		
		this.modificadorVelocidade = modificadorVelocidade;

		this._andando = false;
		this._contadorDePassos;
		
        this._proximoMovimentoX;
        this._proximoMovimentoY;		
	}

    set velX(velX){
        this._velX = velX;
    }

    set velY(velY){
        this._velY = velY;
	}
	
    get velX(){
        return this._velX;
    }

    get velY(){
        return this._velY;
	}	

    set posDestinoX(posDestinoX){
        this._posDestinoX = posDestinoX;
    }

    set posDestinoY(posDestinoY){
        this._posDestinoY = posDestinoY;
	}	

    get posDestinoX(){
        return this._posDestinoX;
    }

    get posDestinoY(){
        return this._posDestinoY;
	}	

    get centroX(){
        return this._posX + this._sprite.comprimento/2;
    }

    get centroY(){
        return this._posY + this._sprite.altura/2;
	}

    get posX(){
        return this._posX;
    }

    get posY(){
        return this._posY;
	}

    set posX(posX){
        this._posX = posX;
    }

    set posY(posY){
        this._posY = posY;
	}	
	
    get comprimento(){
        return this._sprite.comprimento;
    }

    get altura(){
        return this._sprite.altura;
    }	

	desenhar(contexto, limiteBaixo, limiteCima, limiteDireita, limiteEsquerda){
		contexto.globalAlpha = 1;
		
		contexto.drawImage(this._sprite.imagem, 
						   (this._proximaAnimacao * this._sprite.comprimento), 
						   this._sprite.atualDirecao, 
						   this._sprite.comprimento, this._sprite.altura, 
						   0 + this._posX, 0 + this._posY, 
						   this._sprite.comprimento, this._sprite.altura);

        this._prepararProximoMovimento(limiteBaixo, limiteCima, limiteDireita, limiteEsquerda);
    }

    _prepararProximoMovimento(limiteBaixo, limiteCima, limiteDireita, limiteEsquerda){
		if (this._andando) 
		{
			if (!limiteDireita && this._velX >= 0 || !limiteEsquerda && this._velX <= 0)
			{
				if (this._posDestinoX)
				{
					if (this._velX > 0)
						this.posX = (this._posDestinoX < this.centroX + this._velX) ? this._posDestinoX - this._sprite.comprimento/2 : this.posX + this._velX ; 							
					else if (this._velX < 0)
						this.posX = (this._posDestinoX > this.centroX + this._velX) ? this._posDestinoX - this._sprite.comprimento/2 : this.posX + this._velX ;						
				}
				else
				{
					this.posX += this._velX;	
				}			
			} 

			if (!limiteBaixo && this._velY >= 0 || !limiteCima && this._velY <= 0)
			{
				if (this._posDestinoY)
				{
					if (this._velY > 0)
						this.posY = (this._posDestinoY < this.centroY + this._velY) ? this._posDestinoY - this._sprite.altura/2 : this.posY + this._velY ;						
					else if (this._velY < 0)
						this.posY = (this._posDestinoY > this.centroY + this._velY) ? this._posDestinoY - this._sprite.altura/2 : this.posY + this._velY ;					
				}
				else
				{
					this.posY += this._velY;	
				}
			}
			
			if (this._posDestinoX && this.centroX == this._posDestinoX){
				this._posDestinoX = undefined;
				if (this._posDestinoY)
					this._definirDirecao(this._proximoMovimentoY);
				else
					this.finalizarComando('')	
			}
			else if (this._posDestinoY && this.centroY == this._posDestinoY){
				this._posDestinoY = undefined;
				if (this._posDestinoX)
					this._definirDirecao(this._proximoMovimentoX);
				else
					this.finalizarComando('')						
			}
		}
		else 
		{
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
    
    _definirDirecao(acao) {
        let movimentar = comandos[acao];
		if(movimentar) movimentar(this);
		return movimentar;
    }
	
	obterAcaoParaTecla(tecla){
		return this._teclasDeComandos[tecla];
	}

	iniciarComandoTouch(novoDestinoX, novoDestinoY){
		this._posDestinoX = novoDestinoX;
		this._posDestinoY = novoDestinoY;

		this._proximoMovimentoX = (this.centroX > this._posDestinoX) ? 'esquerda':'direita';
		this._proximoMovimentoY = (this.centroY > this._posDestinoY) ? 'cima':'baixo';

        let distanciaDestinoX = Math.abs(this._posDestinoX - this.centroX);
        let distanciaDestinoY = Math.abs(this._posDestinoY - this.centroY);

        (distanciaDestinoX > distanciaDestinoY) ? this.iniciarComando(this._proximoMovimentoY) : this.iniciarComando(this._proximoMovimentoX);
	}

	iniciarComandoTeclado(tecla){
		this.iniciarComando(this._teclasDeComandos[tecla]);	
	}

	finalizarComandoTeclado(tecla){
		this.finalizarComando(this._teclasDeComandos[tecla]);	
	}	

    iniciarComando(acao){
		this._andando = !!this._definirDirecao(acao);
		if(!this._contadorDePassos && this._andando){
			this._trocarAnimacao();
			this._contadorDePassos = setInterval(() => this._trocarAnimacao(), 200);
		}	
    }
    
    finalizarComando(acao){
		this._andando = !!this._definirDirecao(acao);
		if(!this._andando){
			clearInterval(this._contadorDePassos)
			this._contadorDePassos = undefined;
		}
        
    }    
}
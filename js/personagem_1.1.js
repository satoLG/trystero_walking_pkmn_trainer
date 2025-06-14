import { isColliding } from './utils.js';

const comandos = {
	up(personagem){
		personagem.velX = 0;
		personagem.velY = -personagem.modificadorVelocidade;
		personagem._sprite.paraCima();
	},
	down(personagem){
		personagem.velX = 0;
		personagem.velY = +personagem.modificadorVelocidade;
		personagem._sprite.paraBaixo();
	},
	right(personagem){
		personagem.velX = +personagem.modificadorVelocidade;
		personagem.velY = 0;
		personagem._sprite.paraDireita();
	},			
	left(personagem){
		personagem.velX = -personagem.modificadorVelocidade;
		personagem.velY = 0;
		personagem._sprite.paraEsquerda();
	}
}

export class Sprite{
    constructor(options) {
		if (options.mode === "sheet") {
			this.mode = options.mode;
			this._codigosDirecao = {
				'up': options.codigosDirecao.up,
				'down': options.codigosDirecao.down,
				'right': options.codigosDirecao.right,
				'left': options.codigosDirecao.left			
			};

			this.atualDirecao = options.direcaoInicial || 'down';
			this.alturaCorteSprite = this._codigosDirecao[this.atualDirecao];
			
			this.comprimento = options.comprimento;
			this.altura = options.altura;
			this.qtdAnimacoes = options.qtdAnimacoes;

			this.imagem = new Image();
			this.imagem.src = options.src;
		}
        // Overworld mode (folder with frames)
        else if (options.mode === "overworld") {
            this.mode = options.mode;
            this.spriteCode = options.spriteCode;
            this.basePath = options.basePath || "img/overworld/pokemon";
            this.directions = ["down", "up", "left", "right"];
            this.frames = {}; // { direction: [frame1, frame2] }
            this.comprimento = options.comprimento || 32;
            this.altura = options.altura || 32;
            this.qtdAnimacoes = 2;

            // Preload images for each direction and frame
            for (const dir of this.directions) {
                this.frames[dir] = [
                    new Image(),
                    new Image()
                ];
                this.frames[dir][0].src = `${this.basePath}/${dir}/${this.spriteCode}.png`;
                this.frames[dir][1].src = `${this.basePath}/${dir}/frame2/${this.spriteCode}.png`;
            }
            // Map your direction codes to folder names
            this._codigosDirecao = {
                'down': "down",
                'up': "up",
                'right': "right",
                'left': "left"
            };
            this.atualDirecao = "down";		
		}
    }

	paraCima(){
		this.alturaCorteSprite = this._codigosDirecao['up'];
		this.atualDirecao = 'up';
	}

	paraBaixo(){
		this.alturaCorteSprite = this._codigosDirecao['down'];
		this.atualDirecao = 'down';
	}

	paraDireita(){
		this.alturaCorteSprite = this._codigosDirecao['right'];
		this.atualDirecao = 'right';
	}

	paraEsquerda(){
		this.alturaCorteSprite = this._codigosDirecao['left'];
		this.atualDirecao = 'left';
	}

    desenhar(contexto, x, y, animFrame, direcao) {
        if (this.mode === "sheet") {
            // ...existing code for sprite sheet...
        } else if (this.mode === "overworld") {
            const dir = this._codigosDirecao[direcao] || "down";
            const frame = animFrame % 2;
            const img = this.frames[dir][frame];
            contexto.drawImage(img, x, y, this.comprimento, this.altura);
        }
    }
}

export class Personagem{
	constructor(sprite, teclasConfiguradasPorComando, modificadorVelocidade, isFollower = false){  
		this._contadorDePassosIdle = undefined;
		this.isFollower = isFollower;

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
		
		this._animFrameHold = 0;

        // Always animate if follower
        if (this.isFollower) {
            this._contadorDePassos = setInterval(() => this._trocarAnimacao(), 500);
        }		
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

	desenhar(contexto, limiteBaixo, limiteCima, limiteDireita, limiteEsquerda) {
		contexto.globalAlpha = 1;

		if (this._sprite.mode === "sheet") {
			contexto.drawImage(
				this._sprite.imagem,
				(this._proximaAnimacao * this._sprite.comprimento),
				this._sprite.alturaCorteSprite,
				this._sprite.comprimento, this._sprite.altura,
				0 + this._posX, 0 + this._posY,
				this._sprite.comprimento, this._sprite.altura
			);
		} else if (this._sprite.mode === "overworld") {
			this._sprite.desenhar(
				contexto,
				this._posX,
				this._posY,
				this._proximaAnimacao,
				Object.keys(this._sprite._codigosDirecao).find(key => this._sprite._codigosDirecao[key] === this._sprite.atualDirecao) || 'down'
			);
		}

		this._prepararProximoMovimento(limiteBaixo, limiteCima, limiteDireita, limiteEsquerda);
	}

    _prepararProximoMovimento(limiteBaixo, limiteCima, limiteDireita, limiteEsquerda){
		if (this._andando) 
		{
			// if (!limiteDireita && this._velX > 0 || !limiteEsquerda && this._velX < 0)
			// {
			// 	this._posX += ((this._posDestinoX) && Math.abs(this._posDestinoX - this.centroX) < Math.abs(this._velX)) ? this._posDestinoX - this.centroX : this._velX;			
			// } 

			// if (!limiteBaixo && this._velY > 0 || !limiteCima && this._velY < 0)
			// {
			// 	this._posY += ((this._posDestinoY) && Math.abs(this._posDestinoY - this.centroY) < Math.abs(this._velY)) ? this._posDestinoY - this.centroY : this._velY;
			// }
			
			// Only apply collision for the local player (remote players don't need this)
			if (typeof window !== "undefined" && this === window.cena?.cenario?.personagem) {
				// Predict next position
				let nextX = this._posX;
				let nextY = this._posY;
				if ((!limiteDireita && this._velX > 0) || (!limiteEsquerda && this._velX < 0)) {
					nextX += ((this._posDestinoX) && Math.abs(this._posDestinoX - this.centroX) < Math.abs(this._velX)) ? this._posDestinoX - this.centroX : this._velX;
				}
				if ((!limiteBaixo && this._velY > 0) || (!limiteCima && this._velY < 0)) {
					nextY += ((this._posDestinoY) && Math.abs(this._posDestinoY - this.centroY) < Math.abs(this._velY)) ? this._posDestinoY - this.centroY : this._velY;
				}

				// Check collision with all remote players
				let blocked = false;
				if (window.remotePlayers) {
					for (const key in window.remotePlayers) {
						if (isColliding({posX: nextX, posY: nextY}, window.remotePlayers[key])) {
							blocked = true;
							break;
						}
					}
				}

				// Only move if not blocked
				if (!blocked) {
					this._posX = nextX;
					this._posY = nextY;
				}
			} else {
				// For remote players, move as usual (no collision)
				if ((!limiteDireita && this._velX > 0) || (!limiteEsquerda && this._velX < 0)) {
					this._posX += ((this._posDestinoX) && Math.abs(this._posDestinoX - this.centroX) < Math.abs(this._velX)) ? this._posDestinoX - this.centroX : this._velX;			
				}
				if ((!limiteBaixo && this._velY > 0) || (!limiteCima && this._velY < 0)) {
					this._posY += ((this._posDestinoY) && Math.abs(this._posDestinoY - this.centroY) < Math.abs(this._velY)) ? this._posDestinoY - this.centroY : this._velY;
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

		this._proximoMovimentoX = (this.centroX > this._posDestinoX) ? 'left':'right';
		this._proximoMovimentoY = (this.centroY > this._posDestinoY) ? 'up':'down';

        let distanciaDestinoX = Math.abs(this._posDestinoX - this.centroX);
        let distanciaDestinoY = Math.abs(this._posDestinoY - this.centroY);

		if (distanciaDestinoX === 0 && distanciaDestinoY === 0) {
			this.finalizarComando('');
			return;
		}

		if (distanciaDestinoX === 0 && distanciaDestinoY > 0) {
			this.iniciarComando(this._proximoMovimentoY);
			return;
		}
		else if (distanciaDestinoY === 0 && distanciaDestinoX > 0) {
			this.iniciarComando(this._proximoMovimentoX);
			return;
		}

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
        if (!this.isFollower && !this._contadorDePassos && this._andando) {
            this._trocarAnimacao();
            this._contadorDePassos = setInterval(() => this._trocarAnimacao(), 200);
        }
    }

    finalizarComando(acao){
        this._andando = !!this._definirDirecao(acao);
        if (!this.isFollower && !this._andando) {
            clearInterval(this._contadorDePassos);
            this._contadorDePassos = undefined;
        }
    }
}
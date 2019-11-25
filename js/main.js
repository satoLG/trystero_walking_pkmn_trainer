var teclasPressionadas = [];
var andando = false;

var canvas = document.querySelector('.myCanvas');

var width = window.innerWidth;
var height = window.innerHeight;
var ctx = canvas.getContext('2d');

var image = new Image();
image.src = 'img/sprite.png';

var background = new Image();
background.src = 'img/grass.png';
background.onload = desenharCena;

var proximaAnimacao = posX = posY = inputX = inputY = 0;

var codigosDirecao = {
	'cima': 200,
	'baixo': 8,
	'direita': 138,
	'esquerda': 74
}

var direcaoSprite = codigosDirecao['baixo'];

var tamanhoSprite = 64;

function desenharCena() {
	ctx.fillRect(0, 0, width, height);

	ctx.drawImage(background, 0, 0, background.width, background.height, 0, 0, background.width, background.height);

	ctx.drawImage(image, (proximaAnimacao * tamanhoSprite), direcaoSprite, 65, 65, 0 + posX, 0 + posY, 75, 75);

	if (andando) {
		if ((posX % 11 === 0) && (inputX != 0) || (posY % 11 === 0) && (inputY != 0)) {
			if (proximaAnimacao === 3) {
				proximaAnimacao = 0;
			} else {
				proximaAnimacao++;
			}
		}

		if (posX < -tamanhoSprite/1.2 && inputX < 0) {
			console.log('aparece na direita');
			newStartPos = background.width-tamanhoSprite/2;
			posX = Math.ceil(newStartPos / 11) * 11;
		} else if (posX > background.width-tamanhoSprite/2.5 && inputX > 0) {
			console.log('aparece na esquerda');
			newStartPos = -tamanhoSprite/1.2;
			posX = Math.ceil(newStartPos / 11) * 11;
		} else if (posY < -tamanhoSprite/1.2 && inputY < 0) {
			console.log('aparece embaixo');
			newStartPos = background.height-tamanhoSprite/3;
			posY = Math.ceil(newStartPos / 11) * 11;
		} else if (posY > background.height-tamanhoSprite/3 && inputY > 0) {
			console.log('aparece em cima');
			newStartPos = -tamanhoSprite;
			posY = Math.ceil(newStartPos / 11) * 11;
		} else {
			posX += inputX;
			posY += inputY;
		}
	} else {
		proximaAnimacao = 0;
	}
	window.requestAnimationFrame(desenharCena);
};

const movimentos = {
	KeyW(){
		inputX = 0;
		inputY = -3;
		direcaoSprite = codigosDirecao['cima'];
	},
	KeyA(){
		inputX = -3;
		inputY = 0;
		direcaoSprite = codigosDirecao['esquerda'];
	},
	KeyS(){
		inputX = 0;
		inputY = +3;
		direcaoSprite = codigosDirecao['baixo'];
	},
	KeyD(){
		inputX = +3;
		inputY = 0;
		direcaoSprite = codigosDirecao['direita'];
	}	
}

function defineDirecao(tecla) {
	let movimentar = movimentos[tecla];
	movimentar ? movimentar() : andando = false;
}

document.addEventListener('keyup', (event) => {
	andando = !(teclasPressionadas.length < 1);
	teclasPressionadas.splice(teclasPressionadas.indexOf(event.code), 1);
	defineDirecao(teclasPressionadas[teclasPressionadas.length - 1]);
});

document.addEventListener('keydown', (event) => {
	andando = true;
	if ((teclasPressionadas.includes(event.code)))
	teclasPressionadas.splice(teclasPressionadas.indexOf(event.code), 1);	
	teclasPressionadas.push(event.code);
	defineDirecao(teclasPressionadas[teclasPressionadas.length - 1]);
});
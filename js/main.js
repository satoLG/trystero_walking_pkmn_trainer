var TeclasPressionadas = [];
var habilitado = false;

var canvas = document.querySelector('.myCanvas');

var width = window.innerWidth;
var height = window.innerHeight;
var ctx = canvas.getContext('2d');

var image = new Image();
image.src = 'img/sprite.png';
image.onload = draw;

var background = new Image();
background.src = 'img/grass.png';

var sprite = posX = posY = inputX = inputY = 0;
var codigoSprite = 8;
var tamanhoSprite = 64;

function draw() {
	ctx.fillRect(0, 0, width, height);

	ctx.drawImage(background, 0, 0, background.width, background.height, 0, 0, background.width, background.height);

	ctx.drawImage(image, (sprite * tamanhoSprite), codigoSprite, 65, 65, 0 + posX, 0 + posY, 75, 75);

	if (habilitado) {
		if ((posX % 11 === 0) && (inputX != 0) || (posY % 11 === 0) && (inputY != 0)) {
			if (sprite === 3) {
				sprite = 0;
			} else {
				sprite++;
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
		sprite = 0;
	}
	window.requestAnimationFrame(draw);
};

function defineDirecao(tecla) {
	if (tecla == 'KeyW') {
		inputX = 0;
		inputY = -3;
		codigoSprite = 200;
	} else if (tecla == 'KeyA') {
		inputX = -3;
		inputY = 0;
		codigoSprite = 74;
	} else if (tecla == 'KeyS') {
		inputX = 0;
		inputY = +3;
		codigoSprite = 8;
	} else if (tecla == 'KeyD') {
		inputX = +3;
		inputY = 0;
		codigoSprite = 138;
	} else {
		habilitado = false;
	}
}

document.addEventListener('keyup', (event) => {
	habilitado = !(TeclasPressionadas.length < 1);
	TeclasPressionadas.splice(TeclasPressionadas.indexOf(event.code), 1);
	defineDirecao(TeclasPressionadas[TeclasPressionadas.length - 1]);
});

document.addEventListener('keydown', (event) => {
	habilitado = true;
	if ((TeclasPressionadas.includes(event.code)))
		TeclasPressionadas.splice(TeclasPressionadas.indexOf(event.code), 1);	
	TeclasPressionadas.push(event.code);
	defineDirecao(TeclasPressionadas[TeclasPressionadas.length - 1]);
});
var TeclasPressionadas = [];
var habilitado = false;
var canvas = document.querySelector('.myCanvas');

var width = canvas.width = window.innerWidth / 3;
var height = canvas.height = window.innerHeight;
var ctx = canvas.getContext('2d');

ctx.fillStyle = 'rgb(0,120,70)';
ctx.fillRect(0, 0, width, height);

ctx.translate(width / 2, height / 2);

var image = new Image();
image.src = 'img/sprite.png';
image.onload = draw;

var sprite = 0;
var posX = -60;
var posY = 0;
var inputX = 0;
var inputY = 0;
var codigoSprite = 8;

ctx.drawImage(image, (sprite * 64), codigoSprite, 60, 65, 0 + posX, -50 + posY, 100, 100);

function draw() {
	ctx.fillRect(-(width / 2), -(height / 2), width, height);

	ctx.drawImage(image, (sprite * 64), codigoSprite, 60, 65, 0 + posX, -50 + posY, 100, 100);

	if (habilitado) {
		if ((posX % 11 === 0) && (inputX != 0) || (posY % 11 === 0) && (inputY != 0)) {
			if (sprite === 3) {
				sprite = 0;
			} else {
				sprite++;
			}
		}

		if (posX < -(width / 2) - 64 && inputX < 0) {
			newStartPos = ((width / 2) - 32);
			posX = Math.ceil(newStartPos / 11) * 11;
		} else if (posX > ((width / 2) - 32) && inputX > 0) {
			newStartPos = -(width / 2) - 64;
			posX = Math.ceil(newStartPos / 11) * 11;
		} else if (posY < -(height / 2) - 64 && inputY < 0) {
			newStartPos = (height / 2) + 32;
			posY = Math.ceil(newStartPos / 11) * 11;
		} else if (posY > (height / 2) + 32 && inputY > 0) {
			newStartPos = -((height / 2) + 32);
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
	if (!(TeclasPressionadas.includes(event.code))) {
		TeclasPressionadas.push(event.code);
	} else {
		TeclasPressionadas.splice(TeclasPressionadas.indexOf(event.code), 1);
		TeclasPressionadas.push(event.code);
	}
	defineDirecao(TeclasPressionadas[TeclasPressionadas.length - 1]);
});
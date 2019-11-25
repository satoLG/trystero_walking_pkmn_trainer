var canvas = document.querySelector('.myCanvas');
var contexto = canvas.getContext('2d');

let cena = new Cena(window, document, contexto);

cena.cenario = new Cenario(contexto);

cena.cenario.personagem = new Personagem(contexto);

cena.prepararMundo();

(function executar(){
	cena.reproduzir();

	window.requestAnimationFrame(executar);
})();
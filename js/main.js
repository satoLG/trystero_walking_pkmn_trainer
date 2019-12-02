import Cena from './cena.js'
import Cenario from './cenario.js'
import Personagem from './personagem.js'

let canvas = document.querySelector('.myCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let contexto = canvas.getContext('2d');

let cena = new Cena(window, document, contexto);

cena.cenario = new Cenario(contexto);

cena.cenario.personagem = new Personagem(contexto);

cena.prepararMundo();

cena.reproduzir();
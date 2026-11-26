export const TILE = 64;
export const TILE_ORIGEM = 32;
export const COLUNAS = 32;
export const LINHAS = 24;
export const MUNDO_LARGURA = COLUNAS * TILE;
export const MUNDO_ALTURA = LINHAS * TILE;

// Caixa dos pés do trainer, relativa a posX/posY (canto superior esquerdo do sprite).
// Premissa: todo trainer local usa sprite de spriteWidth x spriteHeight = 64x64 (js/constants.js;
// main.js:79-80 e connection.js:123-124 sempre passam esses valores). getSpriteSizeFromHeight só é
// usado para o pokémon follower, que não tem colisão com o mapa. Se o tamanho do trainer mudar,
// ajuste estes valores; tests/mapa.test.mjs confere a premissa.
export const PE_OFFSET_X = 20;
export const PE_LARGURA = 24;
export const PE_OFFSET_Y = 44;
export const PE_ALTURA = 16;

// 'T' árvore, '.' grama, ',' grama variante, '*' flores, '#' caminho, 'F' cerca,
// 'A' célula da Casa A, 'B' célula da Casa B
export const LAYOUT = [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "T..............##..............T",
    "T.*.....T....,.##............,.T",
    "T....AAAA.BBBB.##.BBBB.AAAA....T",
    "TT...AAAA.BBBB.##.BBBB.AAAA...*T",
    "T....AAAA.BBBB.##.BBBB.AAAA....T",
    "T..##########################..T",
    "T..##########################..T",
    "T..##....T..*..##.......,..##..T",
    "T..##.,**....T.##...**...T.##..T",
    "T..##.....,....##.FFFFFFFFF##..T",
    "T##############################T",
    "T##############################T",
    "T..##FFFFFFFFF.##..........##..T",
    "TT.##BBBB.AAAA.##.AAAA.BBBB##..T",
    "T..##BBBB.AAAA.##.AAAA.BBBB##.*T",
    "T,.##BBBB.AAAA.##.AAAA.BBBB##..T",
    "T..##########################..T",
    "T..##########################..T",
    "T..............##.............TT",
    "T.....*..,..*..##..T..,.*......T",
    "T...T..........##.........,..*.T",
    "T..............##..............T",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
];

const INDICE_SIMPLES = {'.': 0, ',': 1, '*': 2, '#': 3, 'T': 4, 'F': 5};

export function tileEm(col, row) {
    if (col < 0 || col >= COLUNAS || row < 0 || row >= LINHAS) return 'T';
    return LAYOUT[row][col];
}

export function ehCaminhavel(col, row) {
    return tileEm(col, row) === '#';
}

export function podeOcupar(posX, posY) {
    const x1 = posX + PE_OFFSET_X;
    const x2 = x1 + PE_LARGURA - 1;
    const y1 = posY + PE_OFFSET_Y;
    const y2 = y1 + PE_ALTURA - 1;
    return [[x1, y1], [x2, y1], [x1, y2], [x2, y2]].every(([x, y]) =>
        ehCaminhavel(Math.floor(x / TILE), Math.floor(y / TILE))
    );
}

export function indiceDoTile(col, row) {
    if (col < 0 || col >= COLUNAS || row < 0 || row >= LINHAS) return 4;
    const ch = tileEm(col, row);
    if (ch in INDICE_SIMPLES) return INDICE_SIMPLES[ch];
    let c0 = col;
    while (tileEm(c0 - 1, row) === ch) c0--;
    let r0 = row;
    while (tileEm(col, r0 - 1) === ch) r0--;
    const dc = col - c0;
    const dr = row - r0;
    const base = ch === 'A' ? 0 : 4;
    return 8 * (1 + dr) + base + dc;
}

export function posicaoInicialAleatoria(rand = Math.random) {
    const lista = [];
    for (let row = 0; row < LINHAS; row++) {
        for (let col = 0; col < COLUNAS; col++) {
            if (LAYOUT[row][col] === '#') lista.push({col, row});
        }
    }
    const {col, row} = lista[Math.floor(rand() * lista.length)];
    return {posX: col * TILE, posY: row * TILE - 20};
}

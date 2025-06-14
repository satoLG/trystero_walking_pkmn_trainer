function resizeCanvas(cena) {
    let canvas = document.querySelector('.myCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (window.cena.cenario) {
        window.cena.cenario._comprimento = canvas.width;
        window.cena.cenario._altura = canvas.height;
    }
}

function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

function isColliding(p1, p2, size = 30) {
    // Simple AABB collision detection
    return (
        p1.posX < p2.posX + size &&
        p1.posX + size > p2.posX &&
        p1.posY < p2.posY + size &&
        p1.posY + size > p2.posY
    );
}

export { isColliding };
export { isMobile };
export { resizeCanvas };

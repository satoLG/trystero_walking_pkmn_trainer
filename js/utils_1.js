import { getConnection } from "./connectionSingleton.js"; 

function resizeCanvas() {
    const connection = getConnection();

    let canvas = document.querySelector('.myCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (connection.cena.cenario) {
        connection.cena.cenario._comprimento = canvas.width;
        connection.cena.cenario._altura = canvas.height;
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

function getSpriteSizeFromHeight(heightStr) {
    // If heightStr is missing, return a default large size
    if (!heightStr) return 64; // or whatever you want as a fallback

    // Extract the number (in meters) from the string, e.g., "3.5 m"
    const match = /([\d.]+)\s*m/.exec(heightStr);
    let meters = match ? parseFloat(match[1]) : 1;
    // Convert meters to pixels (adjust 48 as needed for your game)
    let px = Math.round(meters * 48);
    // Clamp to reasonable sprite sizes (min 64px, max 256px for huge Pokémon)
    px = Math.max(64, Math.min(px, 256));
    return px;
}

function generateRandomName() {
    const funTrainerNames = [
        'Ash', 'Misty', 'Brock', 'Leaf', 'Red', 'Blue', 'Gold', 'Silver', 'Crystal', 'Ruby',
        'Sapphire', 'Emerald', 'Diamond', 'Pearl', 'Platinum', 'Oak', 'Elm', 'Birch', 'Sprout', 
        'Ranger', 'Rocket'
    ];
    return funTrainerNames[Math.floor(Math.random() * funTrainerNames.length)];
}

function saveUserPreferences(preferences = {}){
    if (preferences.name) localStorage.setItem('trainerName', preferences.name);
    if (preferences.trainerSprite) localStorage.setItem('trainerSprite', preferences.trainerSprite);
    if (preferences.followerSprite) localStorage.setItem('followerSprite', preferences.followerSprite);
    if (preferences.isFollowerShiny) localStorage.setItem('isFollowerShiny', preferences.isFollowerShiny);
}

function loadUserPreferences() {
    return {
        name: localStorage.getItem('trainerName'),
        trainerSprite: localStorage.getItem('trainerSprite'),
        followerSprite: localStorage.getItem('followerSprite'),
        isFollowerShiny: localStorage.getItem('isFollowerShiny') === 'true'
    };
}

export { isColliding };
export { isMobile };
export { resizeCanvas };
export { getSpriteSizeFromHeight };
export { generateRandomName };
export { saveUserPreferences };
export { loadUserPreferences };

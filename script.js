const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

canvas.width = 400;
canvas.height = 700;

let score = 0;
let highScore = localStorage.getItem('mirazHighScore') || 0;
highScoreElement.innerText = highScore;

let gameActive = false;
let bubbles = [];
let animationId;

const bgImg = new Image(); bgImg.src = 'background.png';
const playerImg = new Image(); playerImg.src = 'player_ball.png';
const bubbleImg = new Image(); bubbleImg.src = 'bubble.png';

const player = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    radius: 30, 
    targetX: canvas.width / 2,
    targetY: canvas.height - 150
};

// ইমেজের রেশিও ঠিক রেখে ড্র করার ফাংশন
function drawImageWithRatio(img, x, y, size) {
    if (img.complete && img.naturalWidth !== 0) {
        const ratio = img.naturalWidth / img.naturalHeight;
        let drawW, drawH;
        if (ratio > 1) {
            drawW = size * 2;
            drawH = (size * 2) / ratio;
        } else {
            drawH = size * 2;
            drawW = (size * 2) * ratio;
        }
        ctx.drawImage(img, x - drawW / 2, y - drawH / 2, drawW, drawH);
    } else {
        // ইমেজ না থাকলে ব্যাকআপ শেপ
        ctx.fillStyle = 'red';
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }
}

class Bubble {
    constructor() { this.reset(); }
    reset() {
        this.radius = Math.random() * 10 + 15; 
        this.x = Math.random() * canvas.width;
        this.y = -(Math.random() * 800 + 100);
        this.dx = (Math.random() - 0.5) * 4;
        this.dy = Math.random() * 2 + 3;
    }
    update() {
        this.x += this.dx;
        this.y += this.dy;
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) this.dx *= -1;
        if (this.y - this.radius > canvas.height) {
            this.reset();
            score++;
            scoreElement.innerText = score;
            if(score > highScore) {
                highScore = score;
                highScoreElement.innerText = highScore;
            }
        }
    }
    draw() {
        drawImageWithRatio(bubbleImg, this.x, this.y, this.radius);
    }
}

const handleMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let tx = (clientX - rect.left) * scaleX;
    let ty = (clientY - rect.top) * scaleY;
    player.targetX = Math.max(player.radius, Math.min(canvas.width - player.radius, tx));
    player.targetY = Math.max(player.radius, Math.min(canvas.height - player.radius, ty));
};

window.addEventListener('mousemove', handleMove);
window.addEventListener('touchmove', handleMove);

function startGame() {
    gameActive = true;
    score = 0;
    scoreElement.innerText = score;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    bubbles = Array.from({ length: 8 }, () => new Bubble());
    if (animationId) cancelAnimationFrame(animationId);
    animate();
}

function animate() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ব্যাকগ্রাউন্ড রেশিও ঠিক রাখা
    if (bgImg.complete && bgImg.naturalWidth !== 0) {
        let imgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
        let canvasRatio = canvas.width / canvas.height;
        let dW, dH, dX, dY;
        if (imgRatio > canvasRatio) {
            dW = canvas.height * imgRatio; dH = canvas.height;
            dX = (canvas.width - dW) / 2; dY = 0;
        } else {
            dW = canvas.width; dH = canvas.width / imgRatio;
            dX = 0; dY = (canvas.height - dH) / 2;
        }
        ctx.drawImage(bgImg, dX, dY, dW, dH);
    }

    player.x += (player.targetX - player.x) * 0.15;
    player.y += (player.targetY - player.y) * 0.15;
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // প্লেয়ার রেশিও ঠিক রাখা
    drawImageWithRatio(playerImg, player.x, player.y, player.radius);

    bubbles.forEach(bubble => {
        bubble.update();
        bubble.draw();
        if (Math.hypot(player.x - bubble.x, player.y - bubble.y) < player.radius + bubble.radius) {
            endGame();
        }
    });
    animationId = requestAnimationFrame(animate);
}

function endGame() {
    gameActive = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('mirazHighScore', highScore);
        highScoreElement.innerText = highScore;
    }
    document.getElementById('finalScore').innerText = "Score: " + score;
    document.getElementById('bestScoreDisplay').innerText = "Best: " + highScore;
    gameOverScreen.classList.remove('hidden');
}

startBtn.onclick = startGame;
restartBtn.onclick = startGame;
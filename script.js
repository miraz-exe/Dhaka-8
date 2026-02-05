const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const leftScoreEl = document.getElementById('leftScore');
const rightScoreEl = document.getElementById('rightScore');
const timerEl = document.getElementById('timer');
const winnerMessage = document.getElementById('winnerMessage');
const finalVotes = document.getElementById('finalVotes');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

canvas.width = 400;
canvas.height = 700;

let leftScore = 0, rightScore = 0, timeLeft = 60, gameActive = false;
let animationId = null, gameInterval = null;
let bubbles = [], dhanItems = [];
let isRaging = false;

// Assets
const bgImg = new Image(); bgImg.src = 'background.png';
const playerImg = new Image(); playerImg.src = 'player_ball.png';
const bubbleImg = new Image(); bubbleImg.src = 'bubble.png';
const dhanImg = new Image(); dhanImg.src = 'dhaner-shish.png';

const bgMusic = new Audio('bg_music.mp3'); bgMusic.loop = true;
const collectSound = new Audio('collect.mp3');
const hitSound = new Audio('hit.mp3');
const gameOverSound = new Audio('game_over.mp3');

const player = { x: 200, y: 350, radius: 50, targetX: 200, targetY: 350 };

class FallingObject {
    constructor(type) { this.type = type; this.reset(); }
    reset() {
        this.radius = (this.type === 'bubble') ? 22 : 25;
        this.x = Math.random() * (canvas.width - 50) + 25;
        this.y = -Math.random() * 800 - 100;
        this.dx = (Math.random() - 0.5) * 2; 
        
        // Speed: Slower and consistent
        if (this.type === 'bubble') {
            this.dy = Math.random() * 1.5 + 2; 
        } else {
            this.dy = Math.random() * 2 + 2.5;
        }
    }
    update() {
        this.x += this.dx; this.y += this.dy;
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) this.dx *= -1;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (Math.sqrt(dx * dx + dy * dy) < player.radius + this.radius) {
            if (this.type === 'bubble') {
                rightScore++; rightScoreEl.innerText = rightScore;
                hitSound.currentTime = 0; hitSound.play().catch(()=>{});
                isRaging = true;
                setTimeout(() => { isRaging = false; }, 200); 
            } else {
                leftScore++; leftScoreEl.innerText = leftScore;
                collectSound.currentTime = 0; collectSound.play().catch(()=>{});
            }
            this.reset();
        }
        if (this.y - this.radius > canvas.height) this.reset();
    }
    draw() {
        const img = (this.type === 'bubble') ? bubbleImg : dhanImg;
        if (img.complete) ctx.drawImage(img, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    }
}

function handleMove(e) {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    player.targetX = (cx - rect.left) * (canvas.width / rect.width);
    player.targetY = (cy - rect.top) * (canvas.height / rect.height);
}

canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });

function startGame() {
    gameActive = false;
    if (animationId) cancelAnimationFrame(animationId);
    if (gameInterval) clearInterval(gameInterval);
    
    bgMusic.currentTime = 0;
    bgMusic.play().catch(()=>{});

    leftScore = 0; rightScore = 0; timeLeft = 60;
    leftScoreEl.innerText = "0"; rightScoreEl.innerText = "0"; timerEl.innerText = "60s";
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');

    // Density: Bubbles slightly increased to 15
    bubbles = Array.from({length: 15}, () => new FallingObject('bubble'));
    dhanItems = Array.from({length: 3}, () => new FallingObject('dhan'));

    gameActive = true;
    gameInterval = setInterval(() => {
        if (!gameActive) return;
        timeLeft--; timerEl.innerText = timeLeft + "s";
        if (timeLeft <= 0) endGame();
    }, 1000);
    animate();
}

function animate() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgImg.complete) ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    player.x += (player.targetX - player.x) * 0.2; 
    player.y += (player.targetY - player.y) * 0.2;
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    
    ctx.save();
    if (isRaging) {
        ctx.filter = "sepia(1) saturate(10) hue-rotate(-50deg) brightness(0.8)";
        ctx.shadowBlur = 30; ctx.shadowColor = "red";
    }
    if (playerImg.complete) ctx.drawImage(playerImg, player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);
    ctx.restore();

    bubbles.forEach(b => { b.update(); b.draw(); });
    dhanItems.forEach(d => { d.update(); d.draw(); });
    animationId = requestAnimationFrame(animate);
}

function endGame() {
    gameActive = false; clearInterval(gameInterval); cancelAnimationFrame(animationId);
    gameOverSound.play().catch(()=>{});
    let result = (leftScore > rightScore) ? "মির্জা আব্বাস বিপুল ভোটে জয়ী!" : (rightScore > leftScore) ? "নাসিরউদ্দিন পাটোয়ারী বিপুল ভোটে জয়ী!" : "ভোট ড্র হয়েছে!";
    winnerMessage.innerText = result;
    finalVotes.innerHTML = `মির্জা আব্বাস: ${leftScore} ভোট<br>নাসিরউদ্দিন পাটোয়ারী: ${rightScore} ভোট`;
    document.getElementById('gameOver').classList.remove('hidden');
}

startBtn.onclick = startGame;
restartBtn.onclick = startGame;

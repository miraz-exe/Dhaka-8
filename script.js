const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const leftScoreEl = document.getElementById('leftScore');
const rightScoreEl = document.getElementById('rightScore');
const timerEl = document.getElementById('timer');
const winnerMessage = document.getElementById('winnerMessage');
const finalVotes = document.getElementById('finalVotes');

canvas.width = 400;
canvas.height = 700;

let leftScore = 0, rightScore = 0, timeLeft = 60, gameActive = false;
let animationId = null, gameInterval = null;
let bubbles = [], dhanItems = [];
let nextDhanTime = 0;
let isRaging = false;

// Assets
const bgImg = new Image(); bgImg.src = 'background.png';
const playerImg = new Image(); playerImg.src = 'player_ball.png';
const bubbleImg = new Image(); bubbleImg.src = 'bubble.png';
const dhanImg = new Image(); dhanImg.src = 'dhaner-shish.png';

const bgMusic = new Audio('bg_music.mp3');
bgMusic.loop = true; bgMusic.volume = 0.5;
const collectSound = new Audio('collect.mp3');
const hitSound = new Audio('hit.mp3');
const gameOverSound = new Audio('game_over.mp3');

const player = { x: 200, y: 550, radius: 28, targetX: 200, targetY: 550 };

class FallingObject {
    constructor(type) {
        this.type = type;
        this.reset();
    }
    reset() {
        this.radius = (this.type === 'bubble') ? 22 : 25;
        this.x = Math.random() * (canvas.width - 50) + 25;
        this.y = -Math.random() * 600 - 50;
        // গতি কমানো হয়েছে: dx (পাশাপাশি) এবং dy (নিচে নামা)
        this.dx = (Math.random() - 0.5) * 3; 
        this.dy = (this.type === 'bubble') ? Math.random() * 1.5 + 2 : Math.random() * 1.5 + 2.5;
    }
    update() {
        this.x += this.dx;
        this.y += this.dy;
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) this.dx *= -1;
        
        let dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < player.radius + this.radius) {
            if (this.type === 'bubble') {
                rightScore++;
                rightScoreEl.innerText = rightScore;
                hitSound.currentTime = 0;
                hitSound.play().catch(()=>{});
                isRaging = true;
                setTimeout(() => { isRaging = false; }, 200); 
            } else {
                leftScore++;
                leftScoreEl.innerText = leftScore;
                collectSound.currentTime = 0;
                collectSound.play().catch(()=>{});
            }
            this.reset();
        }
        if (this.y > canvas.height) {
            if (this.type === 'bubble') this.reset();
            else return true;
        }
        return false;
    }
    draw() {
        const img = (this.type === 'bubble') ? bubbleImg : dhanImg;
        if (img.complete) ctx.drawImage(img, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    }
}

function handleMove(e) {
    if (e.cancelable) e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    player.targetX = (cx - rect.left) * sx;
    player.targetY = (cy - rect.top) * sy;
}

canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('touchmove', handleMove, { passive: false });

function startGame() {
    gameActive = false;
    if (animationId) cancelAnimationFrame(animationId);
    if (gameInterval) clearInterval(gameInterval);

    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});

    leftScore = 0; rightScore = 0; timeLeft = 60;
    leftScoreEl.innerText = "0"; rightScoreEl.innerText = "0"; timerEl.innerText = "60s";
    
    // ঘনত্ব একই (১৫টি বাবল) রাখা হয়েছে
    bubbles = Array.from({length: 15}, () => new FallingObject('bubble'));
    dhanItems = [];
    nextDhanTime = Date.now() + 500;

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');

    gameActive = true;
    gameInterval = setInterval(() => {
        if (!gameActive) return;
        timeLeft--;
        timerEl.innerText = timeLeft + "s";
        if (timeLeft <= 0) endGame();
    }, 1000);

    animate();
}

function animate() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgImg.complete) ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    player.x += (player.targetX - player.x) * 0.15;
    player.y += (player.targetY - player.y) * 0.15;
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    
    ctx.save();
    if (isRaging) {
        ctx.shadowBlur = 20; ctx.shadowColor = "red";
        ctx.filter = "sepia(1) saturate(10) hue-rotate(-50deg)";
    }
    if (playerImg.complete) ctx.drawImage(playerImg, player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);
    ctx.restore();

    // ধানের শীষ আসার ফ্রিকোয়েন্সি (ঘনত্ব) একই রাখা হয়েছে
    if (Date.now() > nextDhanTime) {
        dhanItems.push(new FallingObject('dhan'));
        nextDhanTime = Date.now() + (Math.random() * 500 + 500); 
    }

    bubbles.forEach(b => { b.update(); b.draw(); });
    dhanItems = dhanItems.filter(d => {
        let isDead = d.update();
        d.draw();
        return !isDead;
    });

    animationId = requestAnimationFrame(animate);
}

function endGame() {
    gameActive = false;
    clearInterval(gameInterval);
    cancelAnimationFrame(animationId);
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(()=>{});
    
    let result = (leftScore > rightScore) ? "মির্জা আব্বাস বিপুল ভোটে জয়লাভ করেছেন!" : 
                 (rightScore > leftScore) ? "নাসিরউদ্দিন পাটোয়ারী বিপুল ভোটে জয়লাভ করেছেন!" : "ভোট ড্র হয়েছে!";
    winnerMessage.innerText = result;
    finalVotes.innerHTML = `মির্জা আব্বাস: ${leftScore} ভোট | নাসিরউদ্দিন: ${rightScore} ভোট`;
    document.getElementById('gameOver').classList.remove('hidden');
}

window.onload = () => {
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', startGame);
};

// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const endScreen = document.getElementById('endScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

// UI Elements
const timeDisplay = document.getElementById('time');
const scoreDisplay = document.getElementById('score');
const speedDisplay = document.getElementById('speed');
const timeProgress = document.getElementById('timeProgress');
const scoreProgress = document.getElementById('scoreProgress');
const finalScore = document.getElementById('finalScore');
const finalTime = document.getElementById('finalTime');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const resultIcon = document.getElementById('resultIcon');
const highScoreDisplay = document.getElementById('highScore');
const bestTimeDisplay = document.getElementById('bestTime');

// Achievement elements
const speedAchievement = document.getElementById('speedAchievement');
const timeAchievement = document.getElementById('timeAchievement');
const perfectAchievement = document.getElementById('perfectAchievement');

// Control buttons
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const boostBtn = document.getElementById('boostBtn');
const pauseBtn = document.getElementById('pauseBtn');

// Set canvas size
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game state
const gameState = {
    running: false,
    paused: false,
    timeLeft: 60,
    score: 0,
    playerSpeed: 3,
    player: {
        x: 100,
        y: 100,
        size: 24,
        color: '#40c9ff',
        trail: [],
        particles: []
    },
    stars: [],
    particles: [],
    keys: {},
    lastTime: 0,
    boostActive: false,
    boostEndTime: 0,
    lastStarCollectedTime: 0,
    combo: 0,
    maxCombo: 0,
    starCount: 10,
    highScore: localStorage.getItem('cosmicHighScore') || 0,
    bestTime: localStorage.getItem('cosmicBestTime') || 0
};

// Initialize game
function initGame() {
    gameState.running = true;
    gameState.paused = false;
    gameState.timeLeft = 60;
    gameState.score = 0;
    gameState.playerSpeed = 3;
    gameState.player.x = canvas.width / 2;
    gameState.player.y = canvas.height / 2;
    gameState.player.trail = [];
    gameState.player.particles = [];
    gameState.particles = [];
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.boostActive = false;
    
    // Create stars in interesting pattern
    gameState.stars = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;
    
    for (let i = 0; i < gameState.starCount; i++) {
        const angle = (i * Math.PI * 2) / gameState.starCount;
        const distance = radius + (Math.random() * 50 - 25);
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        gameState.stars.push({
            x: x,
            y: y,
            size: 12 + Math.random() * 6,
            collected: false,
            pulse: Math.random() * Math.PI * 2,
            color: `hsl(${45 + Math.random() * 30}, 100%, 65%)`,
            rotation: 0
        });
    }
    
    updateUI();
    startScreen.style.display = 'none';
    endScreen.style.display = 'none';
    
    // Start game loop
    gameState.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Update UI elements
function updateUI() {
    // Update displays
    timeDisplay.textContent = Math.max(0, Math.floor(gameState.timeLeft));
    scoreDisplay.textContent = gameState.score;
    speedDisplay.textContent = gameState.playerSpeed;
    
    // Update progress bars
    const timePercent = (gameState.timeLeft / 60) * 100;
    const scorePercent = (gameState.score / gameState.starCount) * 100;
    timeProgress.style.width = `${timePercent}%`;
    scoreProgress.style.width = `${scorePercent}%`;
    
    // Update speed indicators
    const dots = document.querySelectorAll('.speed-dot');
    const activeDots = Math.min(5, Math.floor(gameState.playerSpeed));
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index < activeDots);
    });
    
    // Update high score display
    highScoreDisplay.textContent = gameState.highScore;
    bestTimeDisplay.textContent = gameState.bestTime;
}

// Draw animated background
function drawBackground() {
    // Deep space gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0e17');
    gradient.addColorStop(0.5, '#1a1b3a');
    gradient.addColorStop(1, '#0a0e17');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Distant stars
    for (let i = 0; i < 100; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 23) % canvas.height;
        const size = Math.sin(Date.now() / 1000 + i) * 0.5 + 0.5;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + size * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Nebula effects
    drawNebula();
}

// Draw nebula effects
function drawNebula() {
    const time = Date.now() / 10000;
    
    for (let i = 0; i < 3; i++) {
        const x = Math.sin(time + i) * 100 + canvas.width / 2;
        const y = Math.cos(time + i * 1.3) * 100 + canvas.height / 2;
        const radius = 150 + Math.sin(time * 2 + i) * 50;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${64 + i * 30}, ${201 - i * 50}, 255, 0.1)`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw player with effects
function drawPlayer() {
    const p = gameState.player;
    
    // Update trail
    p.trail.push({x: p.x, y: p.y, alpha: 1, size: p.size});
    if (p.trail.length > 15) p.trail.shift();
    
    // Draw trail
    p.trail.forEach((point, index) => {
        const alpha = (index / p.trail.length) * 0.7;
        const size = point.size * (index / p.trail.length);
        
        ctx.fillStyle = `rgba(64, 201, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw player with gradient
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, p.color);
    gradient.addColorStop(1, 'rgba(64, 201, 255, 0.3)');
    
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Player details
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x - 6, p.y - 6, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.arc(p.x - 6, p.y - 6, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Boost effect
    if (gameState.boostActive) {
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Boost particles
        for (let i = 0; i < 2; i++) {
            gameState.particles.push({
                x: p.x + (Math.random() - 0.5) * p.size,
                y: p.y + (Math.random() - 0.5) * p.size,
                vx: (Math.random() - 0.5) * 10 - (p.x - p.trail[0]?.x || 0) * 0.5,
                vy: (Math.random() - 0.5) * 10 - (p.y - p.trail[0]?.y || 0) * 0.5,
                size: 2 + Math.random() * 4,
                life: 1,
                color: '#ffd166'
            });
        }
    }
}

// Draw stars with rotation and glow
function drawStars() {
    gameState.stars.forEach(star => {
        if (star.collected) return;
        
        // Update star animation
        star.pulse += 0.03;
        star.rotation += 0.01;
        const glow = Math.sin(star.pulse) * 0.3 + 0.7;
        const size = star.size + Math.sin(star.pulse * 2) * 2;
        
        // Outer glow
        ctx.shadowColor = star.color;
        ctx.shadowBlur = 20 + glow * 15;
        
        // Save context for rotation
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.rotate(star.rotation);
        
        // Star body with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.7, star.color);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        
        // Draw 8-pointed star
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const radius = i % 2 === 0 ? size : size * 0.4;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.shadowBlur = 0;
    });
}

// Draw particles
function drawParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        
        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
            continue;
        }
        
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Draw HUD with game info
function drawHUD() {
    // Combo display
    if (gameState.combo > 1) {
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 20px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(`${gameState.combo}x COMBO!`, canvas.width / 2, 60);
        ctx.textAlign = 'left';
    }
    
    // Time warning
    if (gameState.timeLeft < 10) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 24px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(`HURRY! ${Math.ceil(gameState.timeLeft)}s`, canvas.width / 2, 100);
        ctx.textAlign = 'left';
    }
    
    // Pause screen
    if (gameState.paused) {
        ctx.fillStyle = 'rgba(10, 14, 23, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION PAUSED', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '24px Exo 2';
        ctx.fillText('Press P or click Resume to continue', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left';
    }
}

// Check star collisions
function checkCollisions() {
    const player = gameState.player;
    
    gameState.stars.forEach(star => {
        if (star.collected) return;
        
        const dx = player.x - star.x;
        const dy = player.y - star.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.size + star.size) {
            star.collected = true;
            gameState.score++;
            
            // Combo system
            const now = Date.now();
            if (now - gameState.lastStarCollectedTime < 2000) {
                gameState.combo++;
                gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
            } else {
                gameState.combo = 1;
            }
            gameState.lastStarCollectedTime = now;
            
            // Create collection particles
            createStarParticles(star);
            
            // Speed boost for combo
            const boostAmount = 1 + (gameState.combo - 1) * 0.5;
            gameState.playerSpeed = 3 + boostAmount;
            gameState.boostActive = true;
            gameState.boostEndTime = Date.now() + 1500;
            
            updateUI();
            
            // Play collection sound
            playSound('collect');
        }
    });
}

// Create particle explosion for collected star
function createStarParticles(star) {
    for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        gameState.particles.push({
            x: star.x,
            y: star.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 1 + Math.random() * 5,
            life: 1,
            color: star.color
        });
    }
}

// Play sound effects
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        if (type === 'collect') {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800 + gameState.combo * 100, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Update player position
function updatePlayer(deltaTime) {
    const player = gameState.player;
    const speed = gameState.playerSpeed * deltaTime * 60;
    
    // Movement based on keys
    let moveX = 0, moveY = 0;
    if (gameState.keys['ArrowUp'] || gameState.keys['w'] || gameState.keys['W']) moveY -= 1;
    if (gameState.keys['ArrowDown'] || gameState.keys['s'] || gameState.keys['S']) moveY += 1;
    if (gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A']) moveX -= 1;
    if (gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D']) moveX += 1;
    
    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071; // 1 / sqrt(2)
        moveY *= 0.7071;
    }
    
    player.x += moveX * speed;
    player.y += moveY * speed;
    
    // Keep player in bounds with bounce effect
    const bounce = 0.7;
    if (player.x < player.size) {
        player.x = player.size;
        if (moveX < 0) moveX = -moveX * bounce;
    }
    if (player.x > canvas.width - player.size) {
        player.x = canvas.width - player.size;
        if (moveX > 0) moveX = -moveX * bounce;
    }
    if (player.y < player.size) {
        player.y = player.size;
        if (moveY < 0) moveY = -moveY * bounce;
    }
    if (player.y > canvas.height - player.size) {
        player.y = canvas.height - player.size;
        if (moveY > 0) moveY = -moveY * bounce;
    }
    
    // Update boost status
    if (gameState.boostActive && Date.now() > gameState.boostEndTime) {
        gameState.playerSpeed = 3;
        gameState.boostActive = false;
    }
}

// Draw everything
function drawGame() {
    drawBackground();
    drawStars();
    drawParticles();
    drawPlayer();
    drawHUD();
}

// Game loop
function gameLoop(timestamp) {
    if (!gameState.running) return;
    
    const deltaTime = (timestamp - gameState.lastTime) / 1000;
    gameState.lastTime = timestamp;
    
    if (!gameState.paused) {
        // Update game state
        gameState.timeLeft -= deltaTime;
        updatePlayer(deltaTime);
        checkCollisions();
        updateUI();
        
        // Check game end conditions
        if (gameState.timeLeft <= 0) {
            endGame(false);
            return;
        }
        
        if (gameState.score >= gameState.starCount) {
            endGame(true);
            return;
        }
    }
    
    drawGame();
    requestAnimationFrame(gameLoop);
}

// End game with achievements
function endGame(win) {
    gameState.running = false;
    
    // Update high scores
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('cosmicHighScore', gameState.score);
    }
    
    if (win && gameState.timeLeft > gameState.bestTime) {
        gameState.bestTime = Math.floor(gameState.timeLeft);
        localStorage.setItem('cosmicBestTime', gameState.bestTime);
    }
    
    // Set end screen content
    if (win) {
        resultTitle.textContent = 'MISSION SUCCESS!';
        resultMessage.textContent = 'You collected all stellar energy!';
        resultIcon.innerHTML = '<i class="fas fa-trophy"></i>';
        resultIcon.style.color = '#ffd166';
    } else {
        resultTitle.textContent = 'MISSION FAILED';
        resultMessage.textContent = 'Time ran out! Try again.';
        resultIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        resultIcon.style.color = '#ff6b6b';
    }
    
    finalScore.textContent = gameState.score;
    finalTime.textContent = Math.max(0, Math.floor(gameState.timeLeft));
    
    // Check achievements
    checkAchievements();
    
    // Show end screen
    endScreen.style.display = 'flex';
}

// Check and display achievements
function checkAchievements() {
    // Speed Demon: Max combo of 5 or more
    if (gameState.maxCombo >= 5) {
        speedAchievement.classList.add('unlocked');
        speedAchievement.innerHTML = '<i class="fas fa-bolt"></i><span>Speed Demon Unlocked!</span>';
    }
    
    // Time Master: Finish with more than 30 seconds left
    if (gameState.timeLeft > 30 && gameState.score === gameState.starCount) {
        timeAchievement.classList.add('unlocked');
        timeAchievement.innerHTML = '<i class="fas fa-clock"></i><span>Time Master Unlocked!</span>';
    }
    
    // Perfect Run: All stars collected
    if (gameState.score === gameState.starCount) {
        perfectAchievement.classList.add('unlocked');
        perfectAchievement.innerHTML = '<i class="fas fa-star"></i><span>Perfect Run Unlocked!</span>';
    }
}

// Event listeners
startButton.addEventListener('click', initGame);
restartButton.addEventListener('click', initGame);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        e.preventDefault();
        if (gameState.running && !gameState.paused) {
            gameState.playerSpeed = 8;
            gameState.boostActive = true;
            gameState.boostEndTime = Date.now() + 800;
            playSound('boost');
        }
        return;
    }
    
    if (e.key === 'p' || e.key === 'P') {
        if (gameState.running) {
            gameState.paused = !gameState.paused;
        }
        return;
    }
    
    if (e.key === 'r' || e.key === 'R') {
        if (gameState.running || endScreen.style.display === 'flex') {
            initGame();
        }
        return;
    }
    
    gameState.keys[e.key] = true;
    gameState.keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
        if (!gameState.boostActive) {
            gameState.playerSpeed = 3;
        }
        return;
    }
    
    gameState.keys[e.key] = false;
    gameState.keys[e.code] = false;
});

// Touch controls setup
function setupTouchControl(element, key) {
    element.addEventListener('mousedown', () => gameState.keys[key] = true);
    element.addEventListener('mouseup', () => gameState.keys[key] = false);
    element.addEventListener('mouseleave', () => gameState.keys[key] = false);
    
    element.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.keys[key] = true;
    });
    element.addEventListener('touchend', (e) => {
        e.preventDefault();
        gameState.keys[key] = false;
    });
}

setupTouchControl(upBtn, 'ArrowUp');
setupTouchControl(downBtn, 'ArrowDown');
setupTouchControl(leftBtn, 'ArrowLeft');
setupTouchControl(rightBtn, 'ArrowRight');

boostBtn.addEventListener('mousedown', () => {
    if (gameState.running && !gameState.paused) {
        gameState.playerSpeed = 8;
        gameState.boostActive = true;
        gameState.boostEndTime = Date.now() + 800;
        playSound('boost');
    }
});

boostBtn.addEventListener('mouseup', () => {
    if (!gameState.boostActive) {
        gameState.playerSpeed = 3;
    }
});

pauseBtn.addEventListener('click', () => {
    if (gameState.running) {
        gameState.paused = !gameState.paused;
        pauseBtn.innerHTML = gameState.paused ? 
            '<i class="fas fa-play"></i> RESUME' : 
            '<i class="fas fa-pause"></i> PAUSE';
    }
});

// Prevent context menu
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('contextmenu', e => e.preventDefault());
});

// Initialize UI
updateUI();
drawGame();

// Add click sound to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 300;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio not supported
        }
    });
});
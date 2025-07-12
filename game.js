// Flying Birdie Game - Main Game Engine
class FlyingBirdieGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreText = document.getElementById('scoreText');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.startScreen = document.getElementById('startScreen');
        this.finalScore = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        this.startBtn = document.getElementById('startBtn');
        
        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.gameSpeed = 2;
        this.animationId = null;
        
        // Combo system
        this.combo = 0;
        this.maxCombo = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
        
        // Canvas dimensions
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        this.setupCanvas();
        
        // Bird properties
        this.bird = {
            x: 150,
            y: 300,
            width: 30,
            height: 30,
            velocity: 0,
            gravity: 0.3,
            jumpPower: -6,
            rotation: 0,
            wingPhase: 0,
            trail: []
        };
        
        // Pipes array
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 150;
        this.pipeSpacing = 250;
        this.lastPipeX = 0;
        
        // Ground
        this.groundHeight = 50;
        this.groundY = this.canvasHeight - this.groundHeight;
        
        // Background elements
        this.clouds = [];
        this.mountains = [];
        this.initClouds();
        this.initMountains();
        
        // Visual effects
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        
        // Power-ups system
        this.powerUps = [];
        this.slowMotionActive = false;
        this.slowMotionDuration = 0;
        this.shieldActive = false;
        this.shieldDuration = 0;
        this.doublePointsActive = false;
        this.doublePointsDuration = 0;
        
        // Day/night cycle
        this.timeOfDay = 0; // 0-1 cycle
        this.dayNightSpeed = 0.0003;
        
        // Audio system
        this.sounds = this.initAudioSystem();
        
        // Initialize event listeners
        this.setupEventListeners();
        
        // Start the game loop
        this.gameLoop();
        
        // Show start screen
        this.showStartScreen();
    }
    
    setupCanvas() {
        // Make canvas responsive
        const resizeCanvas = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.canvasWidth = rect.width;
            this.canvasHeight = rect.height;
            this.groundY = this.canvasHeight - this.groundHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    initClouds() {
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * 200 + 50,
                width: Math.random() * 60 + 40,
                height: Math.random() * 30 + 20,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    initMountains() {
        for (let i = 0; i < 3; i++) {
            this.mountains.push({
                x: i * 400,
                y: this.canvasHeight - this.groundHeight - 100,
                width: 500,
                height: 100,
                speed: 0.3
            });
        }
    }
    
    initAudioSystem() {
        // Create Web Audio Context for procedural sound generation
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            return {
                context: audioContext,
                playFlap: () => this.playFlapSound(audioContext),
                playScore: () => this.playScoreSound(audioContext),
                playCollision: () => this.playCollisionSound(audioContext),
                enabled: true
            };
        } catch (e) {
            console.log('Audio not supported');
            return { enabled: false };
        }
    }
    
    playFlapSound(audioContext) {
        if (!this.sounds.enabled) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    playScoreSound(audioContext) {
        if (!this.sounds.enabled) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    playCollisionSound(audioContext) {
        if (!this.sounds.enabled) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault();
                this.flap();
            }
        });
        
        // Mouse controls
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'playing') {
                this.flap();
            }
        });
        
        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.flap();
            }
        });
        
        // Resume audio context on first interaction (browser policy)
        document.addEventListener('click', () => {
            if (this.sounds.context && this.sounds.context.state === 'suspended') {
                this.sounds.context.resume();
            }
        }, { once: true });
        
        // Button controls
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    flap() {
        this.bird.velocity = this.bird.jumpPower;
        this.sounds.playFlap();
        this.addFlapParticles();
    }
    
    startGame() {
        this.gameState = 'playing';
        this.hideStartScreen();
        this.resetGame();
    }
    
    restartGame() {
        this.gameState = 'playing';
        this.hideGameOverScreen();
        this.resetGame();
    }
    
    resetGame() {
        this.score = 0;
        this.updateScore();
        this.bird.y = 300;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.bird.wingPhase = 0;
        this.bird.trail = [];
        this.pipes = [];
        this.lastPipeX = 0;
        this.gameSpeed = 2;
        
        // Reset combo system
        this.combo = 0;
        this.maxCombo = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
        
        // Reset power-ups system
        this.powerUps = [];
        this.slowMotionActive = false;
        this.slowMotionDuration = 0;
        this.shieldActive = false;
        this.shieldDuration = 0;
        this.doublePointsActive = false;
        this.doublePointsDuration = 0;
        this.milestoneShown = false;
        
        // Reset visual effects
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        
        // Reset difficulty
        this.pipeGap = 150;
        this.pipeSpacing = 250;
        
        // Generate initial pipes to fill the screen
        this.generateInitialPipes();
    }
    
    generateInitialPipes() {
        // Generate enough pipes to fill the screen plus some extra
        const pipesNeeded = Math.ceil(this.canvasWidth / this.pipeSpacing) + 2;
        
        for (let i = 0; i < pipesNeeded; i++) {
            this.generatePipe();
        }
    }
    
    updateScore() {
        let scoreDisplay = `Score: ${this.score} | Best: ${this.highScore}`;
        if (this.combo >= 5) {
            scoreDisplay += ` | Combo: ${this.combo}x`;
        }
        this.scoreText.textContent = scoreDisplay;
    }
    
    loadHighScore() {
        const saved = localStorage.getItem('flyingBirdieHighScore');
        return saved ? parseInt(saved) : 0;
    }
    
    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flyingBirdieHighScore', this.highScore.toString());
            return true; // New high score!
        }
        return false;
    }
    
    showStartScreen() {
        this.startScreen.classList.add('show');
    }
    
    hideStartScreen() {
        this.startScreen.classList.remove('show');
    }
    
    showGameOverScreen(isNewHighScore = false) {
        this.finalScore.textContent = this.score;
        
        // Add high score indicator
        const highScoreIndicator = this.gameOverScreen.querySelector('.high-score-indicator');
        if (highScoreIndicator) {
            highScoreIndicator.remove();
        }
        
        if (isNewHighScore) {
            const newHighScoreElement = document.createElement('div');
            newHighScoreElement.className = 'high-score-indicator';
            newHighScoreElement.innerHTML = '🏆 NEW HIGH SCORE! 🏆';
            this.gameOverScreen.querySelector('h2').insertAdjacentElement('afterend', newHighScoreElement);
        }
        
        this.gameOverScreen.classList.add('show');
    }
    
    hideGameOverScreen() {
        this.gameOverScreen.classList.remove('show');
    }
    
    // Visual Effects System
    addFlapParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.bird.x,
                y: this.bird.y + this.bird.height / 2,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * 4 - 2,
                life: 30,
                maxLife: 30,
                color: '#FFD700',
                size: Math.random() * 3 + 1
            });
        }
    }
    
    addScoreParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height / 2,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * 6 - 3,
                life: 60,
                maxLife: 60,
                color: '#00FF00',
                size: Math.random() * 4 + 2
            });
        }
    }
    
    addExplosionParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height / 2,
                vx: Math.random() * 8 - 4,
                vy: Math.random() * 8 - 4,
                life: 120,
                maxLife: 120,
                color: '#FF4500',
                size: Math.random() * 5 + 2
            });
        }
    }
    
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            // Apply gravity to particles
            particle.vy += 0.1;
            
            // Fade out particles
            particle.alpha = particle.life / particle.maxLife;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateScreenShake() {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration--;
            const intensity = this.screenShake.intensity * (this.screenShake.duration / 500);
            this.screenShake.x = (Math.random() - 0.5) * intensity;
            this.screenShake.y = (Math.random() - 0.5) * intensity;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
        }
    }
    
    updateMountains() {
        for (let mountain of this.mountains) {
            const speed = this.slowMotionActive ? mountain.speed * 0.5 : mountain.speed;
            mountain.x -= speed;
            if (mountain.x + mountain.width < 0) {
                mountain.x = this.canvasWidth;
            }
        }
    }
    
    generatePowerUps() {
        // Generate power-ups randomly (roughly every 15-25 points)
        if (Math.random() < 0.002 && this.score > 3) {
            const powerUpTypes = ['slowmo', 'shield', 'doublepoints'];
            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            this.powerUps.push({
                x: this.canvasWidth,
                y: Math.random() * (this.canvasHeight - this.groundHeight - 100) + 50,
                width: 20,
                height: 20,
                type: randomType,
                collected: false,
                pulse: 0
            });
        }
    }
    
    updatePowerUps() {
        // Update slow motion effect
        if (this.slowMotionActive) {
            this.slowMotionDuration--;
            if (this.slowMotionDuration <= 0) {
                this.slowMotionActive = false;
            }
        }
        
        // Update shield effect
        if (this.shieldActive) {
            this.shieldDuration--;
            if (this.shieldDuration <= 0) {
                this.shieldActive = false;
            }
        }
        
        // Update double points effect
        if (this.doublePointsActive) {
            this.doublePointsDuration--;
            if (this.doublePointsDuration <= 0) {
                this.doublePointsActive = false;
            }
        }
        
        // Move power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            const speed = this.slowMotionActive ? this.gameSpeed * 0.5 : this.gameSpeed;
            powerUp.x -= speed;
            powerUp.pulse += 0.1;
            
            // Check collision with bird
            if (!powerUp.collected && 
                this.bird.x < powerUp.x + powerUp.width &&
                this.bird.x + this.bird.width > powerUp.x &&
                this.bird.y < powerUp.y + powerUp.height &&
                this.bird.y + this.bird.height > powerUp.y) {
                
                this.collectPowerUp(powerUp);
                powerUp.collected = true;
            }
            
            // Remove off-screen power-ups
            if (powerUp.x + powerUp.width < 0) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    collectPowerUp(powerUp) {
        if (powerUp.type === 'slowmo') {
            this.slowMotionActive = true;
            this.slowMotionDuration = 300; // 5 seconds at 60fps
            this.addPowerUpParticles(powerUp.x, powerUp.y, '#00FFFF');
        } else if (powerUp.type === 'shield') {
            this.shieldActive = true;
            this.shieldDuration = 600; // 10 seconds at 60fps
            this.addPowerUpParticles(powerUp.x, powerUp.y, '#FFD700');
        } else if (powerUp.type === 'doublepoints') {
            this.doublePointsActive = true;
            this.doublePointsDuration = 450; // 7.5 seconds at 60fps
            this.addPowerUpParticles(powerUp.x, powerUp.y, '#FF69B4');
        }
        
        this.sounds.playScore(); // Use score sound for power-up collection
    }
    
    addPowerUpParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Math.random() * 8 - 4,
                vy: Math.random() * 8 - 4,
                life: 80,
                maxLife: 80,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
    }
    
    addComboParticles() {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height / 2,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * 4 - 2,
                life: 40,
                maxLife: 40,
                color: '#FFD700',
                size: Math.random() * 2 + 1
            });
        }
    }
    
    addShieldBreakParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height / 2,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * 6 - 3,
                life: 60,
                maxLife: 60,
                color: '#FFD700',
                size: Math.random() * 3 + 1
            });
        }
    }
    
    updateComboSystem() {
        // Decrease combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
        } else if (this.combo > 0) {
            // Reset combo if timer runs out
            this.combo = 0;
        }
    }
    
    updateDifficulty() {
        // Milestone-based difficulty increases
        if (this.score >= 10 && this.score < 20) {
            this.pipeGap = Math.max(130, this.pipeGap - 0.1);
        } else if (this.score >= 20 && this.score < 30) {
            this.pipeGap = Math.max(120, this.pipeGap - 0.1);
            this.pipeSpacing = Math.max(200, this.pipeSpacing - 0.2);
        } else if (this.score >= 30) {
            this.pipeGap = Math.max(110, this.pipeGap - 0.05);
            this.pipeSpacing = Math.max(180, this.pipeSpacing - 0.1);
        }
        
        // Visual feedback for milestones
        if (this.score > 0 && this.score % 10 === 0 && !this.milestoneShown) {
            this.addMilestoneEffect();
            this.milestoneShown = true;
        } else if (this.score % 10 !== 0) {
            this.milestoneShown = false;
        }
    }
    
    addMilestoneEffect() {
        // Add celebration particles for milestones
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * this.canvasHeight,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * 6 - 3,
                life: 100,
                maxLife: 100,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update bird physics
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Update bird rotation based on velocity
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 90);
        
        // Update bird animation
        this.bird.wingPhase += 0.3;
        
        // Update bird trail
        this.bird.trail.push({
            x: this.bird.x + this.bird.width/2,
            y: this.bird.y + this.bird.height/2,
            life: 20,
            maxLife: 20
        });
        
        // Clean up old trail points
        this.bird.trail = this.bird.trail.filter(point => {
            point.life--;
            return point.life > 0;
        });
        
        // Generate pipes continuously
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x <= this.canvasWidth - this.pipeSpacing) {
            this.generatePipe();
        }
        
        // Update pipes (with slow motion effect)
        this.updatePipes();
        
        // Update clouds and mountains
        this.updateClouds();
        this.updateMountains();
        
        // Update visual effects
        this.updateParticles();
        this.updateScreenShake();
        
        // Update power-ups
        this.updatePowerUps();
        this.generatePowerUps();
        
        // Update combo timer
        this.updateComboSystem();
        
        // Update day/night cycle
        this.timeOfDay += this.dayNightSpeed;
        if (this.timeOfDay > 1) this.timeOfDay = 0;
        
        // Check collisions
        this.checkCollisions();
        
        // Progressive difficulty system
        this.updateDifficulty();
        
        // Gradually increase game speed
        this.gameSpeed += 0.0005;
    }
    
    generatePipe() {
        // Randomize gap size between 140-180 pixels
        const randomGap = Math.random() * 40 + 140;
        
        // Calculate available space for pipes
        const availableHeight = this.canvasHeight - this.groundHeight;
        const minHeight = 60;
        const maxHeight = availableHeight - randomGap - minHeight;
        
        // Randomize top pipe height
        const topPipeHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        // Add some spacing variation (less variation for initial pipes)
        const spacingVariation = Math.random() * 30 - 15; // -15 to +15 pixels
        let xPosition;
        
        if (this.pipes.length === 0) {
            // First pipe starts off-screen to the right
            xPosition = this.canvasWidth + 100;
        } else {
            // Subsequent pipes are spaced from the last pipe
            xPosition = this.pipes[this.pipes.length - 1].x + this.pipeSpacing + spacingVariation;
        }
        
        // Add some visual variety with random pipe width
        const pipeWidth = this.pipeWidth + Math.random() * 10 - 5; // ±5 pixels variation
        
        this.pipes.push({
            x: xPosition,
            topHeight: topPipeHeight,
            bottomY: topPipeHeight + randomGap,
            bottomHeight: availableHeight - (topPipeHeight + randomGap),
            passed: false,
            gap: randomGap,
            width: pipeWidth
        });
    }
    
    updatePipes() {
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            const speed = this.slowMotionActive ? this.gameSpeed * 0.5 : this.gameSpeed;
            pipe.x -= speed;
            
            const currentPipeWidth = pipe.width || this.pipeWidth;
            
            // Check if bird passed through pipe
            if (!pipe.passed && pipe.x + currentPipeWidth < this.bird.x) {
                pipe.passed = true;
                
                // Update combo system
                this.combo++;
                this.maxCombo = Math.max(this.maxCombo, this.combo);
                this.comboTimer = 180; // 3 seconds at 60fps
                
                // Calculate score with combo multiplier
                const basePoints = this.doublePointsActive ? 2 : 1;
                const comboBonus = Math.floor(this.combo / 5); // Bonus every 5 consecutive passes
                const totalPoints = basePoints + comboBonus;
                
                this.score += totalPoints;
                this.updateScore();
                this.sounds.playScore();
                this.addScoreParticles();
                
                // Add combo particles if combo is active
                if (this.combo >= 5) {
                    this.addComboParticles();
                }
            }
            
            // Remove pipes that are off screen
            if (pipe.x + currentPipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
    }
    
    updateClouds() {
        for (let cloud of this.clouds) {
            const speed = this.slowMotionActive ? cloud.speed * 0.5 : cloud.speed;
            cloud.x -= speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvasWidth;
                cloud.y = Math.random() * 200 + 50;
            }
        }
    }
    
    checkCollisions() {
        // Ground collision
        if (this.bird.y + this.bird.height > this.groundY) {
            if (this.shieldActive) {
                this.bird.y = this.groundY - this.bird.height;
                this.bird.velocity = this.bird.jumpPower;
                this.shieldActive = false;
                this.shieldDuration = 0;
                this.addShieldBreakParticles();
            } else {
                this.gameOver();
                return;
            }
        }
        
        // Ceiling collision
        if (this.bird.y < 0) {
            if (this.shieldActive) {
                this.bird.y = 0;
                this.bird.velocity = 0;
                this.shieldActive = false;
                this.shieldDuration = 0;
                this.addShieldBreakParticles();
            } else {
                this.gameOver();
                return;
            }
        }
        
        // Pipe collision
        for (let pipe of this.pipes) {
            const pipeWidth = pipe.width || this.pipeWidth;
            if (this.bird.x < pipe.x + pipeWidth &&
                this.bird.x + this.bird.width > pipe.x) {
                
                // Check top pipe collision
                if (this.bird.y < pipe.topHeight ||
                    this.bird.y + this.bird.height > pipe.bottomY) {
                    
                    if (this.shieldActive) {
                        // Bounce off with shield
                        this.bird.velocity = this.bird.jumpPower;
                        this.shieldActive = false;
                        this.shieldDuration = 0;
                        this.addShieldBreakParticles();
                    } else {
                        this.gameOver();
                        return;
                    }
                }
            }
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.sounds.playCollision();
        this.addScreenShake(15, 500);
        this.addExplosionParticles();
        
        // Reset combo on collision
        this.combo = 0;
        this.comboTimer = 0;
        
        const isNewHighScore = this.saveHighScore();
        this.showGameOverScreen(isNewHighScore);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Apply screen shake
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        // Draw background gradient with day/night cycle
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        
        // Calculate day/night colors
        const dayIntensity = Math.sin(this.timeOfDay * Math.PI * 2);
        const isDay = dayIntensity > 0;
        
        if (isDay) {
            // Day colors
            const intensity = dayIntensity;
            gradient.addColorStop(0, `rgb(${Math.floor(135 + intensity * 50)}, ${Math.floor(206 + intensity * 25)}, ${Math.floor(235 + intensity * 20)})`);
            gradient.addColorStop(1, `rgb(${Math.floor(152 + intensity * 50)}, ${Math.floor(251 + intensity * 4)}, ${Math.floor(152 + intensity * 50)})`);
        } else {
            // Night colors
            const intensity = -dayIntensity;
            gradient.addColorStop(0, `rgb(${Math.floor(25 + intensity * 50)}, ${Math.floor(25 + intensity * 75)}, ${Math.floor(112 + intensity * 50)})`);
            gradient.addColorStop(1, `rgb(${Math.floor(72 + intensity * 50)}, ${Math.floor(61 + intensity * 75)}, ${Math.floor(139 + intensity * 50)})`);
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw clouds
        this.drawClouds();
        
        // Draw mountains (parallax background)
        this.drawMountains();
        
        // Draw pipes
        this.drawPipes();
        
        // Draw ground
        this.drawGround();
        
        // Draw bird trail
        this.drawBirdTrail();
        
        // Draw bird
        this.drawBird();
        
        // Draw power-ups
        this.drawPowerUps();
        
        // Draw particles
        this.drawParticles();
        
        // Draw power-up effect overlays
        if (this.slowMotionActive) {
            this.drawSlowMotionOverlay();
        }
        if (this.shieldActive) {
            this.drawShieldOverlay();
        }
        if (this.doublePointsActive) {
            this.drawDoublePointsOverlay();
        }
        
        // Restore canvas transform
        this.ctx.restore();
    }
    
    drawParticles() {
        for (let particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha || 1;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawPowerUps() {
        for (let powerUp of this.powerUps) {
            if (powerUp.collected) continue;
            
            this.ctx.save();
            
            // Pulsing effect
            const scale = 1 + Math.sin(powerUp.pulse) * 0.1;
            this.ctx.translate(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2);
            this.ctx.scale(scale, scale);
            
            // Draw power-up based on type
            if (powerUp.type === 'slowmo') {
                // Draw slow motion icon (clock-like)
                this.ctx.fillStyle = '#00FFFF';
                this.ctx.strokeStyle = '#0088CC';
                this.ctx.lineWidth = 2;
                
                // Outer circle
                this.ctx.beginPath();
                this.ctx.arc(0, 0, powerUp.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Clock hands
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(0, -powerUp.width/3);
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(powerUp.width/4, 0);
                this.ctx.stroke();
            } else if (powerUp.type === 'shield') {
                // Draw shield icon
                this.ctx.fillStyle = '#FFD700';
                this.ctx.strokeStyle = '#FFA500';
                this.ctx.lineWidth = 2;
                
                // Shield shape
                this.ctx.beginPath();
                this.ctx.moveTo(0, -powerUp.width/2);
                this.ctx.lineTo(-powerUp.width/3, -powerUp.width/4);
                this.ctx.lineTo(-powerUp.width/3, powerUp.width/4);
                this.ctx.lineTo(0, powerUp.width/2);
                this.ctx.lineTo(powerUp.width/3, powerUp.width/4);
                this.ctx.lineTo(powerUp.width/3, -powerUp.width/4);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            } else if (powerUp.type === 'doublepoints') {
                // Draw double points icon (2x)
                this.ctx.fillStyle = '#FF69B4';
                this.ctx.strokeStyle = '#FF1493';
                this.ctx.lineWidth = 2;
                
                // Outer circle
                this.ctx.beginPath();
                this.ctx.arc(0, 0, powerUp.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // "2x" text
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('2x', 0, 3);
            }
            
            this.ctx.restore();
        }
    }
    
    drawSlowMotionOverlay() {
        // Blue tint overlay
        this.ctx.fillStyle = 'rgba(0, 150, 255, 0.1)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Timer indicator
        const remaining = this.slowMotionDuration / 300;
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.fillRect(10, 10, 200 * remaining, 5);
        this.ctx.strokeStyle = '#0088CC';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 10, 200, 5);
    }
    
    drawShieldOverlay() {
        // Golden glow effect
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Timer indicator
        const remaining = this.shieldDuration / 600;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(10, 20, 200 * remaining, 5);
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 20, 200, 5);
    }
    
    drawDoublePointsOverlay() {
        // Pink glow effect
        this.ctx.fillStyle = 'rgba(255, 105, 180, 0.1)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Timer indicator
        const remaining = this.doublePointsDuration / 450;
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.fillRect(10, 30, 200 * remaining, 5);
        this.ctx.strokeStyle = '#FF1493';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 30, 200, 5);
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let cloud of this.clouds) {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.width/3, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width/3, cloud.y, cloud.width/4, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width/2, cloud.y, cloud.width/3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawMountains() {
        this.ctx.fillStyle = '#6B8E23';
        for (let mountain of this.mountains) {
            this.ctx.beginPath();
            this.ctx.moveTo(mountain.x, mountain.y + mountain.height);
            this.ctx.lineTo(mountain.x + mountain.width/4, mountain.y);
            this.ctx.lineTo(mountain.x + mountain.width/2, mountain.y + mountain.height/2);
            this.ctx.lineTo(mountain.x + 3*mountain.width/4, mountain.y + mountain.height/4);
            this.ctx.lineTo(mountain.x + mountain.width, mountain.y + mountain.height);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Add some depth with darker color
            this.ctx.fillStyle = '#556B2F';
            this.ctx.beginPath();
            this.ctx.moveTo(mountain.x + mountain.width/4, mountain.y);
            this.ctx.lineTo(mountain.x + mountain.width/2, mountain.y + mountain.height/2);
            this.ctx.lineTo(mountain.x + mountain.width/4, mountain.y + mountain.height/2);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.fillStyle = '#6B8E23';
        }
    }
    
    drawPipes() {
        this.ctx.fillStyle = '#228B22';
        this.ctx.strokeStyle = '#006400';
        this.ctx.lineWidth = 2;
        
        for (let pipe of this.pipes) {
            const pipeWidth = pipe.width || this.pipeWidth;
            const capWidth = pipeWidth + 10;
            const capOffset = 5;
            
            // Draw top pipe
            this.ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
            this.ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
            
            // Draw bottom pipe
            this.ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, pipe.bottomHeight);
            this.ctx.strokeRect(pipe.x, pipe.bottomY, pipeWidth, pipe.bottomHeight);
            
            // Draw pipe caps
            this.ctx.fillRect(pipe.x - capOffset, pipe.topHeight - 20, capWidth, 20);
            this.ctx.strokeRect(pipe.x - capOffset, pipe.topHeight - 20, capWidth, 20);
            
            this.ctx.fillRect(pipe.x - capOffset, pipe.bottomY, capWidth, 20);
            this.ctx.strokeRect(pipe.x - capOffset, pipe.bottomY, capWidth, 20);
        }
    }
    
    drawGround() {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.groundY, this.canvasWidth, this.groundHeight);
        
        // Draw grass
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.groundY, this.canvasWidth, 10);
    }
    
    drawBirdTrail() {
        for (let i = 0; i < this.bird.trail.length; i++) {
            const trail = this.bird.trail[i];
            const alpha = trail.life / trail.maxLife;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha * 0.3;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(trail.x, trail.y, 3 * alpha, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawBird() {
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.width/2, this.bird.y + this.bird.height/2);
        this.ctx.rotate(this.bird.rotation * Math.PI / 180);
        
        // Draw shield effect if active
        if (this.shieldActive) {
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.bird.width/2 + 8, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
        
        // Draw bird body
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, this.bird.width/2, this.bird.height/2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw bird outline
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw animated wing based on wing phase
        const wingOffset = Math.sin(this.bird.wingPhase) * 3;
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.beginPath();
        this.ctx.ellipse(-5, wingOffset, 8, 12 - Math.abs(wingOffset), 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw second wing layer for flapping effect
        this.ctx.fillStyle = '#FF6347';
        this.ctx.beginPath();
        this.ctx.ellipse(-3, wingOffset * 0.5, 6, 8 - Math.abs(wingOffset * 0.5), 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw eye
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(3, -5, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(4, -5, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw beak
        this.ctx.fillStyle = '#FF4500';
        this.ctx.beginPath();
        this.ctx.moveTo(12, 0);
        this.ctx.lineTo(18, -2);
        this.ctx.lineTo(18, 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    gameLoop() {
        this.update();
        this.render();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FlyingBirdieGame();
}); 
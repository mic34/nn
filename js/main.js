/**
 * NeuroDraw - Main Application
 * Handles drawing canvas, user interactions, and game logic
 */

const App = {
    // Canvas elements
    drawCanvas: null,
    drawCtx: null,

    // Drawing state
    isDrawing: false,
    lastX: 0,
    lastY: 0,

    // Grid size
    gridSize: 28,
    canvasSize: 280,

    // Drawing settings
    brushSize: 20,
    brushColor: '#ffffff',

    // Last prediction for correction
    lastImageData: null,
    lastPrediction: null,

    // Game State
    gameMode: 'free', // 'free', 'time', 'challenge'
    score: 0,
    streak: 0,
    targetDigit: null,
    timer: 60,
    timerInterval: null,
    isGameActive: false,

    /**
     * Initialize the application
     */
    async init() {
        console.log('NeuroDraw v1.2 initializing...');

        this.setupDrawCanvas();
        this.setupEventListeners();
        this.setupOutputNodes();
        this.initializeNetwork();

        // Show loading status
        this.showMessage('Training neural network...', 5000);

        // Wait for model to be ready
        await this.waitForModel();

        this.showMessage('Ready! Draw a digit', 2000);
        console.log('NeuroDraw ready!');
    },

    /**
     * Wait for neural network model to be loaded
     */
    async waitForModel() {
        return new Promise((resolve) => {
            const checkModel = () => {
                if (NeuralNetwork.isLoaded && !NeuralNetwork.isTraining) {
                    resolve();
                } else {
                    setTimeout(checkModel, 500);
                }
            };
            checkModel();
        });
    },

    /**
     * Setup drawing canvas
     */
    setupDrawCanvas() {
        this.drawCanvas = document.getElementById('drawCanvas');
        if (!this.drawCanvas) {
            console.error('Draw canvas not found');
            return;
        }

        this.drawCtx = this.drawCanvas.getContext('2d', { willReadFrequently: true });

        // Set canvas properties
        this.drawCtx.lineCap = 'round';
        this.drawCtx.lineJoin = 'round';
        this.drawCtx.strokeStyle = this.brushColor;
        this.drawCtx.lineWidth = this.brushSize;

        // Clear to black
        this.clearCanvas();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Drawing events - Mouse
        this.drawCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.drawCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.drawCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.drawCanvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Drawing events - Touch
        this.drawCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.drawCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.drawCanvas.addEventListener('touchend', () => this.stopDrawing());

        // Button events
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearCanvas();
            this.resetPrediction();
            NetworkViz.reset();
        });

        document.getElementById('predictBtn').addEventListener('click', () => {
            this.predict();
        });

        document.getElementById('weightsBtn').addEventListener('click', (e) => {
            const isActive = NetworkViz.toggleWeights();
            e.target.closest('.btn').classList.toggle('active', isActive);
        });

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'c' || e.key === 'C') {
                this.clearCanvas();
                this.resetPrediction();
                NetworkViz.reset();
            }
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.predict();
            }
        });

        // Correction buttons
        document.querySelectorAll('.btn-correct').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const digit = parseInt(e.target.dataset.digit);
                this.handleCorrection(digit);
            });
        });

        // Game Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.setGameMode(mode);

                // Update UI
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    },

    /**
     * Setup output node display
     */
    setupOutputNodes() {
        const container = document.getElementById('outputLayer');
        container.innerHTML = '';

        for (let i = 0; i < 10; i++) {
            const node = document.createElement('div');
            node.className = 'output-node';
            node.id = `output-${i}`;
            node.innerHTML = `
                <span class="digit">${i}</span>
                <span class="prob">-</span>
            `;
            container.appendChild(node);
        }
    },

    /**
     * Initialize neural network visualization
     */
    initializeNetwork() {
        NetworkViz.init('networkCanvas');
    },

    /**
     * Set Game Mode
     */
    setGameMode(mode) {
        this.gameMode = mode;
        this.resetGame();

        const timerStat = document.getElementById('timerStat');
        const challengePrompt = document.getElementById('challengePrompt');

        // UI updates based on mode
        if (mode === 'time') {
            timerStat.style.display = 'flex';
            challengePrompt.style.display = 'block';
            this.startTimer();
            this.nextChallenge();
        } else if (mode === 'challenge') {
            timerStat.style.display = 'none';
            challengePrompt.style.display = 'block';
            this.nextChallenge();
        } else {
            timerStat.style.display = 'none';
            challengePrompt.style.display = 'none';
            this.targetDigit = null;
        }

        this.showMessage(`Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    },

    /**
     * Reset Game State
     */
    resetGame() {
        this.score = 0;
        this.streak = 0;
        this.timer = 60;
        this.isGameActive = true;
        this.updateStats();

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    },

    /**
     * Start Timer for Time Attack
     */
    startTimer() {
        this.timer = 60;
        document.getElementById('timerValue').textContent = '60s';

        this.timerInterval = setInterval(() => {
            this.timer--;
            document.getElementById('timerValue').textContent = `${this.timer}s`;

            if (this.timer <= 0) {
                this.endGame();
            }
        }, 1000);
    },

    /**
     * End Game
     */
    endGame() {
        clearInterval(this.timerInterval);
        this.isGameActive = false;
        this.showMessage(`Game Over! Score: ${this.score}`);

        // Reset to free mode after delay
        setTimeout(() => {
            document.querySelector('[data-mode="free"]').click();
        }, 3000);
    },

    /**
     * Set next challenge digit
     */
    nextChallenge() {
        this.targetDigit = Math.floor(Math.random() * 10);
        const targetEl = document.getElementById('targetDigit');
        targetEl.textContent = this.targetDigit;

        // Animation
        targetEl.style.transform = 'scale(1.5)';
        setTimeout(() => targetEl.style.transform = 'scale(1)', 200);
    },

    /**
     * Update Score and Streak UI
     */
    updateStats() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('streakValue').textContent = this.streak;
    },

    /**
     * Get position relative to canvas
     */
    getPosition(e) {
        const rect = this.drawCanvas.getBoundingClientRect();
        const scaleX = this.drawCanvas.width / rect.width;
        const scaleY = this.drawCanvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    },

    /**
     * Start drawing
     */
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getPosition(e);
        this.lastX = pos.x;
        this.lastY = pos.y;

        // Draw a dot for single clicks
        this.drawCtx.beginPath();
        this.drawCtx.arc(pos.x, pos.y, this.brushSize / 2, 0, Math.PI * 2);
        this.drawCtx.fillStyle = this.brushColor;
        this.drawCtx.fill();
    },

    /**
     * Continue drawing
     */
    draw(e) {
        if (!this.isDrawing) return;

        const pos = this.getPosition(e);

        this.drawCtx.beginPath();
        this.drawCtx.moveTo(this.lastX, this.lastY);
        this.drawCtx.lineTo(pos.x, pos.y);
        this.drawCtx.stroke();

        // Also draw circles for smoother lines
        this.drawCtx.beginPath();
        this.drawCtx.arc(pos.x, pos.y, this.brushSize / 2, 0, Math.PI * 2);
        this.drawCtx.fillStyle = this.brushColor;
        this.drawCtx.fill();

        this.lastX = pos.x;
        this.lastY = pos.y;
    },

    /**
     * Stop drawing
     */
    stopDrawing() {
        this.isDrawing = false;
    },

    /**
     * Clear the drawing canvas
     */
    clearCanvas() {
        this.drawCtx.fillStyle = '#000000';
        this.drawCtx.fillRect(0, 0, this.canvasSize, this.canvasSize);
    },

    /**
     * Get canvas data as 28x28 grayscale array
     */
    getImageData() {
        // Get full resolution image data
        const imageData = this.drawCtx.getImageData(0, 0, this.canvasSize, this.canvasSize);
        const data = imageData.data;

        // Downsample to 28x28
        const cellSize = this.canvasSize / this.gridSize;
        const result = new Float32Array(this.gridSize * this.gridSize);

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                let sum = 0;
                let count = 0;

                // Average pixels in this cell
                const startX = Math.floor(x * cellSize);
                const startY = Math.floor(y * cellSize);
                const endX = Math.floor((x + 1) * cellSize);
                const endY = Math.floor((y + 1) * cellSize);

                for (let py = startY; py < endY; py++) {
                    for (let px = startX; px < endX; px++) {
                        const idx = (py * this.canvasSize + px) * 4;
                        // Use red channel (grayscale)
                        sum += data[idx];
                        count++;
                    }
                }

                // Normalize to 0-1
                result[y * this.gridSize + x] = (sum / count) / 255;
            }
        }

        return result;
    },

    /**
     * Run prediction
     */
    predict() {
        const imageData = this.getImageData();
        this.lastImageData = imageData; // Store for correction

        // Check if canvas is empty
        const hasContent = imageData.some(v => v > 0.1);
        if (!hasContent) {
            this.showMessage('Draw something first!');
            return;
        }

        // Run neural network prediction
        const result = NeuralNetwork.predict(imageData);

        // Update UI
        this.updatePrediction(result);

        // Handle Game Logic
        this.handleGameLogic(result.prediction);

        // Animate network visualization
        NetworkViz.animate(result.activations, 800);
    },

    /**
     * Handle Game Logic (Scoring, etc.)
     */
    handleGameLogic(prediction) {
        if (this.gameMode === 'free') return;

        if (this.targetDigit !== null) {
            if (prediction === this.targetDigit) {
                // Correct!
                this.score += 10 + (this.streak * 2);
                this.streak++;
                this.showMessage('Correct! +Points');

                // Auto-clear and next challenge after delay
                setTimeout(() => {
                    this.clearCanvas();
                    this.resetPrediction();
                    NetworkViz.reset();
                    this.nextChallenge();
                }, 1500);
            } else {
                // Wrong
                this.streak = 0;
                this.showMessage('Try again!');
            }
            this.updateStats();
        }
    },

    /**
     * Update prediction display
     */
    updatePrediction(result) {
        const { prediction, confidence, probabilities } = result;

        // Update main prediction
        const predictionDisplay = document.getElementById('predictionDisplay');
        const predictionValue = document.getElementById('predictionValue');
        const predictionConfidence = document.getElementById('predictionConfidence');

        predictionDisplay.classList.add('active');
        predictionValue.textContent = prediction;
        predictionConfidence.textContent = `${(confidence * 100).toFixed(1)}% confidence`;

        // Show correction panel (only in free mode)
        if (this.gameMode === 'free') {
            document.getElementById('correctionPanel').style.display = 'block';
        } else {
            document.getElementById('correctionPanel').style.display = 'none';
        }

        // Store for correction
        this.lastPrediction = prediction;

        // Add animation
        predictionValue.style.transform = 'scale(1.2)';
        setTimeout(() => {
            predictionValue.style.transform = 'scale(1)';
        }, 200);

        // Update output nodes
        this.updateOutputNodes(probabilities, prediction);
    },

    /**
     * Update output nodes with probabilities
     */
    updateOutputNodes(probabilities, prediction) {
        probabilities.forEach((prob, idx) => {
            const node = document.getElementById(`output-${idx}`);
            const probSpan = node.querySelector('.prob');

            // Update probability display
            probSpan.textContent = `${(prob * 100).toFixed(0)}%`;

            // Update visual state
            node.classList.toggle('active', idx === prediction);

            // Update bar height (pseudo-element)
            node.style.setProperty('--prob-height', `${prob * 100}%`);

            // Update the ::before pseudo-element height via style
            const beforeStyle = node.querySelector('::before');
            node.style.cssText = `--prob: ${prob * 100}%`;
        });

        // Add CSS for probability bar
        const style = document.createElement('style');
        style.textContent = `
            .output-node::before {
                height: var(--prob, 0%) !important;
            }
        `;

        // Remove old dynamic styles
        const oldStyle = document.getElementById('dynamic-prob-style');
        if (oldStyle) oldStyle.remove();

        style.id = 'dynamic-prob-style';
        document.head.appendChild(style);
    },

    /**
     * Reset prediction display
     */
    resetPrediction() {
        const predictionDisplay = document.getElementById('predictionDisplay');
        const predictionValue = document.getElementById('predictionValue');
        const predictionConfidence = document.getElementById('predictionConfidence');

        predictionDisplay.classList.remove('active');
        predictionValue.textContent = '?';
        predictionConfidence.textContent = 'Draw a digit to start';

        // Hide correction panel
        document.getElementById('correctionPanel').style.display = 'none';

        // Reset output nodes
        for (let i = 0; i < 10; i++) {
            const node = document.getElementById(`output-${i}`);
            node.classList.remove('active');
            node.querySelector('.prob').textContent = '-';
            node.style.cssText = '--prob: 0%';
        }
    },

    /**
     * Handle user correction
     */
    async handleCorrection(correctDigit) {
        if (!this.lastImageData) return;

        this.showMessage(`Learning that this is a ${correctDigit}...`);

        // Train on the corrected example
        await NeuralNetwork.trainOnExample(this.lastImageData, correctDigit);

        this.showMessage('Learned! Try drawing it again.');

        // Hide correction panel
        document.getElementById('correctionPanel').style.display = 'none';
    },

    /**
     * Show temporary message
     */
    showMessage(text, duration = 2000) {
        const predictionConfidence = document.getElementById('predictionConfidence');
        const original = predictionConfidence.textContent;

        predictionConfidence.textContent = text;
        predictionConfidence.style.color = '#f59e0b';

        setTimeout(() => {
            // Only reset if text hasn't changed again
            if (predictionConfidence.textContent === text) {
                predictionConfidence.textContent = original;
                predictionConfidence.style.color = '';
            }
        }, duration);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

/**
 * NeuroDraw - Network Visualization
 * Renders animated neural network graph with activations
 */

const NetworkViz = {
    canvas: null,
    ctx: null,
    showWeights: false,
    animationFrame: null,

    // Layout configuration
    layout: {
        padding: 40,
        layerGap: 0,
        nodeRadius: {
            input: 2,
            hidden: 8,
            output: 14
        }
    },

    // Colors
    colors: {
        input: '#3b82f6',
        hidden: '#8b5cf6',
        output: '#10b981',
        connection: 'rgba(255, 255, 255, 0.05)',
        connectionActive: 'rgba(139, 92, 246, 0.3)',
        positive: '#10b981',
        negative: '#ef4444'
    },

    // Node positions cache
    nodes: {
        input: [],
        hidden: [],
        output: []
    },

    /**
     * Initialize the visualization
     */
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Network canvas not found');
            return this;
        }

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.calculateLayout();
        this.render();

        // Handle resize
        window.addEventListener('resize', () => {
            this.resize();
            this.calculateLayout();
            this.render();
        });

        console.log('Network Visualization initialized');
        return this;
    },

    /**
     * Resize canvas to match display size
     */
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;
    },

    /**
     * Calculate node positions for each layer
     */
    calculateLayout() {
        const { padding } = this.layout;
        const w = this.width;
        const h = this.height;

        // Layer X positions
        const layerX = [
            padding + 30,                    // Input
            w / 2,                           // Hidden
            w - padding - 30                 // Output
        ];

        // Input layer - 28x28 grid representation (show subset)
        const inputGridSize = 14; // Show 14x14 subset for visualization
        const inputSpacing = Math.min((h - padding * 2) / inputGridSize, 10);
        const inputStartY = (h - inputSpacing * inputGridSize) / 2;

        this.nodes.input = [];
        for (let y = 0; y < inputGridSize; y++) {
            for (let x = 0; x < inputGridSize; x++) {
                this.nodes.input.push({
                    x: layerX[0] + x * inputSpacing - (inputGridSize * inputSpacing) / 2 + 50,
                    y: inputStartY + y * inputSpacing + inputSpacing / 2,
                    originalIndex: y * 2 * 28 + x * 2 // Map to original 28x28
                });
            }
        }

        // Hidden layer - 64 nodes in 8x8 grid
        const hiddenGridSize = 8;
        const hiddenSpacing = Math.min((h - padding * 2) / hiddenGridSize, 25);
        const hiddenStartY = (h - hiddenSpacing * hiddenGridSize) / 2;

        this.nodes.hidden = [];
        for (let y = 0; y < hiddenGridSize; y++) {
            for (let x = 0; x < hiddenGridSize; x++) {
                this.nodes.hidden.push({
                    x: layerX[1] + (x - hiddenGridSize / 2 + 0.5) * hiddenSpacing,
                    y: hiddenStartY + y * hiddenSpacing + hiddenSpacing / 2,
                    index: y * hiddenGridSize + x
                });
            }
        }

        // Output layer - 10 nodes vertical
        const outputSpacing = (h - padding * 2) / 10;
        const outputStartY = padding + outputSpacing / 2;

        this.nodes.output = [];
        for (let i = 0; i < 10; i++) {
            this.nodes.output.push({
                x: layerX[2],
                y: outputStartY + i * outputSpacing,
                digit: i
            });
        }
    },

    /**
     * Render the network
     */
    render(activations = null) {
        const ctx = this.ctx;

        // Clear canvas
        ctx.clearRect(0, 0, this.width, this.height);

        // Draw connections if weights are shown
        if (this.showWeights) {
            this.drawConnections(activations);
        }

        // Draw nodes
        this.drawInputLayer(activations);
        this.drawHiddenLayer(activations);
        this.drawOutputLayer(activations);

        // Draw layer labels
        this.drawLabels();
    },

    /**
     * Draw connections between layers
     */
    drawConnections(activations) {
        const ctx = this.ctx;
        const weights = NeuralNetwork.getWeights();

        // Only draw a subset of connections for performance
        // Hidden to Output connections
        this.nodes.hidden.forEach((hNode, hIdx) => {
            if (hIdx % 4 !== 0) return; // Draw every 4th

            this.nodes.output.forEach((oNode, oIdx) => {
                const weight = weights.hiddenOutput[oIdx * 64 + hIdx];
                const activation = activations?.hidden?.[hIdx] || 0;

                ctx.beginPath();
                ctx.moveTo(hNode.x, hNode.y);
                ctx.lineTo(oNode.x, oNode.y);

                const alpha = Math.min(Math.abs(weight) * activation * 0.5, 0.4);
                ctx.strokeStyle = weight > 0
                    ? `rgba(16, 185, 129, ${alpha})`
                    : `rgba(239, 68, 68, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        });
    },

    /**
     * Draw input layer nodes
     */
    drawInputLayer(activations) {
        const ctx = this.ctx;
        const radius = this.layout.nodeRadius.input;

        this.nodes.input.forEach((node, idx) => {
            const activation = activations?.input?.[node.originalIndex] || 0;

            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + activation * 2, 0, Math.PI * 2);

            const alpha = 0.3 + activation * 0.7;
            ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.fill();
        });
    },

    /**
     * Draw hidden layer nodes
     */
    drawHiddenLayer(activations) {
        const ctx = this.ctx;
        const radius = this.layout.nodeRadius.hidden;

        this.nodes.hidden.forEach((node, idx) => {
            const activation = activations?.hidden?.[idx] || 0;
            const normalizedAct = Math.min(activation / 5, 1); // Normalize

            // Glow effect for active nodes
            if (normalizedAct > 0.1) {
                const gradient = ctx.createRadialGradient(
                    node.x, node.y, 0,
                    node.x, node.y, radius * 2
                );
                gradient.addColorStop(0, `rgba(139, 92, 246, ${normalizedAct * 0.5})`);
                gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

                ctx.beginPath();
                ctx.arc(node.x, node.y, radius * 2, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            // Node
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius * (0.5 + normalizedAct * 0.5), 0, Math.PI * 2);

            const alpha = 0.4 + normalizedAct * 0.6;
            ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.fill();

            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha + 0.2})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    },

    /**
     * Draw output layer nodes
     */
    drawOutputLayer(activations) {
        const ctx = this.ctx;
        const radius = this.layout.nodeRadius.output;

        // Find max activation for highlighting
        let maxIdx = 0;
        let maxVal = 0;
        if (activations?.output) {
            activations.output.forEach((val, idx) => {
                if (val > maxVal) {
                    maxVal = val;
                    maxIdx = idx;
                }
            });
        }

        this.nodes.output.forEach((node, idx) => {
            const prob = activations?.output?.[idx] || 0.1;
            const isMax = idx === maxIdx && maxVal > 0.2;

            // Glow for winning node
            if (isMax) {
                const gradient = ctx.createRadialGradient(
                    node.x, node.y, 0,
                    node.x, node.y, radius * 2.5
                );
                gradient.addColorStop(0, `rgba(16, 185, 129, 0.6)`);
                gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

                ctx.beginPath();
                ctx.arc(node.x, node.y, radius * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            // Node background
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

            const bgAlpha = isMax ? 0.9 : 0.3 + prob * 0.5;
            ctx.fillStyle = isMax
                ? `rgba(16, 185, 129, ${bgAlpha})`
                : `rgba(16, 185, 129, ${bgAlpha})`;
            ctx.fill();

            ctx.strokeStyle = isMax
                ? 'rgba(16, 185, 129, 1)'
                : 'rgba(16, 185, 129, 0.5)';
            ctx.lineWidth = isMax ? 2 : 1;
            ctx.stroke();

            // Digit label
            ctx.font = `${isMax ? 'bold ' : ''}${radius * 0.9}px Inter, sans-serif`;
            ctx.fillStyle = isMax ? '#ffffff' : 'rgba(255, 255, 255, 0.8)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.digit.toString(), node.x, node.y);
        });
    },

    /**
     * Draw layer labels
     */
    drawLabels() {
        const ctx = this.ctx;
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'center';

        // Input label
        if (this.nodes.input.length > 0) {
            const inputCenter = this.nodes.input.reduce((sum, n) => sum + n.x, 0) / this.nodes.input.length;
            ctx.fillText('Input (784)', inputCenter, this.height - 10);
        }

        // Hidden label
        if (this.nodes.hidden.length > 0) {
            const hiddenCenter = this.nodes.hidden.reduce((sum, n) => sum + n.x, 0) / this.nodes.hidden.length;
            ctx.fillText('Hidden (64)', hiddenCenter, this.height - 10);
        }

        // Output label
        if (this.nodes.output.length > 0) {
            ctx.fillText('Output', this.nodes.output[0].x, this.height - 10);
        }
    },

    /**
     * Animate prediction flow
     */
    animate(activations, duration = 1000) {
        const startTime = performance.now();

        const animationLoop = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease function
            const ease = t => t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;

            const easedProgress = ease(progress);

            // Interpolate activations
            const animatedActivations = {
                input: activations.input.map(v => v * easedProgress),
                hidden: activations.hidden.map(v => v * easedProgress),
                output: activations.output.map(v => v * easedProgress)
            };

            this.render(animatedActivations);

            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animationLoop);
            } else {
                this.render(activations);
            }
        };

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.animationFrame = requestAnimationFrame(animationLoop);
    },

    /**
     * Toggle weight visualization
     */
    toggleWeights() {
        this.showWeights = !this.showWeights;
        this.render(NeuralNetwork.getActivations());
        return this.showWeights;
    },

    /**
     * Reset visualization
     */
    reset() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.render();
    }
};

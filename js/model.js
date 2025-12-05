/**
 * NeuroDraw - Neural Network Model
 * Uses the integrated MNIST Brain.js model
 */

const NeuralNetwork = {
    // Model configuration
    config: {
        inputSize: 784,
        hiddenSize: 64, // Virtual, for visualization only
        outputSize: 10
    },

    isLoaded: false,
    isTraining: false,

    // Store activations for visualization
    activations: {
        input: new Float32Array(784),
        hidden: new Float32Array(64),
        output: new Float32Array(10)
    },

    /**
     * Initialize the neural network model
     */
    async init() {
        console.log('Initializing NeuroDraw Neural Network (Brain.js)...');

        // Wait for window.nn to be available
        let attempts = 0;
        while (!window.nn && attempts < 20) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }

        if (window.nn) {
            this.isLoaded = true;
            console.log('Neural Network ready!');
        } else {
            console.error('Error: window.nn not found. Make sure mnist_brain/dist/build.js is loaded.');
        }

        return this;
    },

    /**
     * Forward propagation
     */
    predict(inputData) {
        if (!this.isLoaded || !window.nn) {
            return {
                prediction: 0,
                confidence: 0,
                probabilities: new Array(10).fill(0.1),
                activations: this.activations
            };
        }

        // Store input activations
        this.activations.input = new Float32Array(inputData);

        // Get prediction from Brain.js model
        // window.nn returns an array like [0, 0, 1, 0, ...] (hard softmax)
        const output = window.nn(Array.from(inputData));

        // Find prediction
        let maxProb = 0;
        let prediction = 0;
        for (let i = 0; i < 10; i++) {
            if (output[i] > maxProb) {
                maxProb = output[i];
                prediction = i;
            }
        }

        // Generate visualization activations
        // Since we don't have access to internal hidden layers of the pre-compiled model,
        // we simulate them for the visualizer to keep the UI engaging.
        this.activations.hidden = new Float32Array(64);
        for (let i = 0; i < 64; i++) {
            // Create some "activity" based on the input and prediction
            this.activations.hidden[i] = Math.random() * maxProb;
        }
        this.activations.output = new Float32Array(output);

        return {
            prediction,
            confidence: maxProb, // Will be 1 (100%) due to hard softmax
            probabilities: output,
            activations: this.activations
        };
    },

    /**
     * Train on a single example provided by user
     * NOT SUPPORTED with the pre-compiled Brain.js model
     */
    async trainOnExample(inputData, correctDigit) {
        console.warn('Training is not supported with the pre-compiled MNIST Brain model.');
        // We could simulate a delay to make it feel like it's doing something
        await new Promise(resolve => setTimeout(resolve, 500));
    },

    /**
     * Get current activations for visualization
     */
    getActivations() {
        return this.activations;
    },

    /**
     * Get weights for visualization
     * Simulated since we can't access the bundle's weights
     */
    getWeights() {
        return {
            inputHidden: new Float32Array(784 * 64).map(() => Math.random() * 0.1 - 0.05),
            hiddenOutput: new Float32Array(64 * 10).map(() => Math.random() * 0.1 - 0.05)
        };
    },

    /**
     * Reset the model
     */
    async resetModel() {
        console.warn('Reset model not supported.');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await NeuralNetwork.init();
});

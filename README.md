# 🎮 Game Design Document

## **NeuroDraw — Interactive Neural Network Digit Recognizer**

**Version:** 1.0
**Author:** Senior Game Developer (20+ yrs experience)
**Project Type:** Educational HTML5 Game / Neural Network Visualization

---

# 1. High-Level Overview

## **1.1 Game Title**

**NeuroDraw**

## **1.2 Genre**

* Educational / Simulation
* Light Puzzle / Toy Sandbox
* Technical Visualization

## **1.3 Target Platform**

* Web Browser (Desktop + Mobile)

  * HTML5 Canvas
  * JavaScript
  * Optional: TensorFlow.js

No installation. Runs directly in browser.

## **1.4 Core Concept**

NeuroDraw is an interactive experience where the player **draws a handwritten digit**, and then visually observes how a neural network processes that drawing in real time.

The game combines:

* Accessible drawing gameplay
* A playful visual representation of neural network inference
* Real machine learning under the hood
* Instant feedback loop: Draw → It Thinks → Prediction

The learning goal is **intuitive exposure** to ML concepts rather than formal education.

## **1.5 Elevator Pitch**

> “Draw a number, watch the neural network think.”
> A minimalist ML toy that makes AI inference visible, playful, and surprising.

---

# 2. Gameplay and Core Loop

## **2.1 Player Actions**

Primary input: **Freehand draw** on a 28×28 pixel grid (MNIST-style).
Pixels are mapped to grayscale intensity.

Buttons:

* **Clear**: Reset canvas
* **Predict**: Execute inference + animate network
* **Show Weights**: Toggle weight visualization

## **2.2 Game Loop**

1. Draw a digit
2. Press **Predict**
3. Network layers animate activations
4. Output layer displays model’s guess
5. Optional score systems track accuracy

Loop duration: ~5–8 seconds.

---

# 3. Neural Network Presentation

## **3.1 Architecture**

A standard MNIST classifier:

* **Input Layer:** 784 nodes (28×28)
* **Hidden Layer:** 64 nodes (Dense ReLU)
* **Output Layer:** 10 nodes (Softmax for digits 0–9)

(This can be later extended to 0–1000 with wider output.)

## **3.2 Visualization Flow**

When **Predict** is pressed:

1. **Input Layer Activates**

   * Each input node intensity matches pixel value
   * Subtle glow animation

2. **Weight Connections Animate**

   * Lines pulse with alpha proportional to weight value
   * Gradient coloring (positive/negative) optional

3. **Hidden Layer Activates**

   * Circular nodes expand/contract based on activation value

4. **Output Layer Pulses**

   * Highest probability highlighted
   * Others scale down

## **3.3 Prediction Result**

UI displays:

* **Largest output score**
* Ex: “Predicted: 6 (92%)”
* Optional: bar chart of all outputs

---

# 4. Game Goals and Progression

## **4.1 Educational Design**

This is a **non-competitive, exploratory toy**.
There is no “win/lose” condition by default.

Player motivation is:

* Curiosity (“Why did it guess 3?”)
* Experimentation (“What if I draw weird shapes?”)
* Learning (“So hidden layers transform features…”)

## **4.2 Optional Gamified Extensions**

To increase replay value:

* **Accuracy Tracking**
  Player draws ~10 digits. Tracks % correct.

* **Streak Counter**
  Keep a chain of correct predictions.

* **Time Attack Mode**
  60 seconds to draw as many digits as possible.

* **Guided Levels**
  “Draw a 4”, “Draw a 2”, etc.

These modes are optional add-ons, gated behind “Play Mode” vs “Learn Mode.”

---

# 5. User Interface Design

## **5.1 Layout**

**Top Section:**

* Title
* Output layer visualization (0–9)
* Highlighted prediction

**Center Section:**

* Neural network visualization panel

  * Input → Hidden → Output
  * Animated SVG or Canvas lines

**Bottom Section:**

* 28×28 drawing canvas
* Buttons: Clear / Predict / Toggle Weights

## **5.2 Visual Style**

* Clean, modern, technical aesthetic
* No clutter; focus on the network
* Muted background, bright activations
* Animations feel “alive” without distraction

---

# 6. Technical Architecture

## **6.1 Tech Stack**

* **HTML5 Canvas** for drawing & grid render
* **JavaScript** (ES6) for UI logic
* **TensorFlow.js** (optional) for model prediction
* **SVG/Canvas** for graph visualization

## **6.2 File Structure**

```
/index.html
/css/style.css
/js/main.js
/js/network.js
/model/model.json
/model/weights.bin
```

## **6.3 Performance Considerations**

* Prefer batch redraws over per-frame node updates
* Animation decoupled from inference
* Scaling grid for mobile touch accuracy
* Low memory footprint (under 2MB model)

---

# 7. Core Code (Minimal Example)

HTML:

```html
<canvas id="draw"></canvas>
<button id="clear">Clear</button>
<button id="predict">Predict</button>
<div id="output"></div>
<canvas id="network"></canvas>
```

JavaScript:

```javascript
async function loadModel() {
  model = await tf.loadLayersModel('model/model.json');
}

function predictDigit(data28x28) {
  const input = tf.tensor(data28x28).reshape([1, 28, 28, 1]);
  const output = model.predict(input);
  return output.arraySync()[0];
}
```

Canvas Event Handling:

```javascript
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
```

---

# 8. Visualization Details

## **8.1 Node Rendering**

* Circles drawn with radius proportional to activation
* Node color LERPed between low/high activation

## **8.2 Weight Rendering**

* Lines drawn with alpha = abs(weight)
* Optional color: green=positive, red=negative

Implementation sample:

```javascript
ctx.globalAlpha = activationValue;
```

---

# 9. Development Roadmap

## **Phase 1 — Core MVP**

* Draw grid implementation
* Capture 28×28 grayscale bitmap
* Load pre-trained model
* Run inference
* Display text result

## **Phase 2 — Visualization Layer**

* Render node graph
* Animate weight lines
* Basic activation transitions

## **Phase 3 — Game Mechanics**

* Scoring modes
* Accuracy tracking
* Timer mode / streak modes
* UI polish

## **Phase 4 — Advanced Learning Tools**

* Heatmap of input activation
* Feature visualization
* Backpropagation animation (educational)

---

# 10. Optional Advanced Features

* **Heatmap Overlay**
  Display important pixels the model used.

* **Backpropagation Simulation**
  Reverse-visualize how corrections move.

* **Difficulty Modes**
  Force sloppy handwriting → encourage clarity.

* **Multiplayer Challenge**
  Who gets more correct predictions in 60 seconds?

* **Model Training Sandbox**
  Player can re-train a tiny model with their drawings.

---

# 11. Production and Scope Notes

From a senior developer standpoint:

* MVP is achievable in **2–4 weeks** with one engineer.
* Visualization complexity is the largest risk area.
* TensorFlow.js integration is straightforward.
* Cross-device drawing consistency is essential UX work.
* Educational polish (tooltips, explanations) greatly improves value.

---

# 12. Final Summary

NeuroDraw is a **lightweight, approachable, and visually compelling** ML game where the player sees machine learning inference unfold as a playful animated neural network. It makes an abstract concept tangible.

This is not meant to teach deep ML theory — instead, it builds **intuitive understanding** through experimentation and feedback.

> “Draw your imagination, and watch the AI try to understand you.”

---
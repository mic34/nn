# mnist_brain

Recognizing handwritten digits from the MNIST dataset with Brain.js. Neural Networks example.

A pre-trained model is already included in the repository and saved in the file **./data/mnistTrain.json**. It was created using the **train.js** script. You do not need to repeat this step.

Open the **nnTest.html** page in your browser (the example will work if your browser supports the **canvas** HTML tag).

### Prepare

If you want to train the neural network with your own settings, you will need to modify the data for the MNIST digits library.
By default, it loads only 10,000 records from the training set. You can load all **60,000** using the [mnist_dl](https://github.com/ApelSYN/mnist_dl) package.

```javascript
net.train(trainingSet,
    {
        errorThresh: 0.001,  // error threshold to reach
        iterations: 20000,   // maximum training iterations
        log: true,           // console.log() progress periodically
        logPeriod: 1,        // number of iterations between logging
        learningRate: 0.3    // learning rate
    }
```

You can slightly reduce the learning rate and provide more examples in the trainingSet. Be prepared for the system to train for hours or even days.


function lowPassFilterCanvas(canvas, threshold) {
    let context = canvas.getContext('2d');
    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
        if (brightness > threshold) {
            data[i]     = 0; // red
            data[i + 1] = 0; // green
            data[i + 2] = 0; // blue
        }
    }

    context.putImageData(imageData, 0, 0);
}

function cloneCanvas(oldCanvas) {
    // Create a new canvas element
    let newCanvas = document.createElement('canvas');
    let context = newCanvas.getContext('2d');

    // Set the dimensions of the new canvas
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    // Draw the old canvas onto the new one
    context.drawImage(oldCanvas, 0, 0);

    // Return the new canvas
    return newCanvas;
}

function prepareCanvasForEdgeDetection(canvas) {
    let context = canvas.getContext('2d');
    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i]     = avg; // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
    }

    // Apply edge detection (simple Sobel operator)
    let sobelData = Sobel(imageData);
    context.putImageData(sobelData, 0, 0);
}

function Sobel(imageData) {
    let width = imageData.width;
    let height = imageData.height;
    let data = imageData.data;

    let sobelData = [];
    let grayscaleData = [];

    function bindPixelAt(data) {
        return function(x, y, i) {
            i = i || 0;
            if (x >= 0 && x < width && y >= 0 && y < height) {
                return data[((width * y) + x) * 4 + i];
            } else {
                return 0;
            }
        };
    }

    let dataAt = bindPixelAt(data);
    let xGradient, yGradient;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            xGradient = dataAt(x - 1, y - 1) +
                        2 * dataAt(x - 1, y) +
                        dataAt(x - 1, y + 1) -
                        dataAt(x + 1, y - 1) -
                        2 * dataAt(x + 1, y) -
                        dataAt(x + 1, y + 1);

            yGradient = dataAt(x - 1, y - 1) +
                        2 * dataAt(x, y - 1) +
                        dataAt(x + 1, y - 1) -
                        dataAt(x - 1, y + 1) -
                        2 * dataAt(x, y + 1) -
                        dataAt(x + 1, y + 1);

            sobelData.push(Math.sqrt(xGradient * xGradient + yGradient * yGradient));
        }
    }

    // Normalize to values between 0 and 255
    let max = Math.max(...sobelData);
    sobelData = sobelData.map(value => Math.floor((value / max) * 255));

    // Map sobelData back into imageData
    for (let i = 0; i < sobelData.length; i++) {
        grayscaleData[i * 4]     = sobelData[i]; // red
        grayscaleData[i * 4 + 1] = sobelData[i]; // green
        grayscaleData[i * 4 + 2] = sobelData[i]; // blue
        grayscaleData[i * 4 + 3] = 255; // alpha
    }

    imageData.data.set(grayscaleData);

    return imageData;
}


function gridDetect(){
    //The idea here is to use a hough transform representing an entire grid, to match the scale of the minimap with the scale of the atlas.
    
    //Accumulator should be 2d, param 2 being scale and param 1 being shift%
    
    /*
    Create a javascript function called HoughGrid that takes a canvas. Create a 2d accumulator of size ShiftPercentResolution and MaxScale. Initialise these values to 100 each. For every white pixel in the canvas, pass it to a function called registerVote which takes the 2d accumulator as a parameter. Inside registerVote, loop over the Scale and in a subloop, loop over ShiftPercent. Initialise a variable called Shift that is calculated from ShiftPercent where 100% is the value of Scale. Pass the pixel as a struct containing it's position, the Scale and the Shift to a function called CalculateFitness. Increase the value of the accumulator by the return value of CalculateFitness. End the program by normalizing the accumulator to the range 0-255 and displaying it to the user as a grayscale image.
    */
    
    let image = document.getElementById('minimapSource'); // replace 'yourImageId' with your image id
    let canvas = convertImageToCanvas(image);
    prepareCanvasForEdgeDetection(canvas);
    document.body.appendChild(canvas);
    
    let canvasFiltered = cloneCanvas(canvas);
    lowPassFilterCanvas(canvasFiltered, 100);
    document.body.appendChild(canvasFiltered);
    
    let outputCanvas = HoughGrid(canvasFiltered);
    document.body.appendChild(outputCanvas);
}

function convertImageToCanvas(image) {
    let canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    let context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, image.width, image.height);

    return canvas;
}

const ShiftPercentResolution = 100;
const MaxScale = 100;
function HoughGrid(canvas) {
    let accumulator = new Array(ShiftPercentResolution).fill(0).map(() => new Array(MaxScale).fill(0));

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let pixel = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
            if (pixel[0] === 255 && pixel[1] === 255 && pixel[2] === 255) { // check if the pixel is white
                registerVote(accumulator, {x: x, y: y});
            }
        }
    }

    // normalize the accumulator to the range 0-255
    let max = Math.max(...accumulator.flat());
    accumulator = accumulator.map(row => row.map(value => Math.floor((value / max) * 255)));

    // display the accumulator as a grayscale image
    let outputCanvas = document.createElement('canvas');
    outputCanvas.width = ShiftPercentResolution;
    outputCanvas.height = MaxScale;
    let ctx = outputCanvas.getContext('2d');
    let imgData = ctx.createImageData(ShiftPercentResolution, MaxScale);
    for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i]     = accumulator[i/4]; // red
        imgData.data[i + 1] = accumulator[i/4]; // green
        imgData.data[i + 2] = accumulator[i/4]; // blue
        imgData.data[i + 3] = 255;              // alpha
    }
    ctx.putImageData(imgData, 0, 0);
    
    return outputCanvas;
}

function registerVote(accumulator, pixel) {
    for (let Scale = 0; Scale < MaxScale; Scale++) {
        for (let ShiftPercent = 0; ShiftPercent < ShiftPercentResolution; ShiftPercent++) {
            let Shift = Scale * (ShiftPercent / 100);
            let fitness = CalculateFitness(pixel, Scale, Shift/ShiftPercentResolution);
            accumulator[ShiftPercent][Scale] += fitness;
        }
    }
}

function CalculateFitness(pixel, Scale, ShiftPercent) {
    let xWave = Math.cos(2 * Math.PI * (pixel.x / Scale + ShiftPercent));
    let yWave = Math.cos(2 * Math.PI * (pixel.y / Scale + ShiftPercent));
    return Math.max(xWave, yWave);
}
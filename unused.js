function findIslandBounds(island){
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (let point of island) {
        let coords = point.split(",");
        minX = Math.min(minX, coords[0]);
        minY = Math.min(minY, coords[1]);
        maxX = Math.max(maxX, coords[0]);
        maxY = Math.max(maxY, coords[1]);
    }
    
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
}

function retrieveLargestIsland(canvas, ctx){
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imgData.data;
    let originalData = new Uint8ClampedArray(data);
    
    let visited = new Set();
    let maxIslandSize = 0;
    let maxIsland = null;
    
    function getPixel(x, y) {
        let i = (y * canvas.width + x) * 4;
        return [originalData[i], originalData[i+1], originalData[i+2], originalData[i+3]];
    }
    
    function isWhite(pixel) {
        return (pixel[0] + pixel[1] + pixel[2])/3 > 255/2;
    }
    
    function dfs(x, y) {
        let stack = [[x, y]];
        let island = new Set();
        while (stack.length > 0) {
            let [x, y] = stack.pop();
            let key = `${x},${y}`;
            if (x >= 0 && y >= 0 && x < canvas.width && y < canvas.height && !visited.has(key) && isWhite(getPixel(x, y))) {
                visited.add(key);
                island.add(key);
                stack.push([x-1, y]);
                stack.push([x+1, y]);
                stack.push([x, y-1]);
                stack.push([x, y+1]);
            }
        }
        return island;
    }
    
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            if (!visited.has(`${x},${y}`) && isWhite(getPixel(x, y))) {
                let island = dfs(x, y);
                if (island.size > maxIslandSize) {
                    maxIslandSize = island.size;
                    maxIsland = island;
                }
            }
        }
    }
    
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            if (!maxIsland.has(`${x},${y}`)) {
                let i = (y * canvas.width + x) * 4;
                data[i] = data[i+1] = data[i+2] = 0;
            }
        }
    }
    
    ctx.putImageData(imgData, 0, 0);
    return maxIsland;
}

function pencilSketch(canvas) {
    let ctx = canvas.getContext('2d');
    
    // Get the image data from the canvas
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;
    
    // Apply grayscale filter
    for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
    }
    
    // Apply edge detection filter
    let edgeData = new ImageData(new Uint8ClampedArray(data), canvas.width, canvas.height);
    for (let i = 0; i < data.length; i += 4) {
        let edge = Math.abs(data[i] - (edgeData.data[i + 4] || data[i]));
        data[i] = edge;     // red
        data[i + 1] = edge; // green
        data[i + 2] = edge; // blue
    }
    
    // Put the modified image data back on the canvas
    ctx.putImageData(imageData, 0, 0);
}
function myPencilSketch(canvas){
    applyCssFilterToCanvas(canvas, "grayscale(1) brightness(255)");
}

function applyCssFilterToCanvas(canvas, cssFilter) {
    // Get the context of the canvas
    let ctx = canvas.getContext('2d');

    // Save the current state of the context
    ctx.save();

    // Apply the CSS filter to the context
    ctx.filter = cssFilter;

    // Draw the image onto the context
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);

    // Restore the context to its original state
    ctx.restore();

    // Return the modified canvas
    return canvas;
}

function grayscaleImage(sourceCanvas) {
    var canvas = document.createElement('canvas');
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;

    var ctx = canvas.getContext('2d');
    ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height);

    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imgData.data;

    for (var i = 0; i < data.length; i += 4) {
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];

        // Applying the Sobel operator
        var brightness = (3*r + 4*g + b)>>>3;
        if(brightness < 120)
            brightness = 0;
        
        data[i] = brightness;
        data[i + 1] = brightness;
        data[i + 2] = brightness;
    }

    ctx.putImageData(imgData, 0, 0);
    
    // The result image can be displayed in an img element with id 'resultImage'
    var resultImg = document.getElementById('resultImage');
    
    StackBlur.canvasRGB(canvas, 0, 0, canvas.width, canvas.height, 150);
    
    return canvas;
};

function findBrightestPixel(canvas) {
    var context = canvas.getContext('2d');

    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;

    var maxBrightness = 0;
    var brightestPixel = [0, 0];

    for (var i = 0; i < data.length; i += 4) {
        var red = data[i];
        var green = data[i + 1];
        var blue = data[i + 2];

        // Calculate the brightness of the pixel
        // The weights are the ones used by Photoshop
        var brightness = Math.sqrt(
            red * red * .241 +
            green * green * .691 +
            blue * blue * .068);

        if (brightness > maxBrightness) {
            maxBrightness = brightness;
            brightestPixel = [(i / 4) % canvas.width, Math.floor((i / 4) / canvas.width)];
        }
    }

    return brightestPixel;
}

function drawCross(canvas, location) {
    var context = canvas.getContext('2d');

    context.beginPath();
    context.moveTo(location[0] - 10, location[1]);
    context.lineTo(location[0] + 10, location[1]);
    context.moveTo(location[0], location[1] - 10);
    context.lineTo(location[0], location[1] + 10);
    context.strokeStyle = 'red';
    context.lineWidth = 2;
    context.stroke();
}
function drawSquare(canvas, location, size) {
    var context = canvas.getContext('2d');

    context.beginPath();
    context.rect(location[0]-size/2, location[1]-size/2, size, size);
    context.lineWidth = 2;
    context.strokeStyle = 'red';
    context.stroke();
}


function changeCanvasResolution(canvas, newWidth, newHeight) {
    // Create a temporary canvas to hold the original content
    let tempCanvas = document.createElement('canvas');
    let tempCtx = tempCanvas.getContext('2d');

    // Set the dimensions of the temporary canvas to match the original
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Draw the original canvas onto the temporary canvas
    tempCtx.drawImage(canvas, 0, 0);

    // Resize the original canvas to the new dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Get the context of the resized canvas
    let ctx = canvas.getContext('2d');

    // Disable image smoothing (i.e., disable anti-aliasing)
    ctx.imageSmoothingEnabled = false;

    // Draw the temporary canvas onto the resized canvas,
    // scaling it to fit the new dimensions
    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);

    // Return the modified canvas
    return canvas;
}

function mergeWhitePixels(canvas, ctx, radius){
    // Assuming 'ctx' is your 2D context
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imgData.data;
    
    // Create a copy of the original image data
    let originalData = new Uint8ClampedArray(data);
    
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let index = (y * canvas.width + x) * 4;
    
            // Check the surrounding pixels
            let hasWhiteNeighbor = false;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    // Skip the pixel itself
                    if (dx === 0 && dy === 0) continue;
    
                    let nx = x + dx;
                    let ny = y + dy;
    
                    // Skip pixels outside the canvas
                    if (nx < 0 || nx >= canvas.width || ny < 0 || ny >= canvas.height) continue;
    
                    let nIndex = (ny * canvas.width + nx) * 4;
                    let nr = originalData[nIndex];
                    let ng = originalData[nIndex + 1];
                    let nb = originalData[nIndex + 2];
    
                    // Calculate the brightness of the neighboring pixel
                    let nBrightness = (nr + ng + nb) / 3;
    
                    if (nBrightness > 255/2) {
                        hasWhiteNeighbor = true;
                        break;
                    }
                }
    
                if (hasWhiteNeighbor) break;
            }
    
            if (hasWhiteNeighbor) {
                // This pixel has a white neighbor, so we'll color it white
                data[index] = data[index + 1] = data[index + 2] = 255;
            } else {
                // This pixel doesn't have a white neighbor, so we'll color it black
                data[index] = data[index + 1] = data[index + 2] = 0;
            }
        }
    }
    
    // Put the modified image data back into the context
    ctx.putImageData(imgData, 0, 0);
}

var edgeCropping = 40;
async function locateMinimapBounds(){
    //var image = document.getElementById('sobelSource');
    var image = await takeScreenshot();
    //var image = await loadImage2('../example5.png');
    
    
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0, image.width, image.height);
    
    canvas = applyCssFilterToCanvas(canvas, 'grayscale(100%) contrast(21)');
    //canvas = changeCanvasResolution(canvas, image.width/10, image.height/10);
    let pixelExpansion = 3;
    mergeWhitePixels(canvas, context, pixelExpansion);
    let island = retrieveLargestIsland(canvas, context);
    let bounds = findIslandBounds(island);
    
    bounds.minX += edgeCropping;
    bounds.maxX -= edgeCropping;
    bounds.minY += edgeCropping;
    bounds.maxY -= edgeCropping;
    
    let xp = (bounds.minX + bounds.maxX)/2
    let yp = (bounds.minY + bounds.maxY)/2
    let size = (Math.abs(bounds.minY - bounds.maxY) + Math.abs(bounds.minX - bounds.maxX))/2;
    
    //context.drawImage(image, 0, 0, image.width, image.height);
    //drawSquare(canvas, [xp, yp], size - pixelExpansion*2)
    
    let croppedImage = await cropImage(image, bounds.minX, bounds.minY, bounds.maxX-bounds.minX, bounds.maxY-bounds.minY);
    let canvas2 = document.createElement('canvas');
    canvas2.width = croppedImage.width;
    canvas2.height = croppedImage.height;
    let ctx2 = canvas2.getContext('2d');
    ctx2.drawImage(croppedImage, 0, 0, croppedImage.width, croppedImage.height);
    
    let idealDimensions = (296+308)/2;
    let currentDimensions = Math.max(croppedImage.width,croppedImage.height);//Map can end up smaller in one dimension when you're at the outskirts
    let scaleupFactor = idealDimensions/currentDimensions;
    
    let rescaledImage = changeCanvasResolution(canvas2, croppedImage.width * scaleupFactor, croppedImage.height * scaleupFactor);
    
    document.getElementById('sobelSource').src = rescaledImage.toDataURL();
    
    //canvas = changeCanvasResolution(canvas, image.width, image.height);
    //document.getElementById('sobelSource').parentNode.replaceChild(croppedImage, document.getElementById('sobelSource'));
    
    checkImageContains(await loadImage2('../atlasGenerated.png'), rescaledImage);
}



// Function to scale the image
async function scaleImage(image, scale) {
    let canvas = document.createElement('canvas');
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    let context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return new Promise(resolve => {
        let scaledImage = new Image();
        scaledImage.onload = () => resolve(scaledImage);
        scaledImage.src = canvas.toDataURL();
    });
}



compare = async function() {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    /*
    checkImageContains(await loadImage2('../Maps/Crypt_02_N/Crypt_02_N_1.png'), await loadImage2('../example.png'));
    await delay(3000);
    checkImageContains(await loadImage2('../Maps/Crypt_02_N/Crypt_02_N_2.png'), await loadImage2('../example.png'));
    await delay(3000);
    checkImageContains(await loadImage2('../Maps/Crypt_02_N/Crypt_02_N_3.png'), await loadImage2('../example.png'));
    await delay(3000);
    checkImageContains(await loadImage2('../Maps/Crypt_02_N/Crypt_02_N_4.png'), await loadImage2('../example.png'));
    await delay(3000);
    checkImageContains(await loadImage2('../Maps/Crypt_02_N/Crypt_02_N_5.png'), await loadImage2('../example.png'));
    await delay(3000);
    checkImageContains(await loadImage2('../Maps/Crypt_02_N/Crypt_02_N_6.png'), await loadImage2('../example.png'));
    await delay(3000);
    checkImageContains(await loadImage2('../Maps/Crypt_02_N/Crypt_02_N_7.png'), await loadImage2('../example.png'));
    await delay(3000);
    checkImageContains(await loadImage2('../Maps/Crypt_02_N/Crypt_02_N_8.png'), await loadImage2('../example.png'));
    await delay(3000);
    checkImageContains(await loadImage2('../Maps/Crypt_02_N/Crypt_02_N_9.png'), await loadImage2('../example.png'));
    await delay(3000);
    checkImageContains(await loadImage2('../Maps/Crypt_02_N/Crypt_02_N_10.png'), await loadImage2('../example.png'));
    await delay(3000);*/
    /*
    const map1 = await loadImage2('../Maps/Crypt_01_HR.png');
    const map2 = await loadImage2('../Maps/Crypt_01_N.png');
    const map3 = await loadImage2('../Maps/Crypt_02_HR.png');
    const map4 = await loadImage2('../Maps/Crypt_02_N.png');
    const map5 = await loadImage2('../Maps/Crypt_03_HR.png');
    const map6 = await loadImage2('../Maps/Crypt_03_N.png');
    const map7 = await loadImage2('../Maps/Crypt_04_HR.png');
    const map8 = await loadImage2('../Maps/Crypt_04_N.png');
    const map9 = await loadImage2('../Maps/Crypt_05_HR.png');
    const map10 = await loadImage2('../Maps/Crypt_05_N.png');
    const map11 = await loadImage2('../Maps/Crypt_06_HR.png');
    const map12 = await loadImage2('../Maps/Crypt_06_N.png');
    
    const map13 = await loadImage2('../Maps/GoblinCave_01_HR.png');
    const map14 = await loadImage2('../Maps/GoblinCave_01_N.png');
    const map15 = await loadImage2('../Maps/GoblinCave_02_HR.png');
    const map16 = await loadImage2('../Maps/GoblinCave_02_N.png');
    const map17 = await loadImage2('../Maps/GoblinCave_03_N.png');
    
    const map18 = await loadImage2('../Maps/Inferno_01_HR.png');
    const map19 = await loadImage2('../Maps/Inferno_01_N.png');
    const map20 = await loadImage2('../Maps/Inferno_02_HR.png');
    const map21 = await loadImage2('../Maps/Inferno_02_N.png');
    const map22 = await loadImage2('../Maps/Inferno_03_N.png');
    
    const map23 = await loadImage2('../Maps/Ruins_01_N.png');
    */
    
    /*
    const atlas = await loadImage2('../atlasGenerated.png');
    const example = await loadImage2('../example.png');
    
    checkImageContains(atlas, example);*/
    
    checkImageContains(await loadImage2('../atlasGenerated.png'), await takeScreenshot());
};
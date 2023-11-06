let isIngameImagePromise = loadImage('IsIngame.png');
var downscale = 0.30;

function drawPlayerPosition(canvas, location) {
    let context = canvas.getContext('2d');
    
    context.beginPath();
    context.moveTo(location.x - 10, location.y);
    context.lineTo(location.x + 10, location.y);
    context.moveTo(location.x, location.y - 10);
    context.lineTo(location.x, location.y + 10);
    context.strokeStyle = 'red';
    context.lineWidth = 2;
    context.stroke();
}

async function displayMap(atlasX, atlasY) {
    let data = (await atlasMetaPromise)
    let foundObject = data.find(obj => {
        return atlasX + playerPositionOffset.dx >= obj.xStart && atlasX + playerPositionOffset.dx <= obj.xEnd && atlasY + playerPositionOffset.dy >= obj.yStart && atlasY + playerPositionOffset.dy <= obj.yEnd;
    });
    
    drawPlayerPosition(document.getElementById('rendered'), {x: atlasX + playerPositionOffset.dx, y: atlasY + playerPositionOffset.dy});
    
    let result = await cropImage(document.getElementById('rendered'), foundObject.xStart, foundObject.yStart, foundObject.xEnd - foundObject.xStart, foundObject.yEnd - foundObject.yStart)
    
    // Create a canvas
    let canvas = document.getElementById('rendered')
    canvas.width = result.width;
    canvas.height = result.height;

    // Draw the cropped image onto the canvas
    let ctx = canvas.getContext('2d');
    ctx.drawImage(result, 0, 0);
    
    //window.location.href = "https://darkanddarker.map.spellsandguns.com/map/" + foundObject.mapName;
}

// Function to load an image
function loadImage(url) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// Function to take a screenshot
async function promptForScreenshot() {
    let stream = await navigator.mediaDevices.getDisplayMedia({video: true, selfBrowserSurface: false, surfaceSwitching: false});
    let track = stream.getVideoTracks()[0];
    let imageCapture = new ImageCapture(track);
    let bitmap = await imageCapture.grabFrame();
    track.stop();
    return bitmap;
}

function cropImage(imageBitmap, cropX, cropY, cropWidth, cropHeight) {
    // Create a canvas
    let canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Draw the cropped image onto the canvas
    let ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    // Convert the canvas back to an ImageBitmap and return it
    return createImageBitmap(canvas);
}

// Assuming you have an image with id 'sourceImage'

async function getMinimap(image){
    
    let minimapCaptureDimensions = getMinimapCaptureDimensions(image);
    
    let croppedImage = await cropImage(image,
        image.width - minimapCaptureDimensions.mapDeltaPixels, image.height - minimapCaptureDimensions.mapDeltaPixels,
        minimapCaptureDimensions.mapSizePixels, minimapCaptureDimensions.mapSizePixels
    );
    return croppedImage;
}

async function checkIfIngame(image){
     try {
    
        let isIngameImage = await isIngameImagePromise;
        
        let screenshotHeight = 1440;
        let ingameCheckerHPercent = 7/screenshotHeight;
        let ingameCheckerWPercent = 320/screenshotHeight;
        let ingameCheckerYPercent = 1091/screenshotHeight;
        
        let ingameCheckerYPixels = image.height * ingameCheckerYPercent;
        let ingameCheckerXPixels = image.width - (image.height - ingameCheckerYPixels);
        
        let ingameCheckerHPixels = ingameCheckerHPercent * image.height;
        let ingameCheckerWPixels = ingameCheckerWPercent * image.height;
        
        let croppedImage = await cropImage(image,
            ingameCheckerXPixels, ingameCheckerYPixels,
            ingameCheckerWPixels, ingameCheckerHPixels
        );
        let mse = compareImages(isIngameImage, await changeBitmapResolution(croppedImage, 320, 7));
        return mse < 1500;
    
    } catch (error) {
        console.log("Error2: " + error);
    }
}
function compareImages(img1, img2) {
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');

    context.drawImage(img1, 0, 0);
    let data1 = context.getImageData(0, 0, img1.width, img1.height).data;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.drawImage(img2, 0, 0);
    let data2 = context.getImageData(0, 0, img2.width, img2.height).data;

    let mse = 0;
    for (let i = 0; i < data1.length; i++) {
        let error = data1[i] - data2[i];
        mse += error*error;
    }
    mse /= data1.length;

    return mse;
}

function getMinimapCaptureDimensions(image){
    let screenshotHeight = 1080;
    let mapHeightPercent = 212/screenshotHeight;
    let mapHeightOffsetPercent = 39/screenshotHeight;
    
    return {mapDeltaPixels: image.height * mapHeightOffsetPercent + image.height * mapHeightPercent, mapSizePixels: image.height * mapHeightPercent, mapOffsetPixels: mapHeightOffsetPercent * image.height}
}
function getPlayerPositionVsCaptureDelta(screen){
    let screenshotHeight = 1080;
    let entireMinimapPercent = 225/screenshotHeight;
    let entireMinimapOffsetPercent = 29/screenshotHeight;
    
    let mapCenterPixels = screen.height * entireMinimapOffsetPercent + screen.height * entireMinimapPercent/2;
    
    let mapCaptureDimensions = getMinimapCaptureDimensions(screen);
    let mapCaptureStart = {x: screen.width - mapCaptureDimensions.mapDeltaPixels, y: screen.height - mapCaptureDimensions.mapDeltaPixels};
    let mapCenter =       {x: screen.width - mapCenterPixels,                     y: screen.height - mapCenterPixels};
    
    let scaleupFactor = 419/mapCaptureDimensions.mapSizePixels;
    
    return {dx: (mapCenter.x - mapCaptureStart.x)*scaleupFactor, dy: (mapCenter.y - mapCaptureStart.y)*scaleupFactor};
}

async function resizeMinimapToAtlasSize(image){
    //let idealDimensions = (417+417)/2;//Goblin Caves
    let idealDimensions = (431+431)/2;//Crypts
    let currentDimensions = Math.max(image.width,image.height);
    let scaleupFactor = idealDimensions/currentDimensions * downscale;
    
    return await changeBitmapResolution(image, Math.round(image.width * scaleupFactor), Math.round(image.height * scaleupFactor));
}
let playerPositionOffset;
async function locateMinimap(){
    /*
    //var croppedImage = document.getElementById('crashCaseMinimap');
    var screen = await takeScreenshot();
    
    let croppedImage = await getMinimap(screen);
    playerPositionOffset = getPlayerPositionVsCaptureDelta(screen, croppedImage);
    let rescaledImage = await resizeMinimapToAtlasSize(croppedImage);
    
    match((await loadImage('../atlasGenerated.png')).src, rescaledImage);
    
    let canvas2 = document.createElement('canvas');
    canvas2.width = croppedImage.width;
    canvas2.height = croppedImage.height;
    let ctx2 = canvas2.getContext('2d');
    ctx2.drawImage(rescaledImage, 0, 0, croppedImage.width, croppedImage.height);
    
    document.body.appendChild(canvas2);*/
    
    if(captureStream != null){
        console.log("Already Streaming!");
        return;
    }
    console.log("Starting Streaming!");
    processScreenshot();
}

let captureStream = null;
let prevImagePromise = null;

function setPrevImagePromise(promise) {
    prevImagePromise = promise;
}

function getPrevImagePromise() {
    return prevImagePromise;
}

function deletePrevImagePromise() {
    prevImagePromise = null;
}

async function getScreenShot() {
    if (!captureStream) {
        captureStream = await navigator.mediaDevices.getDisplayMedia({video: true});
    }

    return new Promise((resolve, reject) => {
        const videoTrack = captureStream.getVideoTracks()[0].clone();

        if (!videoTrack || videoTrack.readyState !== 'live' || !videoTrack.enabled) {
            reject('The associated Track is in an invalid state bro. State: ' + videoTrack.readyState + " Enabled: " + videoTrack.enabled);
            return;
        }
        
        const imageCapture = new ImageCapture(videoTrack);

        console.log('Calling grabFrame...');
        try {
            const frame = imageCapture.grabFrame(); // Note the 'await' keyword here
            console.log('grabFrame completed.');
            resolve(frame);
        } catch (error) {
            console.log('grabFrame failed.');
            reject(error);
        }
    });
}

let videoElement = document.createElement('video');
async function getScreenShotVideoStyle() {
    if (!captureStream) {
        captureStream = await navigator.mediaDevices.getDisplayMedia({video: true});
        videoElement.srcObject = captureStream;
        await videoElement.play();
    }

    return new Promise((resolve, reject) => {
        const videoTrack = captureStream.getVideoTracks()[0].clone();

        if (!videoTrack || videoTrack.readyState !== 'live' || !videoTrack.enabled) {
            reject('The associated Track is in an invalid state bro. State: ' + videoTrack.readyState + " Enabled: " + videoTrack.enabled);
            return;
        }

        console.log('Creating canvas...');
        let canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        let frame = canvas.toDataURL('image/png');
        console.log('Screenshot taken.');
        resolve(frame);
    });
}

var canUseOpenCV = false;
function onOpenCvReady() {
    cv.onRuntimeInitialized = function() {
        canUseOpenCV = true;
    }
}

function beginLoadingMaps() {
    for (let key in maps) {
        if (maps.hasOwnProperty(key)) {
            maps[key].imgPromiseDownscaled = loadImage('Maps/'+key+'_downscaled.png');
            maps[key].imgPromiseFullSize = loadImage('Maps/'+key+'.png');
        }
    }
}
beginLoadingMaps();

function resetMapTrust(){
    for (let key in maps) {
        if (maps.hasOwnProperty(key)) {
            maps[key].trust = 0;
        }
    }
}

async function openCVTemplateMatch(templateBitmap){
    if(!canUseOpenCV){
        console.log("Open CV not ready, try again later.");
        return;
    }
    
    try {
    
        //let templateBitmap = await loadImage("crashCaseMinimapResized_10Percent.png");
        let grayscaleTemplate = applyCssFilterToCanvas(templateBitmap, "grayscale(1) brightness(4) contrast(10)");
        
        let newCanvas3 = document.getElementById('template');
        newCanvas3.height = grayscaleTemplate.height;
        newCanvas3.width = grayscaleTemplate.width;
        let ctx3 = newCanvas3.getContext('2d');
        ctx3.drawImage(grayscaleTemplate, 0, 0);
        
        let template = cv.imread(templateBitmap);
        let mask = new cv.Mat();
        let output = new cv.Mat();
        
        let largestMap = null;
        
        // Find the maximum trust
        let maxTrust = -Infinity;
        for (let key in maps) {
            if (maps.hasOwnProperty(key)) {
                maxTrust = Math.max(maxTrust, maps[key].trust);
            }
        }
        
        // Define a threshold as a fraction of the maximum trust
        let trustThreshold = maxTrust * 0.95; // Adjust this value based on your needs
        
        for (let key in maps) {
            if (maps.hasOwnProperty(key)) {
                let map = maps[key];
                if (map.trust >= trustThreshold) {
                    let mapBitmap = applyCssFilterToCanvas(await maps[key].imgPromiseDownscaled, "grayscale(1) brightness(4) contrast(10)");
                    let inputImage = cv.imread(mapBitmap);
                
                    // Create a border around the image
                    let top = template.rows / 2;
                    let bottom = template.rows / 2;
                    let left = template.cols / 2;
                    let right = template.cols / 2;
                    let borderType = cv.BORDER_CONSTANT;
                    let borderColor = new cv.Scalar();
                    cv.copyMakeBorder(inputImage, inputImage, top, bottom, left, right, borderType, borderColor);
                    
                    // Match template with input image
                    cv.matchTemplate(inputImage, template, output, cv.TM_CCOEFF, mask);
                    let maxVal = cv.minMaxLoc(output).maxVal;
                    
                    // Normalize to use the full grayscale 0-255
                    cv.normalize(output, output, 0, 255, cv.NORM_MINMAX, -1, mask);
                    
                    // Find global minimum and maximum in a matrix
                    let minMax = cv.minMaxLoc(output);
                    minMax.maxVal = maxVal;
                    console.log(`Key: ${key}, Value: ${maps[key].HR}, Fitness: ${minMax.maxVal}`);
                    maps[key].trust += minMax.maxVal;
                    
                    if(largestMap == null || minMax.maxVal > largestMap.result.maxVal) {
                        largestMap = {map: key, result: minMax};
                        console.log(`Largest so far: ${key}`);
                        
                        let newCanvas2 = document.getElementById('compared');
                        newCanvas2.height = mapBitmap.height;
                        newCanvas2.width = mapBitmap.width;
                        let ctx2 = newCanvas2.getContext('2d');
                        ctx2.drawImage(mapBitmap, 0, 0);
                    }
                    inputImage.delete();
                }
            }
        }
        
        if(largestMap != null){
            let maxPoint = largestMap.result.maxLoc;
            let rescaleFactor = 1/downscale;
            let playerPos = {x: (maxPoint.x) * rescaleFactor, y: (maxPoint.y)* rescaleFactor};
            
            let fullSizedMap = await maps[largestMap.map].imgPromiseFullSize;
            let newCanvas = document.getElementById('rendered');
            newCanvas.height = fullSizedMap.height;
            newCanvas.width = fullSizedMap.width;
            let ctx = newCanvas.getContext('2d');
            ctx.drawImage(fullSizedMap, 0, 0);
            
            ctx.rect((maxPoint.x - template.rows / 2) * rescaleFactor, (maxPoint.y - template.cols / 2)* rescaleFactor, template.cols * rescaleFactor, template.rows * rescaleFactor);
            ctx.strokeStyle = 'red';
            ctx.stroke();
        
            drawCross(newCanvas, playerPos);
        }
        
        template.delete();
        mask.delete();
        output.delete();
    
    } catch (error) {
        console.log("Error1: " + error);
    }
}
function drawCross(canvas, location) {
    var context = canvas.getContext('2d');

    context.beginPath();
    context.moveTo(location.x - 10, location.y);
    context.lineTo(location.x + 10, location.y);
    context.moveTo(location.x, location.y - 10);
    context.lineTo(location.x, location.y + 10);
    context.strokeStyle = 'red';
    context.lineWidth = 2;
    context.stroke();
}
function applyCssFilterToCanvas(image, cssFilter) {
    let canvas;
    if (image instanceof HTMLCanvasElement) {
        // The image is already a canvas
        canvas = image;
    } else if (image instanceof Image) {
        // The image is a BitmapImage, convert it to a canvas
        canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width, image.height);
    } else {
        throw new Error('Invalid parameter: image must be a Canvas or BitmapImage');
    }
    
    let ctx = canvas.getContext('2d');

    // Save the current state of the context
    ctx.save();
    
    // Apply the CSS filter to the context
    ctx.filter = cssFilter;
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);

    // Restore the context to its original state
    ctx.restore();

    // Return the modified canvas
    return canvas;
}
var mapTrust = [];
async function processScreenshot() {
    try {
        const screen = await getScreenShot();
        if(mapTrust == null)
            mapTrust = resetMapTrust();
        
        
        if(await checkIfIngame(screen)){
            let croppedImage = await getMinimap(screen);
            playerPositionOffset = getPlayerPositionVsCaptureDelta(screen, croppedImage);
            let rescaledImage = await resizeMinimapToAtlasSize(croppedImage);
            
            let tempCanvas = document.createElement('canvas');
            tempCanvas.width = rescaledImage.width;
            tempCanvas.height = rescaledImage.height;
            let tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(rescaledImage, 0, 0);
            
            await openCVTemplateMatch(tempCanvas);
        } else {
            resetMapTrust();
        }
        
        setTimeout(processScreenshot, 1000);
    } catch (error) {
        console.error(error);
    }
}
async function log_processScreenshot() {
    try {
        console.log("Getting screenshot...");
        const screen = await getScreenShot();

        console.log("Checking mapTrust...");
        if(mapTrust == null)
            mapTrust = resetMapTrust();

        console.log("Checking if in-game...");
        if(await checkIfIngame(screen)){
            console.log("Getting minimap...");
            let croppedImage = await getMinimap(screen);

            console.log("Getting player position offset...");
            playerPositionOffset = getPlayerPositionVsCaptureDelta(screen, croppedImage);

            console.log("Resizing minimap to atlas size...");
            let rescaledImage = await resizeMinimapToAtlasSize(croppedImage);

            console.log("Creating temporary canvas...");
            let tempCanvas = document.createElement('canvas');
            tempCanvas.width = rescaledImage.width;
            tempCanvas.height = rescaledImage.height;
            let tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(rescaledImage, 0, 0);

            console.log("Performing OpenCV template match...");
            await openCVTemplateMatch(tempCanvas);
        } else {
            console.log("Resetting mapTrust...");
            resetMapTrust();
        }
    } catch (error) {
        console.error(error);
    }

    console.log("Setting timeout for next screenshot...");
    if(captureStream && captureStream.getVideoTracks()[0].clone().readyState != "ended")
        setTimeout(log_processScreenshot, 1000);
}


async function changeBitmapResolution(bitmap, newWidth, newHeight) {
    // Create a temporary canvas to hold the original content
    let tempCanvas = document.createElement('canvas');
    let tempCtx = tempCanvas.getContext('2d');

    // Set the dimensions of the temporary canvas to match the original
    tempCanvas.width = bitmap.width;
    tempCanvas.height = bitmap.height;

    // Draw the original bitmap onto the temporary canvas
    tempCtx.drawImage(bitmap, 0, 0);

    // Create a new canvas for the resized image
    let newCanvas = document.createElement('canvas');

    // Set the dimensions of the new canvas
    newCanvas.width = newWidth;
    newCanvas.height = newHeight;

    // Get the context of the new canvas
    let ctx = newCanvas.getContext('2d');

    // Disable image smoothing (i.e., disable anti-aliasing)
    ctx.imageSmoothingEnabled = false;

    // Draw the temporary canvas onto the new canvas,
    // scaling it to fit the new dimensions
    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, newCanvas.width, newCanvas.height);

    // Convert the modified canvas back to an ImageBitmap
    let newBitmap = await createImageBitmap(newCanvas);

    // Return the modified ImageBitmap
    return newBitmap;
}

//https://github.com/A9T9/templatematching.js
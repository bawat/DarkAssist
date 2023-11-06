<!DOCTYPE html>
<html>
<head>
    <script src="https://darkanddarker.map.spellsandguns.com/js/maps.js"></script>
    <script src="longPolling.js"></script>
    <script src="app.js"></script>
    <script async src="https://docs.opencv.org/master/opencv.js" onload="onOpenCvReady();" type="text/javascript"></script>
</head>
<body>
    <canvas id="rendered"></canvas>
    <p id="status" ></p>
    
    <canvas id="template"></canvas>
    <canvas id="compared" ></canvas>
    
    Message:
    <p id="message"></p>
    Timestamp:
    <p id="timestamp"></p>

    <p id="pos_and_time"></p>
</body>
</html>

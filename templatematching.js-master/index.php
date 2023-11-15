<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Template Matching</title>
</head>
<body>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/stackblur-canvas/2.6.0/stackblur.min.js" integrity="sha512-W5pl1mdnRnOONc8pHMFi5xyBNNNHo6N7Q2psPRHWMPR47VyO6F/sL1G5PpRLBcsd9QL+WfDa0J9mEsGoxQH+RQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="longPolling.js"></script>
    
    <canvas id="rendered"></canvas>
    <canvas id="template"></canvas>

    <p id="pos_and_time"></p>

    <!-- Scripts -->

    <script src="jquery-3.1.1.min.js"></script>
    <script src="app.js"></script>
    <script src="HoughGrid.js"></script>
    
    Message:
    <p id="message"></p>
    Timestamp:
    <p id="timestamp"></p>
    
    <button type="button" onclick="locateMinimap()">Find map</button>
    <img id="resultImage" src="" />

</body>
</html>
// client.js
function longPolling() {
  var timestamp = document.getElementById('timestamp').innerHTML;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'longPolling.php?timestamp=' + timestamp, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        var response = JSON.parse(xhr.responseText);
        document.getElementById('message').innerHTML = response.msg;
        document.getElementById('timestamp').innerHTML = response.timestamp;
      }
      longPolling();
    }
  };
  xhr.send(null);
}

function sendData(lobbyID, x, y) {
  var data = {
    'lobbyID': lobbyID,
    'x': x,
    'y': y
  };

  // Convert the data to a JSON string
  var jsonData = JSON.stringify(data);

  // Send the data
  // This could be an AJAX call, WebSocket, etc.
  // For example:
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'longPolling.php', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(jsonData);
}

window.onload = longPolling;
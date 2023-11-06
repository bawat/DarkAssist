<?php
// server.php
$filename = 'longPollingData.txt';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // Handle POST request
  $data = json_decode(file_get_contents('php://input'), true);
  if (isset($data['lobbyID']) && isset($data['x']) && isset($data['y'])) {
    // Save the data to the file
    file_put_contents($filename, "lobbyID: {$data['lobbyID']}, x: {$data['x']}, y: {$data['y']}");
  }
} else {
    $lastmodif    = isset($_GET['timestamp']) ? $_GET['timestamp'] : 0;
    $currentmodif = filemtime($filename);
    
    while ($currentmodif <= $lastmodif) {
      usleep(1000000); // sleep 1s to unload the CPU
      clearstatcache();
      $currentmodif = filemtime($filename);
    }
    
    $response = array();
    $response['msg']       = file_get_contents($filename);
    $response['timestamp'] = $currentmodif;
    echo json_encode($response);
    flush();
}
?>
<?php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

/*
 // Replace with the number of resized images you want to generate for each image
$N = 10;
$dir = '/home/bawatnet/public_html/DarkAndDarker/Maps/';

$data = file_get_contents('https://darkanddarker.map.spellsandguns.com/js/maps.js');
// Remove unwanted characters
$data = str_replace(array('maps = {', '}', ': {HR:', 'true', 'false', '}', ','), '', $data);

$data = trim($data);
$data = explode(' ', $data);

//Download and convert map files if needed
foreach($data as $key){
  $key = trim($key);
  if($key == "")
     continue;
  
  $imageUrl = 'https://darkanddarker.map.spellsandguns.com/maps/'.$key.'.webp';
  echo "<a href='{$imageUrl}'>{$key}</a><br>";
  
  if(!file_exists($dir . $key . ".png")){
      $image = imagecreatefromwebp($imageUrl);
      imagepng($image, $dir . $key . ".png");
      imagedestroy($image);
  }
}

//Create lod mipmaps if needed
if ($handle = opendir($dir)) {
    while (false !== ($entry = readdir($handle))) {
        if ($entry != "." && $entry != "..") {
            $path_parts = pathinfo($entry);
            $subfolder = $dir . $path_parts['filename'];
            if (is_file($dir . $entry) && !file_exists($subfolder) && exif_imagetype($dir . $entry)) {
                mkdir($subfolder, 0777, true);
                $image = imagecreatefromstring(file_get_contents($dir . $entry));
                for ($i = $N; $i > 0; $i--) {
                    $resizedImage = imagescale($image, imagesx($image) * ($i / $N));
                    imagejpeg($resizedImage, $subfolder . '/' . $path_parts['filename'] . '_' . $i . '.png');
                }
            } elseif (is_dir($subfolder) && !file_exists($subfolder . ".png")) {
                array_map('unlink', glob("$subfolder/*.*"));
                rmdir($subfolder);
            }
        }
    }
    closedir($handle);
}*/
/*
$LODLevels = 1;
$StartScale = 1.0;
$EndScale = 1.0;

$dir = '/home/bawatnet/public_html/DarkAndDarker/Maps/';

$data = file_get_contents('https://darkanddarker.map.spellsandguns.com/js/maps.js');
// Remove unwanted characters
$data = str_replace(array('maps = {', '}', ': {HR:', 'true', 'false', '}', ','), '', $data);

$data = trim($data);
$data = explode(' ', $data);
$data = array_map('trim', $data);
$data = array_filter($data, function($value) {
    return ($value !== '');
});

$unsizedImages = array();
$unsizedMaxWidth = 0;
$unsizedMaxHeight = 0;
foreach($data as $key){
  $imageUrl = 'https://darkanddarker.map.spellsandguns.com/maps/'.$key.'.webp';
  $image = imagecreatefromwebp($imageUrl);
  $unsizedMaxWidth = max($unsizedMaxWidth, imagesx($image));
  $unsizedMaxHeight = max($unsizedMaxHeight, imagesy($image));
  $unsizedImages[] = $image;
}

$LODAdditionalHeightRatio = ($EndScale + ($StartScale - $EndScale)/2) * $LODLevels;
$numberOfImages = count($unsizedImages);

$sizedWidth = $unsizedMaxWidth * $StartScale;
$sizedHeight = $unsizedMaxHeight * $LODAdditionalHeightRatio;

$atlasWidth = $sizedWidth;
$atlasHeight = $sizedHeight;
$numberFitInAtlas = 1;
while($numberFitInAtlas < $numberOfImages){
    if($atlasWidth < $atlasHeight){
        $atlasWidth += $sizedWidth;
    } else {
        $atlasHeight += $sizedHeight;
    }
    $numberFitInAtlas = ($atlasWidth * $atlasHeight) / ($sizedWidth * $sizedHeight);
}

echo "Creating a " .$atlasWidth. "px by " .$atlasHeight. "px image...<br>";
$atlasMeta = array();
$canvas = imagecreatetruecolor($atlasWidth, $atlasHeight);

// Enable saving of the full alpha channel information
imagealphablending($canvas, false);
imagesavealpha($canvas, true);

$currentWidth = 0;
$currentHeight = 0;
imagefill($canvas, 0, 0, imagecolorallocatealpha($canvas,0,0,0, 127));
for($y = 0; $y < $atlasHeight; $y += $sizedHeight){
    for($x = 0; $x < $atlasWidth; $x += $sizedWidth){
        $index = (($y/$sizedHeight) * ($atlasWidth/$sizedWidth) + ($x/$sizedWidth));
        echo "y:" . ($y/$sizedHeight). " x:" . ($x/$sizedWidth). " index: " . $index . "<br>";
        if($index >= $numberOfImages)
            break;
        
        $currentImage = $unsizedImages[$index];
        $key = $data[$index*2];
        $atlasMeta[] = array(
            "mapName" => $key,
            "xStart" => $x,
            "yStart" => $y,
            "xEnd" => $x + $sizedWidth,
            "yEnd" => $y + $sizedHeight
        );
        $currentHeight = 0;
        
        if($LODLevels == 1){
            $resizedImage = imagescale($currentImage, imagesx($currentImage) * ($StartScale+$EndScale)/2);
            
            // Disable alpha blending for each resized image
            imagealphablending($resizedImage, false);
            imagesavealpha($resizedImage, true);
            
            $sizeX = imagesx($resizedImage);
            $sizeY = imagesy($resizedImage);
            // Use imagecopyresampled instead of imagecopy
            imagecopyresampled($canvas, $resizedImage, $x, $y + $currentHeight, 0, 0, $sizeX, $sizeY, $sizeX, $sizeY);
            imagedestroy($resizedImage);
            
            continue;
        }
        
        for ($scale = $StartScale; $scale >= $EndScale; $scale -= ($StartScale-$EndScale)/($LODLevels-1)) {
            $resizedImage = imagescale($currentImage, imagesx($currentImage) * $scale);
            
            // Disable alpha blending for each resized image
            imagealphablending($resizedImage, false);
            imagesavealpha($resizedImage, true);
            
            $sizeX = imagesx($resizedImage);
            $sizeY = imagesy($resizedImage);
            // Use imagecopyresampled instead of imagecopy
            imagecopyresampled($canvas, $resizedImage, $x, $y + $currentHeight, 0, 0, $sizeX, $sizeY, $sizeX, $sizeY);
            $currentHeight += $sizeY;
            imagedestroy($resizedImage);
        }
    }
}

foreach($unsizedImages as $image) {
    imagedestroy($image);
}

imagepng($canvas, $dir . '../atlasGenerated.png');
$json = json_encode($atlasMeta);
file_put_contents($dir . '../atlasGenerated.meta', $json);

imagedestroy($canvas);
*/
/*
Goblin
	Map Dimensions 884x884
	Idealsize 417x417
	BorderSpace 28x27
	Modules 3x3
Crypt
	Map Dimensions 1594x1594
	Idealsize 431x431
	BorderSpace 127x126 (252/2)
	Modules 5x5
Ruins
	Map Dimensions 1594x1594
	Idealsize 432x432 478 130x130
	BorderSpace 137x134
	Modules 5x5
*/
function calculateNewMapSize($oldMapSize) {
    
    $idealGoblinTemplateSize = 417;
    $idealCryptTemplateSize = 431;
    
    // Define the known points
    $cryptMapSize = 1594;
    $goblinMapSize = 884;
    $goblinMapSizeRescaled = $idealCryptTemplateSize/$idealGoblinTemplateSize * $goblinMapSize;

    // Calculate the slope of the line
    $slope = ($cryptMapSize - $goblinMapSizeRescaled) / ($cryptMapSize - $goblinMapSize);

    // Calculate the y-intercept of the line
    $intercept = $cryptMapSize - $slope * $cryptMapSize;

    // Use the equation of the line (y = mx + b) to find the new map size
    $newMapSize = $slope * $oldMapSize + $intercept;

    return $newMapSize;
}

$dir = '/home/bawatnet/public_html/DarkAndDarker/Maps/';

$data = file_get_contents('https://darkanddarker.map.spellsandguns.com/js/maps.js');
// Remove unwanted characters
$data = str_replace(array('maps = {', '}', ': {HR:', 'true', 'false', '}', ','), '', $data);

$data = trim($data);
$data = explode(' ', $data);
$data = array_map('trim', $data);
$data = array_filter($data, function($value) {
    return ($value !== '');
});
$downscale = 0.30;

foreach($data as $key){
  $imageUrl = 'https://darkanddarker.map.spellsandguns.com/maps/'.$key.'.webp';
  echo "<a href='{$imageUrl}'>{$key}</a><br>";
  
  //if(!file_exists($dir . $key . ".png")){
      $image = imagecreatefromwebp($imageUrl);
      $resizedImage = imagescale($image, calculateNewMapSize(imagesx($image)));
      imagepng($resizedImage, $dir . $key . ".png");
      $downsizedImage = imagescale($resizedImage, imagesx($resizedImage) * $downscale);
      imagepng($downsizedImage, $dir . $key . "_downscaled.png");
      imagedestroy($resizedImage);
      imagedestroy($downsizedImage);
      imagedestroy($image);
  //}
}
?>
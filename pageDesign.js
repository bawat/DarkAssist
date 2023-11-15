import * as THREE from 'https://threejs.org/build/three.module.js';
var mouseX = 0, mouseY = 0;

window.onload = function() {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        1,
        99999
    );
    scene.getWorldWidth = function(){ return camera.right*2; }
    scene.getWorldHeight = function(){ return camera.top*2; }
    scene.toInvariantWidth = function(width){ return width * scene.getWorldWidth()/window.innerWidth; }
    scene.toInvariantHeight = function(height){ return height * scene.getWorldHeight()/window.innerHeight; }
    scene.getScrollX = function(){ return (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft; }
    scene.getScrollY = function(){ return (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop; }
    scene.remapDomX = function(x){ return x -window.innerWidth/2; }
    scene.remapDomY = function(y){ return -(y -window.innerHeight/2 ); }
    
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webGLCanvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xEE0000);
    
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    const geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
    var textureLoader = new THREE.TextureLoader();
    
    var texture = textureLoader.load('Textures/background_diffuse_darkBlue.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(window.innerWidth/150, window.innerHeight/150);
    
    var normalMap = textureLoader.load('Textures/background_normal.png');
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(window.innerWidth/150, window.innerHeight/150);
    
    const material = new THREE.MeshStandardMaterial({map: texture, normalMap: normalMap, metalness: 0.7, roughness: 0.7});
    var tex_title_aspectRatio;
    var tex_title_normal = textureLoader.load('Textures/title_normal.png');// Calculate the aspect ratio of the texture
    var tex_title_diffuse = textureLoader.load('Textures/title_diffuse.png');
    var tex_title_diffuse_shadow = textureLoader.load('Textures/title_diffuse_shadow.png', function(texture){
        
        const geom_title = new THREE.PlaneGeometry(500 + 1920/window.innerWidth, 500 + 1080/window.innerHeight);
        const mat_title = new THREE.MeshStandardMaterial({map: tex_title_diffuse, normalMap: tex_title_normal, metalness: 0.4, roughness: 0.2, color: 0xA67532, transparent: true});
        var title = new THREE.Mesh(geom_title, mat_title);
        var title_shadow = new THREE.Mesh(geom_title, new THREE.MeshBasicMaterial({map: tex_title_diffuse_shadow, transparent: true}));
        
        const mapContainer = document.getElementById("map");
        const titleContainer = document.getElementById("titleSpace");
        const box = makeElementGolden(scene, textureLoader, "map", 6, 'Textures/Textbox_diffuse.png', 'Textures/Textbox_normalMap.png', 'Textures/Textbox_shadowMap.png')
        
        var resizeFunct = function() {
            if(title.material.map.image)
                tex_title_aspectRatio = title_shadow.material.map.image.width / title_shadow.material.map.image.height;
            
            
            const titlePos = titleContainer.getBoundingClientRect();
            title_shadow.position.set(scene.remapDomX(titlePos.x + titlePos.width/2), scene.remapDomY(titlePos.y + titlePos.height/2), 5);
            title.position.set(scene.remapDomX(titlePos.x + titlePos.width/2), scene.remapDomY(titlePos.y + titlePos.height/2), 6);
            
            title.geometry.dispose(); // Dispose of the old geometry
            title.geometry = new THREE.PlaneGeometry(scene.toInvariantWidth(window.innerWidth * 2/3), scene.toInvariantHeight(window.innerWidth * 2/3 / tex_title_aspectRatio)); // Create a new geometry with the new dimensions
            title_shadow.geometry = title.geometry;
            
            box.updateGeometry();
        }
        window.addEventListener('resize', resizeFunct);
        window.addEventListener("scroll", resizeFunct);
        resizeFunct();
        
        scene.add(title_shadow);
        scene.add(title);
    });
    
    // Calculate the decay and distance for the point light
    var distance = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight);
    
    // Create a point light with the same properties as the spotlight
    var titleLight = new THREE.PointLight(0xF6EBB1);
    titleLight.position.set(window.innerWidth/2, window.innerHeight/2, 0);
    titleLight.distance = distance;
    titleLight.decay = 0.5;
    titleLight.intensity = 550; // Set the intensity of the point light
    scene.add(titleLight);
    
    // Create a point light with the same properties as the spotlight
    var backgroundLight = new THREE.PointLight(0xF6EBB1);
    backgroundLight.position.set(window.innerWidth/2, window.innerHeight/2, -9999);
    backgroundLight.distance = distance;
    backgroundLight.decay = 0.5;
    backgroundLight.intensity = 50; // Set the intensity of the point light
    scene.add(backgroundLight);
    
    // Comment out the spotlight
    /*
    var spotlight = new THREE.SpotLight(0xFFFFFF);
    spotlight.position.set(window.innerWidth/2, window.innerHeight/2, 10);
    spotlight.angle = Math.PI/4;
    spotlight.penumbra = 0.1;
    spotlight.intensity = 50; // Increase the intensity of the spotlight
    spotlight.distance = distance;
    spotlight.decay = 0.5;
    scene.add(spotlight);
    */
    
    // Add an ambient light to the scene //0x2A316B
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.8);
    scene.add(ambientLight);
    
    const backdrop = new THREE.Mesh(geometry, material);
    backdrop.position.z = -9999;
    scene.add(backdrop);
    
    camera.position.z = 15;
    
    var mouseLightForeground = new THREE.PointLight(0xffffff);
    mouseLightForeground.distance = distance;
    mouseLightForeground.decay = 0.5;
    mouseLightForeground.intensity = 550/2;
    scene.add(mouseLightForeground);
    
    var mouseLightBackground = new THREE.PointLight(0xF6EBB1);
    mouseLightBackground.distance = distance;
    mouseLightBackground.decay = 0.5;
    mouseLightBackground.intensity = 50/2; // Set the intensity of the point light
    scene.add(mouseLightBackground);
    
    // Add a mousemove event listener
    window.addEventListener('mousemove', function(event) {
        mouseX = event.clientX;
        mouseY = event.clientY;
        
        var mX = -camera.right + ((mouseX+ 32/2) / window.innerWidth) * camera.right *2;
        var mY = -(-camera.top + ((mouseY+ 32/2) / window.innerHeight) * camera.top *2);
        
        mouseLightForeground.position.set(mX, mY, 0);
        mouseLightBackground.position.set(mX, mY, -9999);
    });
    
    const animate = function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        geometry.width = window.innerWidth;
        geometry.height = window.innerHeight;
        
        texture.repeat.set(window.innerWidth/450, window.innerHeight/450);
        normalMap.repeat.set(window.innerWidth/450, window.innerHeight/450);
        
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    };
    
    animate();
}

function makeElementGolden(scene, textureLoader, elementID, depth, diffuseMap, normalMap, shadowMap){
    let skeleton = document.getElementById(elementID);
    let diffuse = textureLoader.load(diffuseMap);
    let normal = textureLoader.load(normalMap);
    let diffuse_shadow = textureLoader.load(shadowMap);
    
    let geom = new THREE.PlaneGeometry(0, 0);
    let mat = new THREE.MeshStandardMaterial({map: diffuse, normalMap: normal, metalness: 0.4, roughness: 0.2, color: 0xA67532, transparent: true});
    
    let mesh_shadow = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({map: diffuse_shadow, transparent: true}));
    let mesh = new THREE.Mesh(geom, mat);
    
    scene.add(mesh_shadow);
    scene.add(mesh);
    
    let updateGeometry = function(){
        const skeleDims = skeleton.getBoundingClientRect();
        
        mesh_shadow.position.set(scene.remapDomX(skeleDims.x + skeleDims.width/2), scene.remapDomY(skeleDims.y + skeleDims.height/2), depth-1);
               mesh.position.set(scene.remapDomX(skeleDims.x + skeleDims.width/2), scene.remapDomY(skeleDims.y + skeleDims.height/2), depth);
        
        mesh_shadow.geometry.dispose(); // Dispose of the old geometry
               mesh.geometry.dispose(); // Dispose of the old geometry
        
        mesh_shadow.geometry = new THREE.PlaneGeometry(scene.toInvariantWidth(skeleDims.width), scene.toInvariantHeight(skeleDims.height)); // Create a new geometry with the new dimensions
               mesh.geometry = mesh_shadow.geometry;
    };
    
    updateGeometry();
    
    return {updateGeometry: updateGeometry};
}
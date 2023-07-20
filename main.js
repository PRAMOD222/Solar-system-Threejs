// main.js

// Initialize Three.js Scene
const canvasContainer = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
canvasContainer.appendChild(renderer.domElement);

// Variables to handle mouse movement

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Event listener for mouse down
renderer.domElement.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
    };
});

// Event listener for mouse move
renderer.domElement.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y,
        };

        const deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(toRadians(deltaMove.y * 0.03), toRadians(deltaMove.x * 0.03), 0, 'XYZ'));

        camera.quaternion.multiplyQuaternions(deltaRotationQuaternion, camera.quaternion);

        previousMousePosition = {
            x: event.clientX,
            y: event.clientY,
        };
    }
});

// Event listener for mouse up
window.addEventListener('mouseup', () => {
    isDragging = false;
});

// Event listener for scroll (zoom)
renderer.domElement.addEventListener('wheel', (event) => {
    const fov = camera.fov + event.deltaY * 0.02;
    camera.fov = THREE.MathUtils.clamp(fov, 3, 75);
    camera.updateProjectionMatrix();
});

// Set the initial camera position and target
const initialCameraPosition = new THREE.Vector3(0, 150, 200);
const initialCameraTarget = new THREE.Vector3(0, 0, 0);
camera.position.copy(initialCameraPosition);
camera.lookAt(initialCameraTarget);


// Function to convert degrees to radians
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}


// Create Starfield
function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff });

    const starsVertices = [];
    const range = 1000;
    const quantity = 1000;

    for (let i = 0; i < quantity; i++) {
        const x = (Math.random() - 0.5) * range;
        const y = (Math.random() - 0.5) * range;
        const z = (Math.random() - 0.5) * range;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starfield = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starfield);
}

// Create Planets
function createPlanet(texturePath, x, y, z, radius) {
    const texture = new THREE.TextureLoader().load(texturePath);
    const planetMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const planetGeometry = new THREE.SphereGeometry(radius, 32, 32);
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.set(x, y, z);
    scene.add(planet);
    return planet;
}


// Function to create an orbit path with thin lines and less opacity
function createOrbit(orbitRadius) {
    const curve = new THREE.EllipseCurve(
        0, 0,           // x, y
        orbitRadius, orbitRadius,      // xRadius, yRadius
        0, 2 * Math.PI, // startAngle, endAngle
        false,          // clockwise
        0               // rotation
    );

    const points = curve.getPoints(360);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true, linewidth: 0.2 });

    const ellipse = new THREE.Line(geometry, material);
    scene.add(ellipse);

    return ellipse;
}


// Create Planets with Orbits
function createPlanetWithOrbit(texturePath, x, y, z, radius, orbitRadius, orbitSpeed, moonRadius, moonOrbitRadius, moonOrbitSpeed, isMoonOfEarth = false) {
    // Create the orbit path for the planet
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true, linewidth: 0.2 });
  
    const orbitVertices = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.cos(theta) * orbitRadius;
      const z = Math.sin(theta) * orbitRadius;
      orbitVertices.push(x, 0, z);
    }
  
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitVertices, 3));
    const orbitPath = new THREE.LineLoop(orbitGeometry, orbitMaterial); // Use LineLoop for closed orbits
    scene.add(orbitPath);
  
    // Create the planet
    const planet = createPlanet(texturePath, x, y, z, radius);
  
    // Group the planet and orbit path together
    const planetGroup = new THREE.Group();
    planetGroup.add(orbitPath);
    planetGroup.add(planet);
    scene.add(planetGroup);
  
    if (isMoonOfEarth) {
      // Add the moon
      const moonOrbitCenter = new THREE.Vector3(x, y, z); // Center of the Earth's orbit
      const moonOrbitOffset = new THREE.Vector3(moonOrbitRadius, 0, 0); // Offset from the center for the moon's orbit
  
      // Create a moon orbit path (invisible)
      const moonOrbitGeometry = new THREE.BufferGeometry();
      const moonOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.0, transparent: true, linewidth: 0.2 });
  
      const moonOrbitVertices = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = Math.cos(theta) * moonOrbitRadius;
        const z = Math.sin(theta) * moonOrbitRadius;
        moonOrbitVertices.push(x, 0, z);
      }
  
      moonOrbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(moonOrbitVertices, 3));
      const moonOrbitPath = new THREE.LineLoop(moonOrbitGeometry, moonOrbitMaterial);
      scene.add(moonOrbitPath);
  
      // Add the moon to the scene
      const moon = createPlanet('moon.jpg', x + moonOrbitRadius, y, z, moonRadius);
      scene.add(moon);
  
      return { planet, orbitPath, orbitRadius, orbitSpeed, moon, moonOrbitPath, moonOrbitRadius, moonOrbitSpeed };
    }
  
    return { planet, orbitPath, orbitRadius, orbitSpeed };
  }
  
  

// Example usage:
const sun = createPlanet('sun.jpg', 0, 0, 0, 10);

// Create the planets with their orbits
const mercury = createPlanetWithOrbit('mercury.jpg', 30, 0, 0, 1, 30, 0.2);
const venus = createPlanetWithOrbit('venus.jpg', 50, 0, 0, 1.5, 50, 0.15);
// const earth = createPlanetWithOrbit('earth.jpg', 70, 0, 0, 2, 70, 0.1);
const earth = createPlanetWithOrbit('earth.jpg', 70, 0, 0, 2, 70, 0.1, 0.5, 5, 0.4, true);
const mars = createPlanetWithOrbit('mars.jpg', 90, 0, 0, 1.8, 90, 0.08);
const jupiter = createPlanetWithOrbit('jupiter.jpg', 120, 0, 0, 5, 120, 0.05);
const saturn = createPlanetWithOrbit('saturn.jpg', 150, 0, 0, 4.5, 150, 0.04);
const uranus = createPlanetWithOrbit('uranus.jpg', 180, 0, 0, 3, 180, 0.03);
const neptune = createPlanetWithOrbit('neptune.jpg', 210, 0, 0, 3.2, 210, 0.02);

// // Hide the orbit paths

mercury.orbitPath.material.visible = false;
venus.orbitPath.material.visible = false;
// earth.orbitPath.material.visible = false;
mars.orbitPath.material.visible = false;
jupiter.orbitPath.material.visible = false;
saturn.orbitPath.material.visible = false;
uranus.orbitPath.material.visible = false;
neptune.orbitPath.material.visible = false;


// Animate Planets and Orbits
function animatePlanetsAndOrbits() {
    const time = Date.now() * 0.001;

    mercury.planet.position.x = Math.cos(mercury.orbitSpeed * time) * mercury.orbitRadius;
    mercury.planet.position.z = Math.sin(mercury.orbitSpeed * time) * mercury.orbitRadius;

    venus.planet.position.x = Math.cos(venus.orbitSpeed * time) * venus.orbitRadius;
    venus.planet.position.z = Math.sin(venus.orbitSpeed * time) * venus.orbitRadius;

    earth.planet.position.x = Math.cos(earth.orbitSpeed * time) * earth.orbitRadius;
    earth.planet.position.z = Math.sin(earth.orbitSpeed * time) * earth.orbitRadius;
    earth.planet.rotation.y += 0.02; // Adjust the rotation speed as needed

    mars.planet.position.x = Math.cos(mars.orbitSpeed * time) * mars.orbitRadius;
    mars.planet.position.z = Math.sin(mars.orbitSpeed * time) * mars.orbitRadius;

    jupiter.planet.position.x = Math.cos(jupiter.orbitSpeed * time) * jupiter.orbitRadius;
    jupiter.planet.position.z = Math.sin(jupiter.orbitSpeed * time) * jupiter.orbitRadius;

    saturn.planet.position.x = Math.cos(saturn.orbitSpeed * time) * saturn.orbitRadius;
    saturn.planet.position.z = Math.sin(saturn.orbitSpeed * time) * saturn.orbitRadius;

    uranus.planet.position.x = Math.cos(uranus.orbitSpeed * time) * uranus.orbitRadius;
    uranus.planet.position.z = Math.sin(uranus.orbitSpeed * time) * uranus.orbitRadius;

    neptune.planet.position.x = Math.cos(neptune.orbitSpeed * time) * neptune.orbitRadius;
    neptune.planet.position.z = Math.sin(neptune.orbitSpeed * time) * neptune.orbitRadius;

     // Animate Moon for Earth
  const moonTime = time * earth.moonOrbitSpeed;
  const moonX = Math.cos(moonTime) * earth.moonOrbitRadius;
  const moonZ = Math.sin(moonTime) * earth.moonOrbitRadius;
  earth.moon.position.set(earth.planet.position.x + moonX, earth.planet.position.y, earth.planet.position.z + moonZ);

    // Update positions for other planets as needed
}

// Update Camera Position
function updateCameraPosition() {
    // Move the camera forward (negative z-axis) to create a moving effect
    // const time = Date.now() * 0.001;
    // camera.position.z = initialCameraPosition.z - 50 * Math.cos(time * 0.5);
}

// Main Animation Loop
function animate() {
    requestAnimationFrame(animate);
    animatePlanetsAndOrbits();
    updateCameraPosition();
    renderer.render(scene, camera);
}

// Resize Handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Event Listeners
window.addEventListener('resize', onWindowResize);

// Initialize the Scene
createStarfield();
camera.position.z = 200;
animate();




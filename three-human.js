/**
 * three-human.js
 * Renders an interactive 3D particle wireframe mannequin using Three.js CDN.
 * Includes automated SVG fallback mechanisms for WebGL compatibility safety.
 */

class ThreeHumanMannequin {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.fallback = document.getElementById('three-fallback-svg');
    this.spinner = document.getElementById('three-loading-spinner');
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mannequin = null;
    this.points = null;
    this.lines = null;
    this.animationId = null;
    
    this.isInitialized = false;
    
    // Attempt startup on load
    window.addEventListener('load', () => {
      setTimeout(() => this.init(), 100);
    });
  }
  
  init() {
    if (this.isInitialized) return;
    
    // 1. Check if Three.js loaded from CDN
    if (typeof THREE === 'undefined') {
      this.triggerFallback("Three.js library not available.");
      return;
    }
    
    try {
      const width = this.container.clientWidth || 240;
      const height = this.container.clientHeight || 250;
      
      // 2. Setup Scene & Camera
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x08090c, 0.05);
      
      this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 100);
      this.camera.position.set(0, 0, 15);
      
      // 3. WebGL Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      // Clear container and append canvas
      this.spinner.classList.add('hidden');
      this.container.appendChild(this.renderer.domElement);
      
      // 4. Construct Mannequin geometry
      this.buildMannequin();
      
      // 5. Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      this.scene.add(ambientLight);
      
      const dirLight = new THREE.DirectionalLight(0x00f2fe, 0.8);
      dirLight.position.set(5, 10, 7);
      this.scene.add(dirLight);
      
      this.isInitialized = true;
      this.animate();
      
      // Handle resizing
      window.addEventListener('resize', () => this.onResize());
      
    } catch (err) {
      this.triggerFallback("WebGL initialization failed: " + err.message);
    }
  }
  
  buildMannequin() {
    this.mannequin = new THREE.Group();
    
    // Skeleton coordinates (x, y, z) representing node points
    const nodes = {
      head: new THREE.Vector3(0, 4.0, 0),
      neck: new THREE.Vector3(0, 3.2, 0),
      lShoulder: new THREE.Vector3(-1.4, 3.0, 0),
      rShoulder: new THREE.Vector3(1.4, 3.0, 0),
      chest: new THREE.Vector3(0, 2.0, 0),
      lElbow: new THREE.Vector3(-1.8, 1.2, -0.2),
      rElbow: new THREE.Vector3(1.8, 1.2, -0.2),
      lHand: new THREE.Vector3(-2.2, -0.4, -0.4),
      rHand: new THREE.Vector3(2.2, -0.4, -0.4),
      pelvis: new THREE.Vector3(0, -0.5, 0),
      lHip: new THREE.Vector3(-0.7, -0.8, 0),
      rHip: new THREE.Vector3(0.7, -0.8, 0),
      lKnee: new THREE.Vector3(-0.8, -2.4, -0.2),
      rKnee: new THREE.Vector3(0.8, -2.4, -0.2),
      lAnkle: new THREE.Vector3(-0.9, -4.2, 0),
      rAnkle: new THREE.Vector3(0.9, -4.2, 0)
    };
    
    // Add point coordinates
    const pointsGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    const keys = Object.keys(nodes);
    keys.forEach(k => {
      positions.push(nodes[k].x, nodes[k].y, nodes[k].z);
      // Cyber lime color points [R, G, B]
      colors.push(0.22, 1.0, 0.08); // #39ff14
    });
    
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    pointsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });
    
    this.points = new THREE.Points(pointsGeometry, pointsMaterial);
    this.mannequin.add(this.points);
    
    // Add connecting wireframe lines
    const lineIndices = [
      // Spine & Head
      'head', 'neck',
      'neck', 'chest',
      'chest', 'pelvis',
      
      // Arms
      'neck', 'lShoulder',
      'neck', 'rShoulder',
      'lShoulder', 'lElbow',
      'rShoulder', 'rElbow',
      'lElbow', 'lHand',
      'rElbow', 'rHand',
      
      // Hips & Legs
      'pelvis', 'lHip',
      'pelvis', 'rHip',
      'lHip', 'lKnee',
      'rHip', 'rKnee',
      'lKnee', 'lAnkle',
      'rKnee', 'rAnkle'
    ];
    
    const lineVertices = [];
    for (let i = 0; i < lineIndices.length; i += 2) {
      const p1 = nodes[lineIndices[i]];
      const p2 = nodes[lineIndices[i + 1]];
      lineVertices.push(p1.x, p1.y, p1.z);
      lineVertices.push(p2.x, p2.y, p2.z);
    }
    
    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
    
    const linesMaterial = new THREE.LineBasicMaterial({
      color: 0x00f2fe, // Cyan wireframe
      transparent: true,
      opacity: 0.4,
      linewidth: 1.5
    });
    
    this.lines = new THREE.LineSegments(linesGeometry, linesMaterial);
    this.mannequin.add(this.lines);
    
    // Add mannequin group to scene
    this.scene.add(this.mannequin);
  }
  
  onResize() {
    if (!this.isInitialized) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  updateZoneGlow(bodyFat) {
    if (!this.isInitialized || !this.lines) return;
    
    // Glow intensity / color shifts to hot magenta (pink) if body fat is high
    const color = new THREE.Color();
    if (bodyFat > 25) {
      color.setHex(0xff007f); // Hot pink (fat warnings)
      this.lines.material.opacity = 0.7;
    } else if (bodyFat <= 14) {
      color.setHex(0x39ff14); // Cyber lime (lean athletic)
      this.lines.material.opacity = 0.5;
    } else {
      color.setHex(0x00f2fe); // Cyan standard
      this.lines.material.opacity = 0.45;
    }
    this.lines.material.color = color;
  }
  
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Slow rotation
    if (this.mannequin) {
      this.mannequin.rotation.y += 0.008;
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  triggerFallback(reason) {
    console.warn("ThreeHumanMannequin Fallback Activated:", reason);
    if (this.spinner) this.spinner.classList.add('hidden');
    if (this.fallback) this.fallback.classList.remove('hidden');
  }
}

// Global hooks
let humanMannequin;
window.addEventListener('DOMContentLoaded', () => {
  humanMannequin = new ThreeHumanMannequin('three-canvas-container');
});

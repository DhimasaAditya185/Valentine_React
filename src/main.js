import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

// Scene setup
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();

// Romantic gradient background using shader
const bgGeometry = new THREE.PlaneGeometry(2, 2);
const bgMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      // Beautiful romantic gradient - deep rose to soft pink
      vec3 color1 = vec3(0.15, 0.02, 0.08);  // Deep wine/burgundy
      vec3 color2 = vec3(0.35, 0.08, 0.18);  // Rose
      vec3 color3 = vec3(0.25, 0.05, 0.12);  // Dark rose

      float y = vUv.y;
      vec3 color;
      if (y < 0.4) {
        color = mix(color1, color2, y / 0.4);
      } else {
        color = mix(color2, color3, (y - 0.4) / 0.6);
      }

      // Soft animated glow in center
      float dist = distance(vUv, vec2(0.5, 0.5));
      float glow = 1.0 - smoothstep(0.0, 0.7, dist);
      glow *= 0.15 + sin(uTime * 0.5) * 0.05;
      color += vec3(0.4, 0.1, 0.2) * glow;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
  depthWrite: false,
  depthTest: false
});
const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
bgMesh.renderOrder = -1000;
scene.add(bgMesh);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.6,
  0.4,
  0.8
);
composer.addPass(bloomPass);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffeeff, 0.6);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
mainLight.position.set(5, 8, 5);
scene.add(mainLight);

const pinkLight = new THREE.PointLight(0xff6699, 2, 25);
pinkLight.position.set(-3, 2, 5);
scene.add(pinkLight);

const warmLight = new THREE.PointLight(0xffaa88, 1.5, 20);
warmLight.position.set(3, 0, 6);
scene.add(warmLight);

// ============================================================
// ==================== CUSTOM 3D MODEL =======================
// ============================================================

// OBJECT SETTINGS - Base values (will be adjusted for screen size)
const OBJECT_ROTATION_SPEED = 0.3;  // How fast it rotates (0 = no rotation)

// Responsive settings function
function getResponsiveSettings() {
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  if (isMobile) {
    return {
      scale: 3,           // Smaller on mobile
      positionY: -2.5     // Higher on mobile (less negative)
    };
  } else if (isTablet) {
    return {
      scale: 4,
      positionY: -3
    };
  } else {
    return {
      scale: 5,           // Desktop size
      positionY: -4
    };
  }
}

let responsiveSettings = getResponsiveSettings();

// ============================================================
// ==================== LOAD THE MODEL ========================
// ============================================================

const flowers = new THREE.Group();
const allFlowers = [];

const loader = new GLTFLoader();
loader.load(
  `${import.meta.env.BASE_URL}model/lily_blossom.glb`,
  (gltf) => {
    const model = gltf.scene;
    model.scale.setScalar(responsiveSettings.scale);

    // Center the model based on its bounding box
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    model.userData.originalY = 0;
    model.userData.phase = 0;

    flowers.add(model);
    allFlowers.push(model);
    console.log('Model loaded successfully!');
  },
  (progress) => {
    console.log('Loading model...', (progress.loaded / progress.total * 100) + '%');
  },
  (error) => {
    console.error('Error loading model:', error);
  }
);

// Position the model group in front of camera (camera is at z=10)
flowers.position.set(0, responsiveSettings.positionY, 0);
scene.add(flowers);

// ==================== FLOATING HEARTS ====================

const heartParticles = [];

function createHeart3D() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0, -0.3, -0.5, -0.3, -0.5, 0);
  shape.bezierCurveTo(-0.5, 0.3, 0, 0.6, 0, 0.8);
  shape.bezierCurveTo(0, 0.6, 0.5, 0.3, 0.5, 0);
  shape.bezierCurveTo(0.5, -0.3, 0, -0.3, 0, 0);

  const geom = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff6699,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });

  const heart = new THREE.Mesh(geom, mat);
  const scale = 0.08 + Math.random() * 0.1;
  heart.scale.set(scale, scale, scale);
  heart.position.set(
    (Math.random() - 0.5) * 14,
    -6 + Math.random() * 2,
    (Math.random() - 0.5) * 6 - 3
  );
  heart.userData.speed = 0.3 + Math.random() * 0.5;
  heart.userData.rotSpeed = (Math.random() - 0.5) * 2;
  heart.userData.wobble = Math.random() * Math.PI * 2;
  scene.add(heart);
  heartParticles.push(heart);
}

for (let i = 0; i < 25; i++) {
  createHeart3D();
}

// ==================== SPARKLE PARTICLES ====================

const sparkleGeom = new THREE.BufferGeometry();
const sparkleCount = 100;
const sparklePos = new Float32Array(sparkleCount * 3);

for (let i = 0; i < sparkleCount; i++) {
  sparklePos[i * 3] = (Math.random() - 0.5) * 20;
  sparklePos[i * 3 + 1] = (Math.random() - 0.5) * 15;
  sparklePos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
}

sparkleGeom.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));

const sparkleMat = new THREE.PointsMaterial({
  color: 0xffccdd,
  size: 0.08,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending
});

const sparkles = new THREE.Points(sparkleGeom, sparkleMat);
scene.add(sparkles);

// ==================== INTERACTION ====================

const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

document.addEventListener('mousemove', (e) => {
  mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
});

document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
  }
});

function createClickHeart(x, y) {
  const el = document.createElement('div');
  el.className = 'heart-particle';
  el.innerHTML = ['❤️', '💕', '💗', '💖', '🌸'][Math.floor(Math.random() * 5)];
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

canvas.addEventListener('click', (e) => {
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      createClickHeart(
        e.clientX + (Math.random() - 0.5) * 80,
        e.clientY + (Math.random() - 0.5) * 40
      );
    }, i * 40);
  }

  allFlowers.forEach((f, i) => {
    setTimeout(() => {
      f.scale.multiplyScalar(1.12);
      setTimeout(() => f.scale.divideScalar(1.12), 180);
    }, i * 25);
  });
});

// ==================== SCROLL ====================

let scrollProgress = 0;
let targetScrollProgress = 0;
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Use passive listener for better mobile scroll performance
window.addEventListener('scroll', () => {
  const max = document.body.scrollHeight - window.innerHeight;
  targetScrollProgress = window.scrollY / max;
}, { passive: true });

// Also listen for touch events on mobile
if (isMobileDevice) {
  document.addEventListener('touchmove', () => {
    const max = document.body.scrollHeight - window.innerHeight;
    targetScrollProgress = window.scrollY / max;
  }, { passive: true });
}

// ============================================
// EDIT NAME HERE
// ============================================
const RECIPIENT_NAME = "Hani";
// ============================================

const messageContainer = document.getElementById('message-container');
const recipient = document.getElementById('recipient');
const scrollHint = document.getElementById('scroll-hint');
const scrollSections = document.querySelectorAll('.scroll-text');

recipient.textContent = RECIPIENT_NAME;
messageContainer.classList.add('visible');

// Welcome hearts
setTimeout(() => {
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      createClickHeart(
        Math.random() * window.innerWidth,
        window.innerHeight + 30
      );
    }, i * 80);
  }
}, 400);

// ==================== ANIMATION ====================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Background animation
  bgMaterial.uniforms.uTime.value = t;

  // Mouse smoothing
  mouse.x += (mouse.targetX - mouse.x) * 0.05;
  mouse.y += (mouse.targetY - mouse.y) * 0.05;

  // Faster scroll smoothing on mobile for more responsive feel
  const scrollSmoothing = isMobileDevice ? 0.2 : 0.1;
  scrollProgress += (targetScrollProgress - scrollProgress) * scrollSmoothing;

  // Flowers follow mouse
  flowers.rotation.y = mouse.x * 0.25;
  flowers.rotation.x = mouse.y * 0.12;

  // Animate the custom object
  allFlowers.forEach((flower) => {
    // Gentle float
    flower.position.y = flower.userData.originalY +
      Math.sin(t * 0.6 + flower.userData.phase) * 0.06;

    // Rotation animation
    flower.rotation.y += OBJECT_ROTATION_SPEED * 0.01;

    // Pulse effect on scroll
    const pulse = 1 + Math.sin(t * 2) * 0.03;
    flower.scale.setScalar(responsiveSettings.scale * pulse);
  });

  // Hearts float up
  heartParticles.forEach((h) => {
    h.position.y += h.userData.speed * 0.015;
    h.position.x += Math.sin(t + h.userData.wobble) * 0.008;
    h.rotation.z += h.userData.rotSpeed * 0.01;
    if (h.position.y > 10) {
      h.position.y = -6;
      h.position.x = (Math.random() - 0.5) * 14;
    }
  });

  // Sparkles
  sparkles.rotation.y = t * 0.02;
  sparkleMat.opacity = 0.4 + Math.sin(t * 0.5) * 0.2;

  // Lights
  pinkLight.intensity = 2 + Math.sin(t * 2) * 0.4;
  warmLight.position.x = Math.sin(t * 0.5) * 2.5;

  // Bloom
  bloomPass.strength = 0.6 + scrollProgress * 1.0;

  // Camera sway
  camera.position.x = Math.sin(t * 0.25) * 0.2;
  camera.position.y = Math.sin(t * 0.35) * 0.15;
  camera.lookAt(0, 0, 0);

  // Scroll hint
  if (scrollProgress > 0.1) {
    scrollHint.classList.add('hidden');
  } else {
    scrollHint.classList.remove('hidden');
  }

  // Scroll sections
  const ranges = [
    { start: 0.15, end: 0.35 },
    { start: 0.35, end: 0.55 },
    { start: 0.55, end: 0.75 },
    { start: 0.75, end: 1.0 }
  ];

  scrollSections.forEach((sec, i) => {
    const r = ranges[i];
    if (scrollProgress >= r.start && scrollProgress < r.end) {
      sec.classList.add('visible');
      sec.classList.remove('fade-out');
    } else if (scrollProgress >= r.end) {
      sec.classList.remove('visible');
      sec.classList.add('fade-out');
    } else {
      sec.classList.remove('visible', 'fade-out');
    }
  });

  // Fade message - fade out completely before section 1 appears at 0.15
  if (scrollProgress > 0.05) {
    messageContainer.style.opacity = Math.max(0, 1 - (scrollProgress - 0.05) * 10);
  } else {
    messageContainer.style.opacity = 1;
  }

  // Move rose on scroll (using responsive position)
  const baseY = responsiveSettings.positionY;
  let targetY = baseY;
  let targetScale = 1;
  let targetRotZ = 0;

  if (scrollProgress < 0.15) {
    targetY = baseY;
    targetScale = 1;
    targetRotZ = 0;
  } else if (scrollProgress < 0.35) {
    targetY = baseY - 1;
    targetScale = 0.85;
    targetRotZ = -0.1;
  } else if (scrollProgress < 0.55) {
    targetY = baseY + 0.5;
    targetScale = 0.8;
    targetRotZ = 0.1;
  } else if (scrollProgress < 0.75) {
    targetY = baseY - 0.8;
    targetScale = 0.75;
    targetRotZ = -0.05;
  } else {
    targetY = baseY - 0.2;
    targetScale = 0.9;
    targetRotZ = 0;
  }

  // Smooth rotation
  flowers.rotation.z += (targetRotZ - flowers.rotation.z) * 0.05;

  flowers.position.y += (targetY - flowers.position.y) * 0.05;
  const s = flowers.scale.x + (targetScale - flowers.scale.x) * 0.05;
  flowers.scale.set(s, s, s);

  composer.render();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);

  // Update responsive settings on resize
  responsiveSettings = getResponsiveSettings();

  // Update model scale if loaded
  if (allFlowers.length > 0) {
    allFlowers.forEach(model => {
      model.scale.setScalar(responsiveSettings.scale);
    });
  }
});

animate();

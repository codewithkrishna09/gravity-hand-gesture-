lucide.createIcons();

class ParticleApp {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.count = 6000;
    this.positions = null;
    this.currentPositions = null;
    this.targetColor = new THREE.Color(0xff3366);
    this.handOpenness = 0;
    this.handPosition = { x: 0.5, y: 0.5 };
    this.currentTemplate = "hearts";
    this.clock = new THREE.Clock();
    this.time = 0;
    this.mouse = new THREE.Vector2();
    this.isHandsDetected = false;
    this.hands = [];
    this.breakFactor = 0;
    this.lerpSpeed = 0.08;
    this.nameText = "";

    this.initThree();
    this.initParticles();
    this.initMediaPipe();
    this.animate();
    this.setupResize();
  }

  initThree() {
    const container = document.getElementById("canvas-container");
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050505, 0.0025);
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 45;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    window.addEventListener("mousemove", (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  createTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.2, "rgba(255,255,255,0.7)");
    g.addColorStop(0.5, "rgba(255,255,255,0.18)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tx = new THREE.Texture(c);
    tx.needsUpdate = true;
    return tx;
  }

  initParticles() {
    const geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(this.count * 3);
    const colorArray = new Float32Array(this.count * 3);
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      posArray[i3] = (Math.random() - 0.5) * 20;
      posArray[i3 + 1] = (Math.random() - 0.5) * 20;
      posArray[i3 + 2] = (Math.random() - 0.5) * 20;
      colorArray[i3] = 1;
      colorArray[i3 + 1] = 1;
      colorArray[i3 + 2] = 1;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));
    const material = new THREE.PointsMaterial({
      size: 0.55,
      map: this.createTexture(),
      transparent: true,
      opacity: 0.95,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
    this.currentPositions = this.particles.geometry.attributes.position.array;
    this.generateShape(this.currentTemplate);
  }

  generateShape(type) {
    this.positions = new Float32Array(this.count * 3);
    if (type === "hearts") {
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3,
          t = Math.random() * Math.PI * 2,
          r = 8 * Math.sqrt(Math.random());
        let x = r * 16 * Math.pow(Math.sin(t), 3);
        let y =
          r *
          (13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t));
        let z = (Math.random() - 0.5) * r * 3;
        this.positions[i3] = x * 0.05;
        this.positions[i3 + 1] = y * 0.05;
        this.positions[i3 + 2] = z * 0.05;
      }
    } else if (type === "saturn") {
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        if (Math.random() > 0.28) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 9 + Math.random() * 5;
          this.positions[i3] = Math.cos(angle) * radius;
          this.positions[i3 + 2] = Math.sin(angle) * radius;
          this.positions[i3 + 1] = (Math.random() - 0.5) * 0.4;
        } else {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 4;
          this.positions[i3] = r * Math.sin(phi) * Math.cos(theta);
          this.positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          this.positions[i3 + 2] = r * Math.cos(phi);
        }
      }
    } else if (type === "flowers") {
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        const r = 0.28 * Math.sqrt(i) + (Math.random() - 0.5) * 0.16;
        const theta = i * golden;
        this.positions[i3] = r * Math.cos(theta);
        this.positions[i3 + 2] = r * Math.sin(theta);
        this.positions[i3 + 1] = Math.sqrt(Math.abs(r)) * 1.1 - 5;
      }
    } else if (type === "galaxy") {
      const arms = 3 + Math.floor(Math.random() * 2);
      const radiusMax = 18;
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        const r = Math.pow(Math.random(), 0.6) * radiusMax;
        const arm = Math.floor(Math.random() * arms);
        const angle =
          r * 0.5 + arm * ((Math.PI * 2) / arms) + (Math.random() - 0.5) * 0.6;
        const x = Math.cos(angle) * r;
        const y = (Math.random() - 0.5) * 1.5;
        const z = Math.sin(angle) * r;
        const coreBias = Math.exp(-r / 6) * (Math.random() * 2);
        this.positions[i3] = x * (1 + coreBias * 0.05);
        this.positions[i3 + 1] = y + coreBias * 0.12;
        this.positions[i3 + 2] = z * (1 + coreBias * 0.05);
      }
    }

    // Name shape
    if (this.nameText.length > 0) {
      const loader = new THREE.FontLoader();
      loader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
        (font) => {
          const textGeo = new THREE.TextGeometry(this.nameText, {
            font: font,
            size: 2,
            height: 0.1,
          });
          textGeo.center();
          const verts = textGeo.attributes.position.array;
          for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            const vi = ((i % verts.length) / 3) | 0;
            this.positions[i3] = verts[vi * 3] + (Math.random() - 0.5) * 0.5;
            this.positions[i3 + 1] =
              verts[vi * 3 + 1] + (Math.random() - 0.5) * 0.5;
            this.positions[i3 + 2] =
              verts[vi * 3 + 2] + (Math.random() - 0.5) * 0.5;
          }
        }
      );
    }

    // jitter
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.positions[i3] += (Math.random() - 0.5) * 0.01;
      this.positions[i3 + 1] += (Math.random() - 0.5) * 0.01;
      this.positions[i3 + 2] += (Math.random() - 0.5) * 0.01;
    }
  }

  generateNameShape() {
    const input = document.getElementById("name-input");
    this.nameText = input.value.trim();
    this.generateShape("name");
  }

  setTemplate(type) {
    this.currentTemplate = type;
    this.generateShape(type);
    document
      .querySelectorAll(".btn-option")
      .forEach((b) => b.classList.remove("active"));
    const btn = Array.from(document.querySelectorAll(".btn-option")).find(
      (el) => el.getAttribute("onclick")?.includes(`app.setTemplate('${type}')`)
    );
    if (btn) btn.classList.add("active");
  }

  setColor(hex) {
    this.targetColor.setHex(hex);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.time += 0.01;
    const delta = this.clock.getDelta();
    let factor = this.isHandsDetected
      ? 0.6 + this.handOpenness * 2.6
      : 1 + Math.sin(this.time * 2) * 0.18;
    const positions = this.particles.geometry.attributes.position.array;
    const colors = this.particles.geometry.attributes.color.array;
    const screenDiag = Math.sqrt(
      window.innerWidth * window.innerWidth +
        window.innerHeight * window.innerHeight
    );
    const explodeScale =
      THREE.MathUtils.clamp(this.breakFactor, 0, 1) * (screenDiag / 20);
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const tx = this.positions[i3];
      const ty = this.positions[i3 + 1];
      const tz = this.positions[i3 + 2];
      const expansion = factor;
      const seed = Math.sin(i * 12.9898 + this.time * 5.0) * 43758.5453;
      const rnd = seed - Math.floor(seed);
      const angle = rnd * Math.PI * 2;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const dirZ = (rnd - 0.5) * 0.8;
      const bScale = explodeScale * (0.6 + rnd * 0.8);
      const breakX = dirX * bScale;
      const breakY = dirY * bScale * 0.65;
      const breakZ = dirZ * bScale * 0.9;
      const targetX = tx * expansion + breakX;
      const targetY = ty * expansion + breakY;
      const targetZ = tz * expansion + breakZ;
      positions[i3] += (targetX - positions[i3]) * this.lerpSpeed;
      positions[i3 + 1] += (targetY - positions[i3 + 1]) * this.lerpSpeed;
      positions[i3 + 2] += (targetZ - positions[i3 + 2]) * this.lerpSpeed;
      colors[i3] += (this.targetColor.r - colors[i3]) * 0.025;
      colors[i3 + 1] += (this.targetColor.g - colors[i3 + 1]) * 0.025;
      colors[i3 + 2] += (this.targetColor.b - colors[i3 + 2]) * 0.025;
    }

    let targetRotY = this.isHandsDetected
      ? (this.handPosition.x - 0.5) * 2.0
      : this.mouse.x;
    let targetRotX = this.isHandsDetected
      ? (this.handPosition.y - 0.5) * 1.6
      : this.mouse.y;
    this.particles.rotation.y +=
      (targetRotY - this.particles.rotation.y) * 0.06;
    this.particles.rotation.x +=
      (targetRotX - this.particles.rotation.x) * 0.06;
    this.particles.rotation.z += 0.0015;
    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.color.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }

  setupResize() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initMediaPipe() {
    const videoElement = document.getElementById("video-input");
    const canvasElement = document.getElementById("camera-debug");
    canvasElement.width = 640;
    canvasElement.height = 480;
    const canvasCtx = canvasElement.getContext("2d");

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
    hands.onResults((results) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      if (results.image)
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const lm of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, lm, HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 2,
          });
          drawLandmarks(canvasCtx, lm, {
            color: "#FF0000",
            lineWidth: 1,
            radius: 2,
          });
        }
        this.hands = results.multiHandLandmarks;
        this.processTwoHands(this.hands);
        this.isHandsDetected = true;
        document.getElementById("status-dot").className =
          "w-2 h-2 rounded-full bg-green-500 animate-pulse";
        document.getElementById("status-text").innerText = "Hands Connected";
      } else {
        this.hands = [];
        this.isHandsDetected = false;
        document.getElementById("status-dot").className =
          "w-2 h-2 rounded-full bg-red-500 animate-pulse";
        document.getElementById("status-text").innerText =
          "Waiting for hands...";
        this.breakFactor += (0 - this.breakFactor) * 0.06;
      }
      canvasCtx.restore();
    });

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 1280,
      height: 720,
    });
    camera
      .start()
      .then(() => {
        document.getElementById("loading-screen").style.opacity = "0";
        setTimeout(() => {
          document.getElementById("loading-screen").style.display = "none";
        }, 700);
      })
      .catch((err) => {
        console.error(err);
        alert("Camera permission denied — mouse fallback enabled");
        document.getElementById("loading-screen").style.display = "none";
      });
  }

  calcOpenness(hand) {
    const wrist = hand[0];
    const tip = hand[12];
    const d = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    return THREE.MathUtils.clamp((d - 0.18) * 2.8, 0, 1);
  }
  processHandData(landmarks) {
    const wrist = landmarks[0];
    const tip = landmarks[12];
    const dy = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const openness = THREE.MathUtils.clamp((dy - 0.18) * 2.8, 0, 1);
    this.handOpenness += (openness - this.handOpenness) * 0.12;
    this.handPosition = { x: wrist.x, y: wrist.y };
  }
  processTwoHands(hands) {
    if (!hands || hands.length === 0) {
      this.isHandsDetected = false;
      return;
    }
    if (hands.length === 1) {
      this.processHandData(hands[0]);
      this.breakFactor += (0 - this.breakFactor) * 0.06;
      return;
    }
    const wA = hands[0][0];
    const wB = hands[1][0];
    const dx = wA.x - wB.x;
    const dy = wA.y - wB.y;
    const dist = Math.hypot(dx, dy);
    let mapped = (dist - 0.11) * 6.5;
    mapped = THREE.MathUtils.clamp(mapped, 0, 1);
    this.breakFactor += (mapped - this.breakFactor) * 0.14;
    this.handPosition.x = (wA.x + wB.x) / 2;
    this.handPosition.y = (wA.y + wB.y) / 2;
    const avgOpen =
      (this.calcOpenness(hands[0]) + this.calcOpenness(hands[1])) / 2;
    this.handOpenness += (avgOpen - this.handOpenness) * 0.12;
  }
}

const app = new ParticleApp();
window.app = app;

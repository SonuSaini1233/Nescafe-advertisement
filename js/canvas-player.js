/**
 * NESCAFÉ Cold Brew Atelier - Canvas Video Sequence Player
 * 60fps dual-buffer interpolation engine driven directly by user scroll
 */

class CanvasPlayer {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.totalFrames = options.totalFrames || 179;
    this.framePathPattern = options.framePathPattern || './ezgif-872002fbc489ccec-jpg/ezgif-frame-{index}.jpg';

    this.images = new Array(this.totalFrames);
    this.loadedCount = 0;
    this.isInitialReady = false;
    this.allLoaded = false;
    this.hasDrawnFirst = false;

    // Scroll-driven playback state
    this.targetFrame = 0;
    this.currentFrame = 0;

    // Parallax mouse offsets
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    // Previous frame tracking for SFX triggers
    this.prevFrameRounded = 0;

    // Canvas scaling
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvasWidth = 0;
    this.canvasHeight = 0;

    // Callbacks
    this.onProgress = options.onProgress || null;
    this.onFrameUpdate = options.onFrameUpdate || null;
    this.onReady = options.onReady || null;

    this._init();
  }

  _init() {
    this._handleResize();
    window.addEventListener('resize', () => this._handleResize(), { passive: true });

    // Track mouse for 3D parallax
    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      this.targetMouseX = nx * 14; // max 14px shift
      this.targetMouseY = ny * 10;
    }, { passive: true });

    // Start preloading all 179 frames in parallel
    this._preloadAllImages();

    // Start 60fps render loop
    requestAnimationFrame((ts) => this._renderLoop(ts));
  }

  _formatFrameFilename(index) {
    const padded = String(index).padStart(3, '0');
    return this.framePathPattern.replace('{index}', padded);
  }

  _preloadAllImages() {
    let completed = 0;
    const total = this.totalFrames;

    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.src = this._formatFrameFilename(i + 1);

      const handleLoad = () => {
        this.images[i] = img;
        completed++;
        this.loadedCount = completed;

        if (this.onProgress) {
          this.onProgress(completed / total);
        }

        // Draw initial frame as soon as frame 1 arrives
        if (i === 0 && !this.isInitialReady) {
          this.isInitialReady = true;
          this._drawFrame(0);
        }

        // Dismiss preloader once critical threshold (or 100%) is ready
        if (completed >= Math.floor(total * 0.95) && !this.allLoaded) {
          this.allLoaded = true;
          if (this.onReady) {
            this.onReady();
          }
        }
      };

      img.onload = handleLoad;
      img.onerror = () => {
        console.warn(`Frame ${i + 1} failed to load, falling back`);
        handleLoad();
      };
    }
  }

  _handleResize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;

    this.canvas.width = this.canvasWidth * this.dpr;
    this.canvas.height = this.canvasHeight * this.dpr;
    this.canvas.style.width = `${this.canvasWidth}px`;
    this.canvas.style.height = `${this.canvasHeight}px`;

    this.ctx.scale(this.dpr, this.dpr);
    this._drawFrame(this.currentFrame);
  }

  setTargetFrame(frame) {
    this.targetFrame = Math.max(0, Math.min(this.totalFrames - 1, frame));
  }

  setProgress(progress) {
    const frame = progress * (this.totalFrames - 1);
    this.setTargetFrame(frame);
  }

  _renderLoop() {
    // Smooth mouse parallax lerp
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;

    // Responsive lerp interpolation towards target frame
    // 0.40 provides immediate, tight lockstep with the user's scroll wheel
    const prevFrame = this.currentFrame;
    this.currentFrame += (this.targetFrame - this.currentFrame) * 0.40;

    // Trigger audio SFX at specific cinematic moments during scroll
    const curRounded = Math.round(this.currentFrame);
    if (curRounded !== this.prevFrameRounded) {
      if (window.soundEngine) {
        // Ice falls into glass around frame 72-78
        if (curRounded >= 72 && this.prevFrameRounded < 72) {
          window.soundEngine.playIceClink(1.0);
        }
        // Splash impact erupts around frame 115-122
        if (curRounded >= 115 && this.prevFrameRounded < 115) {
          window.soundEngine.playSplash();
        }
        // Secondary droplet rebound clink around frame 145
        if (curRounded >= 145 && this.prevFrameRounded < 145) {
          window.soundEngine.playIceClink(1.25);
        }
      }
      this.prevFrameRounded = curRounded;
    }

    // Draw if there's any scroll movement or mouse parallax
    if (!this.hasDrawnFirst || Math.abs(this.currentFrame - prevFrame) > 0.0001 || Math.abs(this.targetMouseX - this.mouseX) > 0.05) {
      this.hasDrawnFirst = true;
      this._drawFrame(this.currentFrame);
      if (this.onFrameUpdate) {
        this.onFrameUpdate(this.currentFrame, this.currentFrame / (this.totalFrames - 1));
      }
    }

    requestAnimationFrame(() => this._renderLoop());
  }

  _drawFrame(frameVal) {
    if (!this.isInitialReady) return;

    const baseIndex = Math.floor(frameVal);
    const nextIndex = Math.min(this.totalFrames - 1, baseIndex + 1);
    const alphaRatio = frameVal - baseIndex;

    const img1 = this.images[baseIndex] || this._findNearestImage(baseIndex);
    const img2 = this.images[nextIndex] || this._findNearestImage(nextIndex);

    if (!img1) return;

    const cw = this.canvasWidth;
    const ch = this.canvasHeight;
    const iw = 1920;
    const ih = 1080;

    // Cover math: scale active content (820px) so tabletop and glass fill edge-to-edge
    const scale = Math.max(cw / iw, ch / 820) * 1.06;

    // Subtle cinematic zoom during the splash apex (frames 80 to 150)
    let dynamicZoom = 1.0;
    if (frameVal >= 80 && frameVal <= 150) {
      const apexDist = Math.abs(frameVal - 118) / 35; // 0 at frame 118, 1 at edges
      const zoomFactor = Math.max(0, 1 - apexDist);
      dynamicZoom = 1.0 + (zoomFactor * 0.038); // max 3.8% camera push-in
    }

    const totalScale = scale * dynamicZoom;
    const dw = iw * totalScale;
    const dh = ih * totalScale;

    // Center image with slight downward bias so reflections reach bottom edge + mouse parallax
    const dx = (cw - dw) / 2 + this.mouseX;
    const dy = (ch - dh) / 2 + 18 + this.mouseY;

    this.ctx.save();

    // Clear background with deep obsidian tone
    this.ctx.fillStyle = '#08090a';
    this.ctx.fillRect(0, 0, cw, ch);

    // 1. Draw base frame
    this.ctx.globalAlpha = 1.0;
    this.ctx.drawImage(img1, dx, dy, dw, dh);

    // 2. Dual-frame crossfade blending for buttery continuous interpolation
    if (alphaRatio > 0.01 && img2 && img2 !== img1) {
      this.ctx.globalAlpha = alphaRatio;
      this.ctx.drawImage(img2, dx, dy, dw, dh);
    }

    // 3. Subtle cinematic radial vignette to blend glass edges into dark UI
    this.ctx.globalAlpha = 1.0;
    const grad = this.ctx.createRadialGradient(
      cw / 2, ch * 0.52, Math.min(cw, ch) * 0.32,
      cw / 2, ch * 0.52, Math.max(cw, ch) * 0.78
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.72, 'rgba(8, 9, 10, 0.25)');
    grad.addColorStop(1, 'rgba(8, 9, 10, 0.85)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, cw, ch);

    // 4. Subtle top letterbox soft fade behind nav bar
    const topBar = this.ctx.createLinearGradient(0, 0, 0, 100);
    topBar.addColorStop(0, 'rgba(8, 9, 10, 0.85)');
    topBar.addColorStop(1, 'rgba(8, 9, 10, 0)');
    this.ctx.fillStyle = topBar;
    this.ctx.fillRect(0, 0, cw, 100);

    // 5. Soft bottom feather for seamless blending into following sections
    const botEdge = this.ctx.createLinearGradient(0, ch - 60, 0, ch);
    botEdge.addColorStop(0, 'rgba(7, 8, 10, 0)');
    botEdge.addColorStop(1, 'rgba(7, 8, 10, 1)');
    this.ctx.fillStyle = botEdge;
    this.ctx.fillRect(0, ch - 60, cw, 60);

    this.ctx.restore();
  }

  _findNearestImage(targetIdx) {
    if (this.images[targetIdx]) return this.images[targetIdx];
    // Search backward
    for (let i = targetIdx - 1; i >= 0; i--) {
      if (this.images[i]) return this.images[i];
    }
    // Search forward
    for (let i = targetIdx + 1; i < this.totalFrames; i++) {
      if (this.images[i]) return this.images[i];
    }
    return null;
  }
}

window.CanvasPlayer = CanvasPlayer;

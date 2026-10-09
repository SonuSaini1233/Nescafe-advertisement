/**
 * NESCAFÉ Cold Brew Atelier - Interactions & UI Orchestration
 * Pure Scroll-Driven Cinematic Experience
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const heroSection = document.getElementById('hero-scroller');
  const progressBar = document.getElementById('loading-progress-bar');
  const loaderOverlay = document.getElementById('loader-overlay');
  const loaderPercent = document.getElementById('loader-percent');
  const scrollPromptCue = document.getElementById('scroll-prompt-cue');

  // Audio Toggle in Header
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioWaveVisuals = document.querySelectorAll('.sound-wave');

  // Narrative Story Cards (Popups that appear during scroll)
  const storyCards = document.querySelectorAll('.hero-story-card');

  // Initialize Canvas Player with scroll sync
  const player = new CanvasPlayer('hero-canvas', {
    totalFrames: 179,
    framePathPattern: './ezgif-872002fbc489ccec-jpg/ezgif-frame-{index}.jpg',
    onProgress: (ratio) => {
      const pct = Math.floor(ratio * 100);
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (loaderPercent) loaderPercent.textContent = `${pct}%`;
    },
    onReady: () => {
      // Fade out loader smoothly once frames are ready
      setTimeout(() => {
        if (loaderOverlay) {
          loaderOverlay.classList.add('loaded');
          setTimeout(() => {
            if (loaderOverlay && loaderOverlay.parentNode) {
              loaderOverlay.parentNode.removeChild(loaderOverlay);
            }
          }, 350);
        }
        // Sync initial scroll position immediately
        handleScroll();
      }, 150);
    },
    onFrameUpdate: (curFrame, progress) => {
      updateActiveCards(progress);
    }
  });

  window.nescafePlayer = player;

  // --- Scroll-Driven Background Frame Progression ---
  function handleScroll() {
    if (!heroSection) return;

    const rect = heroSection.getBoundingClientRect();
    const totalScroll = heroSection.offsetHeight - window.innerHeight;
    const currentScroll = -rect.top;

    if (totalScroll <= 0) return;

    // Direct scroll-to-progress mapping: 0.0 at top to 1.0 at bottom of hero
    const progress = Math.max(0, Math.min(1, currentScroll / totalScroll));
    player.setProgress(progress);
    updateActiveCards(progress);

    // Gently fade out scroll prompt once scrolling commences
    if (scrollPromptCue) {
      if (currentScroll > 60) {
        scrollPromptCue.style.opacity = '0';
        scrollPromptCue.style.pointerEvents = 'none';
      } else {
        scrollPromptCue.style.opacity = '1';
        scrollPromptCue.style.pointerEvents = 'auto';
      }
    }
  }

  // Bind scroll, wheel, and resize events for immediate response
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('wheel', handleScroll, { passive: true });
  window.addEventListener('resize', handleScroll, { passive: true });

  // Initial call
  handleScroll();

  // --- Sync Narrative Story Pop-Up Cards with Scroll Progress ---
  function updateActiveCards(progress) {
    let activeCardIndex = -1;

    // 4 Distinct Cinematic Chapters
    if (progress < 0.24) {
      activeCardIndex = 0; // Card 1: 01 / 24H EXTRACTION (Elevate Your Cold Brew)
    } else if (progress < 0.49) {
      activeCardIndex = 1; // Card 2: 02 / THE CASCADE (Crystalline Ice Descent)
    } else if (progress < 0.74) {
      activeCardIndex = 2; // Card 3: 03 / THE KINETIC IMPACT (Kinetic Crown Hydraulics)
    } else if (progress < 0.94) {
      activeCardIndex = 3; // Card 4: 04 / HARMONIC EQUILIBRIUM (Settle into Pure Silk)
    } else {
      activeCardIndex = -1; // Smoothly fade out Card 4 as user transitions into product experience
    }

    // Toggle active state for pop-up narrative cards
    storyCards.forEach((card, idx) => {
      if (idx === activeCardIndex) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  // --- Sound Engine Toggle in Header ---
  function toggleAudio() {
    if (!window.soundEngine) return;
    const isNowPlaying = window.soundEngine.toggleSound();

    audioWaveVisuals.forEach(visual => {
      if (isNowPlaying) {
        visual.classList.add('playing');
      } else {
        visual.classList.remove('playing');
      }
    });

    const labelTexts = document.querySelectorAll('.sound-status-text');
    labelTexts.forEach(el => {
      el.textContent = isNowPlaying ? 'Sound Active' : 'Sound Off';
    });
  }

  if (audioToggleBtn) audioToggleBtn.addEventListener('click', toggleAudio);

  // --- Smooth Magnetic Luxury Glow Cursor ---
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorGlow = document.querySelector('.cursor-glow');
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;
  let targetCursorX = cursorX;
  let targetCursorY = cursorY;

  window.addEventListener('mousemove', (e) => {
    targetCursorX = e.clientX;
    targetCursorY = e.clientY;
  }, { passive: true });

  function renderCursor() {
    cursorX += (targetCursorX - cursorX) * 0.25;
    cursorY += (targetCursorY - cursorY) * 0.12;

    if (cursorDot) {
      cursorDot.style.transform = `translate3d(${targetCursorX}px, ${targetCursorY}px, 0)`;
    }
    if (cursorGlow) {
      cursorGlow.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    }
    requestAnimationFrame(renderCursor);
  }
  renderCursor();

  // Expand cursor on interactive hover
  const interactiveElements = document.querySelectorAll('button, a, input, .card-interactive, .stage-pill, input[type="range"]');
  interactiveElements.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      if (cursorGlow) cursorGlow.classList.add('cursor-expanded');
    });
    el.addEventListener('mouseleave', () => {
      if (cursorGlow) cursorGlow.classList.remove('cursor-expanded');
    });
  });

  // --- Interactive Product Lens (Section 1) ---
  const lensButtons = document.querySelectorAll('.lens-tab-btn');
  const lensImage = document.getElementById('lens-showcase-img');
  const lensTitle = document.getElementById('lens-caption-title');
  const lensDesc = document.getElementById('lens-caption-desc');
  const lensCard = document.querySelector('.lens-preview-card');

  const lensData = {
    cascade: {
      src: './ezgif-872002fbc489ccec-jpg/ezgif-frame-015.jpg',
      title: 'Micro-Cream Gravity Cascades',
      desc: 'Highland cream filtered to microscopic density, sinking through cold coffee in hypnotic Brownian swirls without rapid phase separation.'
    },
    ice: {
      src: './ezgif-872002fbc489ccec-jpg/ezgif-frame-075.jpg',
      title: 'Sub-Zero Crystal Geometry',
      desc: 'Triple-filtered mountain water frozen at -18°C. Extreme crystal density yields a 3x slower melt cycle, keeping peak concentration intact.'
    },
    splash: {
      src: './ezgif-872002fbc489ccec-jpg/ezgif-frame-130.jpg',
      title: 'Kinetic Crema Apex',
      desc: 'The shockwave of glacial impact creates an aerodynamic liquid crown, atomizing aromatic volatile esters directly into the senses.'
    }
  };

  lensButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      lensButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.lens;
      const data = lensData[key];
      if (data && lensImage) {
        lensImage.style.opacity = '0.3';
        lensImage.style.transform = 'scale(0.97)';
        setTimeout(() => {
          lensImage.src = data.src;
          if (lensTitle) lensTitle.textContent = data.title;
          if (lensDesc) lensDesc.textContent = data.desc;
          lensImage.style.opacity = '1';
          lensImage.style.transform = 'scale(1)';
        }, 180);
      }
      if (window.soundEngine) window.soundEngine.playClick();
    });
  });

  // Interactive Lens Spotlight / Zoom on Mouse Move
  if (lensCard && lensImage) {
    lensCard.addEventListener('mousemove', (e) => {
      const rect = lensCard.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      lensImage.style.transformOrigin = `${x}% ${y}%`;
      lensImage.style.transform = 'scale(1.28)';
    });

    lensCard.addEventListener('mouseleave', () => {
      lensImage.style.transformOrigin = 'center center';
      lensImage.style.transform = 'scale(1)';
    });
  }

  // --- Story Text Word Glow Reveal on Scroll (Section 3) ---
  const storyLines = document.querySelectorAll('.story-reveal-line');

  function updateStoryWordReveal() {
    const triggerBottom = window.innerHeight * 0.85;
    const triggerTop = window.innerHeight * 0.2;

    storyLines.forEach(line => {
      const rect = line.getBoundingClientRect();
      if (rect.top < triggerBottom && rect.bottom > triggerTop) {
        const visibleRatio = 1 - (rect.top - triggerTop) / (triggerBottom - triggerTop);
        const clamped = Math.max(0.2, Math.min(1.0, visibleRatio * 1.3));
        line.style.opacity = clamped;
        line.style.transform = `translateY(${(1 - clamped) * 12}px)`;
        if (clamped > 0.8) {
          line.classList.add('illuminated');
        }
      }
    });
  }

  window.addEventListener('scroll', updateStoryWordReveal, { passive: true });
  updateStoryWordReveal();

  // --- Sensory Profile Flavor Radar Interactive (Section 2) ---
  const flavorData = {
    classic: { sweet: 25, acidity: 15, body: 95, roast: 90, aroma: 85, color: '#d4a359' },
    vanilla: { sweet: 75, acidity: 20, body: 80, roast: 65, aroma: 95, color: '#f3d49b' },
    hazelnut: { sweet: 60, acidity: 10, body: 85, roast: 75, aroma: 90, color: '#e2a36b' },
    cacao: { sweet: 40, acidity: 12, body: 100, roast: 95, aroma: 98, color: '#c47847' }
  };

  const flavorPills = document.querySelectorAll('.flavor-select-pill');
  const radarPolygon = document.getElementById('radar-polygon');
  const statBars = document.querySelectorAll('.flavor-stat-fill');

  function updateFlavorDisplay(profileKey) {
    const data = flavorData[profileKey];
    if (!data) return;

    const cx = 150, cy = 150, maxR = 100;
    const angles = [
      -Math.PI / 2,
      -Math.PI / 2 + (2 * Math.PI / 5),
      -Math.PI / 2 + (4 * Math.PI / 5),
      -Math.PI / 2 + (6 * Math.PI / 5),
      -Math.PI / 2 + (8 * Math.PI / 5)
    ];

    const vals = [
      data.sweet / 100,
      data.acidity / 100,
      data.body / 100,
      data.roast / 100,
      data.aroma / 100
    ];

    const points = angles.map((ang, i) => {
      const r = vals[i] * maxR;
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    if (radarPolygon) {
      radarPolygon.setAttribute('points', points);
      radarPolygon.style.stroke = data.color;
      radarPolygon.style.fill = data.color + '33';
    }

    statBars.forEach(bar => {
      const metric = bar.dataset.metric;
      if (metric && data[metric] !== undefined) {
        bar.style.width = `${data[metric]}%`;
        bar.style.backgroundColor = data.color;
      }
    });
  }

  flavorPills.forEach(pill => {
    pill.addEventListener('click', () => {
      flavorPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      updateFlavorDisplay(pill.dataset.blend);
      if (window.soundEngine) window.soundEngine.playClick();
    });
  });

  updateFlavorDisplay('classic');

  // --- Interactive Atelier Studio (Section 5) ---
  const atelierBaseBtns = document.querySelectorAll('.atelier-base-btn');
  const atelierInfusionBtns = document.querySelectorAll('.atelier-infusion-btn');
  const atelierCreamSlider = document.getElementById('atelier-cream-slider');
  const atelierIceBtns = document.querySelectorAll('.atelier-ice-btn');

  const atelierCreamLayer = document.getElementById('atelier-cream-layer');
  const atelierRecipeCard = document.getElementById('atelier-recipe-summary');
  const atelierBatchId = document.getElementById('atelier-batch-code');

  let currentRecipe = {
    base: 'Noir Reserve (Dark Roast)',
    infusion: 'Pure Reserve (Zero Sugar)',
    cream: 25,
    ice: '3 Crystalline Cubes'
  };

  function updateAtelierPreview() {
    if (atelierRecipeCard) {
      atelierRecipeCard.innerHTML = `
        <div class="recipe-row"><span>Base:</span><strong>${currentRecipe.base}</strong></div>
        <div class="recipe-row"><span>Infusion:</span><strong>${currentRecipe.infusion}</strong></div>
        <div class="recipe-row"><span>Cream Ratio:</span><strong>${currentRecipe.cream}% Micro-Cloud</strong></div>
        <div class="recipe-row"><span>Ice Matrix:</span><strong>${currentRecipe.ice}</strong></div>
      `;
    }

    if (atelierBatchId) {
      const codeNum = 8400 + Math.floor(currentRecipe.cream * 7.4);
      atelierBatchId.textContent = `BATCH #NC-${codeNum}`;
    }

    if (atelierCreamLayer) {
      atelierCreamLayer.style.height = `${Math.max(8, currentRecipe.cream * 0.9)}%`;
      atelierCreamLayer.style.opacity = (currentRecipe.cream / 100) * 0.9 + 0.1;
    }
  }

  atelierBaseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      atelierBaseBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRecipe.base = btn.dataset.value;
      updateAtelierPreview();
      if (window.soundEngine) window.soundEngine.playClick();
    });
  });

  atelierInfusionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      atelierInfusionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRecipe.infusion = btn.dataset.value;
      updateAtelierPreview();
      if (window.soundEngine) window.soundEngine.playClick();
    });
  });

  if (atelierCreamSlider) {
    atelierCreamSlider.addEventListener('input', (e) => {
      currentRecipe.cream = parseInt(e.target.value, 10);
      const label = document.getElementById('atelier-cream-val');
      if (label) label.textContent = `${currentRecipe.cream}%`;
      updateAtelierPreview();
    });
  }

  atelierIceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      atelierIceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRecipe.ice = btn.dataset.value;
      updateAtelierPreview();
      if (window.soundEngine) window.soundEngine.playIceClink();
    });
  });

  updateAtelierPreview();

  // --- Modal Drawer for Variant Details & Reserve Allocation ---
  const modalOverlay = document.getElementById('tasting-modal');
  const modalTitle = document.getElementById('modal-variant-title');
  const modalDesc = document.getElementById('modal-variant-desc');
  const modalNotes = document.getElementById('modal-tasting-notes');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const variantCards = document.querySelectorAll('.variant-card');

  const variantDetailsMap = {
    'noir': {
      title: 'NESCAFÉ Classic Noir Reserve',
      desc: 'Our archetype cold brew. 100% Ethiopian Yirgacheffe and Colombian Huila beans cold-steeped for 24 hours under inert nitrogen. Deep, resonant, and remarkably smooth with zero harsh acidity.',
      notes: ['Bittersweet Cacao', 'Smoked White Cedar', 'Roasted Pecan', 'Dark Molasses']
    },
    'vanilla': {
      title: 'Bourbon Vanilla Velvet',
      desc: 'Sun-cured whole Madagascar Bourbon vanilla beans cold-macerated within the 24-hour brew cycle. Sweet aromatic elegance married to velvety creaminess.',
      notes: ['Madagascar Vanilla', 'Toasted Marshmallow', 'Wildflower Honey', 'Highland Cream']
    },
    'hazelnut': {
      title: 'Toasted Hazelnut Mist',
      desc: 'Piedmont hazelnuts gently dry-roasted to golden amber, creating a fragrant warm pastry aroma balanced against a crisp, refreshing chilled coffee body.',
      notes: ['Piedmont Hazelnut', 'Warm Brioche', 'Toffee Crunch', 'Almond Milk']
    },
    'cacao': {
      title: 'Dark Cacao & Sea Salt Atelier',
      desc: 'Single-origin 72% Ecuadorian Arriba cocoa nibs steeped directly into the cold coffee matrix, finished with hand-harvested Atlantic fleur de sel.',
      notes: ['72% Arriba Cocoa', 'Atlantic Fleur de Sel', 'Dark Fudge', 'Velvet Crema']
    }
  };

  variantCards.forEach(card => {
    const btn = card.querySelector('.btn-view-notes');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const vKey = card.dataset.variant;
        const info = variantDetailsMap[vKey];
        if (info && modalOverlay) {
          if (modalTitle) modalTitle.textContent = info.title;
          if (modalDesc) modalDesc.textContent = info.desc;
          if (modalNotes) {
            modalNotes.innerHTML = info.notes.map(n => `<span class="tag-pill">${n}</span>`).join('');
          }
          modalOverlay.classList.add('open');
          if (window.soundEngine) window.soundEngine.playClick();
        }
      });
    }
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      modalOverlay.classList.remove('open');
      if (window.soundEngine) window.soundEngine.playClick();
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('open');
      }
    });
  }

  // --- Reserve Reservation Form Submit ---
  const reservationForm = document.getElementById('reservation-form');
  const reservationSuccess = document.getElementById('reservation-success');

  if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = reservationForm.querySelector('input[type="email"]');
      if (!emailInput || !emailInput.value) return;

      if (window.soundEngine) {
        window.soundEngine.playSplash();
        setTimeout(() => window.soundEngine.playIceClink(), 150);
      }

      reservationForm.style.display = 'none';
      if (reservationSuccess) {
        reservationSuccess.style.display = 'block';
        reservationSuccess.classList.add('animate-in');
      }
    });
  }

  // --- 3D Tilt Effect on Variant Cards ---
  variantCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotX = -(y / rect.height) * 12;
      const rotY = (x / rect.width) * 12;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
});

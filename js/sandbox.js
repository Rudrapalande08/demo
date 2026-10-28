/**
 * sandbox.js
 * Intelligent Lifting Form & Biomechanics Advisor.
 * Analyzes Squat and Deadlift form, stance, bar path, and safety protocols
 * based dynamically on user Age, Body Weight, Height, and Joint Sensitivity.
 */

class BiomechanicsSandbox {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.activeExercise = 'squat'; // 'squat' or 'deadlift'
    this.animProgress = 0;
    this.animDirection = 1;
    this.animId = null;
    
    // UI Elements
    this.btnSquat = document.getElementById('sandbox-btn-squat');
    this.btnDeadlift = document.getElementById('sandbox-btn-deadlift');
    this.variantSelect = document.getElementById('sandbox-variant');
    
    this.ageSlider = document.getElementById('slider-sandbox-age');
    this.weightSlider = document.getElementById('slider-sandbox-weight');
    this.heightSlider = document.getElementById('slider-sandbox-height');
    this.sensitivitySelect = document.getElementById('sandbox-sensitivity');
    
    this.ageLbl = document.getElementById('lbl-sandbox-age');
    this.weightLbl = document.getElementById('lbl-sandbox-weight');
    this.heightLbl = document.getElementById('lbl-sandbox-height');
    
    this.analysisTitle = document.getElementById('sandbox-analysis-title');
    this.analysisSubtitle = document.getElementById('sandbox-analysis-subtitle');
    this.safetyBadge = document.getElementById('sandbox-safety-badge');
    this.leverageTag = document.getElementById('sandbox-leverage-tag');
    this.liveTips = document.getElementById('sandbox-live-tips');
    
    this.stanceVal = document.getElementById('sandbox-stance-val');
    this.stanceDetail = document.getElementById('sandbox-stance-detail');
    this.barVal = document.getElementById('sandbox-bar-val');
    this.barDetail = document.getElementById('sandbox-bar-detail');
    this.depthVal = document.getElementById('sandbox-depth-val');
    this.depthDetail = document.getElementById('sandbox-depth-detail');
    
    this.ageGroupLbl = document.getElementById('sandbox-age-group');
    this.ageDescLbl = document.getElementById('sandbox-age-desc');
    this.weightGroupLbl = document.getElementById('sandbox-weight-group');
    this.weightDescLbl = document.getElementById('sandbox-weight-desc');
    
    this.phaseContainer = document.getElementById('sandbox-phase-container');
    this.pitfallsList = document.getElementById('sandbox-pitfalls-list');
    this.animPhaseLbl = document.getElementById('sandbox-anim-phase');
    
    this.init();
  }
  
  init() {
    this.resizeCanvas();
    this.populateVariants();
    this.bindEvents();
    this.updateAnalysis();
    this.startAnimationLoop();
    
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
  }
  
  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.parentElement.clientWidth || 360;
    this.canvas.height = this.canvas.parentElement.clientHeight || 220;
  }
  
  populateVariants() {
    if (!this.variantSelect) return;
    this.variantSelect.innerHTML = '';
    
    if (this.activeExercise === 'squat') {
      const opts = [
        { val: 'highbar', text: 'Barbell Back Squat (High Bar - Olympic Standard)' },
        { val: 'lowbar', text: 'Barbell Back Squat (Low Bar - Powerlifting Style)' },
        { val: 'front', text: 'Front Squat (Upright Torso - Quad Focus)' },
        { val: 'box', text: 'Box Squat (Controlled Joint Acceleration)' }
      ];
      opts.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.val;
        opt.innerText = o.text;
        this.variantSelect.appendChild(opt);
      });
    } else {
      const opts = [
        { val: 'conventional', text: 'Conventional Deadlift (Standard Hip Hinge)' },
        { val: 'sumo', text: 'Sumo Deadlift (Wide Stance - Upright Torso)' },
        { val: 'trapbar', text: 'Trap / Hex Bar Deadlift (Lowest Lumbar Shear)' },
        { val: 'romanian', text: 'Romanian Deadlift (Hamstring Hypertrophy)' }
      ];
      opts.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.val;
        opt.innerText = o.text;
        this.variantSelect.appendChild(opt);
      });
    }
  }
  
  bindEvents() {
    const update = () => {
      this.updateLabels();
      this.updateAnalysis();
    };
    
    if (this.ageSlider) this.ageSlider.addEventListener('input', update);
    if (this.weightSlider) this.weightSlider.addEventListener('input', update);
    if (this.heightSlider) this.heightSlider.addEventListener('input', update);
    if (this.variantSelect) this.variantSelect.addEventListener('change', update);
    if (this.sensitivitySelect) this.sensitivitySelect.addEventListener('change', update);
    
    if (this.btnSquat) {
      this.btnSquat.addEventListener('click', () => {
        this.setExercise('squat');
      });
    }
    
    if (this.btnDeadlift) {
      this.btnDeadlift.addEventListener('click', () => {
        this.setExercise('deadlift');
      });
    }
  }
  
  setExercise(type) {
    this.activeExercise = type;
    
    if (type === 'squat') {
      this.btnSquat.classList.add('active');
      this.btnDeadlift.classList.remove('active');
    } else {
      this.btnDeadlift.classList.add('active');
      this.btnSquat.classList.remove('active');
    }
    
    this.populateVariants();
    this.updateAnalysis();
    
    if (window.app) {
      window.app.telemetryLog(`Form Advisor calibrated for ${type.toUpperCase()} execution protocol.`);
    }
  }
  
  updateLabels() {
    const age = this.ageSlider.value;
    const weight = this.weightSlider.value;
    const height = this.heightSlider.value;
    
    if (this.ageLbl) this.ageLbl.innerText = `${age} yrs`;
    if (this.weightLbl) this.weightLbl.innerText = `${weight} kg`;
    if (this.heightLbl) this.heightLbl.innerText = `${height} cm`;
  }
  
  updateAnalysis() {
    const age = parseInt(this.ageSlider.value);
    const weight = parseFloat(this.weightSlider.value);
    const height = parseFloat(this.heightSlider.value);
    const variant = this.variantSelect ? this.variantSelect.value : 'highbar';
    const sensitivity = this.sensitivitySelect ? this.sensitivitySelect.value : 'none';
    
    const isSquat = this.activeExercise === 'squat';
    const exerciseName = isSquat ? 'Squat' : 'Deadlift';
    
    // 1. Diagnostic Title & Subtitle
    if (this.analysisTitle) {
      this.analysisTitle.innerText = `Customized ${exerciseName} Protocol (${this.getVariantLabel(variant)})`;
    }
    if (this.analysisSubtitle) {
      this.analysisSubtitle.innerText = `Biomechanical calibration for ${age}-year-old, ${weight} kg lifter (${height} cm)`;
    }
    
    // 2. Safety & Risk Classification
    let safetyText = "OPTIMAL SAFETY";
    let safetyClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
    if (sensitivity === 'back') {
      safetyText = "LUMBAR PROTECTION PROTOCOL";
      safetyClass = "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30";
    } else if (age > 48 || sensitivity === 'knee') {
      safetyText = "JOINT PRESERVATION MODE";
      safetyClass = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30";
    }
    if (this.safetyBadge) {
      this.safetyBadge.innerText = safetyText;
      this.safetyBadge.className = `self-start sm:self-auto text-[10px] font-mono px-3 py-1 rounded-full font-bold ${safetyClass}`;
    }
    
    // 3. Leverage Assessment
    const bmi = weight / Math.pow(height / 100, 2);
    let leverageText = "Balanced Femur/Torso Leverage";
    let tipText = "Symmetrical lever arm. Barbell aligns naturally over the midfoot tripod.";
    
    if (height > 185) {
      leverageText = "Long Femur Leverage";
      tipText = isSquat 
        ? "Longer femurs increase torso forward lean. Widen your stance by 10-15% and flare toes to allow hips to sink cleanly between legs."
        : "Long limbs favor deadlifts! Keep hips back and engage lats aggressively before breaking the floor.";
    } else if (height < 168) {
      leverageText = "Compact Leverage Advantage";
      tipText = isSquat
        ? "Favorable short femurs allow an upright torso with minimal lower back shear stress. High-bar depth comes naturally."
        : "Shorter reach requires steady shin contact and a patient leg press drive off the floor.";
    }
    
    if (this.leverageTag) this.leverageTag.innerText = leverageText;
    if (this.liveTips) this.liveTips.innerText = tipText;
    
    // 4. Stance, Bar Placement & Depth
    this.calculateStanceAndBar(isSquat, variant, weight, height, sensitivity);
    
    // 5. Age-Specific Directives
    this.calculateAgeDirective(age, isSquat);
    
    // 6. Weight-Specific Directives
    this.calculateWeightDirective(weight, height, isSquat);
    
    // 7. Render 4-Phase Step-by-Step Blueprint
    this.renderPhases(isSquat, variant, age, weight);
    
    // 8. Render Common Pitfalls & Cues
    this.renderPitfalls(isSquat, variant, sensitivity);
  }
  
  getVariantLabel(variant) {
    const map = {
      'highbar': 'High Bar',
      'lowbar': 'Low Bar',
      'front': 'Front Squat',
      'box': 'Box Squat',
      'conventional': 'Conventional',
      'sumo': 'Sumo',
      'trapbar': 'Trap Bar',
      'romanian': 'Romanian'
    };
    return map[variant] || 'Standard';
  }
  
  calculateStanceAndBar(isSquat, variant, weight, height, sensitivity) {
    if (isSquat) {
      if (variant === 'front') {
        if (this.stanceVal) this.stanceVal.innerText = "Shoulder Width (~40-45 cm)";
        if (this.stanceDetail) this.stanceDetail.innerText = "15°–20° Toe Flare, Knees Forward";
        if (this.barVal) this.barVal.innerText = "Anterior Deltoid Shelf";
        if (this.barDetail) this.barDetail.innerText = "Fingertip or Cross-Arm, Elbows High";
        if (this.depthVal) this.depthVal.innerText = "Deep Olympic (Full ATG)";
        if (this.depthDetail) this.depthDetail.innerText = "Hip crease well below knee cap";
      } else if (variant === 'lowbar') {
        const widthCm = Math.round(height * 0.28);
        if (this.stanceVal) this.stanceVal.innerText = `Wide Stance (~${widthCm} cm)`;
        if (this.stanceDetail) this.stanceDetail.innerText = "25°–30° Outward Toe Flare";
        if (this.barVal) this.barVal.innerText = "Across Rear Delts (Low Shelf)";
        if (this.barDetail) this.barDetail.innerText = "Thumbless wide grip, tight upper back";
        if (this.depthVal) this.depthVal.innerText = "Powerlifting Parallel (90°)";
        if (this.depthDetail) this.depthDetail.innerText = "Hip crease level with knee joint";
      } else {
        // High Bar standard
        const widthCm = Math.round(height * 0.25);
        if (this.stanceVal) this.stanceVal.innerText = `Shoulder Width (~${widthCm} cm)`;
        if (this.stanceDetail) this.stanceDetail.innerText = "15°–20° Toe Outward Flare";
        if (this.barVal) this.barVal.innerText = "Upper Trapezius Ridge";
        if (this.barDetail) this.barDetail.innerText = "Thumbs around, elbows pulled down";
        if (this.depthVal) this.depthVal.innerText = sensitivity === 'knee' ? "Box Parallel (90°)" : "Full Parallel (95°)";
        if (this.depthDetail) this.depthDetail.innerText = "Crease slightly below knee top";
      }
    } else {
      // Deadlift
      if (variant === 'sumo') {
        if (this.stanceVal) this.stanceVal.innerText = "Very Wide (~1.6x Shoulder)";
        if (this.stanceDetail) this.stanceDetail.innerText = "35°–45° Toe Flare Toward Plates";
        if (this.barVal) this.barVal.innerText = "Double Overhand / Mixed Grip";
        if (this.barDetail) this.barDetail.innerText = "Arms hanging inside knees";
        if (this.depthVal) this.depthVal.innerText = "Upright Torso Pull";
        if (this.depthDetail) this.depthDetail.innerText = "Hips close to barbell vertical plane";
      } else if (variant === 'trapbar') {
        if (this.stanceVal) this.stanceVal.innerText = "Hip Width (~35 cm)";
        if (this.stanceDetail) this.stanceDetail.innerText = "Straight or 5° slight flare";
        if (this.barVal) this.barVal.innerText = "Neutral Hand Position (Sides)";
        if (this.barDetail) this.barDetail.innerText = "Zero rotational grip torque";
        if (this.depthVal) this.depthVal.innerText = "Mid-Shin Level (Low Shear)";
        if (this.depthDetail) this.depthDetail.innerText = "Even hybrid hinge & knee drive";
      } else {
        // Conventional standard
        if (this.stanceVal) this.stanceVal.innerText = "Hip Width (~30-35 cm)";
        if (this.stanceDetail) this.stanceDetail.innerText = "Toes pointing nearly straight (0-10°)";
        if (this.barVal) this.barVal.innerText = "Grip Just Outside Legs";
        if (this.barDetail) this.barDetail.innerText = "Double overhand or hook grip";
        if (this.depthVal) this.depthVal.innerText = "Standard Barbell Height (22.5cm)";
        if (this.depthDetail) this.depthDetail.innerText = "Hips higher than knees, below shoulders";
      }
    }
  }
  
  calculateAgeDirective(age, isSquat) {
    let group = "Prime Category (20–35)";
    let desc = "";
    
    if (age < 21) {
      group = "Youth / Developing Lifter (Under 21)";
      desc = isSquat
        ? "Excellent joint mobility and elastic recoil. Focus on solid movement mechanics over maximum load. Do not rush depth without keeping core tight and avoiding pelvic tuck ('butt-wink')."
        : "Ligaments and spinal epiphyseal plates are developing. Prioritize flat back neutral positioning. Avoid max-effort ego pulls with rounded spine.";
    } else if (age <= 38) {
      group = "Prime Strength Phase (21–38)";
      desc = isSquat
        ? "Peak muscular recovery and force transfer. Practice strict 360° intra-abdominal pressure bracing (Valsalva). Maintain a controlled 2-3 second eccentric tempo, and drive through the midfoot on the ascent."
        : "Optimal posterior chain recruitment window. Lock lats like squeezing oranges in your armpits before pulling. Push the floor away rather than yanking the barbell with the lower back.";
    } else if (age <= 52) {
      group = "Mature Strength Phase (39–52)";
      desc = isSquat
        ? "Prioritize spine stiffness and hip capsule mobility. Perform a thorough 5-minute dynamic warm-up. Cap depth at parallel to minimize unnecessary patellofemoral pressure."
        : "Lumbar disc resilience benefits from strict setup. Consider elevating the barbell on 2-inch mats or alternating with Trap Bar deadlifts to preserve spine longevity.";
    } else {
      group = "Master / Longevity Phase (53+)";
      desc = isSquat
        ? "Focus on joint preservation and controlled acceleration. Box Squats or Goblet Squats are outstanding choices. Avoid bouncing at the bottom of the movement; maintain constant muscular tension."
        : "Trap Bar / Hex Bar deadlifts are strongly recommended. They shift the center of mass closer to your spine, cutting lumbar shear force by ~35% while building dense hip and bone strength.";
    }
    
    if (this.ageGroupLbl) this.ageGroupLbl.innerText = group;
    if (this.ageDescLbl) this.ageDescLbl.innerText = desc;
  }
  
  calculateWeightDirective(weight, height, isSquat) {
    let group = "";
    let desc = "";
    
    if (weight < 62) {
      group = `Lightweight Lifter (${weight} kg)`;
      desc = isSquat
        ? "The loaded barbell represents a very high percentage of your bodyweight. You must root your feet into the floor ('rip the floor apart') to avoid being pulled forward off balance."
        : "Lock your body as a rigid anchor. Take the slack out of the barbell before initiating the pull; do not let the barbell yank your shoulders forward off the floor.";
    } else if (weight <= 85) {
      group = `Middleweight Lifter (${weight} kg)`;
      desc = isSquat
        ? "Optimal leverage profile. The vertical bar path should align directly with your midfoot shoelaces throughout both descent and ascent. Maintain a 50/50 balance between knee and hip drive."
        : "Balanced lever efficiency. Hips sit between knee and shoulder height. Ensure your arms hang completely straight down like tow ropes.";
    } else if (weight <= 105) {
      group = `Heavyweight Lifter (${weight} kg)`;
      desc = isSquat
        ? "Wider thigh volume requires a moderately wider stance (1.2x shoulder width) to allow your pelvis to drop freely between your knees without rounding your lumbar spine."
        : "Ensure your chest is held proud at the start. Heavier body mass requires strong lat engagement to avoid forward displacement over the bar.";
    } else {
      group = `Superheavy Lifter (${weight} kg)`;
      desc = isSquat
        ? "Slightly widen stance and flare toes out to 25°–30°. This creates space for your torso between your thighs and reduces excessive lumbar flexion under heavy compressive loads."
        : "Sumo or wide-stance conventional deadlifts offer superior clearance. Ensure your knees push out against your arms during setup to engage adductors and glutes.";
    }
    
    if (this.weightGroupLbl) this.weightGroupLbl.innerText = group;
    if (this.weightDescLbl) this.weightDescLbl.innerText = desc;
  }
  
  renderPhases(isSquat, variant, age, weight) {
    if (!this.phaseContainer) return;
    
    const phases = isSquat ? [
      {
        num: "01",
        title: "Setup & Rooting",
        color: "text-cyan-400",
        desc: "Step out with 3 steps. Grip barbell firmly, pull elbows down to create a tight upper-back shelf. Screw big toe, pinky toe, and heel into floor (tripod foot)."
      },
      {
        num: "02",
        title: "360° Core Bracing",
        color: "text-emerald-400",
        desc: "Take a deep belly breath into your diaphragm (not chest) and expand your core against your lifting belt. Lock ribs down, keeping neck in neutral alignment."
      },
      {
        num: "03",
        title: "The Descent (Eccentric)",
        color: "text-purple-400",
        desc: "Unlock hips and knees simultaneously. Push knees out in line with your toes. Control the descent for 2–3 seconds until hip crease reaches parallel depth."
      },
      {
        num: "04",
        title: "The Drive & Lockout",
        color: "text-pink-400",
        desc: "Drive the floor away through your midfoot. Chest and hips must rise at the exact same rate. Lock out by squeezing glutes at top—do not hyperextend lower back."
      }
    ] : [
      {
        num: "01",
        title: "Stance & Bar Distance",
        color: "text-cyan-400",
        desc: "Stand with midfoot directly under bar (bar 1 inch from shins). Feet hip-width. Look at the floor 6 feet in front to keep cervical spine neutral."
      },
      {
        num: "02",
        title: "Grip & Lat Wedge",
        color: "text-emerald-400",
        desc: "Hinge at hips, reach down and grip bar without moving it. Bend your shins forward until they touch the bar. Squeeze armpits shut ('bend the bar') to pack lats."
      },
      {
        num: "03",
        title: "Take Out Slack & Push",
        color: "text-purple-400",
        desc: "Pull tension through your arms until the barbell 'clicks' against the plates. Drive the floor away using quads like a leg press—do not jerk with your spine."
      },
      {
        num: "04",
        title: "Hip Extension & Lockout",
        color: "text-pink-400",
        desc: "Once bar clears knees, push hips forward into the bar by squeezing glutes hard. Stand tall; never lean backward or shrug shoulders at the top."
      }
    ];
    
    this.phaseContainer.innerHTML = phases.map(p => `
      <div class="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1 group hover:border-white/10 transition-colors">
        <div class="flex items-center justify-between">
          <span class="text-[9px] font-mono font-bold ${p.color} tracking-widest uppercase">PHASE ${p.num}</span>
          <span class="text-xs font-bold text-white">${p.title}</span>
        </div>
        <p class="text-[11px] text-gray-300 leading-relaxed">${p.desc}</p>
      </div>
    `).join('');
  }
  
  renderPitfalls(isSquat, variant, sensitivity) {
    if (!this.pitfallsList) return;
    
    const pitfalls = isSquat ? [
      { fault: "Knees Caving Inward (Valgus Collapse)", fix: "Cue: Push the floor apart with your feet and spread your knees outward along toe angle." },
      { fault: "Chest Collapsing / 'Good-Morning' Squat", fix: "Cue: Drive your upper back and traps into the barbell first on the ascent, not just hips." },
      { fault: "Heels Lifting Off Floor", fix: "Cue: Distribute weight evenly across the tripod foot; consider elevated heel squat shoes or ankle mobility drills." },
      { fault: "Pelvic Tucking at Bottom ('Butt-Wink')", fix: "Cue: Stop 1 inch above the point where your lower back rounds; maintain tight lumbar lordosis." }
    ] : [
      { fault: "Barbell Drifting Forward Away from Shins", fix: "Cue: Keep lats tightly clamped. The bar must drag vertically along your shins and thighs." },
      { fault: "Hips Shooting Up Before Chest ('Stripper Pull')", fix: "Cue: Push the floor away like a leg press. Hips and chest must elevate in strict unison." },
      { fault: "Hyperextending Lower Back at Lockout", fix: "Cue: Lock out by squeezing glutes forward into the bar; do not lean backward with your lumbar spine." },
      { fault: "Jerking the Bar Off the Floor Without Bracing", fix: "Cue: 'Pull the slack out of the bar' until heavy tension is felt, then press smooth through heels." }
    ];
    
    this.pitfallsList.innerHTML = pitfalls.map(p => `
      <li class="flex items-start gap-2">
        <span class="text-red-400 font-bold shrink-0 mt-0.5">•</span>
        <div>
          <strong class="text-white font-medium">${p.fault}:</strong>
          <span class="text-gray-300"> ${p.fix}</span>
        </div>
      </li>
    `).join('');
  }
  
  startAnimationLoop() {
    const loop = () => {
      this.animProgress += 0.012 * this.animDirection;
      if (this.animProgress >= 1.0) {
        this.animProgress = 1.0;
        this.animDirection = -1;
      } else if (this.animProgress <= 0) {
        this.animProgress = 0;
        this.animDirection = 1;
      }
      
      this.renderCanvas();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }
  
  renderCanvas() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw Floor Grid
    const floorY = h - 35;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, floorY);
    ctx.lineTo(w - 30, floorY);
    ctx.stroke();
    
    const isSquat = this.activeExercise === 'squat';
    const centerX = w * 0.45;
    const t = this.animProgress; // 0 = top/lockout, 1 = bottom
    
    if (this.animPhaseLbl) {
      if (t > 0.85) {
        this.animPhaseLbl.innerText = isSquat ? "Parallel Bottom Position" : "Floor Setup Position";
      } else if (t < 0.15) {
        this.animPhaseLbl.innerText = "Full Lockout Position";
      } else {
        this.animPhaseLbl.innerText = isSquat ? "Controlled Eccentric Phase" : "Concentric Leg Drive";
      }
    }
    
    // Vertical Barbell Path Reference Line (Emerald)
    ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, floorY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Ankle Position (Stationary on floor)
    const ankleX = centerX - 15;
    const ankleY = floorY - 5;
    
    let kneeX, kneeY, hipX, hipY, shoulderX, shoulderY, headX, headY, barX, barY;
    
    if (isSquat) {
      // Squat kinematics
      // t = 0 (top/standing): upright
      // t = 1 (bottom/parallel): knees forward, hips back, bar over midfoot
      kneeX = ankleX + (12 + t * 25);
      kneeY = ankleY - (65 - t * 22);
      
      hipX = kneeX - (25 + t * 38);
      hipY = kneeY - (60 - t * 45);
      
      shoulderX = hipX + (20 + t * 18);
      shoulderY = hipY - (65 - t * 10);
      
      headX = shoulderX + 5;
      headY = shoulderY - 18;
      
      barX = centerX; // Stays locked over midfoot
      barY = shoulderY + 2;
    } else {
      // Deadlift kinematics
      // t = 0 (top/lockout)
      // t = 1 (bottom/floor starting position)
      kneeX = ankleX + (5 + t * 14);
      kneeY = ankleY - (65 - t * 20);
      
      hipX = kneeX - (15 + t * 35);
      hipY = kneeY - (65 - t * 38);
      
      shoulderX = centerX - (5 - t * 4);
      shoulderY = hipY - (65 - t * 15);
      
      headX = shoulderX + 4;
      headY = shoulderY - 16;
      
      barX = centerX;
      barY = floorY - 15 - (1 - t) * 85;
    }
    
    // Draw Bones / Limbs
    const drawBone = (x1, y1, x2, y2, color, width = 4) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };
    
    const drawJoint = (x, y, color = "#00f2fe", radius = 5) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    
    // Shin
    drawBone(ankleX, ankleY, kneeX, kneeY, "rgba(255, 255, 255, 0.7)", 4);
    // Thigh (Femur)
    drawBone(kneeX, kneeY, hipX, hipY, "rgba(255, 255, 255, 0.8)", 5);
    // Torso / Spine (Glowing Cyan Neutral Spine)
    drawBone(hipX, hipY, shoulderX, shoulderY, "#00f2fe", 5);
    
    if (isSquat) {
      // Arm holding bar
      drawBone(shoulderX, shoulderY, barX, barY + 5, "rgba(255, 255, 255, 0.6)", 3);
    } else {
      // Arm hanging straight to barbell
      drawBone(shoulderX, shoulderY, barX, barY, "rgba(255, 255, 255, 0.75)", 3.5);
    }
    
    // Head
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(headX, headY, 11, 0, Math.PI * 2);
    ctx.fill();
    
    // Joints
    drawJoint(ankleX, ankleY, "#94a3b8", 4);
    drawJoint(kneeX, kneeY, "#10b981", 5);
    drawJoint(hipX, hipY, "#f43f5e", 5);
    drawJoint(shoulderX, shoulderY, "#00f2fe", 4);
    
    // Barbell & Weights
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(barX, barY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Barbell plate rectangle
    ctx.fillStyle = "rgba(16, 185, 129, 0.85)";
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(barX - 4, barY - 20, 8, 40, 3);
    ctx.fill();
    ctx.stroke();
  }
}

// Global initialization hook
window.addEventListener('DOMContentLoaded', () => {
  window.biomechSandbox = new BiomechanicsSandbox('sandbox-physics-canvas');
});

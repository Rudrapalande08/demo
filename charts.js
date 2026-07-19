/**
 * Charts.js
 * Renders custom SVG gauges, progress charts, macro rings, and canvas fluid wave animations.
 */

const Charts = {
  /**
   * Updates an SVG BMI Dial Gauge
   */
  renderBMIGauge(containerId, bmi) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const minBMI = 15;
    const maxBMI = 40;
    const clampedBmi = Math.min(Math.max(bmi, minBMI), maxBMI);
    const percentage = (clampedBmi - minBMI) / (maxBMI - minBMI);
    const angle = percentage * 180;
    
    let category = 'Normal';
    let color = '#39ff14'; // Lime
    let desc = 'Healthy Weight';
    
    if (bmi < 18.5) {
      category = 'Underweight';
      color = '#00f2fe'; // Cyan
      desc = 'Below healthy range';
    } else if (bmi >= 18.5 && bmi < 25) {
      category = 'Normal';
      color = '#39ff14'; // Lime
      desc = 'Optimal healthy range';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight';
      color = '#fbbf24'; // Yellow
      desc = 'Slightly above range';
    } else {
      category = 'Obese';
      color = '#ff007f'; // Pink
      desc = 'Significantly above range';
    }
    
    const svgHTML = `
      <svg viewBox="0 0 200 120" class="w-full max-w-[280px] mx-auto filter drop-shadow-[0_0_8px_rgba(255,255,255,0.05)]">
        <!-- Background Arc -->
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#2a303c" stroke-width="12" stroke-linecap="round" />
        
        <!-- Colored Filled Arc -->
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#bmi-gradient)" stroke-width="12" stroke-linecap="round" 
              stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (251.2 * percentage)}"
              style="transition: stroke-dashoffset 0.8s ease-out;" />
              
        <!-- Needle Pointer -->
        <g transform="translate(100, 100)">
          <g transform="rotate(${angle - 90})" style="transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            <line x1="0" y1="0" x2="0" y2="-75" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
            <polygon points="-6,0 6,0 0,-12" fill="#ffffff" />
          </g>
          <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#39ff14" stroke-width="2" />
        </g>
        
        <!-- Center Text -->
        <text x="100" y="85" text-anchor="middle" fill="#ffffff" font-size="20" font-family="'Outfit', sans-serif" font-weight="700">${bmi.toFixed(1)}</text>
        <text x="100" y="98" text-anchor="middle" fill="${color}" font-size="9" font-family="'Inter', sans-serif" font-weight="600" letter-spacing="1.5">${category.toUpperCase()}</text>
        
        <!-- Scale ticks -->
        <text x="20" y="115" text-anchor="middle" fill="#9ca3af" font-size="8">15</text>
        <text x="58" y="42" text-anchor="middle" fill="#9ca3af" font-size="8">18.5</text>
        <text x="100" y="15" text-anchor="middle" fill="#9ca3af" font-size="8">25</text>
        <text x="142" y="42" text-anchor="middle" fill="#9ca3af" font-size="8">30</text>
        <text x="180" y="115" text-anchor="middle" fill="#9ca3af" font-size="8">40</text>
        
        <!-- Gradient definition -->
        <defs>
          <linearGradient id="bmi-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#00f2fe" />
            <stop offset="40%" stop-color="#39ff14" />
            <stop offset="75%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#ff007f" />
          </linearGradient>
        </defs>
      </svg>
      <div class="text-center mt-2">
        <p class="text-sm font-semibold text-gray-300">${desc}</p>
      </div>
    `;
    
    container.innerHTML = svgHTML;
  },

  /**
   * Updates an SVG Circular Progress ring for Body Fat
   */
  renderBodyFatRing(containerId, bf, gender) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const percentage = Math.min(Math.max(bf / 50, 0), 1);
    const radius = 55;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage * circumference);
    
    let classification = 'Average';
    let color = '#3b82f6';
    
    if (gender === 'male') {
      if (bf < 6) { classification = 'Essential Fat'; color = '#00f2fe'; }
      else if (bf >= 6 && bf < 14) { classification = 'Athletic / Fit'; color = '#39ff14'; }
      else if (bf >= 14 && bf < 18) { classification = 'Fitness'; color = '#00f2fe'; }
      else if (bf >= 18 && bf < 25) { classification = 'Average'; color = '#fbbf24'; }
      else { classification = 'Excess Fat'; color = '#ff007f'; }
    } else {
      if (bf < 14) { classification = 'Essential Fat'; color = '#00f2fe'; }
      else if (bf >= 14 && bf < 21) { classification = 'Athletic / Fit'; color = '#39ff14'; }
      else if (bf >= 21 && bf < 25) { classification = 'Fitness'; color = '#00f2fe'; }
      else if (bf >= 25 && bf < 32) { classification = 'Average'; color = '#fbbf24'; }
      else { classification = 'Excess Fat'; color = '#ff007f'; }
    }
    
    const svgHTML = `
      <div class="relative flex items-center justify-center w-[150px] h-[150px] mx-auto">
        <svg class="w-full h-full transform -rotate-90">
          <circle cx="75" cy="75" r="${radius}" fill="transparent" stroke="#2a303c" stroke-width="${strokeWidth}" />
          <circle cx="75" cy="75" r="${radius}" fill="transparent" 
                  stroke="url(#bf-gradient)" stroke-width="${strokeWidth}" 
                  stroke-dasharray="${circumference}" 
                  stroke-dashoffset="${strokeDashoffset}" 
                  stroke-linecap="round"
                  style="transition: stroke-dashoffset 0.8s ease-out;" />
          <defs>
            <linearGradient id="bf-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#39ff14" />
              <stop offset="100%" stop-color="#00f2fe" />
            </linearGradient>
          </defs>
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span class="text-2xl font-bold font-sans text-white">${bf.toFixed(1)}%</span>
          <span class="text-[8px] font-bold tracking-wider uppercase font-mono" style="color: ${color};">${classification}</span>
        </div>
      </div>
    `;
    
    container.innerHTML = svgHTML;
    
    // Update rotating 3D model if it exists
    if (window.humanMannequin) {
      window.humanMannequin.updateZoneGlow(bf);
    }
  },

  /**
   * Concentric Macro Rings SVG drawing
   */
  renderMacroRings(containerId, carbsPct, protPct, fatPct) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const drawRing = (radius, percentage, colorUrl) => {
      const circ = 2 * Math.PI * radius;
      const offset = circ - (percentage / 100 * circ);
      return `
        <!-- Track -->
        <circle cx="64" cy="64" r="${radius}" fill="transparent" stroke="#2a303c" stroke-width="8" />
        <!-- Progress -->
        <circle cx="64" cy="64" r="${radius}" fill="transparent" 
                stroke="${colorUrl}" stroke-width="8" 
                stroke-linecap="round"
                stroke-dasharray="${circ}" 
                stroke-dashoffset="${offset}"
                style="transition: stroke-dashoffset 0.8s ease-out;" />
      `;
    };
    
    const svgHTML = `
      <svg viewBox="0 0 128 128" class="w-full h-full transform -rotate-95">
        <defs>
          <linearGradient id="ring-carbs" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00f2fe" /><stop offset="100%" stop-color="#4facfe" />
          </linearGradient>
          <linearGradient id="ring-protein" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#39ff14" /><stop offset="100%" stop-color="#10b981" />
          </linearGradient>
          <linearGradient id="ring-fats" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff007f" /><stop offset="100%" stop-color="#d946ef" />
          </linearGradient>
        </defs>
        ${drawRing(50, carbsPct, 'url(#ring-carbs)')}
        ${drawRing(38, protPct, 'url(#ring-protein)')}
        ${drawRing(26, fatPct, 'url(#ring-fats)')}
      </svg>
    `;
    container.innerHTML = svgHTML;
  },

  /**
   * Fluid wave animation on Canvas
   */
  initHydrationWave(canvasId, totalMl, targetMl) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    
    // Setup high-DPI scaling
    const scale = window.devicePixelRatio || 1;
    const size = 192; // size in CSS pixels (w-48)
    canvas.width = size * scale;
    canvas.height = size * scale;
    ctx.scale(scale, scale);
    
    let phase = 0;
    let currentHeight = 0;
    
    const animateWave = () => {
      ctx.clearRect(0, 0, size, size);
      
      const percentage = Math.min(totalMl / targetMl, 1.0);
      const targetHeight = size * (1 - percentage);
      
      // Interpolate wave height smoothly
      currentHeight += (targetHeight - currentHeight) * 0.08;
      
      // Draw fluid background area
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0, 242, 254, 0.15)'; // Pale cyan
      ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw waves
      ctx.save();
      // Clip everything inside the circle
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
      ctx.clip();
      
      // Draw second background wave (slower offset)
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0, 242, 254, 0.35)';
      for (let x = 0; x <= size; x++) {
        const y = currentHeight + Math.sin((x / 20) + phase + 1.5) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(size, size);
      ctx.lineTo(0, size);
      ctx.fill();

      // Draw primary active wave
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0, 242, 254, 0.65)';
      for (let x = 0; x <= size; x++) {
        const y = currentHeight + Math.sin((x / 25) + phase) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(size, size);
      ctx.lineTo(0, size);
      ctx.fill();
      
      ctx.restore();
      
      phase += 0.05;
      
      // Keep animation running
      window.hydrationRequest = requestAnimationFrame(animateWave);
    };
    
    // Cancel previous frame loops
    if (window.hydrationRequest) {
      cancelAnimationFrame(window.hydrationRequest);
    }
    
    animateWave();
  },

  /**
   * Renders an SVG progress line chart
   */
  renderProgressLineChart(containerId, logs, metricType = 'weight') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!logs || logs.length < 2) {
      container.innerHTML = `
        <div class="flex items-center justify-center h-48 border border-dashed border-gray-700 rounded-xl bg-white/5 backdrop-blur-md w-full">
          <p class="text-xs text-gray-500 font-mono">Need at least 2 logged entries to map timeline chart.</p>
        </div>
      `;
      return;
    }
    
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const width = 500;
    const height = 220;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;
    
    const yValues = sortedLogs.map(l => Number(l[metricType]));
    const minY = Math.min(...yValues) * 0.95;
    const maxY = Math.max(...yValues) * 1.05;
    const yRange = maxY - minY;
    
    const pointsCount = sortedLogs.length;
    const xStep = (width - paddingLeft - paddingRight) / (pointsCount - 1);
    
    const points = sortedLogs.map((log, index) => {
      const x = paddingLeft + index * xStep;
      const valY = Number(log[metricType]);
      const y = height - paddingBottom - ((valY - minY) / yRange) * (height - paddingTop - paddingBottom);
      return { x, y, value: valY, date: log.date };
    });
    
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }
    
    const fillPathD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
    
    const yTicks = [];
    const ticksCount = 4;
    for (let i = 0; i < ticksCount; i++) {
      const val = minY + (yRange * (i / (ticksCount - 1)));
      const y = height - paddingBottom - (i / (ticksCount - 1)) * (height - paddingTop - paddingBottom);
      yTicks.push({ val, y });
    }
    
    const formatDate = (dateStr) => {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    };
    
    let svgHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full text-gray-400">
        <defs>
          <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#39ff14" />
            <stop offset="100%" stop-color="#00f2fe" />
          </linearGradient>
          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#39ff14" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#39ff14" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        
        ${yTicks.map(tick => `
          <line x1="${paddingLeft}" y1="${tick.y}" x2="${width - paddingRight}" y2="${tick.y}" 
                stroke="#2a303c" stroke-dasharray="3,3" stroke-width="1" />
          <text x="${paddingLeft - 8}" y="${tick.y + 3}" text-anchor="end" fill="#9ca3af" font-size="9" font-family="'Share Tech Mono', monospace">
            ${tick.val.toFixed(1)}${metricType === 'weight' ? 'kg' : '%'}
          </text>
        `).join('')}
        
        <path d="${fillPathD}" fill="url(#chart-area-grad)" />
        
        <path d="${pathD}" fill="none" stroke="url(#chart-line-grad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
        
        ${points.map((pt, idx) => {
          const showLabel = pointsCount < 8 || idx % Math.ceil(pointsCount / 6) === 0 || idx === pointsCount - 1;
          return `
            ${showLabel ? `
              <line x1="${pt.x}" y1="${paddingTop}" x2="${pt.x}" y2="${height - paddingBottom}" stroke="#2a303c" stroke-opacity="0.3" stroke-width="1" />
              <text x="${pt.x}" y="${height - paddingBottom + 16}" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="'Share Tech Mono', monospace">
                ${formatDate(pt.date)}
              </text>
            ` : ''}
            
            <g class="cursor-pointer group">
              <circle cx="${pt.x}" cy="${pt.y}" r="5" fill="#1e293b" stroke="#39ff14" stroke-width="2.5" />
              <circle cx="${pt.x}" cy="${pt.y}" r="9" fill="#39ff14" fill-opacity="0.1" class="transition-all duration-300 hover:scale-150" />
              <title>${pt.date}: ${pt.value.toFixed(1)}${metricType === 'weight' ? 'kg' : '%'}</title>
            </g>
          `;
        }).join('')}
      </svg>
    `;
    
    container.innerHTML = svgHTML;
  }
};

/**
 * sandbox.js
 * Biomechanical lifting sandbox simulator.
 * Renders an interactive vector model of joint angles and calculates forces.
 */

class BiomechanicsSandbox {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.activeExercise = 'squat'; // 'squat' or 'deadlift'
    
    // Sliders & UI Elements
    this.hipSlider = document.getElementById('slider-sandbox-hip');
    this.kneeSlider = document.getElementById('slider-sandbox-knee');
    this.torsoSlider = document.getElementById('slider-sandbox-torso');
    
    this.hipLbl = document.getElementById('lbl-sandbox-hip');
    this.kneeLbl = document.getElementById('lbl-sandbox-knee');
    this.torsoLbl = document.getElementById('lbl-sandbox-torso');
    
    this.spineMetric = document.getElementById('sandbox-metric-spine');
    this.kneeMetric = document.getElementById('sandbox-metric-knee');
    this.tipsBox = document.getElementById('sandbox-live-tips');
    
    this.btnSquat = document.getElementById('sandbox-btn-squat');
    this.btnDeadlift = document.getElementById('sandbox-btn-deadlift');
    
    this.init();
  }
  
  init() {
    this.resizeCanvas();
    this.bindEvents();
    this.render();
    
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.render();
    });
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 320;
    this.canvas.height = 250;
  }
  
  bindEvents() {
    const update = () => {
      this.updateLabels();
      this.calculateForces();
      this.render();
    };
    
    this.hipSlider.addEventListener('input', update);
    this.kneeSlider.addEventListener('input', update);
    this.torsoSlider.addEventListener('input', update);
    
    this.btnSquat.addEventListener('click', () => {
      this.setExercise('squat');
    });
    this.btnDeadlift.addEventListener('click', () => {
      this.setExercise('deadlift');
    });
  }
  
  setExercise(type) {
    this.activeExercise = type;
    
    if (type === 'squat') {
      this.btnSquat.className = "py-2 border border-[#39ff14] bg-[#39ff14]/10 text-white rounded-xl text-xs font-bold transition-all duration-300";
      this.btnDeadlift.className = "py-2 border border-white/5 hover:border-white/10 text-gray-400 rounded-xl text-xs font-semibold transition-all duration-300";
      
      // Default squat angles
      this.hipSlider.value = 75;
      this.kneeSlider.value = 90;
      this.torsoSlider.value = 35;
    } else {
      this.btnDeadlift.className = "py-2 border border-[#39ff14] bg-[#39ff14]/10 text-white rounded-xl text-xs font-bold transition-all duration-300";
      this.btnSquat.className = "py-2 border border-white/5 hover:border-white/10 text-gray-400 rounded-xl text-xs font-semibold transition-all duration-300";
      
      // Default deadlift angles
      this.hipSlider.value = 100;
      this.kneeSlider.value = 45;
      this.torsoSlider.value = 55;
    }
    
    this.updateLabels();
    this.calculateForces();
    this.render();
    
    if (window.app) {
      window.app.telemetryLog(`Switched biomechanics sandbox target to ${type.toUpperCase()} loading model.`);
    }
  }
  
  updateLabels() {
    this.hipLbl.innerText = `${this.hipSlider.value}°`;
    this.kneeLbl.innerText = `${this.kneeSlider.value}°`;
    this.torsoLbl.innerText = `${this.torsoSlider.value}°`;
  }
  
  calculateForces() {
    const hip = parseInt(this.hipSlider.value);
    const knee = parseInt(this.kneeSlider.value);
    const torso = parseInt(this.torsoSlider.value);
    
    // Spine Shear estimate: high torso lean increases gravity moment arm on lower back
    if (torso > 50) {
      this.spineMetric.innerText = "CRITICAL (High Shear)";
      this.spineMetric.className = "text-sm font-bold text-pink-500 mt-1";
    } else if (torso > 30) {
      this.spineMetric.innerText = "MODERATE Load";
      this.spineMetric.className = "text-sm font-bold text-yellow-400 mt-1";
    } else {
      this.spineMetric.innerText = "SAFE (Low Stress)";
      this.spineMetric.className = "text-sm font-bold text-[#39ff14] mt-1";
    }
    
    // Knee Load estimate: deep knee flexion increases patellofemoral compressive force
    if (knee > 105) {
      this.kneeMetric.innerText = "HIGH Compression";
      this.kneeMetric.className = "text-sm font-bold text-pink-500 mt-1";
    } else if (knee > 75) {
      this.kneeMetric.innerText = "OPTIMAL Loading";
      this.kneeMetric.className = "text-sm font-bold text-[#39ff14] mt-1";
    } else {
      this.kneeMetric.innerText = "LOW Loading";
      this.kneeMetric.className = "text-sm font-bold text-gray-400 mt-1";
    }
    
    // General Form evaluation
    let tip = "";
    if (this.activeExercise === 'squat') {
      if (knee > 100 && torso < 20) {
        tip = "Deep Squat with high knee travel. Keep chest proud and push hips back to distribute load to glutes.";
      } else if (torso > 45) {
        tip = "Warning: Excessive torso lean increases spinal shear! Strengthen core bracing and drive chest upwards.";
      } else if (knee < 80) {
        tip = "Partial depth. Aim to bring hips down to parallel (90° knee angle) for complete quad and glute activation.";
      } else {
        tip = "Form looks balanced. Weight distribution sits directly over midfoot. Keep core compressed.";
      }
    } else {
      // Deadlift
      if (hip < 70) {
        tip = "Warning: Hips too low! This turns the deadlift into a squat. Raise hips slightly to load hamstrings.";
      } else if (torso > 60) {
        tip = "Warning: Lumbar load is critical. Pull shoulder blades back, drop hips slightly, and engage lat muscles.";
      } else if (knee > 70) {
        tip = "Knees pushing forward blocking barbell vertical line. Push shins back to vertical.";
      } else {
        tip = "Solid setup. Keep bar close to shins and drive through heels. Brace core before starting the pull.";
      }
    }
    
    this.tipsBox.innerText = tip;
  }
  
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Draw Ground
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#2a303c';
    this.ctx.lineWidth = 4;
    this.ctx.moveTo(10, h - 30);
    this.ctx.lineTo(w - 10, h - 30);
    this.ctx.stroke();
    
    // Kinematic link lengths
    const footLen = 22;
    const shinLen = 50;
    const femurLen = 55;
    const torsoLen = 65;
    const headRadius = 10;
    
    // Anchors
    const footX = w / 2 - 20;
    const footY = h - 30;
    
    const ankleX = footX + 10;
    const ankleY = footY - 2;
    
    // Extract joint angles (in radians)
    const hipAngleDeg = parseInt(this.hipSlider.value);
    const kneeAngleDeg = parseInt(this.kneeSlider.value);
    const torsoLeanDeg = parseInt(this.torsoSlider.value);
    
    // Convert to relative coordinate vectors
    // 1. Shin vector: relative to ankle
    // Knee angle controls ankle dorsiflexion
    const shinAngle = Math.PI - (kneeAngleDeg * 0.75 * Math.PI / 180);
    const kneeX = ankleX + Math.cos(shinAngle) * shinLen;
    const kneeY = ankleY - Math.sin(shinAngle) * shinLen;
    
    // 2. Femur vector: relative to knee
    // Hip flexion controls thigh angle
    const femurAngle = shinAngle - (hipAngleDeg * 0.65 * Math.PI / 180);
    const hipX = kneeX - Math.cos(femurAngle) * femurLen;
    const hipY = kneeY + Math.sin(femurAngle) * femurLen;
    
    // 3. Torso vector: relative to hip
    const torsoAngle = Math.PI/2 - (torsoLeanDeg * Math.PI / 180);
    const shoulderX = hipX + Math.cos(torsoAngle) * torsoLen;
    const shoulderY = hipY - Math.sin(torsoAngle) * torsoLen;
    
    // 4. Head vector: relative to shoulder
    const headX = shoulderX + Math.cos(torsoAngle) * 14;
    const headY = shoulderY - Math.sin(torsoAngle) * 14;
    
    // Draw Foot
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#9ca3af';
    this.ctx.lineWidth = 3;
    this.ctx.moveTo(footX - 10, footY);
    this.ctx.lineTo(footX + footLen, footY);
    this.ctx.stroke();
    
    // Draw Shin (Lower Leg)
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#39ff14'; // Neon Lime for active links
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = 'round';
    this.ctx.moveTo(ankleX, ankleY);
    this.ctx.lineTo(kneeX, kneeY);
    this.ctx.stroke();
    
    // Draw Femur (Thigh)
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#00f2fe'; // Cyan
    this.ctx.moveTo(kneeX, kneeY);
    this.ctx.lineTo(hipX, hipY);
    this.ctx.stroke();
    
    // Draw Torso
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.moveTo(hipX, hipY);
    this.ctx.lineTo(shoulderX, shoulderY);
    this.ctx.stroke();
    
    // Draw Head
    this.ctx.beginPath();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw Joint Nodes
    const drawJoint = (x, y) => {
      this.ctx.beginPath();
      this.ctx.fillStyle = '#1e293b';
      this.ctx.strokeStyle = '#39ff14';
      this.ctx.lineWidth = 2;
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    };
    
    drawJoint(ankleX, ankleY);
    drawJoint(kneeX, kneeY);
    drawJoint(hipX, hipY);
    drawJoint(shoulderX, shoulderY);
    
    // Draw Barbell / Weight & Center of Gravity Line
    let barX = 0;
    let barY = 0;
    
    if (this.activeExercise === 'squat') {
      // Bar is on upper back (near shoulders)
      barX = shoulderX - 4;
      barY = shoulderY + 4;
    } else {
      // Deadlift: arms hang straight down from shoulders to grasp bar
      barX = shoulderX;
      barY = shoulderY + 45;
      
      // Draw arms hanging to the bar
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#9ca3af';
      this.ctx.lineWidth = 3;
      this.ctx.moveTo(shoulderX, shoulderY);
      this.ctx.lineTo(barX, barY);
      this.ctx.stroke();
      drawJoint(barX, barY);
    }
    
    // Draw Barbell plates (neon pink)
    this.ctx.beginPath();
    this.ctx.fillStyle = '#ff007f'; // Hot pink weights
    this.ctx.fillRect(barX - 10, barY - 15, 20, 30);
    this.ctx.beginPath();
    this.ctx.fillStyle = '#08090c';
    this.ctx.arc(barX, barY, 4, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw Gravity Center Line downwards from Barbell
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
    this.ctx.setLineDash([4, 4]);
    this.ctx.lineWidth = 1.5;
    this.ctx.moveTo(barX, barY);
    this.ctx.lineTo(barX, footY);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset line dash
    
    // Check alignment over midfoot (Safe zone: within 15px of ankleX)
    const distFromMidfoot = Math.abs(barX - ankleX);
    this.ctx.beginPath();
    if (distFromMidfoot < 12) {
      this.ctx.fillStyle = '#39ff14'; // Balanced green tick
    } else {
      this.ctx.fillStyle = '#ff007f'; // Unbalanced pink warning
    }
    this.ctx.arc(barX, footY, 4, 0, Math.PI*2);
    this.ctx.fill();
  }
}

// Global hooks
let biomechSandbox;
window.addEventListener('DOMContentLoaded', () => {
  biomechSandbox = new BiomechanicsSandbox('sandbox-physics-canvas');
});

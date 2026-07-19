/**
 * app.js
 * Main application controller for the Fitness Hub SPA.
 * Manages database, auth state, router, calculations, user and admin dashboards.
 * Extended with 1RM Classifier, Hydration waves, Diet planners, backups, and trainer roles.
 */

class FitnessApp {
  constructor() {
    this.dbKey = 'fitness_hub_users';
    this.announcementKey = 'fitness_hub_announcement';
    this.activeTab = 'home';
    this.currentUser = null;
    this.activeChartMetric = 'weight'; // 'weight' or 'bodyFat'
    this.plannerTab = 'diet'; // 'diet' or 'workout'
    
    this.initDatabase();
    this.initAuth();
    this.initRouter();
    this.initAnnouncement();
    this.bindEvents();
    
    // Initial UI updates
    this.updateAuthUI();
    this.calcs.runAllCalculatorsPreview();
    
    this.telemetryLog("Cybernetic System Console initialized successfully.");
  }

  // --- 1. LOCAL STORAGE DATABASE ENGINE ---
  initDatabase() {
    if (!localStorage.getItem(this.dbKey)) {
      // Seed initial mock data
      const defaultUsers = {
        'admin': {
          username: 'admin',
          fullname: 'System Administrator',
          password: 'admin123',
          role: 'admin',
          goal: 75,
          waterTarget: 3000,
          waterLogged: 1250,
          logs: []
        },
        'john_doe': {
          username: 'john_doe',
          fullname: 'John Doe',
          password: 'user123',
          role: 'user',
          goal: 72,
          waterTarget: 3000,
          waterLogged: 1500,
          logs: [
            { date: '2026-05-15', weight: 80.5, bodyFat: 22.1, bmi: 26.3 },
            { date: '2026-05-22', weight: 79.2, bodyFat: 21.0, bmi: 25.9 },
            { date: '2026-06-01', weight: 77.8, bodyFat: 19.8, bmi: 25.4 },
            { date: '2026-06-09', weight: 76.5, bodyFat: 18.5, bmi: 25.0 }
          ]
        },
        'sarah_fit': {
          username: 'sarah_fit',
          fullname: 'Sarah Jenkins',
          password: 'user123',
          role: 'user',
          goal: 58,
          waterTarget: 2500,
          waterLogged: 800,
          logs: [
            { date: '2026-05-10', weight: 64.2, bodyFat: 26.5, bmi: 23.6 },
            { date: '2026-05-20', weight: 63.0, bodyFat: 25.4, bmi: 23.1 },
            { date: '2026-06-01', weight: 62.1, bodyFat: 24.3, bmi: 22.8 },
            { date: '2026-06-09', weight: 61.2, bodyFat: 23.1, bmi: 22.5 }
          ]
        },
        'coach_mike': {
          username: 'coach_mike',
          fullname: 'Mike Miller (Trainer)',
          password: 'user123',
          role: 'trainer',
          goal: 85,
          waterTarget: 3500,
          waterLogged: 2000,
          logs: [
            { date: '2026-06-01', weight: 86.5, bodyFat: 12.5, bmi: 24.8 }
          ]
        }
      };
      localStorage.setItem(this.dbKey, JSON.stringify(defaultUsers));
    }
  }

  getUsers() {
    return JSON.parse(localStorage.getItem(this.dbKey)) || {};
  }

  saveUsers(users) {
    localStorage.setItem(this.dbKey, JSON.stringify(users));
  }

  // HUD Console logging
  telemetryLog(message) {
    const consoleEl = document.getElementById('admin-telemetry-console');
    if (!consoleEl) return;
    
    const time = new Date().toTimeString().split(' ')[0];
    const log = document.createElement('div');
    log.className = "text-[#39ff14] font-mono mt-0.5";
    log.innerHTML = `<span class="text-gray-500">[${time}]</span> &gt;&gt; ${message}`;
    consoleEl.appendChild(log);
    
    // Auto Scroll
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  // --- 2. AUTHENTICATION MANAGER ---
  initAuth() {
    const session = sessionStorage.getItem('fitness_hub_session');
    if (session) {
      const users = this.getUsers();
      if (users[session]) {
        this.currentUser = users[session];
      }
    }
  }

  auth = {
    login: (username, password) => {
      const users = this.getUsers();
      const user = users[username];
      
      if (user && user.password === password) {
        this.currentUser = user;
        sessionStorage.setItem('fitness_hub_session', username);
        this.updateAuthUI();
        this.dashboard.sync();
        this.admin.sync();
        
        this.telemetryLog(`Session established for user: @${username} (Role: ${user.role})`);
        
        // Navigate
        if (user.role === 'admin') {
          this.router.navigate('admin');
        } else {
          this.router.navigate('user');
        }
        return true;
      }
      return false;
    },

    logout: () => {
      const prevUser = this.currentUser ? this.currentUser.username : 'unknown';
      this.currentUser = null;
      sessionStorage.removeItem('fitness_hub_session');
      this.updateAuthUI();
      this.telemetryLog(`Session terminated for user: @${prevUser}`);
      this.router.navigate('home');
    },

    signup: (username, fullname, password) => {
      const users = this.getUsers();
      if (users[username]) {
        return false;
      }
      
      users[username] = {
        username: username.toLowerCase().trim(),
        fullname: fullname.trim(),
        password: password,
        role: 'user',
        goal: 70,
        waterTarget: 3000,
        waterLogged: 0,
        logs: [
          { date: new Date().toISOString().split('T')[0], weight: 70, bodyFat: 18, bmi: 22.8 }
        ]
      };
      
      this.saveUsers(users);
      this.telemetryLog(`Registered new member account: @${username}`);
      this.auth.login(username, password);
      return true;
    }
  };

  updateAuthUI() {
    const loggedOutSidebar = document.getElementById('sidebar-auth-logged-out');
    const loggedInSidebar = document.getElementById('sidebar-auth-logged-in');
    const navAdminLink = document.getElementById('nav-admin-link');
    
    const userLoggedOutView = document.getElementById('user-portal-logged-out');
    const userLoggedInView = document.getElementById('user-portal-logged-in');
    
    const adminLockedView = document.getElementById('admin-portal-locked');
    const adminUnlockedView = document.getElementById('admin-portal-unlocked');
    
    if (this.currentUser) {
      loggedOutSidebar.classList.add('hidden');
      loggedInSidebar.classList.remove('hidden');
      
      document.getElementById('sidebar-user-name').innerText = this.currentUser.fullname;
      document.getElementById('sidebar-user-avatar').innerText = this.currentUser.fullname.charAt(0).toUpperCase();
      
      let roleLabel = 'Premium Member';
      if (this.currentUser.role === 'admin') roleLabel = 'System Admin';
      if (this.currentUser.role === 'trainer') roleLabel = 'Elite Coach';
      document.getElementById('sidebar-user-role').innerText = roleLabel;
      
      userLoggedOutView.classList.add('hidden');
      userLoggedInView.classList.remove('hidden');
      
      if (this.currentUser.role === 'admin') {
        navAdminLink.classList.remove('hidden');
        adminLockedView.classList.add('hidden');
        adminUnlockedView.classList.remove('hidden');
      } else {
        navAdminLink.classList.add('hidden');
        adminLockedView.classList.remove('hidden');
        adminUnlockedView.classList.add('hidden');
      }
      
      // If role is trainer, enable client logging table
      const trainerClients = document.getElementById('trainer-client-container');
      if (this.currentUser.role === 'trainer') {
        trainerClients.classList.remove('hidden');
        this.trainer.syncClients();
      } else {
        trainerClients.classList.add('hidden');
      }
      
    } else {
      loggedOutSidebar.classList.remove('hidden');
      loggedInSidebar.classList.add('hidden');
      navAdminLink.classList.add('hidden');
      
      userLoggedOutView.classList.remove('hidden');
      userLoggedInView.classList.add('hidden');
      adminLockedView.classList.remove('hidden');
      adminUnlockedView.classList.add('hidden');
      document.getElementById('trainer-client-container').classList.add('hidden');
    }
  }

  // --- 3. DYNAMIC SPA ROUTER ---
  initRouter() {
    this.router = {
      navigate: (target) => {
        document.querySelectorAll('.spa-section').forEach(sec => {
          sec.classList.add('hidden');
        });
        
        const targetSec = document.getElementById(`sec-${target}`);
        if (targetSec) {
          targetSec.classList.remove('hidden');
        }
        
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('data-target') === target) {
            link.classList.add('active');
          }
        });
        
        document.getElementById('sidebar-nav-menu').classList.add('hidden');
        if (window.innerWidth >= 1024) {
          document.getElementById('sidebar-nav-menu').classList.remove('hidden');
        }
        
        const headerTitle = document.getElementById('header-title');
        const headerSubtitle = document.getElementById('header-subtitle');
        this.activeTab = target;
        
        switch (target) {
          case 'home':
            headerTitle.innerText = "Fitness Analytics Overview";
            headerSubtitle.innerText = "Real-time health measurements, formulas, and progress metrics";
            break;
          case 'bmi':
            headerTitle.innerText = "BMI Dial Speedometer";
            headerSubtitle.innerText = "Check weight proportions using automated height calculations";
            break;
          case 'bodyfat':
            headerTitle.innerText = "3D Specific Body Fat Estimator";
            headerSubtitle.innerText = "US Navy mathematical circumference formula with 3D Mannequin scanning";
            break;
          case 'bodytype':
            headerTitle.innerText = "Somatotype & Goal Analyzer";
            headerSubtitle.innerText = "Determines ectomorph, mesomorph, and endomorph muscular configurations";
            break;
          case 'tdee':
            headerTitle.innerText = "TDEE & Katch-McArdle Solvers";
            headerSubtitle.innerText = "Daily Basal Metabolic Rate (BMR) utilizing lean body mass estimations";
            break;
          case 'heartrate':
            headerTitle.innerText = "Heart Zones & Ideal Weights";
            headerSubtitle.innerText = "Optimal target cardiovascular zones (Karvonen method) & Ideal body weights";
            break;
          case '1rm':
            headerTitle.innerText = "1RM Strength Classifier";
            headerSubtitle.innerText = "Calculates estimated maximum limits and classifies powerlifting coefficients";
            break;
          case 'hydration':
            headerTitle.innerText = "Hydration Wave Tracker";
            headerSubtitle.innerText = "Log daily water volume and monitor the rising fluid canvas wave";
            break;
          case 'planner':
            headerTitle.innerText = "Custom Diet & Workout Routine Planner";
            headerSubtitle.innerText = "Generates customized macronutrients, daily meals, and weekly training splits";
            break;
          case 'sandbox':
            headerTitle.innerText = "Lifting Biomechanics Sandbox";
            headerSubtitle.innerText = "Adjust joint sliders on an animated skeleton to estimate lift forces";
            break;
          case 'user':
            headerTitle.innerText = this.currentUser ? `${this.currentUser.fullname}'s Console` : "Member Registration Portal";
            headerSubtitle.innerText = "Access historical metric progression, manually add weight records, and set goals";
            this.dashboard.sync();
            break;
          case 'admin':
            headerTitle.innerText = "System Administrative Panel";
            headerSubtitle.innerText = "Manage registered member records, review telemetry ratios, and publish global alerts";
            this.admin.sync();
            break;
        }
        
        this.telemetryLog(`Routed main content display focus to section: [sec-${target}]`);
        
        // Triggers rendering
        if (target === 'bmi') this.calcs.runBMI();
        if (target === 'bodyfat') this.calcs.runBodyFat();
        if (target === 'bodytype') this.calcs.runBodyType();
        if (target === 'tdee') this.calcs.runTDEE();
        if (target === 'heartrate') this.calcs.runHeartRate();
        if (target === '1rm') this.calcs.run1RM();
        if (target === 'hydration') this.hydration.sync();
        if (target === 'planner') this.planner.sync();
        if (target === 'sandbox' && window.biomechSandbox) {
          window.biomechSandbox.resizeCanvas();
          window.biomechSandbox.render();
        }
        if (target === 'user') this.dashboard.renderChart();
      }
    };
  }

  // --- 4. GLOBAL ANNOUNCEMENTS SYSTEM ---
  initAnnouncement() {
    const announcement = localStorage.getItem(this.announcementKey);
    const box = document.getElementById('global-announcement-box');
    const text = document.getElementById('announcement-text-content');
    const pill = document.getElementById('header-announcement-pill');
    
    if (announcement) {
      text.innerText = announcement;
      box.classList.remove('hidden');
      pill.classList.remove('hidden');
    } else {
      box.classList.add('hidden');
      pill.classList.add('hidden');
    }
  }

  // --- 5. BIND USER INTERFACES EVENTS ---
  bindEvents() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    document.getElementById('current-date-p').innerText = `${months[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')}, ${now.getFullYear()}`;

    // Mobile Navbar toggle
    document.getElementById('btn-mobile-nav').addEventListener('click', () => {
      const menu = document.getElementById('sidebar-nav-menu');
      menu.classList.toggle('hidden');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        this.router.navigate(target);
      });
    });

    document.getElementById('btn-close-announcement').addEventListener('click', () => {
      document.getElementById('global-announcement-box').classList.add('hidden');
    });
    
    document.getElementById('header-announcement-pill').addEventListener('click', () => {
      document.getElementById('global-announcement-box').classList.remove('hidden');
    });

    document.getElementById('btn-tab-login').addEventListener('click', () => {
      document.getElementById('form-login').classList.remove('hidden');
      document.getElementById('form-signup').classList.add('hidden');
      document.getElementById('btn-tab-login').className = "flex-1 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#39ff14] to-[#00f2fe] text-black transition-all duration-300";
      document.getElementById('btn-tab-signup').className = "flex-1 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-all duration-300";
    });

    document.getElementById('btn-tab-signup').addEventListener('click', () => {
      document.getElementById('form-login').classList.add('hidden');
      document.getElementById('form-signup').classList.remove('hidden');
      document.getElementById('btn-tab-signup').className = "flex-1 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white transition-all duration-300";
      document.getElementById('btn-tab-login').className = "flex-1 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-all duration-300";
    });

    document.getElementById('form-login').addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('login-username').value;
      const p = document.getElementById('login-password').value;
      if (!this.auth.login(u, p)) {
        alert("Invalid credentials. Try 'john_doe' / 'user123' or 'admin' / 'admin123'.");
      } else {
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
      }
    });

    document.getElementById('form-signup').addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('signup-username').value;
      const f = document.getElementById('signup-fullname').value;
      const p = document.getElementById('signup-password').value;
      if (!this.auth.signup(u, f, p)) {
        alert("Username already taken. Pick another!");
      } else {
        document.getElementById('signup-username').value = '';
        document.getElementById('signup-fullname').value = '';
        document.getElementById('signup-password').value = '';
      }
    });

    const bindSlider = (numId, rangeId, callback) => {
      const num = document.getElementById(numId);
      const range = document.getElementById(rangeId);
      
      num.addEventListener('input', () => {
        range.value = num.value;
        callback();
      });
      range.addEventListener('input', () => {
        num.value = range.value;
        callback();
      });
    };
    
    bindSlider('bmi-weight-num', 'bmi-weight-range', () => this.calcs.runBMI());
    bindSlider('bmi-height-num', 'bmi-height-range', () => this.calcs.runBMI());
    
    document.getElementById('bmi-toggle-metric').addEventListener('click', () => {
      this.calcs.toggleBmiUnits('metric');
    });
    document.getElementById('bmi-toggle-imperial').addEventListener('click', () => {
      this.calcs.toggleBmiUnits('imperial');
    });

    document.getElementById('form-bmi').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!this.currentUser) {
        alert("Please log in to your Member account to save calculations.");
        this.router.navigate('user');
        return;
      }
      
      const isMetric = document.getElementById('bmi-toggle-metric').classList.contains('bg-gradient-to-r');
      let w = parseFloat(document.getElementById('bmi-weight-num').value);
      let h = parseFloat(document.getElementById('bmi-height-num').value);
      
      if (!isMetric) {
        w = w * 0.453592;
        h = h * 2.54;
      }
      
      const hM = h / 100;
      const bmi = w / (hM * hM);
      const bodyFat = this.calcs.estimateBodyFatQuick(bmi, this.currentUser.username);
      
      this.dashboard.addLog(w, bodyFat, bmi);
      this.telemetryLog(`Logged BMI telemetry metrics on @${this.currentUser.username}`);
      alert("BMI Measurement successfully logged to progress timeline!");
    });

    document.getElementById('form-bodyfat').addEventListener('submit', (e) => {
      e.preventDefault();
      const bf = this.calcs.runBodyFat();
      if (this.currentUser) {
        const w = parseFloat(document.getElementById('bf-weight').value);
        const bmi = w / Math.pow(parseFloat(document.getElementById('bf-height').value) / 100, 2);
        this.dashboard.addLog(w, bf, bmi);
        this.telemetryLog(`Estimated US Navy body fat index on @${this.currentUser.username}: ${bf.toFixed(1)}%`);
        alert(`Estimated Body Fat of ${bf.toFixed(1)}% logged to profile.`);
      }
    });

    document.getElementById('bf-gender-male').addEventListener('click', () => {
      document.getElementById('bf-gender-male').className = "py-2 border border-[#39ff14] bg-[#39ff14]/10 text-white rounded-xl text-xs font-bold transition-all duration-300";
      document.getElementById('bf-gender-female').className = "py-2 border border-white/5 hover:border-white/10 text-gray-400 rounded-xl text-xs font-semibold transition-all duration-300";
      document.getElementById('bf-hip-group').classList.add('hidden');
      this.calcs.runBodyFat();
    });
    document.getElementById('bf-gender-female').addEventListener('click', () => {
      document.getElementById('bf-gender-female').className = "py-2 border border-[#39ff14] bg-[#39ff14]/10 text-white rounded-xl text-xs font-bold transition-all duration-300";
      document.getElementById('bf-gender-male').className = "py-2 border border-white/5 hover:border-white/10 text-gray-400 rounded-xl text-xs font-semibold transition-all duration-300";
      document.getElementById('bf-hip-group').classList.remove('hidden');
      this.calcs.runBodyFat();
    });

    document.getElementById('form-bodytype').addEventListener('submit', (e) => {
      e.preventDefault();
      this.calcs.runBodyType();
    });

    document.getElementById('form-tdee').addEventListener('submit', (e) => {
      e.preventDefault();
      this.calcs.runTDEE();
    });

    document.getElementById('form-heartrate').addEventListener('submit', (e) => {
      e.preventDefault();
      this.calcs.runHeartRate();
    });

    // 1RM form submit
    document.getElementById('form-1rm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.calcs.run1RM();
    });

    // Diet & Workout form submit
    document.getElementById('form-planner').addEventListener('submit', (e) => {
      e.preventDefault();
      this.planner.generate();
    });

    document.getElementById('plan-btn-diet').addEventListener('click', () => {
      this.plannerTab = 'diet';
      document.getElementById('plan-btn-diet').className = "flex-1 py-1.5 rounded-lg text-xs font-bold bg-[#39ff14]/10 text-[#39ff14] transition-all duration-300";
      document.getElementById('plan-btn-workout').className = "flex-1 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white transition-all duration-300";
      document.getElementById('plan-diet-content').classList.remove('hidden');
      document.getElementById('plan-workout-content').classList.add('hidden');
    });

    document.getElementById('plan-btn-workout').addEventListener('click', () => {
      this.plannerTab = 'workout';
      document.getElementById('plan-btn-workout').className = "flex-1 py-1.5 rounded-lg text-xs font-bold bg-[#39ff14]/10 text-[#39ff14] transition-all duration-300";
      document.getElementById('plan-btn-diet').className = "flex-1 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white transition-all duration-300";
      document.getElementById('plan-workout-content').classList.remove('hidden');
      document.getElementById('plan-diet-content').classList.add('hidden');
    });

    document.getElementById('form-manual-log').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!this.currentUser) return;
      const w = parseFloat(document.getElementById('manual-weight').value);
      const bf = parseFloat(document.getElementById('manual-bf').value);
      const bmi = w / Math.pow(175 / 100, 2);
      
      this.dashboard.addLog(w, bf, bmi);
      
      document.getElementById('manual-weight').value = '70';
      document.getElementById('manual-bf').value = '15';
    });

    document.getElementById('chart-toggle-weight').addEventListener('click', () => {
      this.activeChartMetric = 'weight';
      document.getElementById('chart-toggle-weight').className = "px-2.5 py-1 text-[10px] font-bold rounded bg-cyan-500/10 text-cyan-400";
      document.getElementById('chart-toggle-bf').className = "px-2.5 py-1 text-[10px] font-bold rounded text-gray-500 hover:text-white";
      this.dashboard.renderChart();
    });
    
    document.getElementById('chart-toggle-bf').addEventListener('click', () => {
      this.activeChartMetric = 'bodyFat';
      document.getElementById('chart-toggle-bf').className = "px-2.5 py-1 text-[10px] font-bold rounded bg-cyan-500/10 text-cyan-400";
      document.getElementById('chart-toggle-weight').className = "px-2.5 py-1 text-[10px] font-bold rounded text-gray-500 hover:text-white";
      this.dashboard.renderChart();
    });

    document.getElementById('form-publish-notice').addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = document.getElementById('notice-textarea').value;
      this.admin.publishNotice(msg);
    });

    document.getElementById('form-admin-edit-user').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('edit-user-username').value;
      const fullname = document.getElementById('edit-user-fullname').value;
      const goal = parseFloat(document.getElementById('edit-user-goal').value);
      const role = document.getElementById('edit-user-role').value;
      
      this.admin.saveUserMetrics(username, fullname, goal, role);
    });

    // File picker binding for JSON DB Restore
    document.getElementById('db-import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.admin.importDB(file);
      }
    });
  }

  // --- 6. SCIENTIFIC CALCULATOR MATHEMATICS ENGINE ---
  calcs = {
    runAllCalculatorsPreview: () => {
      this.calcs.runBMI();
      this.calcs.runBodyFat();
      this.calcs.runBodyType();
      this.calcs.runTDEE();
      this.calcs.runHeartRate();
    },

    toggleBmiUnits: (mode) => {
      const metricBtn = document.getElementById('bmi-toggle-metric');
      const imperialBtn = document.getElementById('bmi-toggle-imperial');
      
      const weightNum = document.getElementById('bmi-weight-num');
      const weightRange = document.getElementById('bmi-weight-range');
      const weightLbl = document.getElementById('bmi-weight-lbl');
      
      const heightNum = document.getElementById('bmi-height-num');
      const heightRange = document.getElementById('bmi-height-range');
      const heightLbl = document.getElementById('bmi-height-lbl');
      
      if (mode === 'metric') {
        metricBtn.className = "flex-1 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#39ff14] to-[#00f2fe] text-black transition-all duration-300";
        imperialBtn.className = "flex-1 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-all duration-300";
        
        weightLbl.innerText = 'kg';
        weightRange.min = 20;
        weightRange.max = 250;
        weightNum.min = 20;
        weightNum.max = 250;
        
        heightLbl.innerText = 'cm';
        heightRange.min = 100;
        heightRange.max = 250;
        heightNum.min = 100;
        heightNum.max = 250;
        
        const lbsVal = parseFloat(weightNum.value);
        const inchVal = parseFloat(heightNum.value);
        if (lbsVal > 250 || inchVal < 100) {
          weightNum.value = Math.round(lbsVal * 0.453592);
          weightRange.value = weightNum.value;
          heightNum.value = Math.round(inchVal * 2.54);
          heightRange.value = heightNum.value;
        }
      } else {
        imperialBtn.className = "flex-1 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#39ff14] to-[#00f2fe] text-black transition-all duration-300";
        metricBtn.className = "flex-1 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-all duration-300";
        
        weightLbl.innerText = 'lbs';
        weightRange.min = 50;
        weightRange.max = 500;
        weightNum.min = 50;
        weightNum.max = 500;
        
        heightLbl.innerText = 'in';
        heightRange.min = 36;
        heightRange.max = 100;
        heightNum.min = 36;
        heightNum.max = 100;
        
        const kgVal = parseFloat(weightNum.value);
        const cmVal = parseFloat(heightNum.value);
        if (kgVal < 250 && cmVal > 100) {
          weightNum.value = Math.round(kgVal / 0.453592);
          weightRange.value = weightNum.value;
          heightNum.value = Math.round(cmVal / 2.54);
          heightRange.value = heightNum.value;
        }
      }
      this.calcs.runBMI();
    },

    runBMI: () => {
      const isMetric = document.getElementById('bmi-toggle-metric').classList.contains('bg-gradient-to-r');
      const w = parseFloat(document.getElementById('bmi-weight-num').value);
      const h = parseFloat(document.getElementById('bmi-height-num').value);
      
      let bmi = 0;
      if (isMetric) {
        const hM = h / 100;
        bmi = w / (hM * hM);
      } else {
        bmi = (w / (h * h)) * 703;
      }
      
      if (isNaN(bmi) || bmi === Infinity || bmi <= 0) return;
      
      Charts.renderBMIGauge('bmi-gauge-container', bmi);
      
      const tipText = document.getElementById('bmi-tip-text');
      if (bmi < 18.5) {
        tipText.innerHTML = `<strong class="text-cyan-400 font-mono">Nutritional Guidance:</strong> Your index indicates thin proportions. Focus on a steady caloric surplus (+300 to +500 kcal) with quality complex carbs and lean protein to build skeletal muscle mass safely.`;
      } else if (bmi >= 18.5 && bmi < 25) {
        tipText.innerHTML = `<strong class="text-[#39ff14] font-mono">Health Maintenance:</strong> Excellent! Your ratio resides inside the optimal range. Retain clean nutrient partitions and maintain strength routines 3-4 days/week.`;
      } else if (bmi >= 25 && bmi < 30) {
        tipText.innerHTML = `<strong class="text-yellow-400 font-mono">Caloric Recomposition:</strong> You fall into the overweight profile. Run a mild caloric deficit (-250 kcal) or recomposition goals. Combine resistance lift styles with steady cardio.`;
      } else {
        tipText.innerHTML = `<strong class="text-pink-400 font-mono">Metabolic Health Plan:</strong> Your index indicates obesity. Prioritize cardiovascular safety and metabolic recovery. Limit high fats, increase fibers, and execute steady cardio.`;
      }
    },

    estimateBodyFatQuick: (bmi, username) => {
      const isSarah = username === 'sarah_fit';
      const genderFactor = isSarah ? 0 : 1;
      return (1.20 * bmi) + (0.23 * 25) - (10.8 * genderFactor) - 5.4;
    },

    runBodyFat: () => {
      const isMale = document.getElementById('bf-gender-male').classList.contains('border-[#39ff14]');
      const h = parseFloat(document.getElementById('bf-height').value);
      const neck = parseFloat(document.getElementById('bf-neck').value);
      const waist = parseFloat(document.getElementById('bf-waist').value);
      const hip = parseFloat(document.getElementById('bf-hip').value);
      const w = parseFloat(document.getElementById('bf-weight').value);
      
      if (!h || !neck || !waist || ( !isMale && !hip )) return;
      
      let bf = 0;
      
      if (isMale) {
        const diff = waist - neck;
        if (diff <= 0) return;
        bf = 495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(h)) - 450;
      } else {
        const sum = waist + hip - neck;
        if (sum <= 0) return;
        bf = 495 / (1.29579 - 0.35004 * Math.log10(sum) + 0.22100 * Math.log10(h)) - 450;
      }
      
      bf = Math.max(2, Math.min(bf, 50));
      
      Charts.renderBodyFatRing('bf-gauge-container', bf, isMale ? 'male' : 'female');
      
      const fatMass = w * (bf / 100);
      const leanMass = w - fatMass;
      
      document.getElementById('bf-fat-mass').innerText = `${fatMass.toFixed(1)} kg`;
      document.getElementById('bf-lean-mass').innerText = `${leanMass.toFixed(1)} kg`;
      
      const desc = document.getElementById('bf-desc-text');
      
      let colorClass = 'zone-glow-average';
      let classification = 'Average';
      
      if (isMale) {
        if (bf < 6) { colorClass = 'zone-glow-fitness'; classification = 'Essential'; }
        else if (bf >= 6 && bf < 14) { colorClass = 'zone-glow-athletic'; classification = 'Athletic'; }
        else if (bf >= 14 && bf < 18) { colorClass = 'zone-glow-fitness'; classification = 'Fit'; }
        else if (bf >= 18 && bf < 25) { colorClass = 'zone-glow-average'; classification = 'Average'; }
        else { colorClass = 'zone-glow-excess'; classification = 'Obese'; }
      } else {
        if (bf < 14) { colorClass = 'zone-glow-fitness'; classification = 'Essential'; }
        else if (bf >= 14 && bf < 21) { colorClass = 'zone-glow-athletic'; classification = 'Athletic'; }
        else if (bf >= 21 && bf < 25) { colorClass = 'zone-glow-fitness'; classification = 'Fit'; }
        else if (bf >= 25 && bf < 32) { colorClass = 'zone-glow-average'; classification = 'Average'; }
        else { colorClass = 'zone-glow-excess'; classification = 'Obese'; }
      }
      
      // If WebGL fallback is active, update the SVG outline zones
      const fallbackActive = !document.getElementById('three-fallback-svg').classList.contains('hidden');
      if (fallbackActive) {
        document.querySelectorAll('.body-zone').forEach(z => {
          z.className.baseVal = "body-zone";
        });
        document.getElementById('zone-chest').className.baseVal = `body-zone ${colorClass}`;
        document.getElementById('zone-waist').className.baseVal = `body-zone ${colorClass}`;
        document.getElementById('zone-hips').className.baseVal = `body-zone ${colorClass}`;
        document.getElementById('zone-neck').className.baseVal = `body-zone ${colorClass}`;
      }
      
      desc.innerHTML = `Your composition matches the <strong class="text-cyan-400 font-mono">${classification.toUpperCase()}</strong> classification. This means you hold approximately ${fatMass.toFixed(1)}kg of pure storage tissue and ${leanMass.toFixed(1)}kg of active metabolic skeletal mass.`;
      
      return bf;
    },

    runBodyType: () => {
      const sh = parseFloat(document.getElementById('bt-shoulders').value);
      const waist = parseFloat(document.getElementById('bt-waist').value);
      const hips = parseFloat(document.getElementById('bt-hips').value);
      const metabolism = document.getElementById('bt-metabolism').value;
      const goal = document.getElementById('bt-goal').value;
      
      if (!sh || !waist || !hips) return;
      
      let ecto = 30;
      let meso = 40;
      let endo = 30;
      
      const vTaper = sh / waist;
      const hipRatio = hips / waist;
      
      if (vTaper > 1.35) {
        meso += 15; ecto -= 5; endo -= 10;
      }
      if (hipRatio > 1.15) {
        endo += 15; meso -= 5; ecto -= 10;
      }
      
      if (metabolism === 'fast') {
        ecto += 20; endo -= 15; meso -= 5;
      } else if (metabolism === 'slow') {
        endo += 20; ecto -= 15; meso -= 5;
      }
      
      const total = ecto + meso + endo;
      const pctEcto = Math.round((ecto / total) * 100);
      const pctMeso = Math.round((meso / total) * 100);
      const pctEndo = 100 - pctEcto - pctMeso;
      
      document.getElementById('bar-ectomorph').style.width = `${pctEcto}%`;
      document.getElementById('pct-ectomorph').innerText = `${pctEcto}%`;
      document.getElementById('bar-mesomorph').style.width = `${pctMeso}%`;
      document.getElementById('pct-mesomorph').innerText = `${pctMeso}%`;
      document.getElementById('bar-endomorph').style.width = `${pctEndo}%`;
      document.getElementById('pct-endomorph').innerText = `${pctEndo}%`;
      
      const pathTitle = document.getElementById('bt-path-title');
      const pathDesc = document.getElementById('bt-path-desc');
      const diet = document.getElementById('bt-macro-diet');
      const protein = document.getElementById('bt-macro-protein');
      const training = document.getElementById('bt-macro-training');
      
      let dominant = 'Mesomorph';
      if (pctEcto > pctMeso && pctEcto > pctEndo) dominant = 'Ectomorph';
      else if (pctEndo > pctMeso && pctEndo > pctEcto) dominant = 'Endomorph';
      
      pathTitle.innerText = `Archetype: Dominant ${dominant} (${goal.toUpperCase()})`;
      
      if (goal === 'lean') {
        pathDesc.innerText = `Recommended: Lean Bulk. Focus on clean carbohydrate loading to fuel training without spillover fat gains. Perform progressive overload strength training.`;
        diet.innerText = "+250 kcal surplus";
        protein.innerText = "2.0g per kg";
        training.innerText = "Strength focus";
      } else if (goal === 'aggressive') {
        pathDesc.innerText = `Recommended: Classic Hypertrophy Bulk. Substantial surplus to maximize strength and weight gains. Support with heavy compound lifting schedules.`;
        diet.innerText = "+500 kcal surplus";
        protein.innerText = "2.2g per kg";
        training.innerText = "Powerlifting focus";
      } else if (goal === 'recomp') {
        pathDesc.innerText = `Recommended: Body Recomposition. Maintain current calories while shifting nutrients to high-protein macros to swap body fat for active muscle fibers.`;
        diet.innerText = "Maintenance (0)";
        protein.innerText = "2.3g per kg";
        training.innerText = "Hypertrophy lift";
      } else {
        pathDesc.innerText = `Recommended: Caloric Deficit Cut. Retain intense weight lifting to preserve muscle mass while burning storage fat via calorie deficit and cardio.`;
        diet.innerText = "-400 kcal deficit";
        protein.innerText = "2.4g per kg";
        training.innerText = "Cardio + Strength";
      }
      
      document.getElementById('card-ectomorph').className = "p-3 bg-white/5 border border-white/5 rounded-2xl text-center transition-all duration-500";
      document.getElementById('card-mesomorph').className = "p-3 bg-white/5 border border-white/5 rounded-2xl text-center transition-all duration-500";
      document.getElementById('card-endomorph').className = "p-3 bg-white/5 border border-white/5 rounded-2xl text-center transition-all duration-500";
      
      if (dominant === 'Ectomorph') {
        document.getElementById('card-ectomorph').className = "p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-center transition-all duration-500 shadow-md";
      } else if (dominant === 'Mesomorph') {
        document.getElementById('card-mesomorph').className = "p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center transition-all duration-500 shadow-md";
      } else {
        document.getElementById('card-endomorph').className = "p-3 bg-pink-500/10 border border-pink-500/30 rounded-2xl text-center transition-all duration-500 shadow-md";
      }
    },

    runTDEE: () => {
      const gender = document.getElementById('tdee-gender').value;
      const age = parseInt(document.getElementById('tdee-age').value);
      const w = parseFloat(document.getElementById('tdee-weight').value);
      const h = parseFloat(document.getElementById('tdee-height').value);
      const bf = parseFloat(document.getElementById('tdee-bf').value);
      const activity = parseFloat(document.getElementById('tdee-activity').value);
      
      if (!age || !w || !h) return;
      
      let bmr = 0;
      let usingKatch = false;
      
      // If Body fat percentage provided, execute Katch-McArdle Formula
      if (!isNaN(bf) && bf > 2) {
        const leanMass = w * (1 - (bf / 100));
        bmr = 370 + (21.6 * leanMass);
        usingKatch = true;
      } else {
        // Fallback to Mifflin-St Jeor
        if (gender === 'male') {
          bmr = (10 * w) + (6.25 * h) - (5 * age) + 5;
        } else {
          bmr = (10 * w) + (6.25 * h) - (5 * age) - 161;
        }
      }
      
      const tdee = bmr * activity;
      
      document.getElementById('tdee-bmr-val').innerHTML = `${Math.round(bmr)} <span class="text-xs text-gray-500 font-normal">kcal/day</span>`;
      document.getElementById('tdee-tdee-val').innerHTML = `${Math.round(tdee)} <span class="text-xs text-gray-500 font-normal">kcal/day</span>`;
      
      const label = document.getElementById('tdee-formula-label');
      if (usingKatch) {
        label.innerText = `Using somatic Katch-McArdle (LBM factored).`;
        label.className = "text-[9px] text-[#39ff14] mt-1 font-mono";
      } else {
        label.innerText = `Using standard Mifflin-St Jeor equation.`;
        label.className = "text-[9px] text-gray-500 mt-1 font-mono";
      }
      
      document.getElementById('tdee-cut-val').innerText = `${Math.round(tdee - 500)} kcal`;
      document.getElementById('tdee-maint-val').innerText = `${Math.round(tdee)} kcal`;
      document.getElementById('tdee-bulk-val').innerText = `${Math.round(tdee + 300)} kcal`;
    },

    runHeartRate: () => {
      const age = parseInt(document.getElementById('hr-age').value);
      const rhr = parseInt(document.getElementById('hr-rhr').value);
      const gender = document.getElementById('hr-gender').value;
      const h = parseFloat(document.getElementById('hr-height').value);
      
      if (!age || !rhr || !h) return;
      
      const maxHr = Math.round(207 - (0.7 * age));
      const hrr = maxHr - rhr;
      
      const fbLow = Math.round((hrr * 0.50) + rhr);
      const fbHigh = Math.round((hrr * 0.60) + rhr);
      const cardLow = Math.round((hrr * 0.70) + rhr);
      const cardHigh = Math.round((hrr * 0.80) + rhr);
      const peakLow = Math.round((hrr * 0.85) + rhr);
      
      document.getElementById('hr-max-bpm').innerHTML = `${maxHr} <span class="text-xs text-gray-500 font-normal">BPM</span>`;
      document.getElementById('hr-zone-fb').innerText = `${fbLow} - ${fbHigh} BPM`;
      document.getElementById('hr-zone-cardio').innerText = `${cardLow} - ${cardHigh} BPM`;
      document.getElementById('hr-zone-peak').innerText = `${peakLow} - ${maxHr} BPM`;
      
      const heightInches = h / 2.54;
      const inchesOver 	= Math.max(0, heightInches - 60);
      
      let idealWeight = 0;
      if (gender === 'male') {
        idealWeight = 50.0 + (2.3 * inchesOver);
      } else {
        idealWeight = 45.5 + (2.3 * inchesOver);
      }
      
      document.getElementById('hr-ideal-wt').innerHTML = `${(idealWeight - 3).toFixed(1)} - ${(idealWeight + 3).toFixed(1)} <span class="text-xs text-gray-500 font-normal">kg</span>`;
    },

    // 1-Rep Max calculations
    run1RM: () => {
      const lift = document.getElementById('one-lift').value;
      const w = parseFloat(document.getElementById('one-weight').value);
      const reps = parseInt(document.getElementById('one-reps').value);
      const bw = parseFloat(document.getElementById('one-bodyweight').value);
      
      if (!w || !reps || !bw) return;
      
      // Formulas
      const epley = w * (1 + (reps / 30));
      const brzycki = w / (1.0278 - (0.0278 * reps));
      
      document.getElementById('one-epley-val').innerHTML = `${Math.round(epley)} <span class="text-xs text-gray-500 font-normal">kg</span>`;
      document.getElementById('one-brzycki-val').innerHTML = `${Math.round(brzycki)} <span class="text-xs text-gray-500 font-normal">kg</span>`;
      
      // Calculate coefficient compared to bodyweight
      const best1RM = Math.max(epley, brzycki);
      const ratio = best1RM / bw;
      document.getElementById('one-ratio-badge').innerText = `${ratio.toFixed(2)}x Bodyweight`;
      
      // Classification limits
      let tier = 'Beginner';
      let pct = 20;
      
      if (lift === 'squat') {
        if (ratio < 1.0) { tier = 'Beginner'; pct = 20; }
        else if (ratio < 1.3) { tier = 'Novice'; pct = 40; }
        else if (ratio < 1.7) { tier = 'Intermediate'; pct = 60; }
        else if (ratio < 2.3) { tier = 'Advanced'; pct = 80; }
        else { tier = 'Elite Lifting Athlete'; pct = 100; }
      } else if (lift === 'bench') {
        if (ratio < 0.6) { tier = 'Beginner'; pct = 20; }
        else if (ratio < 0.9) { tier = 'Novice'; pct = 40; }
        else if (ratio < 1.2) { tier = 'Intermediate'; pct = 60; }
        else if (ratio < 1.7) { tier = 'Advanced'; pct = 80; }
        else { tier = 'Elite Lifting Athlete'; pct = 100; }
      } else { // Deadlift
        if (ratio < 1.2) { tier = 'Beginner'; pct = 20; }
        else if (ratio < 1.5) { tier = 'Novice'; pct = 40; }
        else if (ratio < 2.0) { tier = 'Intermediate'; pct = 60; }
        else if (ratio < 2.6) { tier = 'Advanced'; pct = 80; }
        else { tier = 'Elite Lifting Athlete'; pct = 100; }
      }
      
      document.getElementById('one-class-title').innerText = `Strength Tier: ${tier}`;
      document.getElementById('one-level-bar').style.width = `${pct}%`;
      
      let classDesc = '';
      if (pct <= 40) {
        classDesc = "Base physical threshold. Focus on stabilizing lifting posture (e.g. vertical shins on deadlifts) and expanding target workout experience levels.";
      } else if (pct <= 60) {
        classDesc = "Optimal standard metrics. Balanced load distributions. Support with higher calorie surplus meals to build structural muscle mass.";
      } else {
        classDesc = "Exceptional power output. High biomechanical efficiency. Consider advanced weekly hypertrophy routines to bypass plateaus.";
      }
      document.getElementById('one-class-desc').innerText = classDesc;
    }
  };

  // --- 7. HYDRATION ENGINE ---
  hydration = {
    sync: () => {
      let logged = 0;
      let target = 3000;
      
      if (this.currentUser) {
        logged = this.currentUser.waterLogged || 0;
        target = this.currentUser.waterTarget || 3000;
      } else {
        // Fallback for mock session
        logged = parseInt(localStorage.getItem('mock_water_logged') || '0');
        target = parseInt(document.getElementById('hydro-target').value);
      }
      
      document.getElementById('hydro-target').value = target;
      
      // Update graphics
      const pct = target > 0 ? Math.round((logged / target) * 100) : 0;
      document.getElementById('hydro-percent-text').innerText = `${pct}%`;
      document.getElementById('hydro-total-text').innerText = `${logged} / ${target} ml`;
      
      Charts.initHydrationWave('hydro-wave-canvas', logged, target);
    },
    
    logWater: (ml) => {
      if (this.currentUser) {
        const users = this.getUsers();
        users[this.currentUser.username].waterLogged = (users[this.currentUser.username].waterLogged || 0) + ml;
        this.saveUsers(users);
        this.currentUser = users[this.currentUser.username];
      } else {
        const logged = parseInt(localStorage.getItem('mock_water_logged') || '0');
        localStorage.setItem('mock_water_logged', String(logged + ml));
      }
      
      this.telemetryLog(`Logged fluid intake: +${ml}ml`);
      this.hydration.sync();
    },

    logCustom: () => {
      const val = parseInt(document.getElementById('hydro-custom').value);
      if (isNaN(val) || val <= 0) return;
      this.hydration.logWater(val);
    },

    resetWater: () => {
      if (!confirm("Are you sure you want to clear logged water history for today?")) return;
      
      if (this.currentUser) {
        const users = this.getUsers();
        users[this.currentUser.username].waterLogged = 0;
        this.saveUsers(users);
        this.currentUser = users[this.currentUser.username];
      } else {
        localStorage.setItem('mock_water_logged', '0');
      }
      
      this.telemetryLog("Hydration history log reset to 0ml.");
      this.hydration.sync();
    }
  };

  // --- 8. DIET & WORKOUT SPLIT BUILDERS ---
  planner = {
    sync: () => {
      this.planner.generate();
    },

    generate: () => {
      const kcal = parseFloat(document.getElementById('plan-calories').value);
      const type = document.getElementById('plan-diet-type').value;
      const level = document.getElementById('plan-workout-level').value;
      const equip = document.getElementById('plan-workout-equip').value;
      
      if (!kcal) return;
      
      // Caloric ratios
      let carbsPct = 40, protPct = 30, fatPct = 30;
      if (type === 'highprotein') { carbsPct = 25; protPct = 45; fatPct = 30; }
      else if (type === 'keto') { carbsPct = 5; protPct = 25; fatPct = 70; }
      else if (type === 'vegan') { carbsPct = 55; protPct = 25; fatPct = 20; }
      
      // Calculate grams: Carbs 4kcal/g, Protein 4kcal/g, Fat 9kcal/g
      const cG = Math.round((kcal * (carbsPct / 100)) / 4);
      const pG = Math.round((kcal * (protPct / 100)) / 4);
      const fG = Math.round((kcal * (fatPct / 100)) / 9);
      
      document.getElementById('lbl-macro-carbs').innerHTML = `${cG}g <span class="text-gray-500 font-normal">(${carbsPct}%)</span>`;
      document.getElementById('lbl-macro-protein').innerHTML = `${pG}g <span class="text-gray-500 font-normal">(${protPct}%)</span>`;
      document.getElementById('lbl-macro-fats').innerHTML = `${fG}g <span class="text-gray-500 font-normal">(${fatPct}%)</span>`;
      
      // Render Macro SVG concentrics
      Charts.renderMacroRings('plan-macro-svg-container', carbsPct, protPct, fatPct);
      
      // Build Meals templates
      const dietBox = document.getElementById('plan-diet-content');
      let mealsHTML = '';
      
      if (type === 'keto') {
        mealsHTML = `
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-pink-400 font-bold font-mono uppercase">Breakfast</span><p class="text-xs text-white mt-1">3 Scrambled Eggs in butter + 1/2 Avocado + Smoked Salmon slices.</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-pink-400 font-bold font-mono uppercase">Lunch</span><p class="text-xs text-white mt-1">Grilled Chicken Caesar Salad (no croutons) with extra olive oil dressing & cheese.</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-pink-400 font-bold font-mono uppercase">Dinner</span><p class="text-xs text-white mt-1">Pan seared Ribeye Steak + Asparagus spears sautéed in garlic ghee.</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-pink-400 font-bold font-mono uppercase">Snack</span><p class="text-xs text-white mt-1">Macadamia nuts (30g) or pork rinds.</p></div>
        `;
      } else if (type === 'vegan') {
        mealsHTML = `
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-cyan-400 font-bold font-mono uppercase">Breakfast</span><p class="text-xs text-white mt-1">Organic Tofu Scramble with spinach, mushrooms & 2 slices of sprouted grain toast.</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-cyan-400 font-bold font-mono uppercase">Lunch</span><p class="text-xs text-white mt-1">Quinoa Bowl loaded with black beans, roasted sweet potatoes, broccoli & tahini drizzle.</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-cyan-400 font-bold font-mono uppercase">Dinner</span><p class="text-xs text-white mt-1">Lentil Dahl Curry with brown rice + steamed asparagus.</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-cyan-400 font-bold font-mono uppercase">Snack</span><p class="text-xs text-white mt-1">Pea Protein Shake + banana blended with almond milk.</p></div>
        `;
      } else if (type === 'highprotein') {
        mealsHTML = `
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-[#39ff14] font-bold font-mono uppercase">Breakfast</span><p class="text-xs text-white mt-1">5 Egg whites + 1 whole egg omelet + 1 cup Oats with berries.</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-[#39ff14] font-bold font-mono uppercase">Lunch</span><p class="text-xs text-white mt-1">Grilled Turkey breast (200g) + Jasmine Rice (150g) + Steamed Green Beans.</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-[#39ff14] font-bold font-mono uppercase">Dinner</span><p class="text-xs text-white mt-1">Baked Cod or Tuna filet + roasted sweet potatoes + broccoli florets.</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-[#39ff14] font-bold font-mono uppercase">Snack</span><p class="text-xs text-white mt-1">Whey Protein Isolate + 200g Greek Yogurt (0% fat).</p></div>
        `;
      } else {
        mealsHTML = `
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-[#39ff14] font-bold font-mono uppercase">Breakfast</span><p class="text-xs text-white mt-1">3 Scrambled Eggs + 2 slices whole wheat toast + 1 orange.</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-[#39ff14] font-bold font-mono uppercase">Lunch</span><p class="text-xs text-white mt-1">Lean Sirloin steak wrap with lettuce, tomatoes, low-fat cheese, and brown rice.</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-[#39ff14] font-bold font-mono uppercase">Dinner</span><p class="text-xs text-white mt-1">Baked Salmon filet + sweet potato wedges + roasted mixed vegetables.</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><span class="text-[9px] text-[#39ff14] font-bold font-mono uppercase">Snack</span><p class="text-xs text-white mt-1">Mixed Almonds & Walnuts + 1 apple.</p></div>
        `;
      }
      dietBox.innerHTML = mealsHTML;
      
      // Build Workout split
      const workoutBox = document.getElementById('plan-workout-content');
      let splitHTML = '';
      
      if (level === 'beginner') {
        splitHTML = `
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><div class="flex items-center gap-2"><input type="checkbox" id="ex-b1"><label for="ex-b1" class="text-xs text-white font-semibold">Day 1: Full Body Compound</label></div><p class="text-[10px] text-gray-500 mt-1 pl-5">Squats (3x8) | Bench Press (3x8) | Lat Pulldowns (3x10)</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><div class="flex items-center gap-2"><input type="checkbox" id="ex-b2"><label for="ex-b2" class="text-xs text-white font-semibold">Day 2: Full Body Compound</label></div><p class="text-[10px] text-gray-500 mt-1 pl-5">Romanian Deadlifts (3x10) | Overhead Press (3x8) | Barbell Rows (3x8)</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><div class="flex items-center gap-2"><input type="checkbox" id="ex-b3"><label for="ex-b3" class="text-xs text-white font-semibold">Day 3: Full Body Cardio & Core</label></div><p class="text-[10px] text-gray-500 mt-1 pl-5">Incline Walk (20m) | Hanging Knee Raises (3x12) | Planks (3x60s)</p></div>
        `;
      } else if (level === 'intermediate') {
        splitHTML = `
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><div class="flex items-center gap-2"><input type="checkbox" id="ex-i1"><label for="ex-i1" class="text-xs text-white font-semibold">Day 1: Upper Body Power</label></div><p class="text-[10px] text-gray-500 mt-1 pl-5">Flat Bench Press (4x6) | Pull-ups (4x8) | DB Shoulder Press (3x8)</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><div class="flex items-center gap-2"><input type="checkbox" id="ex-i2"><label for="ex-i2" class="text-xs text-white font-semibold">Day 2: Lower Body Power</label></div><p class="text-[10px] text-gray-500 mt-1 pl-5">Back Squats (4x6) | Romanian Deadlifts (4x8) | Calf Raises (4x15)</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><div class="flex items-center gap-2"><input type="checkbox" id="ex-i3"><label for="ex-i3" class="text-xs text-white font-semibold">Day 3: Upper Hypertrophy</label></div><p class="text-[10px] text-gray-500 mt-1 pl-5">Incline DB Press (3x10) | Cable Rows (3x12) | Lateral Raises (4x12)</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><div class="flex items-center gap-2"><input type="checkbox" id="ex-i4"><label for="ex-i4" class="text-xs text-white font-semibold">Day 4: Lower Hypertrophy</label></div><p class="text-[10px] text-gray-500 mt-1 pl-5">Leg Press (3x12) | Leg Curls (3x12) | Lunges (3x10 per leg)</p></div>
        `;
      } else { // Pro
        splitHTML = `
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><div class="flex items-center gap-2"><input type="checkbox" id="ex-p1"><label for="ex-p1" class="text-xs text-white font-semibold">Day 1: Push (Chest, Shoulders, Tris)</label></div><p class="text-[10px] text-gray-500 mt-1 pl-5">Barbell Bench (4x6) | Overhead Press (3x8) | Skull Crushers (3x10)</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><div class="flex items-center gap-2"><input type="checkbox" id="ex-p2"><label for="ex-p2" class="text-xs text-white font-semibold">Day 2: Pull (Back, Rear Delts, Bis)</label></div><p class="text-[10px] text-gray-500 mt-1 pl-5">Weighted Pull-ups (4x6) | Chest Supported Rows (3x10) | Hammer Curls (3x12)</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><div class="flex items-center gap-2"><input type="checkbox" id="ex-p3"><label for="ex-p3" class="text-xs text-white font-semibold">Day 3: Legs (Quads, Hams, Calves)</label></div><p class="text-[10px] text-gray-500 mt-1 pl-5">Front Squats (4x8) | Lying Leg Curls (4x10) | Standing Calf Raises (4x15)</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><div class="flex items-center gap-2"><input type="checkbox" id="ex-p4"><label for="ex-p4" class="text-xs text-white font-semibold">Day 4: Push (Volume Focus)</label></div><p class="text-[10px] text-gray-500 mt-1 pl-5">Incline DB Press (3x12) | Cable Flyes (3x15) | Lateral Raises (4x15)</p></div>
          <div class="p-3 bg-white/5 rounded-xl border border-white/5"><div class="flex items-center gap-2"><input type="checkbox" id="ex-p5"><label for="ex-p5" class="text-xs text-white font-semibold">Day 5: Pull (Volume Focus)</label></div><p class="text-[10px] text-gray-500 mt-1 pl-5">Lat Pulldowns (3x12) | Face Pulls (4x15) | Incline DB Curls (3x10)</p></div>
        `;
      }
      
      workoutBox.innerHTML = splitHTML;
    }
  };

  // --- 9. MEMBER DASHBOARD MANAGER ---
  dashboard = {
    sync: () => {
      if (!this.currentUser) return;
      
      const users = this.getUsers();
      this.currentUser = users[this.currentUser.username];
      
      const logs = this.currentUser.logs || [];
      
      if (logs.length > 0) {
        const latest = logs[logs.length - 1];
        document.getElementById('dash-stat-bmi').innerText = latest.bmi.toFixed(1);
        document.getElementById('dash-stat-bf').innerText = `${latest.bodyFat.toFixed(1)}%`;
        
        const weight = latest.weight;
        // Mifflin approximation for dashboard
        const bmr = 10 * weight + 6.25 * 175 - 5 * 25 + 5;
        document.getElementById('dash-stat-tdee').innerHTML = `${Math.round(bmr * 1.375)} <span class="text-xs font-normal text-gray-400 font-mono">kcal</span>`;
      } else {
        document.getElementById('dash-stat-bmi').innerText = "--";
        document.getElementById('dash-stat-bf').innerText = "--";
        document.getElementById('dash-stat-tdee').innerText = "--";
      }
      
      document.getElementById('dash-stat-goal').innerHTML = `${this.currentUser.goal} <span class="text-xs font-normal text-gray-400 font-mono">kg</span>`;
      document.getElementById('input-weight-goal').value = this.currentUser.goal;
      
      this.dashboard.renderLogsTable();
      this.dashboard.renderChart();
    },

    renderLogsTable: () => {
      const container = document.getElementById('user-metrics-table-rows');
      container.innerHTML = '';
      
      const logs = this.currentUser.logs || [];
      const reversedLogs = [...logs].reverse();
      
      if (reversedLogs.length === 0) {
        container.innerHTML = `
          <tr>
            <td colspan="5" class="py-6 text-center text-gray-500">No logs found. Enter metrics above or use the health calculators to save logs!</td>
          </tr>
        `;
        return;
      }
      
      reversedLogs.forEach((log, index) => {
        const actualIndex = logs.indexOf(log);
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 transition-colors";
        tr.innerHTML = `
          <td class="py-3 px-4 font-semibold text-white">${log.date}</td>
          <td class="py-3 px-4 font-mono">${log.weight.toFixed(1)} kg</td>
          <td class="py-3 px-4 text-[#39ff14] font-mono">${log.bodyFat.toFixed(1)} %</td>
          <td class="py-3 px-4 font-mono">${log.bmi.toFixed(1)}</td>
          <td class="py-3 px-4 text-right">
            <button onclick="app.dashboard.deleteLog(${actualIndex})" class="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Delete Metric Log">&times; Delete</button>
          </td>
        `;
        container.appendChild(tr);
      });
    },

    addLog: (weight, bodyFat, bmi) => {
      if (!this.currentUser) return;
      
      const users = this.getUsers();
      const user = users[this.currentUser.username];
      
      user.logs.push({
        date: new Date().toISOString().split('T')[0],
        weight: Number(weight),
        bodyFat: Number(bodyFat),
        bmi: Number(bmi)
      });
      
      this.saveUsers(users);
      this.dashboard.sync();
      this.admin.sync();
    },

    deleteLog: (index) => {
      if (!this.currentUser) return;
      if (!confirm("Are you sure you want to delete this log entry?")) return;
      
      const users = this.getUsers();
      const user = users[this.currentUser.username];
      
      user.logs.splice(index, 1);
      
      this.saveUsers(users);
      this.dashboard.sync();
      this.admin.sync();
    },

    setWeightGoal: () => {
      if (!this.currentUser) return;
      const targetVal = parseFloat(document.getElementById('input-weight-goal').value);
      if (isNaN(targetVal) || targetVal <= 0) return;
      
      const users = this.getUsers();
      users[this.currentUser.username].goal = targetVal;
      
      this.saveUsers(users);
      this.dashboard.sync();
      alert(`Weight target updated to ${targetVal}kg!`);
    },

    renderChart: () => {
      const logs = this.currentUser ? this.currentUser.logs : [];
      Charts.renderProgressLineChart('progress-chart-container', logs, this.activeChartMetric);
    }
  };

  // --- 10. TRAINER CLIENTS LOGGING ENGINE ---
  trainer = {
    syncClients: () => {
      const users = this.getUsers();
      // Select standard users
      const clientNames = Object.keys(users).filter(name => users[name].role === 'user');
      
      const container = document.getElementById('trainer-client-rows');
      container.innerHTML = '';
      
      if (clientNames.length === 0) {
        container.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-500">No client accounts found.</td></tr>`;
        return;
      }
      
      clientNames.forEach(name => {
        const client = users[name];
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 transition-colors";
        tr.innerHTML = `
          <td class="py-3 px-4 font-semibold text-white font-mono">@${client.username}</td>
          <td class="py-3 px-4 text-gray-300">${client.fullname}</td>
          <td class="py-3 px-4 font-mono text-cyan-400">${client.goal} kg</td>
          <td class="py-3 px-4 text-right">
            <button onclick="app.trainer.logForClient('${client.username}')" class="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-300 rounded-xl text-[10px] font-bold transition-all duration-300">
              Manage Client Logs
            </button>
          </td>
        `;
        container.appendChild(tr);
      });
    },

    logForClient: (username) => {
      const weightStr = prompt(`Enter current weight (kg) for client @${username}:`, "70");
      if (weightStr === null) return;
      const weight = parseFloat(weightStr);
      
      const bfStr = prompt(`Enter body fat percentage (%) for client @${username}:`, "15");
      if (bfStr === null) return;
      const bf = parseFloat(bfStr);
      
      if (isNaN(weight) || isNaN(bf)) {
        alert("Invalid numbers entered.");
        return;
      }
      
      const users = this.getUsers();
      const client = users[username];
      
      if (!client) return;
      
      const bmi = weight / Math.pow(175 / 100, 2); // default height approximation
      client.logs.push({
        date: new Date().toISOString().split('T')[0],
        weight: weight,
        bodyFat: bf,
        bmi: bmi
      });
      
      this.saveUsers(users);
      this.telemetryLog(`Trainer logged metric for @${username}: ${weight}kg, ${bf}%`);
      this.trainer.syncClients();
      this.admin.sync();
      alert(`Successfully saved log metrics for @${username}.`);
    }
  };

  // --- 11. SYSTEM ADMINISTRATION CONTROL MODULE ---
  admin = {
    sync: () => {
      if (!this.currentUser || this.currentUser.role !== 'admin') return;
      
      const users = this.getUsers();
      const usernames = Object.keys(users).filter(name => users[name].role !== 'admin');
      
      const totalAccounts = usernames.length;
      document.getElementById('admin-stat-users').innerText = totalAccounts;
      
      let sumBmi = 0;
      let sumBf = 0;
      let bmiCount = 0;
      let bfCount = 0;
      
      usernames.forEach(name => {
        const u = users[name];
        const logs = u.logs || [];
        if (logs.length > 0) {
          const latest = logs[logs.length - 1];
          sumBmi += latest.bmi;
          sumBf += latest.bodyFat;
          bmiCount++;
          bfCount++;
        }
      });
      
      const avgBmi = bmiCount > 0 ? (sumBmi / bmiCount) : 0;
      const avgBf = bfCount > 0 ? (sumBf / bfCount) : 0;
      
      document.getElementById('admin-stat-avg-bmi').innerText = avgBmi > 0 ? avgBmi.toFixed(1) : '--';
      document.getElementById('admin-stat-avg-bf').innerText = avgBf > 0 ? `${avgBf.toFixed(1)}%` : '--%';
      
      this.admin.renderUsersTable(users, usernames);
    },

    renderUsersTable: (users, usernames) => {
      const container = document.getElementById('admin-user-table-rows');
      container.innerHTML = '';
      
      if (usernames.length === 0) {
        container.innerHTML = `
          <tr>
            <td colspan="5" class="py-6 text-center text-gray-500">No member accounts registered yet.</td>
          </tr>
        `;
        return;
      }
      
      usernames.forEach(name => {
        const u = users[name];
        const logsCount = u.logs ? u.logs.length : 0;
        
        let badgeColor = 'bg-cyan-500/10 text-cyan-400';
        let badgeText = 'Standard Member';
        if (u.role === 'trainer') {
          badgeColor = 'bg-[#39ff14]/15 text-[#39ff14]';
          badgeText = 'Elite Coach';
        }
        
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 transition-colors";
        tr.innerHTML = `
          <td class="py-3 px-4 font-semibold text-white font-mono">@${u.username}</td>
          <td class="py-3 px-4 font-medium text-gray-300">${u.fullname}</td>
          <td class="py-3 px-4 font-mono text-gray-400">${logsCount} records</td>
          <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-md ${badgeColor} font-bold uppercase text-[9px] font-mono">${badgeText}</span></td>
          <td class="py-3 px-4 text-right space-x-2">
            <button onclick="app.admin.openEditModal('${u.username}')" class="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-[10px] font-semibold transition-colors">Edit</button>
            <button onclick="app.admin.deleteUser('${u.username}')" class="px-2 py-1 bg-red-500/15 hover:bg-red-500/30 text-red-400 rounded text-[10px] font-semibold transition-colors">Delete</button>
          </td>
        `;
        container.appendChild(tr);
      });
    },

    deleteUser: (username) => {
      if (!confirm(`Are you absolutely sure you want to terminate member account @${username}? This deletes all historical telemetry data.`)) return;
      
      const users = this.getUsers();
      delete users[username];
      
      this.saveUsers(users);
      this.telemetryLog(`Administrative deletion executed on user: @${username}`);
      this.admin.sync();
      alert(`Account @${username} has been deleted.`);
    },

    openEditModal: (username) => {
      const users = this.getUsers();
      const user = users[username];
      
      if (!user) return;
      
      document.getElementById('edit-user-username').value = username;
      document.getElementById('edit-user-fullname').value = user.fullname;
      document.getElementById('edit-user-goal').value = user.goal;
      document.getElementById('edit-user-role').value = user.role || 'user';
      
      document.getElementById('modal-edit-user').classList.remove('hidden');
    },

    closeEditModal: () => {
      document.getElementById('modal-edit-user').classList.add('hidden');
    },

    saveUserMetrics: (username, fullname, goal, role) => {
      const users = this.getUsers();
      const user = users[username];
      
      if (!user) return;
      
      user.fullname = fullname.trim();
      user.goal = Number(goal);
      user.role = role;
      
      this.saveUsers(users);
      this.telemetryLog(`Administrative profile update applied to user: @${username}`);
      this.admin.sync();
      this.admin.closeEditModal();
      this.updateAuthUI();
      alert(`User profile details for @${username} have been adjusted.`);
    },

    publishNotice: (msg) => {
      localStorage.setItem(this.announcementKey, msg.trim());
      this.initAnnouncement();
      document.getElementById('notice-textarea').value = '';
      this.telemetryLog(`Published system alert broadcast notice: "${msg.substring(0, 30)}..."`);
      alert("Notice announcement broadcasted system-wide!");
    },

    clearNotice: () => {
      localStorage.removeItem(this.announcementKey);
      this.initAnnouncement();
      this.telemetryLog("Cleared active system alert broadcast notice.");
      alert("Notice announcement cleared.");
    },

    // JSON DB export downloader
    exportDB: () => {
      const db = localStorage.getItem(this.dbKey);
      if (!db) return;
      
      const blob = new Blob([db], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness_hub_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.telemetryLog("Database exported as JSON backup download file.");
    },

    // JSON DB restore file uploader
    importDB: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          // Simple key structure validation
          if (typeof json === 'object' && json !== null) {
            localStorage.setItem(this.dbKey, JSON.stringify(json));
            this.initDatabase();
            this.initAuth();
            this.updateAuthUI();
            this.admin.sync();
            this.telemetryLog("Database successfully restored from JSON file upload.");
            alert("Database successfully restored from backup file!");
          } else {
            alert("Invalid database file format.");
          }
        } catch (err) {
          alert("Error parsing JSON backup file: " + err.message);
        }
      };
      reader.readAsText(file);
    }
  }
}

// Global hook instantiation
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new FitnessApp();
});

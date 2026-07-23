import { stateManager } from './state.js';
import { initSearchableDropdown } from './dropdown.js';
import { computeAIMetrics } from './aiEngine.js';
import { initVoiceInput } from './voiceInput.js';
import { generateClientPDF } from './pdfGenerator.js';
import { initResultsScreen, showResultsDashboard } from './results.js';
import confetti from 'canvas-confetti';

document.addEventListener('DOMContentLoaded', () => {
  // 3-Second Splash Intro Handler
  const splash = document.getElementById('splashScreen');
  if (splash) {
    setTimeout(() => {
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
      }, 800);
    }, 3000);
  }

  if (window.lucide) window.lucide.createIcons();

  // PRE-SEED VAULT WITH MOCK CLIENTS IF EMPTY
  let vault = stateManager.getVault();
  if (vault.length === 0) {
    const mockClients = [
      {
        clientId: 'ELITE-2026-8842',
        fullName: 'Vikramaditya Singhania',
        dob: '1982-08-14',
        pan: 'AAAPS1234K',
        mobile: '+91 98200 12345',
        email: 'vikram@singhaniagroup.com',
        occupation: 'Business Owner',
        businessType: 'Private Limited',
        companyName: 'Singhania Global Ventures',
        industry: 'Technology',
        annualIncome: '5-10Cr',
        netWorth: '50-100Cr',
        liquidAssets: '180000000',
        city: 'Mumbai',
        currentStep: 1,
        familyMembers: [
          { name: 'Karan Singhania', relationship: 'Son', dependent: 'Yes' },
          { name: 'Pooja Singhania', relationship: 'Spouse', dependent: 'Yes' }
        ],
        riskAnswers: {
          q1Horizon: '5-10 years',
          q2Reaction: 'Buy More',
          q3Objective: 'Capital Growth'
        },
        riskScore: 78,
        riskCategory: 'Growth',
        goals: [
          {
            id: 'g-1',
            type: 'Higher Education Planning',
            targetAmount: 90000000,
            targetYears: 15,
            bifurcations: [
              { name: 'Parag Parikh Flexi Cap Fund', allocation: 6000000, yield: 12.0, access: '3–4 days' },
              { name: 'UTI Nifty 50 Index Fund', allocation: 6000000, yield: 11.5, access: '3–4 days' },
              { name: 'Motilal US S&P 500 Index Fund', allocation: 4000000, yield: 11.0, access: '3–4 days' },
              { name: 'Motilal NASDAQ 100 ETF', allocation: 4000000, yield: 13.0, access: '3–4 days' }
            ]
          }
        ],
        selectedAssets: ['Direct Equity', 'Alternative Assets (AIF/PMS)'],
        stockExperience: 'Professional',
        preferredSectors: ['Technology', 'AI'],
        residentialStatus: 'Resident',
        taxRegime: 'New',
        grossProceeds: 1000000000,
        taxRate: 0.15,
        taxReserve: 150000000,
        hasLifeInsurance: 'Yes',
        hasHealthInsurance: 'Yes',
        auditLogs: [{ timestamp: '12:00:00', action: 'Pre-seeded Vikramaditya Profile' }],
        isDraft: false
      },
      {
        clientId: 'ELITE-2026-3029',
        fullName: 'Ananya Birla',
        dob: '1991-04-20',
        pan: 'BBBPB4321A',
        mobile: '+91 98110 54321',
        email: 'ananya@birlacapital.com',
        occupation: 'Investor',
        companyName: 'Birla Ventures',
        industry: 'Finance',
        annualIncome: '25Cr+',
        netWorth: '100Cr+',
        liquidAssets: '450000000',
        city: 'Delhi',
        currentStep: 1,
        familyMembers: [],
        riskAnswers: {
          q1Horizon: '10+ years',
          q2Reaction: 'Buy More',
          q3Objective: 'Aggressive Expansion'
        },
        riskScore: 92,
        riskCategory: 'Aggressive',
        goals: [
          {
            id: 'g-2',
            type: 'Health Emergency Reserve',
            targetAmount: 30000000,
            targetYears: 15,
            bifurcations: [
              { name: 'Sweep-in Fixed Deposit (Tier 1)', allocation: 5000000, yield: 5.8, access: 'Same day' },
              { name: 'ICICI Prudential Short Term Fund (Tier 2)', allocation: 10000000, yield: 7.25, access: '2–3 days' },
              { name: 'Tata Arbitrage Fund (Tier 3)', allocation: 15000000, yield: 7.59, access: '3–4 days' }
            ]
          }
        ],
        selectedAssets: ['Direct Equity', 'Alternative Assets (AIF/PMS)', 'Mutual Funds & ETFs'],
        stockExperience: 'Professional',
        preferredSectors: ['AI', 'Banking'],
        residentialStatus: 'Resident',
        taxRegime: 'New',
        grossProceeds: 2000000000,
        taxRate: 0.15,
        taxReserve: 300000000,
        hasLifeInsurance: 'Yes',
        hasHealthInsurance: 'Yes',
        auditLogs: [{ timestamp: '12:05:00', action: 'Pre-seeded Ananya Profile' }],
        isDraft: false
      }
    ];
    localStorage.setItem('elite_wealth_os_vault', JSON.stringify(mockClients));
    stateManager.vault = mockClients;
    vault = mockClients;
  }

  // SCREEN VIEWS TOGGLING
  const homeScreen = document.getElementById('homeScreen');
  const wizardScreen = document.getElementById('wizardScreen');
  const vaultSection = document.getElementById('vaultSection');
  const vaultTableBody = document.getElementById('vaultTableBody');

  // NAVBAR ACTION BUTTONS TO SHOW/HIDE
  const actionButtons = [
    'btnBackToHome', 'autosaveStatus', 'btnUndo', 'btnRedo', 'btnVoice', 'btnAuditLog'
  ].map(id => document.getElementById(id));

  function showHomeScreen() {
    homeScreen.style.display = 'flex';
    wizardScreen.style.display = 'none';
    const resultsScreen = document.getElementById('resultsScreen');
    if (resultsScreen) resultsScreen.style.display = 'none';
    actionButtons.forEach(btn => { if (btn) btn.style.display = 'none'; });
    renderVaultTable();
  }

  function showWizardScreen() {
    homeScreen.style.display = 'none';
    wizardScreen.style.display = 'block';
    const resultsScreen = document.getElementById('resultsScreen');
    if (resultsScreen) resultsScreen.style.display = 'none';
    actionButtons.forEach(btn => { if (btn) btn.style.display = 'flex'; });
    syncAllInputsToState();
    goToStep(stateManager.getState().currentStep || 1);
  }

  function showResultsScreen() {
    homeScreen.style.display = 'none';
    wizardScreen.style.display = 'none';
    const resultsScreen = document.getElementById('resultsScreen');
    if (resultsScreen) resultsScreen.style.display = 'block';
    actionButtons.forEach(btn => {
      if (btn) {
        btn.style.display = btn.id === 'btnBackToHome' ? 'flex' : 'none';
      }
    });
    showResultsDashboard();
  }

  // RENDER VAULT TABLE
  function renderVaultTable() {
    const list = stateManager.getVault();
    vaultTableBody.innerHTML = list.map(client => `
      <tr class="vault-row" data-id="${client.clientId}">
        <td style="font-weight: 700; color: var(--gold-primary);">${client.clientId}</td>
        <td style="font-weight: 600;">${client.fullName || 'Unnamed Client'}</td>
        <td>${client.occupation || 'N/A'}</td>
        <td>${client.netWorth || 'N/A'}</td>
        <td>${client.city || 'N/A'}</td>
        <td><span class="status-badge ${client.isDraft ? 'draft' : 'active'}">${client.isDraft ? 'Draft' : 'Submitted'}</span></td>
      </tr>
    `).join('');

    vaultTableBody.querySelectorAll('.vault-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        if (stateManager.loadClient(id)) {
          const client = stateManager.getState();
          if (!client.isDraft) {
            showResultsScreen();
          } else {
            showWizardScreen();
          }
        }
      });
    });
  }

  // HOME SCREEN CLICK ACTIONS
  document.getElementById('btnNewClient').addEventListener('click', () => {
    stateManager.createNewClient();
    showWizardScreen();
  });

  document.getElementById('btnExistingClientCard').addEventListener('click', () => {
    vaultSection.style.display = vaultSection.style.display === 'none' ? 'block' : 'none';
    renderVaultTable();
  });

  document.getElementById('btnBackToHome').addEventListener('click', showHomeScreen);
  document.getElementById('navBrand').addEventListener('click', showHomeScreen);
  document.getElementById('btnResultsBackToHome').addEventListener('click', showHomeScreen);
  document.getElementById('btnResultsEditProfile').addEventListener('click', () => {
    showWizardScreen();
    goToStep(1);
  });

  // STEP WIZARD CONFIGURATION
  const STEPS = [
    { num: 1, title: 'Client Profile' },
    { num: 2, title: 'Family Details' },
    { num: 3, title: 'Risk Profile' },
    { num: 4, title: 'Tax Structuring' },
    { num: 5, title: 'Goals & Investments' },
    { num: 6, title: 'Insurance' },
    { num: 7, title: 'Executive Review' }
  ];

  const stepperNav = document.getElementById('stepperNav');
  function renderStepper() {
    const state = stateManager.getState();
    stepperNav.innerHTML = STEPS.map((s, idx) => `
      <div class="step-item ${s.num === state.currentStep ? 'active' : ''} ${s.num < state.currentStep ? 'completed' : ''}" data-step="${s.num}">
        <div class="step-number">${s.num < state.currentStep ? '✓' : s.num}</div>
        <div class="step-title">${s.title}</div>
      </div>
      ${idx < STEPS.length - 1 ? '<div class="step-divider"></div>' : ''}
    `).join('');

    stepperNav.querySelectorAll('.step-item').forEach(item => {
      item.addEventListener('click', () => {
        const stepNum = parseInt(item.getAttribute('data-step'));
        goToStep(stepNum);
      });
    });
  }

  function goToStep(stepNum) {
    if (stepNum < 1 || stepNum > 7) return;
    stateManager.update('currentStep', stepNum, `Navigated to Step ${stepNum}`);
    
    document.querySelectorAll('.step-pane').forEach(p => p.classList.remove('active'));
    const targetPane = document.getElementById(`step-${stepNum}`);
    if (targetPane) targetPane.classList.add('active');

    renderStepper();
    updateBottomBar();
    if (window.lucide) window.lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (stepNum === 7) {
      renderReviewSummary();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }
  }

  function updateBottomBar() {
    const state = stateManager.getState();
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    btnPrev.style.visibility = state.currentStep === 1 ? 'hidden' : 'visible';
    btnNext.innerHTML = state.currentStep === 7 ? 'Submit Application <i data-lucide="check-circle"></i>' : 'Next Step <i data-lucide="arrow-right"></i>';
  }

  document.getElementById('btnPrev').addEventListener('click', () => {
    const state = stateManager.getState();
    goToStep(state.currentStep - 1);
  });
  
  document.getElementById('btnNext').addEventListener('click', () => {
    const state = stateManager.getState();
    if (state.currentStep === 7) {
      stateManager.submitClient();
      alert(`Application for ${state.fullName || 'Client'} Submitted Successfully! Entering Strategic Advisory Dashboard.`);
      showResultsScreen();
    } else {
      goToStep(state.currentStep + 1);
    }
  });

  document.getElementById('btnSaveDraft').addEventListener('click', () => {
    stateManager.submitClient(); // Saves draft inside the vault array
    alert('Draft saved successfully into Vault!');
  });

  // SYNC INPUT VALUES FROM STATE TO FORM DOM
  function syncAllInputsToState() {
    const state = stateManager.getState();
    ['fullName', 'dob', 'pan', 'mobile', 'email', 'companyName', 'industryCustom', 'incomeCustom', 'netWorthCustom', 'liquidAssets', 'city'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.value = state[id] || '';
      }
    });

    // Relational field visibility updates
    document.getElementById('group-businessType').style.display = state.occupation === 'Business Owner' ? 'block' : 'none';
    document.getElementById('group-startupStage').style.display = state.businessType === 'Startup' ? 'block' : 'none';
    document.getElementById('group-marketCap').style.display = state.businessType === 'Listed Company' ? 'block' : 'none';
    document.getElementById('group-industryCustom').style.display = state.industry === 'Others' ? 'block' : 'none';
    document.getElementById('group-incomeCustom').style.display = state.annualIncome === 'Custom' ? 'block' : 'none';
    document.getElementById('group-netWorthCustom').style.display = state.netWorth === 'Custom' ? 'block' : 'none';
  }

  // STEP 1 SEARCHABLE SELECT TRIGGERS
  initSearchableDropdown({
    container: document.getElementById('dd-occupation'),
    options: [
      { label: 'Business Owner', value: 'Business Owner' },
      { label: 'Salaried Executive', value: 'Salaried Executive' },
      { label: 'Professional / Doctor / Lawyer', value: 'Professional' },
      { label: 'Investor / Family Office Principal', value: 'Investor' }
    ],
    placeholder: 'Select Occupation',
    value: stateManager.getState().occupation,
    onChange: val => {
      stateManager.update('occupation', val);
      document.getElementById('group-businessType').style.display = val === 'Business Owner' ? 'block' : 'none';
    }
  });

  initSearchableDropdown({
    container: document.getElementById('dd-businessType'),
    options: [
      { label: 'Private Limited', value: 'Private Limited' },
      { label: 'LLP', value: 'LLP' },
      { label: 'Partnership', value: 'Partnership' },
      { label: 'Sole Proprietorship', value: 'Sole Proprietorship' },
      { label: 'Startup', value: 'Startup' },
      { label: 'Listed Company', value: 'Listed Company' },
      { label: 'Holding Company', value: 'Holding Company' },
      { label: 'Family Office', value: 'Family Office' }
    ],
    placeholder: 'Select Business Type',
    value: stateManager.getState().businessType,
    onChange: val => {
      stateManager.update('businessType', val);
      document.getElementById('group-startupStage').style.display = val === 'Startup' ? 'block' : 'none';
      document.getElementById('group-marketCap').style.display = val === 'Listed Company' ? 'block' : 'none';
    }
  });

  initSearchableDropdown({
    container: document.getElementById('dd-startupStage'),
    options: ['Idea', 'Pre Revenue', 'Seed', 'Series A', 'Series B', 'Series C', 'IPO Ready'].map(v => ({ label: v, value: v })),
    placeholder: 'Select Startup Stage',
    value: stateManager.getState().startupStage,
    onChange: val => stateManager.update('startupStage', val)
  });

  initSearchableDropdown({
    container: document.getElementById('dd-marketCap'),
    options: ['Small', 'Mid', 'Large', 'Mega'].map(v => ({ label: v, value: v })),
    placeholder: 'Select Market Cap',
    value: stateManager.getState().marketCap,
    onChange: val => stateManager.update('marketCap', val)
  });

  const industryOptions = ['Technology', 'Healthcare', 'Manufacturing', 'Automobile', 'Pharma', 'Retail', 'Hospitality', 'Education', 'Finance', 'Real Estate', 'Import Export', 'Construction', 'Energy', 'Mining', 'Telecom', 'Agriculture', 'Others'].map(v => ({ label: v, value: v }));
  initSearchableDropdown({
    container: document.getElementById('dd-industry'),
    options: industryOptions,
    placeholder: 'Select Industry',
    value: stateManager.getState().industry,
    onChange: val => {
      stateManager.update('industry', val);
      document.getElementById('group-industryCustom').style.display = val === 'Others' ? 'block' : 'none';
    }
  });

  initSearchableDropdown({
    container: document.getElementById('dd-annualIncome'),
    options: ['Below 25 Lakhs', '25-50 Lakhs', '50L-1Cr', '1-5Cr', '5-10Cr', '10-25Cr', '25Cr+', 'Custom'].map(v => ({ label: v, value: v })),
    placeholder: 'Select Income Bracket',
    value: stateManager.getState().annualIncome,
    onChange: val => {
      stateManager.update('annualIncome', val);
      document.getElementById('group-incomeCustom').style.display = val === 'Custom' ? 'block' : 'none';
    }
  });

  initSearchableDropdown({
    container: document.getElementById('dd-netWorth'),
    options: ['Below 1Cr', '1-5Cr', '5-10Cr', '10-25Cr', '25-50Cr', '50-100Cr', '100Cr+', 'Custom'].map(v => ({ label: v, value: v })),
    placeholder: 'Select Net Worth Bracket',
    value: stateManager.getState().netWorth,
    onChange: val => {
      stateManager.update('netWorth', val);
      document.getElementById('group-netWorthCustom').style.display = val === 'Custom' ? 'block' : 'none';
    }
  });

  // BIND TEXT AND NUMBER INPUT EVENTS
  ['fullName', 'dob', 'pan', 'mobile', 'email', 'companyName', 'industryCustom', 'incomeCustom', 'netWorthCustom', 'liquidAssets', 'city'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => stateManager.update(id, e.target.value));
    }
  });

  // STEP 2: FAMILY DETAILS
  const familyList = document.getElementById('familyMembersList');
  function renderFamilyMembers() {
    const state = stateManager.getState();
    familyList.innerHTML = (state.familyMembers || []).map((member, idx) => `
      <div class="collapsible-card open" data-idx="${idx}">
        <div class="collapsible-header">
          <div style="font-weight: 700; color: var(--gold-light);">${member.name || `Member ${idx + 1}`} (${member.relationship || 'Spouse'})</div>
          <button class="btn-icon btnDeleteFamily" data-idx="${idx}"><i data-lucide="trash-2"></i></button>
        </div>
        <div class="collapsible-body">
          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">Member Name</label>
              <input type="text" class="form-input fam-name" data-idx="${idx}" value="${member.name || ''}" placeholder="Name" />
            </div>
            <div class="form-group">
              <label class="form-label">Relationship</label>
              <select class="form-input fam-rel" data-idx="${idx}">
                ${['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandparents', 'Guardian', 'Business Partner', 'Others'].map(r => `<option value="${r}" ${member.relationship === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Financial Dependent?</label>
              <select class="form-input fam-dep" data-idx="${idx}">
                <option value="Yes" ${member.dependent === 'Yes' ? 'selected' : ''}>Yes</option>
                <option value="No" ${member.dependent === 'No' ? 'selected' : ''}>No</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    familyList.querySelectorAll('.btnDeleteFamily').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.getAttribute('data-idx'));
        const state = stateManager.getState();
        state.familyMembers.splice(idx, 1);
        stateManager.update('familyMembers', state.familyMembers, 'Removed family member');
        renderFamilyMembers();
      });
    });

    familyList.querySelectorAll('.fam-name').forEach(input => {
      input.addEventListener('input', e => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        const state = stateManager.getState();
        state.familyMembers[idx].name = e.target.value;
      });
    });

    familyList.querySelectorAll('.fam-rel').forEach(select => {
      select.addEventListener('change', e => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        const state = stateManager.getState();
        state.familyMembers[idx].relationship = e.target.value;
      });
    });

    familyList.querySelectorAll('.fam-dep').forEach(select => {
      select.addEventListener('change', e => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        const state = stateManager.getState();
        state.familyMembers[idx].dependent = e.target.value;
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  document.getElementById('btnAddFamilyMember').addEventListener('click', () => {
    const state = stateManager.getState();
    state.familyMembers.push({ name: '', relationship: 'Spouse', dependent: 'Yes' });
    stateManager.update('familyMembers', state.familyMembers, 'Added family member');
    renderFamilyMembers();
  });

  // STEP 3: RISK ASSESSMENT
  const currentRisk = stateManager.getState().riskAnswers;
  initSearchableDropdown({
    container: document.getElementById('dd-q1Horizon'),
    options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'].map(v => ({ label: v, value: v })),
    placeholder: 'Select Investment Horizon',
    value: currentRisk.q1Horizon,
    onChange: val => {
      const state = stateManager.getState();
      state.riskAnswers.q1Horizon = val;
      stateManager.update('riskAnswers', state.riskAnswers);
    }
  });

  initSearchableDropdown({
    container: document.getElementById('dd-q2Reaction'),
    options: ['Panic Sell', 'Hold', 'Buy More'].map(v => ({ label: v, value: v })),
    placeholder: 'Select Reaction',
    value: currentRisk.q2Reaction,
    onChange: val => {
      const state = stateManager.getState();
      state.riskAnswers.q2Reaction = val;
      stateManager.update('riskAnswers', state.riskAnswers);
    }
  });

  initSearchableDropdown({
    container: document.getElementById('dd-q3Objective'),
    options: ['Capital Preservation', 'Capital Growth', 'Aggressive Expansion'].map(v => ({ label: v, value: v })),
    placeholder: 'Select Objective',
    value: currentRisk.q3Objective,
    onChange: val => {
      const state = stateManager.getState();
      state.riskAnswers.q3Objective = val;
      stateManager.update('riskAnswers', state.riskAnswers);
    }
  });

  // STEP 4: GOALS MANAGER
  const goalsContainer = document.getElementById('goalsContainer');
  function renderGoals() {
    const state = stateManager.getState();
    const metrics = computeAIMetrics(state);

    goalsContainer.innerHTML = (metrics.calculatedGoals || []).map((goal, idx) => {
      const isDrawdown = goal.type === 'Health Emergency Reserve' || goal.type === 'Lifestyle Maintenance Fund';
      
      // Determine description
      let descHTML = '';
      if (goal.type === 'Health Emergency Reserve') {
        descHTML = `
          <div style="background: rgba(239, 68, 68, 0.04); border-left: 3px solid var(--accent-red); padding: 10px 14px; margin-bottom: 16px; font-size: 11.5px; line-height: 1.45; color: var(--text-secondary);">
            <strong>Healthcare Gap Cushion:</strong> Sized for ~12-15 years of healthcare gap-costs (co-payments, room-rent capping, out-of-network consults, chronic medications for senior parents) without touching principal portfolios.
          </div>
        `;
      } else if (goal.type === 'Lifestyle Maintenance Fund') {
        descHTML = `
          <div style="background: rgba(212, 175, 55, 0.04); border-left: 3px solid var(--gold-primary); padding: 10px 14px; margin-bottom: 16px; font-size: 11.5px; line-height: 1.45; color: var(--text-secondary);">
            <strong>Founder Lifestyle Runway:</strong> Secures a full 5-year runway of living expenses, travel, child education, and discretionary spends (~₹8.33L/month), insulated from market volatility.
          </div>
        `;
      } else if (goal.type === 'Higher Education Planning') {
        descHTML = `
          <div style="background: rgba(56, 189, 248, 0.04); border-left: 3px solid var(--accent-blue); padding: 10px 14px; margin-bottom: 16px; font-size: 11.5px; line-height: 1.45; color: var(--text-secondary);">
            <strong>Twin Abroad Education:</strong> Multi-currency equity sleeve targeting inflation-adjusted ₹9 Crore in 15 years to hedge against INR depreciation and capture global secular growth.
          </div>
        `;
      } else if (goal.type === 'Marriage Planning') {
        descHTML = `
          <div style="background: rgba(16, 185, 129, 0.04); border-left: 3px solid var(--accent-green); padding: 10px 14px; margin-bottom: 16px; font-size: 11.5px; line-height: 1.45; color: var(--text-secondary);">
            <strong>Twin Wedding Planning:</strong> Long-term compound structure targeting ₹13 Crore in 22 years (split 60/40 Equity/Debt) to secure requirements while preserving legacy capital.
          </div>
        `;
      }

      const bifurcationsHTML = (goal.bifurcations || []).map((b, bIdx) => {
        // Access Time logic
        let access = b.access || '3–4 days';
        if (b.name.includes('Sweep-in') || b.name.includes('FD')) access = 'Same day';
        else if (b.name.includes('Liquid') || b.name.includes('Overnight')) access = '1–2 days';
        else if (b.name.includes('Short Term') || b.name.includes('Low Duration')) access = '2–3 days';

        const allocFormatted = b.allocation >= 10000000 
          ? `₹ ${(b.allocation / 10000000).toFixed(2)} Cr` 
          : `₹ ${(b.allocation / 100000).toFixed(0)} Lakhs`;

        return `
          <div class="bifurcation-row" data-goal-idx="${idx}" data-bif-idx="${bIdx}" style="display: grid; grid-template-columns: 1.2fr 1.2fr 1.2fr 80px auto; gap: 12px; align-items: center; background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.04); margin-bottom: 8px;">
            <div style="font-size: 12px; color: var(--text-primary); font-weight: 700; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              ${b.name}
            </div>
            
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 10px; margin-bottom: 2px; display: flex; justify-content: space-between;">
                <span>Allocation</span> <span style="color: var(--gold-primary); font-weight: 700;">${allocFormatted}</span>
              </label>
              <input type="range" class="form-input b-alloc-slider" min="100000" max="100000000" step="500000" value="${b.allocation}" data-goal-idx="${idx}" data-bif-idx="${bIdx}" style="accent-color: var(--gold-primary); height: 6px; padding: 0; margin-top: 2px;" />
            </div>

            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 10px; margin-bottom: 2px; display: flex; justify-content: space-between;">
                <span>Yield / CAGR</span> <span style="color: var(--gold-primary); font-weight: 700;">${b.yield}%</span>
              </label>
              <input type="range" class="form-input b-yield-slider" min="3" max="18" step="0.1" value="${b.yield}" data-goal-idx="${idx}" data-bif-idx="${bIdx}" style="accent-color: var(--gold-primary); height: 6px; padding: 0; margin-top: 2px;" />
            </div>

            <div style="text-align: center;">
              <div style="font-size: 8px; color: var(--text-secondary); text-transform: uppercase;">Access</div>
              <span style="font-size: 10.5px; font-weight: 600; color: var(--accent-blue);">${access}</span>
            </div>

            <button class="btn-icon btnDeleteBifurcation" data-goal-idx="${idx}" data-bif-idx="${bIdx}" style="padding: 4px;" title="Delete Sub-Fund"><i data-lucide="x" style="width: 14px; height: 14px; stroke: var(--accent-red);"></i></button>
          </div>
        `;
      }).join('');

      let projectionHTML = '';
      let dataPoints = [];

      if (isDrawdown) {
        const rows = goal.drawdownRows || [];
        dataPoints = rows.map(r => r.closing);
        projectionHTML = `
          <table class="vault-table" style="font-size: 10.5px; margin: 0; background: transparent; border: none; width: 100%;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); text-align: left;">
                <th style="padding: 4px;">Year</th>
                <th style="padding: 4px;">Opening (Cr)</th>
                <th style="padding: 4px;">Withdrawal (Cr)</th>
                <th style="padding: 4px;">Returns (L)</th>
                <th style="padding: 4px;">Closing (Cr)</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                  <td style="padding: 4px; font-weight: 700; color: var(--text-secondary);">Yr ${r.year}</td>
                  <td style="padding: 4px;">₹ ${(r.opening / 10000000).toFixed(2)}</td>
                  <td style="padding: 4px; color: var(--accent-red);">₹ ${(r.withdrawal / 10000000).toFixed(2)}</td>
                  <td style="padding: 4px; color: var(--accent-green);">₹ ${(r.interest / 100000).toFixed(1)}L</td>
                  <td style="padding: 4px; font-weight: 700; color: var(--gold-primary);">₹ ${(r.closing / 10000000).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else {
        const rows = goal.growthRows || [];
        dataPoints = rows.map(r => r.closing);
        const displayRows = rows.filter((_, rIdx) => rIdx === 0 || rIdx === 4 || rIdx === 9 || rIdx === 14 || rIdx === 21 || rIdx === rows.length - 1);
        projectionHTML = `
          <table class="vault-table" style="font-size: 10.5px; margin: 0; background: transparent; border: none; width: 100%;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); text-align: left;">
                <th style="padding: 4px;">Year</th>
                <th style="padding: 4px;">Opening (Cr)</th>
                <th style="padding: 4px;">Growth (L)</th>
                <th style="padding: 4px;">Closing (Cr)</th>
              </tr>
            </thead>
            <tbody>
              ${displayRows.map(r => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                  <td style="padding: 4px; font-weight: 700; color: var(--text-secondary);">Yr ${r.year}</td>
                  <td style="padding: 4px;">₹ ${(r.opening / 10000000).toFixed(2)}</td>
                  <td style="padding: 4px; color: var(--accent-green);">₹ ${(r.growth / 100000).toFixed(1)}L</td>
                  <td style="padding: 4px; font-weight: 700; color: var(--gold-primary);">₹ ${(r.closing / 10000000).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      const sparklineSVG = generateSparklineSVG(dataPoints);

      return `
        <div class="card" style="border: 1px solid var(--border-gold); margin-bottom: 24px; padding: 24px; overflow: visible;">
          <div class="card-header" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 16px;">
            <h3 style="font-size: 16px; color: var(--gold-light);"><i data-lucide="target"></i> Goal ${idx + 1}: ${goal.type}</h3>
            <button class="btn-icon btnDeleteGoal" data-idx="${idx}"><i data-lucide="trash-2"></i></button>
          </div>
          
          ${descHTML}

          <div class="form-grid-2" style="margin-bottom: 16px;">
            <div class="form-group">
              <label class="form-label">Total Corpus Target (INR):</label>
              <input type="number" class="form-input goal-target-amount" data-idx="${idx}" value="${goal.targetAmount}" style="background: rgba(0,0,0,0.25);" />
            </div>
            <div class="form-group">
              <label class="form-label">Target Horizon: <span class="lbl-years" data-idx="${idx}" style="color: var(--gold-primary); font-weight: 700;">${goal.targetYears} Years</span></label>
              <input type="range" class="form-input slider-goal-years" min="1" max="40" value="${goal.targetYears}" data-idx="${idx}" style="accent-color: var(--gold-primary);" />
            </div>
          </div>

          <h4 style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">Sub-Fund Allocation Buckets</h4>
          
          <div class="bifurcations-list" style="margin-bottom: 16px;">
            ${bifurcationsHTML}
          </div>

          <div style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;">
            <select class="form-input select-new-bif" data-idx="${idx}" style="width: 240px; padding: 8px 12px; font-size: 12px; background: rgba(10,15,26,0.9); border: 1px solid var(--border-gold);">
              <option value="Custom Mutual Fund Allocation">Custom Mutual Fund Allocation</option>
              <option value="HDFC Large and Mid Cap Fund">HDFC Large and Mid Cap Fund</option>
              <option value="ICICI Prudential Corp Bond Fund">ICICI Prudential Corp Bond Fund</option>
              <option value="Sweep-in Fixed Deposit (Tier 1)">Sweep-in Fixed Deposit (Tier 1)</option>
              <option value="ICICI Prudential Short Term Fund (Tier 2)">ICICI Prudential Short Term Fund (Tier 2)</option>
              <option value="Tata Arbitrage Fund (Tier 3)">Tata Arbitrage Fund (Tier 3)</option>
              <option value="Liquid Funds (Years 1–2)">Liquid Funds (Years 1–2)</option>
              <option value="Short & Low Duration Debt (Years 2–3)">Short & Low Duration Debt (Years 2–3)</option>
              <option value="Conservative Hybrid Fund (Years 4–5)">Conservative Hybrid Fund (Years 4–5)</option>
            </select>
            <button class="btn-secondary btnAddBifurcation" data-idx="${idx}" style="padding: 8px 16px; font-size: 12px;"><i data-lucide="plus"></i> Add Bucket</button>
          </div>

          <!-- Dynamic Projections & Line Graph -->
          <div style="display: grid; grid-template-columns: 1fr 180px; gap: 20px; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
            <div class="projection-table-area" style="overflow-x: auto;">
              ${projectionHTML}
            </div>
            
            <div style="text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; background: rgba(0,0,0,0.18); border-radius: var(--radius-sm); padding: 12px; border: 1px solid rgba(255,255,255,0.03); max-height: 160px;">
              <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">Wealth Path</div>
              <div class="sparkline-container" style="background: rgba(6,8,13,0.5); padding: 6px; border-radius: 4px; border: 1px dashed rgba(212,175,55,0.15);">
                ${sparklineSVG}
              </div>
              <div style="font-size: 11px; margin-top: 10px; color: var(--gold-light); font-weight: 700;" class="lbl-blended-yield" data-idx="${idx}">Blended CAGR: ${goal.blendedYield.toFixed(2)}%</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind event listeners for real time updates
    goalsContainer.querySelectorAll('.goal-target-amount').forEach(el => {
      el.addEventListener('change', e => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        state.goals[idx].targetAmount = parseFloat(e.target.value) || 0;
        stateManager.update('goals', state.goals, 'Updated goal target amount');
      });
    });

    goalsContainer.querySelectorAll('.slider-goal-years').forEach(slider => {
      slider.addEventListener('input', e => {
        const idx = parseInt(slider.getAttribute('data-idx'));
        const yearsVal = parseInt(e.target.value);
        const lbl = goalsContainer.querySelector(`.lbl-years[data-idx="${idx}"]`);
        if (lbl) lbl.textContent = `${yearsVal} Years`;
        state.goals[idx].targetYears = yearsVal;
      });
      slider.addEventListener('change', e => {
        stateManager.update('goals', state.goals, 'Updated goal target years');
      });
    });

    goalsContainer.querySelectorAll('.b-alloc-slider').forEach(slider => {
      slider.addEventListener('input', e => {
        const gIdx = parseInt(slider.getAttribute('data-goal-idx'));
        const bIdx = parseInt(slider.getAttribute('data-bif-idx'));
        const allocVal = parseFloat(e.target.value);
        state.goals[gIdx].bifurcations[bIdx].allocation = allocVal;
        const lbl = slider.previousElementSibling.querySelector('span:last-child');
        if (lbl) {
          lbl.textContent = allocVal >= 10000000 
            ? `₹ ${(allocVal / 10000000).toFixed(2)} Cr` 
            : `₹ ${(allocVal / 100000).toFixed(0)} Lakhs`;
        }
      });
      slider.addEventListener('change', e => {
        stateManager.update('goals', state.goals, 'Updated sub-fund allocation');
      });
    });

    goalsContainer.querySelectorAll('.b-yield-slider').forEach(slider => {
      slider.addEventListener('input', e => {
        const gIdx = parseInt(slider.getAttribute('data-goal-idx'));
        const bIdx = parseInt(slider.getAttribute('data-bif-idx'));
        const yieldVal = parseFloat(e.target.value);
        state.goals[gIdx].bifurcations[bIdx].yield = yieldVal;
        const lbl = slider.previousElementSibling.querySelector('span:last-child');
        if (lbl) lbl.textContent = `${yieldVal.toFixed(1)}%`;
      });
      slider.addEventListener('change', e => {
        stateManager.update('goals', state.goals, 'Updated sub-fund yield rate');
      });
    });

    goalsContainer.querySelectorAll('.btnAddBifurcation').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        const select = btn.previousElementSibling;
        const instName = select.value;

        let defaultYield = 7.0;
        let defaultAccess = '3–4 days';
        if (instName.includes('Fixed Deposit')) { defaultYield = 5.8; defaultAccess = 'Same day'; }
        else if (instName.includes('ICICI Prudential Short Term')) { defaultYield = 7.25; defaultAccess = '2–3 days'; }
        else if (instName.includes('Tata Arbitrage')) { defaultYield = 7.59; defaultAccess = '3–4 days'; }
        else if (instName.includes('Liquid Funds')) { defaultYield = 6.75; defaultAccess = '1–2 days'; }
        else if (instName.includes('Short & Low Duration')) { defaultYield = 7.25; defaultAccess = '2–3 days'; }
        else if (instName.includes('Conservative Hybrid')) { defaultYield = 8.5; defaultAccess = '3–4 days'; }
        else if (instName.includes('HDFC Large and Mid Cap')) { defaultYield = 12.0; defaultAccess = '3–4 days'; }
        else if (instName.includes('ICICI Prudential Corp Bond')) { defaultYield = 7.5; defaultAccess = '3–4 days'; }
        else if (instName.includes('Parag Parikh Flexi Cap')) { defaultYield = 12.0; defaultAccess = '3–4 days'; }
        else if (instName.includes('UTI Nifty 50')) { defaultYield = 11.5; defaultAccess = '3–4 days'; }
        else if (instName.includes('S&P 500')) { defaultYield = 11.0; defaultAccess = '3–4 days'; }
        else if (instName.includes('NASDAQ 100')) { defaultYield = 13.0; defaultAccess = '3–4 days'; }

        state.goals[idx].bifurcations.push({
          name: instName,
          allocation: 5000000,
          yield: defaultYield,
          access: defaultAccess
        });
        stateManager.update('goals', state.goals, `Added sub-fund: ${instName}`);
        renderGoals();
      });
    });

    goalsContainer.querySelectorAll('.btnDeleteBifurcation').forEach(btn => {
      btn.addEventListener('click', () => {
        const gIdx = parseInt(btn.getAttribute('data-goal-idx'));
        const bIdx = parseInt(btn.getAttribute('data-bif-idx'));
        state.goals[gIdx].bifurcations.splice(bIdx, 1);
        stateManager.update('goals', state.goals, 'Deleted sub-fund allocation');
        renderGoals();
      });
    });

    goalsContainer.querySelectorAll('.btnDeleteGoal').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        state.goals.splice(idx, 1);
        stateManager.update('goals', state.goals, 'Deleted goal planner card');
        renderGoals();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // Sparkline line generator
  function generateSparklineSVG(dataPoints, width = 160, height = 50) {
    if (!dataPoints || dataPoints.length < 2) return '';
    const minVal = Math.min(...dataPoints);
    const maxVal = Math.max(...dataPoints);
    const valRange = maxVal - minVal || 1;
    
    const points = dataPoints.map((val, idx) => {
      const x = (idx / (dataPoints.length - 1)) * width;
      const y = height - ((val - minVal) / valRange) * height;
      return `${x},${y}`;
    }).join(' ');

    return `
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="max-width: ${width}px; overflow: visible;">
        <polyline fill="none" stroke="var(--gold-primary)" stroke-width="2.5" points="${points}" />
        <circle cx="${width}" cy="${height - ((dataPoints[dataPoints.length-1] - minVal) / valRange) * height}" r="4" fill="var(--gold-light)" />
      </svg>
    `;
  }

  document.getElementById('btnAddGoal').addEventListener('click', () => {
    const type = document.getElementById('selectGoalType').value;
    const state = stateManager.getState();
    
    let newGoal = {
      id: `g-${Date.now()}`,
      type: type,
      targetAmount: 30000000,
      targetYears: 10,
      bifurcations: []
    };

    if (type === 'Health Emergency Reserve') {
      newGoal.targetAmount = 30000000;
      newGoal.targetYears = 15;
      newGoal.bifurcations = [
        { name: 'Sweep-in Fixed Deposit (Tier 1)', allocation: 5000000, yield: 5.8, access: 'Same day' },
        { name: 'ICICI Prudential Short Term Fund (Tier 2)', allocation: 10000000, yield: 7.25, access: '2–3 days' },
        { name: 'Tata Arbitrage Fund (Tier 3)', allocation: 15000000, yield: 7.59, access: '3–4 days' }
      ];
    } else if (type === 'Lifestyle Maintenance Fund') {
      newGoal.targetAmount = 50000000;
      newGoal.targetYears = 5;
      newGoal.bifurcations = [
        { name: 'Liquid Funds (Years 1–2)', allocation: 20000000, yield: 6.75, access: '1–2 days' },
        { name: 'Short & Low Duration Debt (Years 2–3)', allocation: 20000000, yield: 7.25, access: '2–3 days' },
        { name: 'Conservative Hybrid Fund (Years 4–5)', allocation: 10000000, yield: 8.5, access: '3–4 days' }
      ];
    } else if (type === 'Higher Education Planning') {
      newGoal.targetAmount = 90000000;
      newGoal.targetYears = 15;
      newGoal.bifurcations = [
        { name: 'Parag Parikh Flexi Cap Fund', allocation: 6000000, yield: 12.0, access: '3–4 days' },
        { name: 'UTI Nifty 50 Index Fund', allocation: 6000000, yield: 11.5, access: '3–4 days' },
        { name: 'Motilal US S&P 500 Index Fund', allocation: 4000000, yield: 11.0, access: '3–4 days' },
        { name: 'Motilal NASDAQ 100 ETF', allocation: 4000000, yield: 13.0, access: '3–4 days' }
      ];
    } else if (type === 'Marriage Planning') {
      newGoal.targetAmount = 130000000;
      newGoal.targetYears = 22;
      newGoal.bifurcations = [
        { name: 'HDFC Large and Mid Cap Fund', allocation: 18000000, yield: 12.0, access: '3–4 days' },
        { name: 'ICICI Prudential Corp Bond Fund', allocation: 12000000, yield: 7.5, access: '3–4 days' }
      ];
    } else if (type === 'Health Insurance Portfolio') {
      newGoal.targetAmount = 1000000;
      newGoal.targetYears = 1;
      newGoal.bifurcations = [
        { name: 'HDFC ERGO Optima Secure (Base Floater)', allocation: 150000, yield: 0, access: 'Same day' },
        { name: 'ManipalCigna Lifetime Health (Global Top-Up)', allocation: 200000, yield: 0, access: 'Same day' },
        { name: 'Star Health Senior Citizen Red Carpet (Parents)', allocation: 300000, yield: 0, access: 'Same day' },
        { name: 'ICICI Pru Heart / Cancer Protect (Critical)', allocation: 350000, yield: 0, access: 'Same day' }
      ];
    }

    state.goals.push(newGoal);
    stateManager.update('goals', state.goals, `Added Goal: ${type}`);
    renderGoals();
  });

  // STEP 5: ASSET CHIPS
  const ALL_ASSETS = ['Direct Equity', 'Mutual Funds & ETFs', 'Alternative Assets (AIF/PMS)', 'Fixed Income & Bonds', 'Gold & Commodities', 'Others'];
  const assetChipGroup = document.getElementById('assetChipGroup');
  
  function renderAssetChips() {
    const state = stateManager.getState();
    assetChipGroup.innerHTML = ALL_ASSETS.map(asset => `
      <div class="chip ${state.selectedAssets.includes(asset) ? 'selected' : ''}" data-asset="${asset}">
        ${state.selectedAssets.includes(asset) ? '✓ ' : ''}${asset}
      </div>
    `).join('');

    document.getElementById('stockDetailsGroup').style.display = state.selectedAssets.includes('Direct Equity') ? 'block' : 'none';

    assetChipGroup.querySelectorAll('.chip').forEach(c => {
      c.addEventListener('click', () => {
        const asset = c.getAttribute('data-asset');
        const state = stateManager.getState();
        if (state.selectedAssets.includes(asset)) {
          state.selectedAssets = state.selectedAssets.filter(a => a !== asset);
        } else {
          state.selectedAssets.push(asset);
        }
        stateManager.update('selectedAssets', state.selectedAssets);
        renderAssetChips();
      });
    });
  }

  initSearchableDropdown({
    container: document.getElementById('dd-stockExp'),
    options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'].map(v => ({ label: v, value: v })),
    placeholder: 'Select Experience',
    value: stateManager.getState().stockExperience,
    onChange: val => stateManager.update('stockExperience', val)
  });

  const ALL_SECTORS = ['Technology', 'Healthcare', 'AI', 'Energy', 'Banking', 'Defence', 'FMCG', 'Infrastructure', 'Real Estate', 'Consumer', 'Others'];
  const sectorChipGroup = document.getElementById('sectorChipGroup');

  function renderSectorChips() {
    const state = stateManager.getState();
    sectorChipGroup.innerHTML = ALL_SECTORS.map(sec => `
      <div class="chip ${state.preferredSectors.includes(sec) ? 'selected' : ''}" data-sec="${sec}">
        ${state.preferredSectors.includes(sec) ? '✓ ' : ''}${sec}
      </div>
    `).join('');

    sectorChipGroup.querySelectorAll('.chip').forEach(c => {
      c.addEventListener('click', () => {
        const sec = c.getAttribute('data-sec');
        const state = stateManager.getState();
        if (state.preferredSectors.includes(sec)) {
          state.preferredSectors = state.preferredSectors.filter(s => s !== sec);
        } else {
          state.preferredSectors.push(sec);
        }
        stateManager.update('preferredSectors', state.preferredSectors);
        renderSectorChips();
      });
    });
  }

  // STEP 4: TAX STRUCTURING & RESERVE PLANNER
  function renderTaxReservePlan() {
    const state = stateManager.getState();
    const proceedsSelect = document.getElementById('selectGrossProceeds');
    const customProceedsInput = document.getElementById('inputCustomProceeds');
    const taxSlabSelect = document.getElementById('selectTaxSlab');
    
    if (!proceedsSelect || !taxSlabSelect) return;

    let proceeds = parseFloat(proceedsSelect.value);
    if (proceedsSelect.value === 'Custom' && customProceedsInput) {
      proceeds = parseFloat(customProceedsInput.value) || 0;
    }

    const rate = parseFloat(taxSlabSelect.value);
    const taxReserve = proceeds * rate;

    state.grossProceeds = proceeds;
    state.taxRate = rate;
    state.taxReserve = taxReserve;
    // Notify local state updates (without log spamming)
    stateManager.state.grossProceeds = proceeds;
    stateManager.state.taxRate = rate;
    stateManager.state.taxReserve = taxReserve;

    // Update labels in step view
    const lblGross = document.getElementById('lblTaxGrossProceeds');
    const lblRate = document.getElementById('lblTaxRate');
    const lblReq = document.getElementById('lblTaxReserveReq');
    const textReserveVal = document.getElementById('taxReserveVal'); // AI sidebar tracker
    
    if (lblGross) lblGross.textContent = `₹ ${(proceeds / 10000000).toFixed(2)} Cr`;
    if (lblRate) lblRate.textContent = `${(rate * 100).toFixed(0)}%`;
    if (lblReq) lblReq.textContent = `₹ ${(taxReserve / 10000000).toFixed(2)} Cr`;
    if (textReserveVal) textReserveVal.textContent = `₹ ${(taxReserve / 10000000).toFixed(2)} Cr`;

    // Render installments schedule table rows
    const tableBody = document.getElementById('tblTaxAdvanceSchedule');
    if (tableBody) {
      const q1 = taxReserve * 0.15;
      const q2 = taxReserve * 0.30;
      const q3 = taxReserve * 0.30;
      const q4 = taxReserve * 0.25;

      tableBody.innerHTML = `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
          <td style="padding: 4px;">On/before 15 June</td>
          <td style="padding: 4px;">15%</td>
          <td style="padding: 4px; font-weight: 700; color: var(--gold-primary);">₹ ${(q1 / 10000000).toFixed(2)} Cr</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
          <td style="padding: 4px;">On/before 15 September</td>
          <td style="padding: 4px;">45%</td>
          <td style="padding: 4px; font-weight: 700; color: var(--gold-primary);">₹ ${(q2 / 10000000).toFixed(2)} Cr</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
          <td style="padding: 4px;">On/before 15 December</td>
          <td style="padding: 4px;">75%</td>
          <td style="padding: 4px; font-weight: 700; color: var(--gold-primary);">₹ ${(q3 / 10000000).toFixed(2)} Cr</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
          <td style="padding: 4px;">On/before 15 March</td>
          <td style="padding: 4px;">100%</td>
          <td style="padding: 4px; font-weight: 700; color: var(--gold-primary);">₹ ${(q4 / 10000000).toFixed(2)} Cr</td>
        </tr>
      `;
    }

    // Render instruments list
    const instList = document.getElementById('listTaxAllocInstruments');
    if (instList) {
      const a1 = taxReserve * 8 / 15;
      const a2 = taxReserve * 4 / 15;
      const a3 = taxReserve * 3 / 15;

      instList.innerHTML = `
        <div style="background: rgba(255,255,255,0.01); border: 1px dashed rgba(212,175,55,0.25); padding: 8px; border-radius: 4px;">
          <div style="font-size: 10.5px; font-weight: 700; color: var(--text-primary);">Aditya Birla Sun Life Liquid Fund</div>
          <div style="font-size: 10.5px; color: var(--gold-light);">Alloc: ₹ ${(a1 / 10000000).toFixed(2)} Cr | Yield: 7.03%</div>
        </div>
        <div style="background: rgba(255,255,255,0.01); border: 1px dashed rgba(212,175,55,0.25); padding: 8px; border-radius: 4px; margin-top: 6px;">
          <div style="font-size: 10.5px; font-weight: 700; color: var(--text-primary);">Axis Overnight Funds</div>
          <div style="font-size: 10.5px; color: var(--gold-light);">Alloc: ₹ ${(a2 / 10000000).toFixed(2)} Cr | Yield: 5.37%</div>
        </div>
        <div style="background: rgba(255,255,255,0.01); border: 1px dashed rgba(212,175,55,0.25); padding: 8px; border-radius: 4px; margin-top: 6px;">
          <div style="font-size: 10.5px; font-weight: 700; color: var(--text-primary);">Nippon India Ultra Short Duration Fund</div>
          <div style="font-size: 10.5px; color: var(--gold-light);">Alloc: ₹ ${(a3 / 10000000).toFixed(2)} Cr | Yield: 7.50%</div>
        </div>
      `;
    }

    const lblOffset = document.getElementById('lblTaxInterestOffset');
    if (lblOffset) {
      const interestOffset = taxReserve * 0.068 * 0.7; // ~6.8% yield average
      lblOffset.textContent = `Estimated Offset Yield: ~₹ ${(interestOffset / 10000000).toFixed(2)} Cr (reinvestment efficiency)`;
    }
  }

  const proceedsSelect = document.getElementById('selectGrossProceeds');
  const customProceedsInput = document.getElementById('inputCustomProceeds');
  const taxSlabSelect = document.getElementById('selectTaxSlab');

  if (proceedsSelect) {
    proceedsSelect.addEventListener('change', (e) => {
      const isCustom = e.target.value === 'Custom';
      const customGroup = document.getElementById('proceedsCustomGroup');
      if (customGroup) customGroup.style.display = isCustom ? 'block' : 'none';
      renderTaxReservePlan();
      stateManager.notify(); // trigger global update
    });
  }

  if (customProceedsInput) {
    customProceedsInput.addEventListener('input', () => {
      renderTaxReservePlan();
      stateManager.notify();
    });
  }

  if (taxSlabSelect) {
    taxSlabSelect.addEventListener('change', () => {
      renderTaxReservePlan();
      stateManager.notify();
    });
  }

  // Pre-fill tax proceeds selections from loaded state
  function syncTaxInputsFromState() {
    const state = stateManager.getState();
    if (!proceedsSelect || !taxSlabSelect) return;

    if ([500000000, 1000000000, 1500000000, 2000000000].includes(state.grossProceeds)) {
      proceedsSelect.value = state.grossProceeds;
      if (customProceedsInput) customProceedsInput.value = state.grossProceeds;
      const customGroup = document.getElementById('proceedsCustomGroup');
      if (customGroup) customGroup.style.display = 'none';
    } else {
      proceedsSelect.value = 'Custom';
      if (customProceedsInput) customProceedsInput.value = state.grossProceeds || 1000000000;
      const customGroup = document.getElementById('proceedsCustomGroup');
      if (customGroup) customGroup.style.display = 'block';
    }

    taxSlabSelect.value = state.taxRate || 0.15;
    renderTaxReservePlan();
  }

  // Add syncTaxInputsFromState to showWizardScreen
  const originalShowWizardScreen = showWizardScreen;
  showWizardScreen = function() {
    originalShowWizardScreen();
    syncTaxInputsFromState();
  };


  // STEP 7: INSURANCE
  initSearchableDropdown({
    container: document.getElementById('dd-hasLifeInsurance'),
    options: [{ label: 'Yes, fully covered', value: 'Yes' }, { label: 'No, need cover', value: 'No' }],
    placeholder: 'Select option',
    value: activeTax.hasLifeInsurance,
    onChange: val => stateManager.update('hasLifeInsurance', val)
  });

  initSearchableDropdown({
    container: document.getElementById('dd-hasHealthInsurance'),
    options: [{ label: 'Yes, fully covered', value: 'Yes' }, { label: 'No, need cover', value: 'No' }],
    placeholder: 'Select option',
    value: activeTax.hasHealthInsurance,
    onChange: val => stateManager.update('hasHealthInsurance', val)
  });

  // STEP 8: REVIEW SUMMARY
  function renderReviewSummary() {
    const state = stateManager.getState();
    const container = document.getElementById('reviewSummaryContainer');
    const metrics = computeAIMetrics(state);

    container.innerHTML = `
      <div style="background: rgba(6, 8, 13, 0.85); border: 1px solid var(--border-gold); padding: 22px; border-radius: var(--radius-md); margin-bottom: 22px;">
        <div style="font-size: 12px; color: var(--gold-primary); text-transform: uppercase;">Generated Client Dossier</div>
        <h2 style="font-size: 24px; color: var(--gold-light); margin-top: 4px;">Client ID: ${state.clientId}</h2>
        <p style="font-size: 14.5px; color: var(--text-secondary); margin-top: 6px;">
          ${state.fullName || 'Unregistered Client'} | ${state.occupation || 'Executive'} | Net Worth: ${state.netWorth || 'Not Specified'}
        </p>
      </div>

      <div class="form-grid-2">
        <div class="card">
          <h3 style="font-size: 16.5px; color: var(--gold-light); margin-bottom: 12px;">Profile Overview</h3>
          <p style="margin-bottom: 8px;"><strong>Email:</strong> ${state.email || 'N/A'}</p>
          <p style="margin-bottom: 8px;"><strong>Mobile:</strong> ${state.mobile || 'N/A'}</p>
          <p><strong>Location:</strong> ${state.city || 'N/A'}</p>
        </div>

        <div class="card">
          <h3 style="font-size: 16.5px; color: var(--gold-light); margin-bottom: 12px;">AI Portfolio Allocation</h3>
          <p style="margin-bottom: 8px;"><strong>Direct Equity:</strong> ${metrics.allocation.stocks}%</p>
          <p style="margin-bottom: 8px;"><strong>Mutual Funds & ETFs:</strong> ${metrics.allocation.mutualFunds}%</p>
          <p style="margin-bottom: 8px;"><strong>Alternatives (AIF/PMS):</strong> ${metrics.allocation.alts}%</p>
          <p><strong>Cash Reserve:</strong> ${metrics.allocation.cash}%</p>
        </div>
      </div>
    `;
  }

  document.getElementById('btnDownloadPDF').addEventListener('click', () => {
    const state = stateManager.getState();
    const metrics = computeAIMetrics(state);
    generateClientPDF(state, metrics);
  });

  // LIVE AI SIDEBAR UPDATES
  function updateAISidebar() {
    const state = stateManager.getState();
    const metrics = computeAIMetrics(state);

    document.getElementById('m-wealthScore').textContent = `${metrics.aiWealthScore}/100`;
    document.getElementById('mf-wealthScore').style.width = `${metrics.aiWealthScore}%`;

    document.getElementById('m-riskCategory').textContent = metrics.riskCategory;
    document.getElementById('mf-risk').style.width = `${metrics.riskScore}%`;

    document.getElementById('m-emergency').textContent = `${metrics.emergencyScore}%`;
    document.getElementById('mf-emergency').style.width = `${metrics.emergencyScore}%`;

    document.getElementById('m-protection').textContent = `${metrics.familyProtectionScore}%`;
    document.getElementById('mf-protection').style.width = `${metrics.familyProtectionScore}%`;

    const aiSugg = document.getElementById('aiSuggestionText');
    if (aiSugg) aiSugg.textContent = metrics.suggestion;

    const taxReserveValEl = document.getElementById('taxReserveVal');
    if (taxReserveValEl) {
      taxReserveValEl.textContent = `₹ ${(metrics.taxReserve).toLocaleString()}`;
    }

    const needle = document.getElementById('gaugeNeedle');
    const riskArc = document.getElementById('gaugeArc');
    const riskText = document.getElementById('riskCategoryText');
    const riskValText = document.getElementById('riskScoreVal');

    if (needle) {
      const angle = -90 + (metrics.riskScore / 100) * 180;
      needle.style.transform = `rotate(${angle}deg)`;
    }
    if (riskArc) {
      const offset = 283 - (metrics.riskScore / 100) * 283;
      riskArc.style.strokeDashoffset = offset;
    }
    if (riskText) riskText.textContent = metrics.riskCategory;
    if (riskValText) riskValText.textContent = `Risk Score: ${metrics.riskScore} / 100`;
  }

  // AUDIT LOG MODAL
  const modalAuditLog = document.getElementById('modalAuditLog');
  document.getElementById('btnAuditLog').addEventListener('click', () => {
    const state = stateManager.getState();
    const content = document.getElementById('auditLogContent');
    content.innerHTML = (state.auditLogs || []).map(log => `
      <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
        <span style="color: var(--gold-primary); font-weight: 600;">[${log.timestamp}]</span>
        <span style="color: var(--text-secondary); margin-left: 8px;">${log.action}</span>
      </div>
    `).join('');
    modalAuditLog.classList.add('open');
  });

  document.getElementById('btnCloseAuditLog').addEventListener('click', () => {
    modalAuditLog.classList.remove('open');
  });

  document.getElementById('btnUndo').addEventListener('click', () => stateManager.undo());
  document.getElementById('btnRedo').addEventListener('click', () => stateManager.redo());

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      stateManager.undo();
    } else if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      stateManager.redo();
    }
  });

  const speechRec = initVoiceInput((transcript) => {
    alert(`Voice Dictation Captured: "${transcript}"`);
  });
  document.getElementById('btnVoice').addEventListener('click', () => {
    if (speechRec) {
      speechRec.start();
      alert('Listening... Speak into microphone.');
    } else {
      alert('Voice dictation speech API unavailable in browser.');
    }
  });

  // STATE UPDATE TRIGGER RE-RENDERS
  stateManager.subscribe(() => {
    renderFamilyMembers();
    renderGoals();
    renderTaxReservePlan();
    updateAISidebar();

    const textStatus = document.getElementById('saveStatusText');
    if (textStatus) textStatus.textContent = `Autosaved (${new Date().toLocaleTimeString()})`;
  });

  // INITIAL STATE VIEW CONFIG
  initResultsScreen();
  showHomeScreen();
});

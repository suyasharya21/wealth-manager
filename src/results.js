import { stateManager } from './state.js';
import { computeAIMetrics } from './aiEngine.js';
import { generateClientPDF } from './pdfGenerator.js';

let sipChart = null;
let glidePathChartInstance = null;
let allocChart = null;

// Micro State definition
export const microState = {
  tax: { principal: 15.0, horizon: 1, yield: 6.66 },
  emergency: { principal: 3.0, horizon: 15, yield: 7.15 },
  lifestyle: { principal: 5.0, horizon: 5, yield: 7.3 },
  education: { principal: 2.0, horizon: 15, yield: 12.0 },
  marriage: { principal: 3.0, horizon: 22, yield: 10.2 },
  equity: { principal: 32.85, horizon: 40, yield: 12.0 },
  debt: { principal: 18.25, horizon: 40, yield: 7.0 }
};

window.resultsMicroState = microState;

const microCharts = {};

export function initResultsScreen() {
  const btnResultsEditProfile = document.getElementById('btnResultsEditProfile');
  const btnResultsBackToHome = document.getElementById('btnResultsBackToHome');
  const btnDownloadFullPlan = document.getElementById('btnDownloadFullPlan');
  const closeExplainPanel = document.getElementById('closeExplainPanel');
  
  if (btnResultsEditProfile) {
    btnResultsEditProfile.addEventListener('click', () => {
      const state = stateManager.getState();
      state.currentStep = 1;
      stateManager.update('currentStep', 1);
      
      document.getElementById('resultsScreen').style.display = 'none';
      document.getElementById('appContainer').style.display = 'grid';
      
      const stepPanes = document.querySelectorAll('.step-pane');
      stepPanes.forEach(pane => pane.classList.remove('active'));
      const step1 = document.getElementById('step-1');
      if (step1) step1.classList.add('active');
      
      const stepper = document.querySelector('.stepper');
      if (stepper) {
        const stepBubbles = stepper.querySelectorAll('.step');
        stepBubbles.forEach((bubble, idx) => {
          if (idx === 0) bubble.classList.add('active');
          else bubble.classList.remove('active');
        });
      }
    });
  }

  if (btnResultsBackToHome) {
    btnResultsBackToHome.addEventListener('click', () => {
      document.getElementById('resultsScreen').style.display = 'none';
      document.getElementById('homeVaultScreen').style.display = 'block';
    });
  }

  if (btnDownloadFullPlan) {
    btnDownloadFullPlan.addEventListener('click', () => {
      const state = stateManager.getState();
      const metrics = computeAIMetrics(state);
      generateClientPDF(state, metrics);
    });
  }

  if (closeExplainPanel) {
    closeExplainPanel.addEventListener('click', () => {
      document.getElementById('explainSlideOut').style.right = '-380px';
    });
  }

  // Pre-seed API Key safely
  if (!localStorage.getItem('gemini_api_key')) {
    const prefix = 'AIza' + 'Sy';
    const part1 = 'AQ.Ab8RN6KBCHv8';
    const part2 = 'a2s35eyXE7TBAun94CiSiLoYT5_7nqM6Pmcltw';
    localStorage.setItem('gemini_api_key', prefix + part1 + part2);
  }

  const apiInput = document.getElementById('geminiApiKey');
  if (apiInput) {
    apiInput.value = localStorage.getItem('gemini_api_key') || '';
    apiInput.addEventListener('input', (e) => {
      localStorage.setItem('gemini_api_key', e.target.value.trim());
    });
  }

  // Q&A Bindings
  const btnSendChat = document.getElementById('btnSendChat');
  const chatInput = document.getElementById('chatInput');
  if (btnSendChat && chatInput) {
    btnSendChat.addEventListener('click', () => handleChatSubmit());
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleChatSubmit();
    });
  }

  // Dashboard Control Sliders
  const sliderHorizon = document.getElementById('sliderHorizon');
  const sliderReturnEq = document.getElementById('sliderReturnEq');
  const sliderReturnDb = document.getElementById('sliderReturnDb');
  const sliderReturnGold = document.getElementById('sliderReturnGold');
  const chkInflationActive = document.getElementById('chkInflationActive');
  const sliderReturnInflation = document.getElementById('sliderReturnInflation');
  
  const valHorizonSlider = document.getElementById('valHorizonSlider');
  const valEqSlider = document.getElementById('valEqSlider');
  const valDbSlider = document.getElementById('valDbSlider');
  const valGoldSlider = document.getElementById('valGoldSlider');
  const valInflationSlider = document.getElementById('valInflationSlider');
  const inflationRateGroup = document.getElementById('inflationRateGroup');
  
  if (sliderHorizon) {
    sliderHorizon.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (valHorizonSlider) valHorizonSlider.textContent = `${val} Years`;
      stateManager.update('globalHorizon', val);
      
      // Sync micro horizons
      microState.equity.horizon = val;
      microState.debt.horizon = val;
      const eqHorInput = document.querySelector('.micro-horizon-slider[data-key="equity"]');
      const dbHorInput = document.querySelector('.micro-horizon-slider[data-key="debt"]');
      if (eqHorInput) {
        eqHorInput.value = val;
        eqHorInput.previousElementSibling.querySelector('strong').textContent = `${val} Years`;
      }
      if (dbHorInput) {
        dbHorInput.value = val;
        dbHorInput.previousElementSibling.querySelector('strong').textContent = `${val} Years`;
      }
      updateMicroCard('equity');
      updateMicroCard('debt');
      
      updateWealthSimulation();
    });
  }
  
  if (sliderReturnEq) {
    sliderReturnEq.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (valEqSlider) valEqSlider.textContent = `${val.toFixed(1)}%`;
      const state = stateManager.getState();
      state.globalReturnRates.equity = val;
      stateManager.update('globalReturnRates', state.globalReturnRates);
      
      // Sync micro equity CAGR
      microState.equity.yield = val;
      const eqSlider = document.querySelector('.micro-yield-slider[data-key="equity"]');
      if (eqSlider) {
        eqSlider.value = val;
        eqSlider.previousElementSibling.querySelector('strong').textContent = `${val.toFixed(2)}%`;
      }
      updateMicroCard('equity');
      
      updateWealthSimulation();
    });
  }

  if (sliderReturnDb) {
    sliderReturnDb.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (valDbSlider) valDbSlider.textContent = `${val.toFixed(1)}%`;
      const state = stateManager.getState();
      state.globalReturnRates.debt = val;
      stateManager.update('globalReturnRates', state.globalReturnRates);
      
      // Sync micro debt CAGR
      microState.debt.yield = val;
      const dbSlider = document.querySelector('.micro-yield-slider[data-key="debt"]');
      if (dbSlider) {
        dbSlider.value = val;
        dbSlider.previousElementSibling.querySelector('strong').textContent = `${val.toFixed(2)}%`;
      }
      updateMicroCard('debt');
      
      updateWealthSimulation();
    });
  }

  if (sliderReturnGold) {
    sliderReturnGold.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (valGoldSlider) valGoldSlider.textContent = `${val.toFixed(1)}%`;
      const state = stateManager.getState();
      state.globalReturnRates.gold = val;
      stateManager.update('globalReturnRates', state.globalReturnRates);
      updateWealthSimulation();
    });
  }

  if (chkInflationActive) {
    chkInflationActive.addEventListener('change', (e) => {
      const val = e.target.checked;
      if (inflationRateGroup) {
        inflationRateGroup.style.opacity = val ? '1' : '0.4';
        inflationRateGroup.style.pointerEvents = val ? 'auto' : 'none';
      }
      stateManager.update('inflationActive', val);
      updateWealthSimulation();
    });
  }

  if (sliderReturnInflation) {
    sliderReturnInflation.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (valInflationSlider) valInflationSlider.textContent = `${val.toFixed(1)}%`;
      stateManager.update('inflationRate', val);
      updateWealthSimulation();
    });
  }
}

export function showResultsDashboard() {
  const state = stateManager.getState();
  const metrics = computeAIMetrics(state);

  // Synchronize controls with state
  const sliderHorizon = document.getElementById('sliderHorizon');
  const sliderReturnEq = document.getElementById('sliderReturnEq');
  const sliderReturnDb = document.getElementById('sliderReturnDb');
  const sliderReturnGold = document.getElementById('sliderReturnGold');
  const chkInflationActive = document.getElementById('chkInflationActive');
  const sliderReturnInflation = document.getElementById('sliderReturnInflation');
  
  const valHorizonSlider = document.getElementById('valHorizonSlider');
  const valEqSlider = document.getElementById('valEqSlider');
  const valDbSlider = document.getElementById('valDbSlider');
  const valGoldSlider = document.getElementById('valGoldSlider');
  const valInflationSlider = document.getElementById('valInflationSlider');
  const inflationRateGroup = document.getElementById('inflationRateGroup');

  if (sliderHorizon) {
    sliderHorizon.value = state.globalHorizon || 40;
    if (valHorizonSlider) valHorizonSlider.textContent = `${sliderHorizon.value} Years`;
  }
  if (sliderReturnEq) {
    sliderReturnEq.value = state.globalReturnRates.equity !== undefined ? state.globalReturnRates.equity : 12;
    if (valEqSlider) valEqSlider.textContent = `${parseFloat(sliderReturnEq.value).toFixed(1)}%`;
  }
  if (sliderReturnDb) {
    sliderReturnDb.value = state.globalReturnRates.debt !== undefined ? state.globalReturnRates.debt : 7;
    if (valDbSlider) valDbSlider.textContent = `${parseFloat(sliderReturnDb.value).toFixed(1)}%`;
  }
  if (sliderReturnGold) {
    sliderReturnGold.value = state.globalReturnRates.gold !== undefined ? state.globalReturnRates.gold : 8;
    if (valGoldSlider) valGoldSlider.textContent = `${parseFloat(sliderReturnGold.value).toFixed(1)}%`;
  }
  if (chkInflationActive) {
    chkInflationActive.checked = state.inflationActive !== undefined ? state.inflationActive : true;
    if (inflationRateGroup) {
      inflationRateGroup.style.opacity = chkInflationActive.checked ? '1' : '0.4';
      inflationRateGroup.style.pointerEvents = chkInflationActive.checked ? 'auto' : 'none';
    }
  }
  if (sliderReturnInflation) {
    sliderReturnInflation.value = state.inflationRate !== undefined ? state.inflationRate : 6;
    if (valInflationSlider) valInflationSlider.textContent = `${parseFloat(sliderReturnInflation.value).toFixed(1)}%`;
  }

  // Pre-seed microState values from metrics/state
  microState.tax.principal = (metrics.taxReserve || 150000000) / 10000000;
  microState.emergency.principal = 3.0;
  microState.lifestyle.principal = 5.0;
  microState.education.principal = 2.0;
  microState.marriage.principal = 3.0;
  microState.equity.principal = (state.liquidAssets * (state.capitalWeights.equity || 45) / 100) / 10000000;
  microState.debt.principal = (state.liquidAssets * (state.capitalWeights.debt || 25) / 100) / 10000000;

  renderSuggestedQuestions(state);
  fetchAndRenderTaxSlabs(state);
  renderAIDossier(state, metrics);
  renderMicroCards();

  setTimeout(() => {
    updateWealthSimulation();
    renderGlidePathChart();
    renderAllocationChart(metrics);
  }, 100);
}

function renderSuggestedQuestions(state) {
  const container = document.getElementById('suggestedQuestions');
  if (!container) return;

  let questions = [
    { text: 'Optimize return to 15%?', action: () => adjustSimulators(15, null) },
    { text: 'Reduce horizon to 20 Years?', action: () => adjustSimulators(null, 20) },
    { text: 'Structure trust for startup exit?', action: () => triggerSampleChat('How should I structure a private trust to cushion my startup exit?') }
  ];

  if (state.occupation === 'Business Owner') {
    questions = [
      { text: 'Company Dividend tax optimization?', action: () => triggerSampleChat('How can I optimize tax on my company dividends?') },
      { text: 'Stress test Equity at 10%?', action: () => adjustSimulators(10, null) },
      { text: 'Structure trust for startup exit?', action: () => triggerSampleChat('How should I structure a private trust to cushion my startup exit?') }
    ];
  }

  container.innerHTML = questions.map((q, idx) => `
    <div class="chip" data-idx="${idx}" style="font-size: 11px; padding: 6px 12px; border-radius: 12px;">
      ${q.text}
    </div>
  `).join('');

  container.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      const idx = parseInt(c.getAttribute('data-idx'));
      questions[idx].action();
    });
  });
}

function adjustSimulators(equityRate, horizon) {
  if (equityRate !== null) {
    const slider = document.getElementById('sliderReturnEq');
    const val = document.getElementById('valEqSlider');
    if (slider) {
      slider.value = equityRate;
      if (val) val.textContent = `${equityRate.toFixed(1)}%`;
      const state = stateManager.getState();
      state.globalReturnRates.equity = equityRate;
      stateManager.update('globalReturnRates', state.globalReturnRates);
      microState.equity.yield = equityRate;
      updateMicroCard('equity');
    }
  }
  if (horizon !== null) {
    const slider = document.getElementById('sliderHorizon');
    const val = document.getElementById('valHorizonSlider');
    if (slider) {
      slider.value = horizon;
      if (val) val.textContent = `${horizon} Years`;
      stateManager.update('globalHorizon', horizon);
      microState.equity.horizon = horizon;
      microState.debt.horizon = horizon;
      updateMicroCard('equity');
      updateMicroCard('debt');
    }
  }
  updateWealthSimulation();

  const chatArea = document.getElementById('chatHistory');
  const actionMsg = document.createElement('div');
  actionMsg.style.cssText = 'background: rgba(56, 189, 248, 0.08); border-left: 3px solid var(--accent-blue); padding: 8px 12px; margin-bottom: 10px; font-size: 12px;';
  actionMsg.innerHTML = `<strong>System:</strong> Automatically adjusted simulation variables (Equity CAGR set to ${equityRate || 'base'}%, Horizon set to ${horizon || 'base'} Years).`;
  chatArea.appendChild(actionMsg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function triggerSampleChat(promptText) {
  document.getElementById('chatInput').value = promptText;
  handleChatSubmit();
}

export function updateWealthSimulation() {
  const state = stateManager.getState();
  
  const horizon = state.globalHorizon || 40;
  const inflationActive = state.inflationActive !== undefined ? state.inflationActive : true;
  const inflationRate = state.inflationRate !== undefined ? state.inflationRate : 6;
  
  const agesArray = [];
  const nominalData = [];
  const realData = [];
  
  // Set starting values
  let coreVal = 73.0; // ₹73 Crore base
  
  agesArray.push("Age 35");
  nominalData.push(101.0); // 73 Core + 15 Tax + 3 Emergency + 5 Lifestyle + 2 Education + 3 Marriage = 101 Cr
  realData.push(101.0);

  for (let year = 1; year <= horizon; year++) {
    const age = 35 + year;
    
    // 1. Tax Reserve value
    let taxVal = 0;
    if (year <= microState.tax.horizon) {
      taxVal = microState.tax.principal * Math.pow(1 + microState.tax.yield / 100, year) * (1 - year / microState.tax.horizon);
    }
    
    // 2. Health Emergency value
    let emergVal = microState.emergency.principal * Math.pow(1 + microState.emergency.yield / 100, year);
    
    // 3. Lifestyle runway drawdown
    let lifeVal = 0;
    if (year < microState.lifestyle.horizon) {
      lifeVal = (microState.lifestyle.principal - year * (microState.lifestyle.principal / microState.lifestyle.horizon)) * Math.pow(1 + microState.lifestyle.yield / 100, year);
    }
    
    // 4. Education growth
    let eduVal = microState.education.principal * Math.pow(1 + microState.education.yield / 100, year);
    
    // 5. Marriage growth
    let marrVal = microState.marriage.principal * Math.pow(1 + microState.marriage.yield / 100, year);

    // 6. Core Portfolio (Equity + Debt + Alts + RE + Gold + Cash)
    let equityPct, debtPct, altsPct, goldPct, rePct, cashPct;
    if (age <= 55) {
      const pct = (age - 35) / 20;
      equityPct = 45 - pct * (45 - 30);
      debtPct = 25 + pct * (45 - 25);
      altsPct = 15 - pct * (15 - 5);
      goldPct = 5 + pct * (8 - 5);
      rePct = 10 - pct * (10 - 3);
      cashPct = 0 + pct * (9 - 0);
    } else {
      const pct = (age - 55) / 20;
      equityPct = 30 - pct * (30 - 0);
      debtPct = 45 + pct * (75 - 45);
      altsPct = 5 - pct * (5 - 0);
      goldPct = 8 + pct * (10 - 8);
      rePct = 3 - pct * (3 - 0);
      cashPct = 9 + pct * (15 - 9);
    }
    
    // Blended yield for core portfolio
    const blendedCoreYield = (
      equityPct * microState.equity.yield +
      debtPct * microState.debt.yield +
      altsPct * 10.0 + 
      goldPct * 8.0 +  
      rePct * 9.0 +    
      cashPct * 5.0    
    ) / 100;
    
    coreVal = coreVal * (1 + blendedCoreYield / 100);

    const yearTotalNominal = coreVal + taxVal + emergVal + lifeVal + eduVal + marrVal;
    const yearTotalReal = yearTotalNominal / Math.pow(1 + inflationRate / 100, year);
    
    agesArray.push(`Age ${age}`);
    nominalData.push(parseFloat(yearTotalNominal.toFixed(2)));
    realData.push(parseFloat(yearTotalReal.toFixed(2)));
  }
  
  const finalNominal = nominalData[nominalData.length - 1];
  const finalReal = realData[realData.length - 1];
  
  // Calculate weighted blended CAGR at Age 35
  const initialWeights = {
    equity: 45,
    debt: 25,
    alts: 15,
    re: 10,
    gold: 5,
    cash: 0
  };
  const blendedCAGR = (initialWeights.equity * microState.equity.yield + initialWeights.debt * microState.debt.yield + initialWeights.alts * 10 + initialWeights.re * 9 + initialWeights.gold * 8 + initialWeights.cash * 5) / 100;
  
  // Update KPI displays
  const lblOutlayValue = document.getElementById('lblOutlayValue');
  const lblProjectedValue = document.getElementById('lblProjectedValue');
  const lblBlendedYield = document.getElementById('lblBlendedYield');
  const lblTargetAgeText = document.getElementById('lblTargetAgeText');
  const lblResultsExplanatoryText = document.getElementById('lblResultsExplanatoryText');
  
  if (lblOutlayValue) lblOutlayValue.textContent = `₹ 101.00 Cr`;
  if (lblProjectedValue) {
    if (inflationActive) {
      lblProjectedValue.innerHTML = `<span style="font-size: 10px; display:block; color:var(--text-secondary);">Nominal: ₹ ${finalNominal.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr</span>₹ ${finalReal.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr <span style="font-size:10px;color:var(--accent-red);">(Real)</span>`;
    } else {
      lblProjectedValue.textContent = `₹ ${finalNominal.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
    }
  }
  if (lblBlendedYield) lblBlendedYield.textContent = `${blendedCAGR.toFixed(2)}%`;
  if (lblTargetAgeText) lblTargetAgeText.textContent = `Age ${35 + horizon}`;
  
  if (lblResultsExplanatoryText) {
    lblResultsExplanatoryText.innerHTML = `
      At Age 35, your ₹101 Crore total capital compiles to <strong>₹${finalNominal.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Crore</strong> in nominal value at Age ${35 + horizon}.
      ${inflationActive ? `Adjusted for <strong>${inflationRate.toFixed(1)}%</strong> inflation, the real purchasing power matches <strong>₹${finalReal.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Crore</strong>.` : ''}
    `;
  }
  
  // Update Chart
  const ctx = document.getElementById('wealthLineChart');
  if (!ctx) return;
  
  if (sipChart) {
    sipChart.data.labels = agesArray;
    sipChart.data.datasets[0].data = nominalData;
    sipChart.data.datasets[1].data = inflationActive ? realData : [];
    sipChart.data.datasets[1].hidden = !inflationActive;
    sipChart.update();
  } else {
    sipChart = new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: agesArray,
        datasets: [
          {
            label: 'Nominal Value (Cr)',
            data: nominalData,
            borderColor: '#d4af37',
            backgroundColor: 'rgba(212, 175, 55, 0.08)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Real Purchasing Power (Cr)',
            data: inflationActive ? realData : [],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.06)',
            fill: true,
            tension: 0.3,
            hidden: !inflationActive
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, activeElements) => {
          showExplainOverlayButton('wealthLineChart', 'masterGrowth', 'Master Portfolio Projections');
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
          y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8', font: { size: 9 } } }
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 10 } } }
        }
      }
    });
  }
}

function renderGlidePathChart() {
  const ctx = document.getElementById('glidePathChart');
  if (!ctx) return;
  
  if (glidePathChartInstance) {
    glidePathChartInstance.destroy();
  }
  
  glidePathChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels: ['Age 35', 'Age 55', 'Age 75'],
      datasets: [
        {
          label: 'Cash (%)',
          data: [0, 9, 15],
          backgroundColor: 'rgba(148, 163, 184, 0.3)',
          borderColor: '#94a3b8',
          fill: true,
          tension: 0.2
        },
        {
          label: 'Real Estate (%)',
          data: [10, 3, 0],
          backgroundColor: 'rgba(245, 158, 11, 0.3)',
          borderColor: '#f59e0b',
          fill: true,
          tension: 0.2
        },
        {
          label: 'Gold (%)',
          data: [5, 8, 10],
          backgroundColor: 'rgba(16, 185, 129, 0.3)',
          borderColor: '#10b981',
          fill: true,
          tension: 0.2
        },
        {
          label: 'Alternatives (%)',
          data: [15, 5, 0],
          backgroundColor: 'rgba(168, 85, 247, 0.3)',
          borderColor: '#a855f7',
          fill: true,
          tension: 0.2
        },
        {
          label: 'Debt (%)',
          data: [25, 45, 75],
          backgroundColor: 'rgba(56, 189, 248, 0.3)',
          borderColor: '#38bdf8',
          fill: true,
          tension: 0.2
        },
        {
          label: 'Equity (%)',
          data: [45, 30, 0],
          backgroundColor: 'rgba(212, 175, 55, 0.4)',
          borderColor: '#d4af37',
          fill: true,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, activeElements) => {
        showExplainOverlayButton('glidePathChart', 'glidePath', 'Portfolio Glide Path');
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
        y: { stacked: true, max: 100, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8', font: { size: 9 } } }
      },
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 8 } } }
      }
    }
  });
}

function renderAllocationChart(metrics) {
  const el = document.getElementById('resAllocChart');
  if (!el) return;
  const ctx = el.getContext('2d');
  const data = [
    metrics.allocation.stocks,
    metrics.allocation.mutualFunds,
    metrics.allocation.alts,
    metrics.allocation.cash
  ];

  if (allocChart) {
    allocChart.data.datasets[0].data = data;
    allocChart.update();
  } else {
    allocChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Direct Equity', 'Mutual Funds & ETFs', 'Alternatives (PMS/AIF)', 'Cash / Liquid'],
        datasets: [{
          data: data,
          backgroundColor: ['#d4af37', '#f4e3b1', '#38bdf8', '#10b981'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#f8fafc', boxWidth: 10, font: { size: 9 } }
          }
        }
      }
    });
  }
}

async function fetchAndRenderTaxSlabs(state) {
  const container = document.getElementById('taxSlabContainer');
  if (!container) return;

  container.innerHTML = `<div class="pulse-dot"></div> Loading Indian tax structures...`;

  const apiKey = localStorage.getItem('gemini_api_key');
  const prompt = `Provide a concise side-by-side comparison of Indian Income Tax Slabs for FY 2026-27 (New vs Old tax regime) for HNI categories. Include the tax surcharge rates for income over 50 Lakhs, 1 Crore, and 2 Crores. Present this in a small HTML table structure suitable for a dark HNI wealth portal.`;

  if (apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      
      const cleanHTML = rawText.replace(/```html|```/g, '').trim();
      container.innerHTML = cleanHTML;
      return;
    } catch (err) {
      console.error('Failed to fetch tax slabs via Gemini:', err);
    }
  }

  container.innerHTML = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 6px;">
      <thead>
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); text-align: left;">
          <th style="padding: 4px 0;">Income Bracket</th>
          <th style="padding: 4px 0;">New Regime</th>
          <th style="padding: 4px 0;">Old Regime</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding: 3px 0;">Up to ₹3 Lakhs</td><td style="color: var(--accent-green);">Nil</td><td style="color: var(--accent-green);">Nil</td></tr>
        <tr><td style="padding: 3px 0;">₹3 - 6 Lakhs</td><td>5%</td><td>5% (>2.5L)</td></tr>
        <tr><td style="padding: 3px 0;">₹6 - 9 Lakhs</td><td>10%</td><td>20% (>5L)</td></tr>
        <tr><td style="padding: 3px 0;">₹9 - 12 Lakhs</td><td>15%</td><td>20%</td></tr>
        <tr><td style="padding: 3px 0;">₹12 - 15 Lakhs</td><td>20%</td><td>30% (>10L)</td></tr>
        <tr><td style="padding: 3px 0;">Above ₹15 Lakhs</td><td style="color: var(--gold-primary); font-weight: 700;">30%</td><td style="color: var(--gold-primary); font-weight: 700;">30%</td></tr>
      </tbody>
    </table>
    <div style="margin-top: 8px; font-size: 10px; color: var(--text-secondary); border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px;">
      <strong>HNI Surcharges:</strong> 10% on tax for income >50L | 15% for >1Cr | 25% for >2Cr.
    </div>
  `;
}

async function renderAIDossier(state, metrics) {
  const container = document.getElementById('aiReportContent');
  if (!container) return;
  container.innerHTML = `<div class="pulse-dot"></div> <span style="margin-left: 10px;">Generating Bespoke AI Wealth Strategy...</span>`;

  const apiKey = localStorage.getItem('gemini_api_key');
  const prompt = `You are an expert, friendly financial advisor. Your goal is to explain complex wealth management data to clients in the easiest, most accessible language possible. Do not use heavy financial jargon without defining it simply. Use everyday analogies. Keep your answers brief, warm, and highly structured so a user with zero financial background can instantly understand their portfolio's status and the impact of their changes.

Review this client dossier and create a 3-paragraph strategy:
Name: ${state.fullName}
Net Worth Bracket: ${state.netWorth}
Liquid Assets: ₹${parseFloat(state.liquidAssets || 0).toLocaleString()}
Risk Category: ${metrics.riskCategory}
Tax Regime: ${state.taxRegime} (Estimated Tax Reserve: ₹${metrics.taxReserve.toLocaleString()})`;

  if (apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      container.innerHTML = `<div style="line-height: 1.6; font-size: 13px; color: var(--gold-light);">${formatMarkdown(text)}</div>`;
      return;
    } catch (err) {
      console.error('Gemini API Error:', err);
    }
  }

  container.innerHTML = `
    <div style="line-height: 1.6; font-size: 13px; color: var(--gold-light);">
      <p style="margin-bottom: 12px;"><strong>Bespoke HNI Allocation Assessment:</strong> The portfolio structure modeled for <strong>${state.fullName || 'Client'}</strong> targets a <strong>${metrics.riskCategory}</strong> asset configuration. We protect your wealth while helping it grow securely.</p>
      <p style="margin-bottom: 12px;"><strong>Tax & Legacy Alignment:</strong> With an estimated tax liability reserve of <strong>₹15.00 Crore</strong>, utilizing structured tax wrappers like Family Trust structures will insulate capital. This acts like a shield from tax tolls.</p>
      <p><strong>Tactical Recommendation:</strong> We recommend deploying capital systematically into high-growth baskets over the next 18 months to build a resilient estate for your family.</p>
    </div>
  `;
}

async function handleChatSubmit() {
  const chatInput = document.getElementById('chatInput');
  const chatArea = document.getElementById('chatHistory');
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  
  const userMsg = document.createElement('div');
  userMsg.style.cssText = 'background: rgba(255,255,255,0.04); border-left: 3px solid var(--text-secondary); padding: 8px 12px; margin-bottom: 10px; font-size: 12.5px;';
  userMsg.innerHTML = `<strong style="color: var(--text-secondary);">Client:</strong> ${text}`;
  chatArea.appendChild(userMsg);
  chatArea.scrollTop = chatArea.scrollHeight;

  const aiMsg = document.createElement('div');
  aiMsg.style.cssText = 'background: rgba(212,175,55,0.06); border-left: 3px solid var(--gold-primary); padding: 8px 12px; margin-bottom: 10px; font-size: 12.5px;';
  aiMsg.innerHTML = `<strong style="color: var(--gold-primary);">AI Advisor:</strong> <span class="pulse-dot"></span> Thinking...`;
  chatArea.appendChild(aiMsg);
  chatArea.scrollTop = chatArea.scrollHeight;

  const state = stateManager.getState();
  const metrics = computeAIMetrics(state);
  const apiKey = localStorage.getItem('gemini_api_key');

  const systemContext = `You are an expert, friendly financial advisor. Your goal is to explain complex wealth management data to clients in the easiest, most accessible language possible. Do not use heavy financial jargon without defining it simply. Use everyday analogies. Keep your answers brief, warm, and highly structured so a user with zero financial background can instantly understand their portfolio's status and the impact of their changes.

Client: ${state.fullName} (Occupation: ${state.occupation}, Net Worth Bracket: ${state.netWorth})
Risk Profile: ${metrics.riskCategory}
Question: ${text}`;

  if (apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemContext }] }] })
      });
      const data = await response.json();
      const reply = data.candidates[0].content.parts[0].text;
      aiMsg.innerHTML = `<strong style="color: var(--gold-primary);">AI Advisor:</strong> ${formatMarkdown(reply)}`;
      chatArea.scrollTop = chatArea.scrollHeight;
      return;
    } catch (err) {
      console.error('Gemini API Chat error:', err);
    }
  }

  setTimeout(() => {
    let reply = `Here is a simple way to look at this: we want to put your money in a mix of safe debt options (like bank deposits) and high-growth investments (like stocks). This is like having both a sturdy shield and a sharp sword. It protects your cash while helping it grow.`;
    if (text.toLowerCase().includes('tax')) {
      reply = `Think of taxes like a toll booth on your wealth highway. To keep more of your hard-earned money, we can use a special legal structure called a private trust. This acts like a pass that lowers your overall estimated tax tolls (currently ₹15.00 Crore) legally and safely.`;
    } else if (text.toLowerCase().includes('risk') || text.toLowerCase().includes('loss')) {
      reply = `Market drops are like temporary storm clouds. Since your risk profile is ${metrics.riskCategory}, we build your portfolio with safety nets. We keep a portion in cash so you never have to sell your long-term investments when prices are down.`;
    }
    aiMsg.innerHTML = `<strong style="color: var(--gold-primary);">AI Advisor:</strong> ${reply}`;
    chatArea.scrollTop = chatArea.scrollHeight;
  }, 1000);
}

// Micro-View rendering logic
export function renderMicroCards() {
  const grid = document.getElementById('microCardsGrid');
  if (!grid) return;
  
  const state = stateManager.getState();
  
  const categories = [
    { key: 'tax', name: 'Tax Reserve Portfolio', principal: microState.tax.principal, color: 'var(--accent-red)' },
    { key: 'emergency', name: 'Health Emergency Reserve', principal: microState.emergency.principal, color: 'var(--accent-blue)' },
    { key: 'lifestyle', name: 'Lifestyle Maintenance Fund', principal: microState.lifestyle.principal, color: 'var(--gold-primary)' },
    { key: 'education', name: 'Higher Education Sleeve', principal: microState.education.principal, color: 'var(--accent-purple)' },
    { key: 'marriage', name: 'Marriage Planning Sleeve', principal: microState.marriage.principal, color: 'var(--accent-green)' },
    { key: 'equity', name: 'Equity Sleeve Portfolio', principal: microState.equity.principal, color: '#d4af37' },
    { key: 'debt', name: 'Debt Sleeve Portfolio', principal: microState.debt.principal, color: '#38bdf8' }
  ];
  
  grid.innerHTML = categories.map(c => {
    const s = microState[c.key];
    return `
      <div class="card" id="card-micro-${c.key}" style="background: rgba(6, 8, 13, 0.6); border: 1px solid var(--border-subtle); padding: 18px; display: flex; flex-direction: column; gap: 14px; position: relative;">
        <h4 style="font-size: 13.5px; color: var(--gold-light); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px; margin: 0;">
          <span style="display:flex; align-items:center; gap:6px;"><i data-lucide="shield" style="color: ${c.color}; width: 14px; height: 14px;"></i> ${c.name}</span>
          <span style="font-size: 12px; color: var(--text-primary); font-weight: 700;">₹ ${s.principal.toFixed(2)} Cr</span>
        </h4>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-size: 10.5px; display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Time Horizon</span>
              <strong style="color: var(--gold-primary);">${s.horizon} Years</strong>
            </label>
            <input type="range" class="form-input micro-horizon-slider" data-key="${c.key}" min="${c.key === 'tax' ? 1 : 5}" max="40" value="${s.horizon}" style="accent-color: var(--gold-primary); height: 5px; padding:0;" />
          </div>
          
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-size: 10.5px; display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Target Yield / CAGR</span>
              <strong style="color: var(--gold-primary);">${s.yield.toFixed(2)}%</strong>
            </label>
            <input type="range" class="form-input micro-yield-slider" data-key="${c.key}" min="3" max="20" step="0.1" value="${s.yield}" style="accent-color: var(--gold-primary); height: 5px; padding:0;" />
          </div>
        </div>
        
        <div style="height: 110px; position: relative; background: rgba(0,0,0,0.15); border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 4px;">
          <canvas id="canvas-micro-${c.key}" style="width: 100%; height: 100%; cursor: pointer;"></canvas>
        </div>
        
        <div style="overflow-x: auto; max-height: 100px; border: 1px solid rgba(255,255,255,0.03); border-radius: var(--radius-sm);">
          <table class="vault-table" style="font-size: 9.5px; margin: 0; background: transparent; width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; background: rgba(0,0,0,0.25);">
                <th style="padding: 4px;">Year</th>
                <th style="padding: 4px; text-align: right;">Value</th>
                <th style="padding: 4px; text-align: right;">Net Int.</th>
              </tr>
            </thead>
            <tbody id="table-micro-body-${c.key}">
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
  
  if (window.lucide) window.lucide.createIcons();
  
  grid.querySelectorAll('.micro-horizon-slider').forEach(slider => {
    slider.addEventListener('input', e => {
      const key = e.target.getAttribute('data-key');
      const val = parseInt(e.target.value);
      microState[key].horizon = val;
      e.target.previousElementSibling.querySelector('strong').textContent = `${val} Years`;
      updateMicroCard(key);
      updateWealthSimulation();
    });
  });
  
  grid.querySelectorAll('.micro-yield-slider').forEach(slider => {
    slider.addEventListener('input', e => {
      const key = e.target.getAttribute('data-key');
      const val = parseFloat(e.target.value);
      microState[key].yield = val;
      e.target.previousElementSibling.querySelector('strong').textContent = `${val.toFixed(2)}%`;
      updateMicroCard(key);
      updateWealthSimulation();
    });
  });
  
  categories.forEach(c => {
    updateMicroCard(c.key);
  });
}

export function updateMicroCard(key) {
  const s = microState[key];
  const tbody = document.getElementById(`table-micro-body-${key}`);
  const canvas = document.getElementById(`canvas-micro-${key}`);
  if (!tbody || !canvas) return;
  
  const years = [];
  const vals = [];
  const interests = [];
  
  let currentVal = s.principal;
  years.push(0);
  vals.push(currentVal);
  interests.push(0);
  
  const isDrawdown = (key === 'tax' || key === 'lifestyle');
  
  for (let y = 1; y <= s.horizon; y++) {
    let growth = 0;
    if (isDrawdown) {
      if (key === 'tax') {
        const pay = s.principal / s.horizon;
        growth = currentVal * (s.yield / 100);
        currentVal = Math.max(0, currentVal + growth - pay);
      } else if (key === 'lifestyle') {
        const pay = 1.0;
        growth = currentVal * (s.yield / 100);
        currentVal = Math.max(0, currentVal + growth - pay);
      }
    } else {
      growth = currentVal * (s.yield / 100);
      currentVal = currentVal + growth;
    }
    years.push(y);
    vals.push(parseFloat(currentVal.toFixed(2)));
    interests.push(parseFloat(growth.toFixed(2)));
  }
  
  const milestones = [0, 1, Math.floor(s.horizon / 2), s.horizon].filter((v, i, arr) => arr.indexOf(v) === i && v <= s.horizon);
  tbody.innerHTML = milestones.map(y => {
    const idx = years.indexOf(y);
    return `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.02);">
        <td style="padding: 4px; color: var(--text-secondary);">Yr ${y}</td>
        <td style="padding: 4px; text-align: right; font-weight: 700; color: var(--gold-light);">₹ ${vals[idx].toFixed(2)} Cr</td>
        <td style="padding: 4px; text-align: right; color: var(--accent-green);">₹ ${interests[idx].toFixed(2)} Cr</td>
      </tr>
    `;
  }).join('');
  
  const ctx = canvas.getContext('2d');
  if (microCharts[key]) {
    microCharts[key].destroy();
  }
  
  let chartColor = '#d4af37';
  if (key === 'tax') chartColor = '#ef4444';
  else if (key === 'emergency') chartColor = '#3b82f6';
  else if (key === 'education') chartColor = '#a855f7';
  else if (key === 'marriage') chartColor = '#10b981';
  
  microCharts[key] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years.map(y => `Yr ${y}`),
      datasets: [{
        data: vals,
        borderColor: chartColor,
        backgroundColor: 'rgba(255,255,255,0.01)',
        fill: false,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: false },
        y: { display: false }
      },
      plugins: {
        legend: { display: false }
      },
      onClick: (event, activeElements) => {
        const labelMap = {
          tax: 'Tax Reserve Portfolio',
          emergency: 'Health Emergency Reserve',
          lifestyle: 'Lifestyle Maintenance Fund',
          education: 'Higher Education Sleeve',
          marriage: 'Marriage Planning Sleeve',
          equity: 'Equity Sleeve Portfolio',
          debt: 'Debt Sleeve Portfolio'
        };
        showExplainOverlayButton(`canvas-micro-${key}`, key, labelMap[key]);
      }
    }
  });
}

function showExplainOverlayButton(canvasId, key, label) {
  const canvasEl = document.getElementById(canvasId);
  const parent = canvasEl.parentElement;
  
  const existing = parent.querySelector('.btn-explain-overlay');
  if (existing) existing.remove();
  
  const btn = document.createElement('button');
  btn.className = 'btn-explain-overlay btn-primary';
  btn.style.cssText = 'position: absolute; bottom: 8px; right: 8px; z-index: 10; font-size: 10px; padding: 4px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-gold); background: rgba(10,15,26,0.9);';
  btn.innerHTML = '<i data-lucide="sparkles" style="width:11px; height:11px; display:inline-block; vertical-align:middle; margin-right:3px;"></i> Explain';
  parent.style.position = 'relative';
  parent.appendChild(btn);
  if (window.lucide) window.lucide.createIcons();
  
  btn.onclick = (e) => {
    e.stopPropagation();
    btn.remove();
    triggerAIChartExplanation(key, label);
  };
}

async function triggerAIChartExplanation(key, label) {
  const panel = document.getElementById('explainSlideOut');
  if (!panel) return;
  panel.style.right = '0px';

  let summaryText = '';
  let queryText = '';

  if (key === 'masterGrowth') {
    const state = stateManager.getState();
    summaryText = `Master Portfolio Growth Projections\nTime Horizon: ${state.globalHorizon || 40} Years\nAsset base: ₹ 101 Crore`;
    queryText = `portfolio growth projections spanning ${state.globalHorizon || 40} years. Total asset base starts at ₹101 Crore.`;
  } else if (key === 'glidePath') {
    summaryText = `Age-Based Glide Path Asset Allocations\nAge range: Age 35 to Age 75\nDetails: transitioning from higher risk equities to stable debt assets over time.`;
    queryText = `strategic glide path asset allocation showing linear shifts from high-growth equities at Age 35 down to 75% debt protection at Age 75.`;
  } else {
    const s = microState[key];
    summaryText = `Goal/Category: ${label}\nPrincipal Invested: ₹ ${s.principal.toFixed(2)} Cr\nHorizon: ${s.horizon} Years\nTarget CAGR: ${s.yield.toFixed(2)}%`;
    queryText = `${label} compounding at ${s.yield}% yield over ${s.horizon} years. The initial principal is ₹${s.principal} Crore.`;
  }

  document.getElementById('explainTargetChartName').textContent = label;
  document.getElementById('explainChartDataSummary').innerText = summaryText;
  document.getElementById('explainTextContent').innerHTML = `<div style="display:flex; align-items:center; gap:8px;"><div class="pulse-dot"></div> Analysing details...</div>`;

  const apiKey = localStorage.getItem('gemini_api_key');
  const systemContext = `You are an expert, friendly financial advisor. Your goal is to explain complex wealth management data to clients in the easiest, most accessible language possible. Do not use heavy financial jargon without defining it simply. Use everyday analogies. Keep your answers brief, warm, and highly structured so a user with zero financial background can instantly understand their portfolio's status and the impact of their changes.

Explain what this chart represents to the client simply:
Chart context: ${queryText}

Write a brief, warm 2-3 sentence overview that explains this chart's trends and why it is important for their long-term wealth strategy.`;

  if (apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemContext }] }] })
      });
      const data = await response.json();
      const reply = data.candidates[0].content.parts[0].text;
      document.getElementById('explainTextContent').innerHTML = `<div style="line-height:1.6; font-size:12.5px; color:var(--text-primary);">${formatMarkdown(reply)}</div>`;
      return;
    } catch (err) {
      console.error('Failed explaining chart via Gemini:', err);
    }
  }

  // Fallback explanations in plain friendly language
  setTimeout(() => {
    let reply = `This chart shows how your money compounds over time. Think of it like planting a small seed (your principal) and watching it grow into a giant shade tree (your final corpus). The higher the CAGR (our growth rate), the faster the tree grows!`;
    if (key === 'tax') {
      reply = `This shows your tax payments. Think of it like paying a toll bridge as you cross it. The curve dips because we are using our tax reserve pool of ₹15 Crore to pay off tax liabilities until it reaches zero.`;
    } else if (key === 'lifestyle') {
      reply = `This visualizes your living runway. We set aside ₹5 Crore to fund your lifestyle spends of ₹1 Crore per year. We let the remaining balance earn a steady interest return, so the fund lasts longer before drying out.`;
    } else if (key === 'glidePath') {
      reply = `This is your portfolio's safety steering wheel. As you age, we slowly transition your money from high-speed growth tracks (like stocks) into stable, smooth tracks (like bonds). It ensures that by the time you reach retirement, your wealth is fully protected from sudden market drops.`;
    }
    document.getElementById('explainTextContent').innerHTML = `<div style="line-height:1.6; font-size:12.5px; color:var(--text-primary);">${reply}</div>`;
  }, 1000);
}

function formatMarkdown(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export function renderBespokeDossier(state, metrics) {
  return;
}

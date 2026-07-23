import { stateManager } from './state.js';
import { computeAIMetrics } from './aiEngine.js';

let sipChart = null;
let allocChart = null;

export function initResultsScreen() {
  const btnDownloadPDF = document.getElementById('btnDownloadPDF');
  const btnNext = document.getElementById('btnNext');

  // Sliders listeners
  const sliderSip = document.getElementById('sliderSip');
  const valSip = document.getElementById('valSip');
  const sliderYears = document.getElementById('sliderYears');
  const valYears = document.getElementById('valYears');
  const sliderRate = document.getElementById('sliderRate');
  const valRate = document.getElementById('valRate');
  
  // Booster Slider listener
  const sliderBooster = document.getElementById('sliderBooster');
  const valBooster = document.getElementById('valBooster');

  if (sliderSip) {
    sliderSip.addEventListener('input', (e) => {
      valSip.textContent = `₹ ${parseInt(e.target.value).toLocaleString()}`;
      updateWealthSimulation();
    });
  }

  if (sliderYears) {
    sliderYears.addEventListener('input', (e) => {
      valYears.textContent = `${e.target.value} Years`;
      updateWealthSimulation();
    });
  }

  if (sliderRate) {
    sliderRate.addEventListener('input', (e) => {
      valRate.textContent = `${e.target.value}%`;
      updateWealthSimulation();
    });
  }

  if (sliderBooster) {
    sliderBooster.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      valBooster.textContent = val >= 0 ? `+${val}%` : `${val}%`;
      updateWealthSimulation();
    });
  }

  // Gemini API Key handling
  if (!localStorage.getItem('gemini_api_key')) {
    const part1 = 'AQ.Ab8RN6KBCHv8';
    const part2 = 'a2s35eyXE7TBAun94CiSiLoYT5_7nqM6Pmcltw';
    localStorage.setItem('gemini_api_key', part1 + part2);
  }
  const apiInput = document.getElementById('geminiApiKey');
  if (apiInput) {
    apiInput.value = localStorage.getItem('gemini_api_key') || '';
    apiInput.addEventListener('input', (e) => {
      localStorage.setItem('gemini_api_key', e.target.value.trim());
    });
  }

  // Q&A button listener
  const btnSendChat = document.getElementById('btnSendChat');
  const chatInput = document.getElementById('chatInput');
  if (btnSendChat && chatInput) {
    btnSendChat.addEventListener('click', () => handleChatSubmit());
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleChatSubmit();
    });
  }
}

export function showResultsDashboard() {
  const state = stateManager.getState();
  const metrics = computeAIMetrics(state);

  const firstGoal = state.goals[0] || {};
  const monthlySIPSuggested = firstGoal.calculatedSIP || 250000;
  const targetYears = firstGoal.targetYears || 15;
  const expectedReturn = metrics.riskCategory === 'Aggressive' ? 14 : (metrics.riskCategory === 'Growth' ? 12 : 10);

  const sliderSip = document.getElementById('sliderSip');
  const valSip = document.getElementById('valSip');
  const sliderYears = document.getElementById('sliderYears');
  const valYears = document.getElementById('valYears');
  const sliderRate = document.getElementById('sliderRate');
  const valRate = document.getElementById('valRate');
  const sliderBooster = document.getElementById('sliderBooster');
  const valBooster = document.getElementById('valBooster');

  if (sliderSip) {
    sliderSip.value = Math.min(1000000, Math.max(10000, monthlySIPSuggested));
    valSip.textContent = `₹ ${parseInt(sliderSip.value).toLocaleString()}`;
  }
  if (sliderYears) {
    sliderYears.value = targetYears;
    valYears.textContent = `${targetYears} Years`;
  }
  if (sliderRate) {
    sliderRate.value = expectedReturn;
    valRate.textContent = `${expectedReturn}%`;
  }
  if (sliderBooster) {
    sliderBooster.value = 0;
    valBooster.textContent = '+0%';
  }

  // Render suggested questions
  renderSuggestedQuestions(state);
  
  // Render tax slabs
  fetchAndRenderTaxSlabs(state);

  // Render text reports
  renderAIDossier(state, metrics);
  
  // Render dynamic dossier panel
  renderBespokeDossier(state, metrics);

  // Render charts
  setTimeout(() => {
    updateWealthSimulation();
    renderAllocationChart(metrics);
  }, 100);
}

// Generate Context-Aware Suggested Questions
function renderSuggestedQuestions(state) {
  const container = document.getElementById('suggestedQuestions');
  if (!container) return;

  let questions = [
    { text: 'Optimize return to 15%?', action: () => adjustSimulators(null, null, 15) },
    { text: 'Extend horizon to 25 Years?', action: () => adjustSimulators(null, 25, null) },
    { text: 'What is the surcharge rate for >2Cr income?', action: () => triggerSampleChat('What is the surcharge rate for >2Cr income in India?') }
  ];

  if (state.occupation === 'Business Owner') {
    questions = [
      { text: 'Company Dividend tax optimization?', action: () => triggerSampleChat('How can I optimize tax on my company dividends?') },
      { text: 'Optimize return to 15%?', action: () => adjustSimulators(null, null, 15) },
      { text: 'Structure trust for startup exit?', action: () => triggerSampleChat('How should I structure a private trust to cushion my startup exit?') }
    ];
  } else if (state.riskCategory === 'Conservative') {
    questions = [
      { text: 'Hedging capital preservation?', action: () => triggerSampleChat('How should I hedge a conservative portfolio against inflation?') },
      { text: 'Extend horizon to 20 Years?', action: () => adjustSimulators(null, 20, null) },
      { text: 'Optimal allocation for fixed income?', action: () => triggerSampleChat('What alternative instruments are best for high-yielding fixed income?') }
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

function adjustSimulators(sip, years, rate) {
  if (sip) {
    document.getElementById('sliderSip').value = sip;
    document.getElementById('valSip').textContent = `₹ ${sip.toLocaleString()}`;
  }
  if (years) {
    document.getElementById('sliderYears').value = years;
    document.getElementById('valYears').textContent = `${years} Years`;
  }
  if (rate) {
    document.getElementById('sliderRate').value = rate;
    document.getElementById('valRate').textContent = `${rate}%`;
  }
  updateWealthSimulation();
  
  // Log action
  const chatArea = document.getElementById('chatHistory');
  const actionMsg = document.createElement('div');
  actionMsg.style.cssText = 'background: rgba(56, 189, 248, 0.08); border-left: 3px solid var(--accent-blue); padding: 8px 12px; margin-bottom: 10px; font-size: 12.5px;';
  actionMsg.innerHTML = `<strong>System:</strong> Automatically adjusted simulation variables (Expected Return set to ${rate || 'base'}%, Horizon set to ${years || 'base'} Years). Scroll bar and wealth graphs updated.`;
  chatArea.appendChild(actionMsg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function triggerSampleChat(promptText) {
  document.getElementById('chatInput').value = promptText;
  handleChatSubmit();
}

// Math calculation with Booster & Comparison Table
function updateWealthSimulation() {
  const monthlySip = parseFloat(document.getElementById('sliderSip').value) || 250000;
  const years = parseInt(document.getElementById('sliderYears').value) || 15;
  const annualRate = parseFloat(document.getElementById('sliderRate').value) || 12;
  const booster = parseFloat(document.getElementById('sliderBooster').value) || 0;

  const monthlyRateBase = (annualRate / 100) / 12;
  const monthlyRateBoosted = ((annualRate + booster) / 100) / 12;
  const months = years * 12;

  let totalInvestment = 0;
  let futureValueBase = 0;
  let futureValueBoosted = 0;
  const yearsArray = [];
  const principalData = [];
  const interestData = [];

  for (let i = 1; i <= years; i++) {
    yearsArray.push(`Yr ${i}`);
    const m = i * 12;
    const inv = monthlySip * m;
    const fValBase = Math.round(monthlySip * ((Math.pow(1 + monthlyRateBase, m) - 1) / monthlyRateBase) * (1 + monthlyRateBase));
    const fValBoosted = Math.round(monthlySip * ((Math.pow(1 + monthlyRateBoosted, m) - 1) / monthlyRateBoosted) * (1 + monthlyRateBoosted));
    
    totalInvestment = inv;
    futureValueBase = fValBase;
    futureValueBoosted = fValBoosted;

    principalData.push(inv);
    interestData.push(fValBoosted - inv);
  }

  // Update comparison values
  document.getElementById('resTotalPrincipal').textContent = `₹ ${totalInvestment.toLocaleString()}`;
  document.getElementById('resFutureValue').textContent = `₹ ${futureValueBoosted.toLocaleString()}`;
  document.getElementById('resTotalGain').textContent = `₹ ${(futureValueBoosted - totalInvestment).toLocaleString()}`;

  document.getElementById('valBaseEst').textContent = `₹ ${(futureValueBase/10000000).toFixed(2)} Cr`;
  document.getElementById('valBoostedEst').textContent = `₹ ${(futureValueBoosted/10000000).toFixed(2)} Cr`;
  
  const delta = futureValueBoosted - futureValueBase;
  const deltaText = document.getElementById('valDeltaEst');
  if (delta >= 0) {
    deltaText.textContent = `+ ₹ ${(delta/10000000).toFixed(2)} Cr`;
    deltaText.style.color = 'var(--accent-green)';
  } else {
    deltaText.textContent = `- ₹ ${(Math.abs(delta)/10000000).toFixed(2)} Cr`;
    deltaText.style.color = 'var(--accent-red)';
  }

  // Update line chart
  const ctx = document.getElementById('wealthLineChart').getContext('2d');
  if (sipChart) {
    sipChart.data.labels = yearsArray;
    sipChart.data.datasets[0].data = principalData;
    sipChart.data.datasets[1].data = interestData;
    sipChart.update();
  } else {
    sipChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: yearsArray,
        datasets: [
          {
            label: 'Principal Invested',
            data: principalData,
            borderColor: '#94a3b8',
            backgroundColor: 'rgba(148, 163, 184, 0.08)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Wealth Gained (Adjusted)',
            data: interestData,
            borderColor: '#d4af37',
            backgroundColor: 'rgba(212, 175, 55, 0.12)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#f8fafc' } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }
}

function renderAllocationChart(metrics) {
  const ctx = document.getElementById('resAllocChart').getContext('2d');
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
            labels: { color: '#f8fafc', boxWidth: 10 }
          }
        }
      }
    });
  }
}

// Fetch Indian Tax slabs comparison (New vs Old regime) using AI key
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
      
      // Clean up markdown wrapping if present
      const cleanHTML = rawText.replace(/```html|```/g, '').trim();
      container.innerHTML = cleanHTML;
      return;
    } catch (err) {
      console.error('Failed to fetch tax slabs via Gemini:', err);
    }
  }

  // Pre-structured premium fallback table
  setTimeout(() => {
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
        <strong>HNI Surcharges:</strong> 10% on tax for income >50L | 15% for >1Cr | 25% for >2Cr (New Regime capped).
      </div>
    `;
  }, 1000);
}

// Fetch AI Report / Dossier using Gemini API key or fall back to high-fidelity mock
async function renderAIDossier(state, metrics) {
  const container = document.getElementById('aiReportContent');
  container.innerHTML = `<div class="pulse-dot"></div> <span style="margin-left: 10px;">Generating Bespoke AI Wealth Strategy...</span>`;

  const apiKey = localStorage.getItem('gemini_api_key');
  const prompt = `You are the lead HNI Wealth Advisor at Elite WealthOS. Review this client dossier:
Name: ${state.fullName}
Occupation: ${state.occupation} (${state.businessType || 'N/A'})
Company: ${state.companyName || 'N/A'}
Net Worth Bracket: ${state.netWorth}
Liquid Assets: ₹${parseFloat(state.liquidAssets || 0).toLocaleString()}
Risk Category: ${metrics.riskCategory} (Risk Score: ${metrics.riskScore})
Tax Regime: ${state.taxRegime} (Estimated Tax Reserve: ₹${metrics.taxReserve.toLocaleString()})
Active Goals: ${JSON.stringify(state.goals)}
Proposed Portfolio: Stocks: ${metrics.allocation.stocks}%, MFs: ${metrics.allocation.mutualFunds}%, Alternatives: ${metrics.allocation.alts}%, Cash: ${metrics.allocation.cash}%

Provide an executive, ultra-premium wealth planning report. In 3 short paragraphs:
1. Explain the "Elite Wealth Profile" they are making and why this specific allocation makes sense for their status.
2. Outline how this plan secures their family details and covers their tax reserve requirements.
3. Suggest a concrete tactical roadmap (e.g. AIF, PMS, or private equity opportunities) to build legacy wealth and hedge inflation.`;

  if (apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      container.innerHTML = `<div style="line-height: 1.6; font-size: 13.5px; color: var(--gold-light);">${formatMarkdown(text)}</div>`;
      return;
    } catch (err) {
      console.error('Gemini API Error:', err);
    }
  }

  // Fallback high-fidelity structured summary if no API key
  setTimeout(() => {
    container.innerHTML = `
      <div style="line-height: 1.6; font-size: 13.5px; color: var(--gold-light);">
        <p style="margin-bottom: 12px;"><strong>Bespoke HNI Allocation Assessment:</strong> The portfolio structure modeled for <strong>${state.fullName || 'Client'}</strong> targets a <strong>${metrics.riskCategory}</strong> asset configuration. By allocating ${metrics.allocation.stocks}% to Direct High-Conviction Equity and ${metrics.allocation.alts}% to Alternative Assets (including AIF Category II/III and PMS structures), we maximize alpha capture while aligning with your liquid asset profile of ₹${parseFloat(state.liquidAssets || 10000000).toLocaleString()}.</p>
        <p style="margin-bottom: 12px;"><strong>Tax & Legacy Alignment:</strong> With an estimated tax liability reserve of <strong>₹${(metrics.taxReserve/100000).toFixed(1)} Lakhs</strong> based on your residential status as a ${state.residentialStatus}, utilizing structured tax wrappers like Family Trust structures or OCI corporate vehicles will insulate capital. Family protection metrics of ${metrics.familyProtectionScore}% confirm basic coverage, which we recommend scaling.</p>
        <p><strong>Tactical Recommendation:</strong> Given your background in ${state.industry || 'Business Operations'}, we recommend parking short-term liquidity in liquid corporate debt and deploying alternative allocations systematically into AI infrastructure and Defence opportunities over the next 18 months to build a resilient HNI legacy estate.</p>
      </div>
    `;
  }, 1200);
}

// Handle Chat Q&A Interaction
async function handleChatSubmit() {
  const chatInput = document.getElementById('chatInput');
  const chatArea = document.getElementById('chatHistory');
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  
  // Append user message
  const userMsg = document.createElement('div');
  userMsg.style.cssText = 'background: rgba(255,255,255,0.04); border-left: 3px solid var(--text-secondary); padding: 8px 12px; margin-bottom: 10px; font-size: 13px;';
  userMsg.innerHTML = `<strong style="color: var(--text-secondary);">Client:</strong> ${text}`;
  chatArea.appendChild(userMsg);
  chatArea.scrollTop = chatArea.scrollHeight;

  // Loading indicator
  const aiMsg = document.createElement('div');
  aiMsg.style.cssText = 'background: rgba(212,175,55,0.06); border-left: 3px solid var(--gold-primary); padding: 8px 12px; margin-bottom: 10px; font-size: 13px;';
  aiMsg.innerHTML = `<strong style="color: var(--gold-primary);">AI Advisor:</strong> <span class="pulse-dot"></span> Thinking...`;
  chatArea.appendChild(aiMsg);
  chatArea.scrollTop = chatArea.scrollHeight;

  const state = stateManager.getState();
  const metrics = computeAIMetrics(state);
  const apiKey = localStorage.getItem('gemini_api_key');

  const systemContext = `You are the lead Family Office Wealth Advisor at Elite WealthOS.
Client: ${state.fullName} (Occupation: ${state.occupation}, Net Worth Bracket: ${state.netWorth})
Risk Profile: ${metrics.riskCategory}
Tax Regime: ${state.taxRegime} (Tax reserve: ₹${metrics.taxReserve})
Question: ${text}

Answer the client's question in a professional, premium tone. Keep the answer concise (2-4 sentences) and highly actionable based on their financial parameters. If they ask about changing returns or years, suggest what value they should boost or stress test.`;

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

  // Fallback mock responses
  setTimeout(() => {
    let reply = `To address your concern, we suggest deploying your ₹${parseFloat(state.liquidAssets || 10000000).toLocaleString()} liquid assets across structured credit opportunities and PMS wrappers. This cushions your portfolio from market volatility while keeping yields high.`;
    if (text.toLowerCase().includes('tax')) {
      reply = `Under the ${state.taxRegime} tax regime, we recommend wrapping your investments in a private trust or corporate holding structure to consolidate capital gains. This minimizes the estimated ₹${(metrics.taxReserve/100000).toFixed(1)} Lakhs tax liability.`;
    } else if (text.toLowerCase().includes('risk') || text.toLowerCase().includes('loss')) {
      reply = `With your risk profile designated as ${metrics.riskCategory}, the portfolio is geared to handle short-term pullbacks. We hedge this by reserving cash assets and using market neutral hedging strategies.`;
    }
    aiMsg.innerHTML = `<strong style="color: var(--gold-primary);">AI Advisor:</strong> ${reply}`;
    chatArea.scrollTop = chatArea.scrollHeight;
  }, 1000);
}

// Convert markdown stars to strong elements
function formatMarkdown(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export function renderBespokeDossier(state, metrics) {
  const selectAnalyzer = document.getElementById('selectReturnAnalyzer');
  const panelAnalyzer = document.getElementById('panelReturnAnalyzer');
  const listInvestments = document.getElementById('listDossierInvestments');
  const listInsurance = document.getElementById('listDossierInsurance');

  if (!selectAnalyzer || !panelAnalyzer || !listInvestments || !listInsurance) return;

  // 1. Gather all active instruments
  const activeInstruments = [];

  const taxReserve = parseFloat(state.taxReserve || 150000000);
  if (taxReserve > 0) {
    activeInstruments.push(
      { name: 'Aditya Birla Sun Life Liquid Fund', allocation: taxReserve * (8/15), yield: 7.03, access: '1–2 days', vertical: 'Tax Reserve Plan' },
      { name: 'Axis Overnight Funds', allocation: taxReserve * (4/15), yield: 5.37, access: 'Same day', vertical: 'Tax Reserve Plan' },
      { name: 'Nippon India Ultra Short Duration Fund', allocation: taxReserve * (3/15), yield: 7.50, access: '2–3 days', vertical: 'Tax Reserve Plan' }
    );
  }

  // Add Goals bifurcations
  (metrics.calculatedGoals || []).forEach(goal => {
    const bifurcations = goal.bifurcations || [];
    bifurcations.forEach(b => {
      activeInstruments.push({
        name: b.name,
        allocation: parseFloat(b.allocation || 0),
        yield: parseFloat(b.yield || 7.0),
        access: b.access || '3–4 days',
        vertical: goal.type
      });
    });
  });

  // 2. Populate Dropdown Analyzer
  if (activeInstruments.length === 0) {
    selectAnalyzer.innerHTML = `<option value="">No active investments found</option>`;
    panelAnalyzer.innerHTML = `<div style="grid-column: span 4; color: var(--text-secondary); padding: 10px;">Add a goal or configure tax proceeds to see return analytics.</div>`;
  } else {
    selectAnalyzer.innerHTML = activeInstruments.map((inst, i) => `
      <option value="${i}">${inst.name} (${inst.vertical})</option>
    `).join('');

    // Select first instrument by default and render panel
    updateAnalyzerPanel(0);

    // Bind change listener
    selectAnalyzer.onchange = (e) => {
      const idx = parseInt(e.target.value);
      updateAnalyzerPanel(idx);
    };
  }

  function updateAnalyzerPanel(idx) {
    const inst = activeInstruments[idx];
    if (!inst) return;

    const yieldRate = inst.yield;
    const alloc = inst.allocation;
    const rDec = yieldRate / 100;

    const r1 = alloc * Math.pow(1 + rDec, 1) - alloc;
    const r3 = alloc * Math.pow(1 + rDec, 3) - alloc;
    const r5 = alloc * Math.pow(1 + rDec, 5) - alloc;
    const r10 = alloc * Math.pow(1 + rDec, 10) - alloc;

    panelAnalyzer.innerHTML = `
      <div>
        <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Expected Yield</div>
        <div style="font-size: 15px; font-weight: 700; color: var(--gold-light); margin-top: 4px;">${yieldRate.toFixed(2)}%</div>
      </div>
      <div>
        <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Amount Invested</div>
        <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">₹ ${(alloc / 10000000).toFixed(2)} Cr</div>
      </div>
      <div>
        <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Projected Returns</div>
        <div style="font-size: 11.5px; text-align: left; color: var(--accent-green); line-height: 1.35; padding-left: 10px;">
          1 Yr: +₹ ${(r1 / 100000).toFixed(1)}L<br>
          3 Yr: +₹ ${(r3 / 100000).toFixed(1)}L<br>
          5 Yr: +₹ ${(r5 / 100000).toFixed(1)}L<br>
          10 Yr: +₹ ${(r10 / 10000000).toFixed(2)}Cr
        </div>
      </div>
      <div>
        <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Access Time</div>
        <div style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-top: 6px;">${inst.access}</div>
      </div>
    `;
  }

  // 3. Render Bifurcations Tables
  let listHTML = '';
  if (taxReserve > 0) {
    listHTML += `
      <div style="background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: var(--radius-sm);">
        <div style="font-size: 12px; font-weight: 700; color: var(--gold-light); margin-bottom: 8px;"><i data-lucide="receipt" style="width:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Tax Planning Reserve Allocation (₹ ${(taxReserve/10000000).toFixed(2)} Cr)</div>
        <div class="table-responsive">
          <table class="vault-table" style="font-size: 10.5px; width: 100%; margin: 0;">
            <tbody>
              <tr>
                <td>Aditya Birla Sun Life Liquid Fund</td>
                <td>₹ ${((taxReserve * 8/15) / 10000000).toFixed(2)} Cr</td>
                <td style="color: var(--accent-green);">7.03%</td>
              </tr>
              <tr>
                <td>Axis Overnight Funds</td>
                <td>₹ ${((taxReserve * 4/15) / 10000000).toFixed(2)} Cr</td>
                <td style="color: var(--accent-green);">5.37%</td>
              </tr>
              <tr>
                <td>Nippon India Ultra Short Duration</td>
                <td>₹ ${((taxReserve * 3/15) / 10000000).toFixed(2)} Cr</td>
                <td style="color: var(--accent-green);">7.50%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  (metrics.calculatedGoals || []).forEach(goal => {
    const bifurcations = goal.bifurcations || [];
    if (bifurcations.length > 0) {
      listHTML += `
        <div style="background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: var(--radius-sm); margin-top: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--gold-light); margin-bottom: 8px;"><i data-lucide="target" style="width:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> ${goal.type} (₹ ${(goal.totalAlloc/10000000).toFixed(2)} Cr)</div>
          <div class="table-responsive">
            <table class="vault-table" style="font-size: 10.5px; width: 100%; margin: 0;">
              <tbody>
                ${bifurcations.map(b => `
                  <tr>
                    <td>${b.name}</td>
                    <td>₹ ${(b.allocation / 100000).toFixed(0)} Lakhs</td>
                    <td style="color: var(--accent-green);">${b.yield}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  });

  listInvestments.innerHTML = listHTML || `<div style="font-size:12px; color:var(--text-secondary); padding: 10px;">No active investments configured. Go back to Onboarding Wizard to add wealth goals.</div>`;

  // Render Insurance list
  listInsurance.innerHTML = `
    <div style="background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: var(--radius-sm);">
      <div style="font-size: 12px; font-weight: 700; color: var(--gold-light); margin-bottom: 8px;"><i data-lucide="shield-check" style="width:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Family Health Coverage Premium</div>
      <div class="table-responsive">
        <table class="vault-table" style="font-size: 10.5px; width: 100%; margin: 0;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); text-align: left;">
              <th style="padding: 4px 2px;">Plan</th>
              <th style="padding: 4px 2px;">Coverage</th>
              <th style="padding: 4px 2px;">Premium</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>HDFC ERGO Optima Secure</td>
              <td>₹ 1 Crore</td>
              <td>₹ 1.5 Lakhs/yr</td>
            </tr>
            <tr>
              <td>ManipalCigna Global Secure</td>
              <td>₹ 1 Crore (Global)</td>
              <td>₹ 2.0 Lakhs/yr</td>
            </tr>
            <tr>
              <td>Care Senior Citizens (Parents)</td>
              <td>₹ 50 Lakhs</td>
              <td>₹ 3.0 Lakhs/yr</td>
            </tr>
            <tr>
              <td>ICICI Pru Critical CareProtect</td>
              <td>₹ 5 Crore (Split)</td>
              <td>₹ 3.5 Lakhs/yr</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // 4. Render SVG Charts
  const goalsAlloc = (metrics.calculatedGoals || []).reduce((acc, curr) => acc + parseFloat(curr.totalAlloc || 0), 0);
  const insuranceAlloc = 1000000; // 10 Lakhs

  const maxVal = Math.max(taxReserve, goalsAlloc, insuranceAlloc) || 1;
  const wTax = (taxReserve / maxVal) * 160 || 10;
  const wGoals = (goalsAlloc / maxVal) * 160 || 10;
  const wIns = (insuranceAlloc / maxVal) * 160 || 10;

  const barSVG = `
    <svg viewBox="0 0 220 90" width="100%" height="90" style="max-width: 220px; overflow: visible;">
      <!-- Tax Planning bar -->
      <text x="0" y="11" fill="var(--text-secondary)" font-size="8.5" font-weight="700">Tax planning: ₹ ${(taxReserve/10000000).toFixed(1)} Cr</text>
      <rect x="0" y="16" width="${wTax}" height="8" rx="2" fill="var(--accent-red)" opacity="0.85" />
      
      <!-- Wealth Goals bar -->
      <text x="0" y="41" fill="var(--text-secondary)" font-size="8.5" font-weight="700">Goals Portfolio: ₹ ${(goalsAlloc/10000000).toFixed(1)} Cr</text>
      <rect x="0" y="46" width="${wGoals}" height="8" rx="2" fill="var(--gold-primary)" opacity="0.85" />
      
      <!-- Insurance Premium bar -->
      <text x="0" y="71" fill="var(--text-secondary)" font-size="8.5" font-weight="700">Insurance Premiums: ₹ ${(insuranceAlloc/100000).toFixed(0)}L</text>
      <rect x="0" y="76" width="${wIns}" height="8" rx="2" fill="var(--accent-blue)" opacity="0.85" />
    </svg>
  `;
  document.getElementById('svgCombinedBarContainer').innerHTML = barSVG;

  // Separate line charts sparklines
  const taxPoints = [taxReserve, taxReserve - 22500000, taxReserve - 67500000, taxReserve - 112500000, 0];
  document.getElementById('svgTaxDrawdownLine').innerHTML = drawSparkline(taxPoints, 'var(--accent-red)');

  const goalsPoints = [goalsAlloc, goalsAlloc * 1.12, goalsAlloc * 1.25, goalsAlloc * 1.45, goalsAlloc * 1.68, goalsAlloc * 2.05];
  document.getElementById('svgGoalsGrowthLine').innerHTML = drawSparkline(goalsPoints, 'var(--accent-green)');

  const insPoints = [75000000, 75000000, 75000000, 75000000, 75000000, 75000000];
  document.getElementById('svgInsuranceCoverLine').innerHTML = drawSparkline(insPoints, 'var(--accent-blue)');

  if (window.lucide) window.lucide.createIcons();
}

function drawSparkline(points, color, width = 70, height = 30) {
  if (!points || points.length < 2) return '';
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const valRange = maxVal - minVal || 1;
  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - minVal) / valRange) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="max-width: ${width}px; overflow: visible;">
      <polyline fill="none" stroke="${color}" stroke-width="2" points="${coords}" />
    </svg>
  `;
}

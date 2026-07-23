import { fetchClientsFromDB, saveClientToDB, fetchClientById } from './api.js';

// Centralized Relational Store with Live MongoDB DB Sync Support
const INITIAL_STATE = {
  currentStep: 1,
  clientId: null,
  
  // Step 1: Simplified Profile
  fullName: '',
  dob: '',
  pan: '',
  mobile: '',
  email: '',
  occupation: '',
  businessType: '',
  startupStage: '',
  marketCap: '',
  companyName: '',
  industry: '',
  industryCustom: '',
  annualIncome: '',
  incomeCustom: '',
  netWorth: '',
  netWorthCustom: '',
  liquidAssets: '',
  city: '',
  
  // Step 2: Family
  familyMembers: [],
  
  // Step 3: Risk Profile
  riskAnswers: {
    q1Horizon: '5-10 years',
    q2Reaction: 'Hold',
    q3Objective: 'Capital Growth'
  },
  riskScore: 65,
  riskCategory: 'Growth',
  
  // Step 4: Goals
  goals: [
    {
      id: 'g-tax',
      type: 'Tax Planning Reserve (₹15 Cr)',
      targetAmount: 150000000,
      targetYears: 1,
      bifurcations: [
        { name: 'Aditya Birla Sun Life Liquid Fund', allocation: 80000000, yield: 7.03, access: '1–2 days' },
        { name: 'Axis Overnight Funds', allocation: 40000000, yield: 5.37, access: '1–2 days' },
        { name: 'Nippon India Ultra Short Duration Fund', allocation: 30000000, yield: 7.50, access: '1–2 days' }
      ]
    },
    {
      id: 'g-health-reserve',
      type: 'Health Emergency Reserve (₹3 Cr)',
      targetAmount: 30000000,
      targetYears: 15,
      bifurcations: [
        { name: 'Sweep-in Fixed Deposit (Tier 1 - Instant)', allocation: 5000000, yield: 5.8, access: 'Same day' },
        { name: 'ICICI Prudential Short Term Fund (Tier 2 - Fast)', allocation: 10000000, yield: 7.25, access: '2–3 days' },
        { name: 'Tata Arbitrage Fund (Tier 3 - Tax-Efficient)', allocation: 15000000, yield: 7.59, access: '3–4 days' }
      ]
    },
    {
      id: 'g-lifestyle',
      type: 'Lifestyle Maintenance Fund (₹5 Cr)',
      targetAmount: 50000000,
      targetYears: 5,
      bifurcations: [
        { name: 'Years 1–2: Liquid Funds (rolling)', allocation: 20000000, yield: 6.75, access: '1–2 days' },
        { name: 'Years 2–3: Short / Low Duration Debt Funds', allocation: 20000000, yield: 7.25, access: '2–3 days' },
        { name: 'Years 4–5: Conservative Hybrid / Debt Fund', allocation: 10000000, yield: 8.5, access: '3–4 days' }
      ]
    },
    {
      id: 'g-edu',
      type: 'Higher Education Planning (₹2 Cr)',
      targetAmount: 90000000,
      targetYears: 15,
      bifurcations: [
        { name: 'Parag Parikh Flexi Cap Fund', allocation: 6000000, yield: 12.0, access: '3–4 days' },
        { name: 'UTI Nifty 50 Index Fund', allocation: 6000000, yield: 11.5, access: '3–4 days' },
        { name: 'Motilal Oswal S&P 500 Index Fund', allocation: 4000000, yield: 11.0, access: '3–4 days' },
        { name: 'Motilal Oswal NASDAQ 100 ETF', allocation: 4000000, yield: 13.0, access: '3–4 days' }
      ]
    },
    {
      id: 'g-marriage',
      type: 'Marriage Planning (₹3 Cr)',
      targetAmount: 30000000,
      targetYears: 22,
      bifurcations: [
        { name: 'HDFC Large and Mid Cap Fund (Equity 60%)', allocation: 18000000, yield: 12.0, access: '3–4 days' },
        { name: 'ICICI Prudential Corporate Bond Fund (Debt 40%)', allocation: 12000000, yield: 7.5, access: '3–4 days' }
      ]
    },
    {
      id: 'g-ins-port',
      type: 'Health Insurance Portfolio',
      targetAmount: 1000000,
      targetYears: 1,
      bifurcations: [
        { name: 'HDFC ERGO Optima Secure (Family Floater, ₹1 Cr Base)', allocation: 150000, yield: 0, access: 'Same day' },
        { name: 'ManipalCigna Lifetime Health Global (Super Top-Up, ₹1 Cr Global)', allocation: 200000, yield: 0, access: 'Same day' },
        { name: 'Star Health / Care Senior (Parents, ₹50 Lakhs)', allocation: 300000, yield: 0, access: 'Same day' },
        { name: 'ICICI Pru Heart / Cancer Protect (Critical Illness, ₹5 Cr Split)', allocation: 350000, yield: 0, access: 'Same day' }
      ]
    }
  ],
  
  // Step 5: Investments
  selectedAssets: ['Direct Equity', 'Mutual Funds & ETFs', 'Alternative Assets (AIF/PMS)'],
  stockExperience: 'Intermediate',
  preferredSectors: ['Technology', 'AI', 'Defence'],
  capitalWeights: {
    equity: 45,
    debt: 25,
    alts: 15,
    re: 10,
    gold: 5
  },

  // Step 6: Tax
  residentialStatus: 'Resident',
  taxRegime: 'New',
  grossProceeds: 1000000000,
  taxRate: 0.15,
  taxReserve: 150000000,
  
  // Step 7: Insurance
  hasLifeInsurance: 'Yes',
  hasHealthInsurance: 'Yes',
  
  // Simulation Controls
  globalReturnRates: {
    equity: 12,
    debt: 7,
    alts: 10,
    re: 9,
    gold: 8,
    cash: 5
  },
  globalHorizon: 40,
  inflationRate: 6,
  inflationActive: true,
  
  auditLogs: [],
  lastSavedAt: null,
  isDraft: true
};

class StateManager {
  constructor() {
    this.state = { ...INITIAL_STATE };
    this.vault = [];
    this.subscribers = new Set();
    this.undoStack = [];
    this.redoStack = [];

    // Load active client on startup
    const savedActive = localStorage.getItem('elite_wealth_os_active_client');
    if (savedActive) {
      this.state = JSON.parse(savedActive);
    }

    this.syncVault();
    this.startAutoSave();
  }

  getState() {
    return this.state;
  }

  getVault() {
    return this.vault;
  }

  async syncVault() {
    this.vault = await fetchClientsFromDB();
    this.notify();
  }

  createNewClient() {
    this.undoStack = [];
    this.redoStack = [];
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.state.clientId = `ELITE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    this.state.auditLogs.push({
      timestamp: new Date().toLocaleTimeString(),
      action: 'Initialized New Client Onboarding'
    });
    this.saveActive();
    this.notify();
    return this.state;
  }

  async loadClient(clientId) {
    const client = await fetchClientById(clientId);
    if (client) {
      this.undoStack = [];
      this.redoStack = [];
      this.state = JSON.parse(JSON.stringify(client));
      this.state.auditLogs.push({
        timestamp: new Date().toLocaleTimeString(),
        action: 'Loaded client profile from database'
      });
      this.saveActive();
      this.notify();
      return true;
    }
    return false;
  }

  async submitClient() {
    this.state.isDraft = false;
    this.state.lastSavedAt = new Date().toLocaleTimeString();
    
    // Save to Database
    await saveClientToDB(this.state);
    await this.syncVault();
    
    this.saveActive();
    this.notify();
  }

  saveActive() {
    localStorage.setItem('elite_wealth_os_active_client', JSON.stringify(this.state));
  }

  update(keyOrObject, value, logDescription = null) {
    this.undoStack.push(JSON.stringify(this.state));
    this.redoStack = [];
    
    if (typeof keyOrObject === 'string') {
      this.state[keyOrObject] = value;
    } else if (typeof keyOrObject === 'object') {
      Object.assign(this.state, keyOrObject);
    }
    
    if (logDescription) {
      this.state.auditLogs.unshift({
        timestamp: new Date().toLocaleTimeString(),
        action: logDescription
      });
    }

    this.saveActive();
    this.notify();
  }

  undo() {
    if (this.undoStack.length === 0) return false;
    this.redoStack.push(JSON.stringify(this.state));
    const previous = JSON.parse(this.undoStack.pop());
    this.state = previous;
    this.saveActive();
    this.notify();
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    this.undoStack.push(JSON.stringify(this.state));
    const next = JSON.parse(this.redoStack.pop());
    this.state = next;
    this.saveActive();
    this.notify();
    return true;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.state));
  }

  startAutoSave() {
    setInterval(async () => {
      const wizardVisible = document.getElementById('wizardScreen')?.style.display !== 'none';
      const resultsVisible = document.getElementById('resultsScreen')?.style.display !== 'none';
      if (this.state.clientId && (wizardVisible || resultsVisible)) {
        this.state.lastSavedAt = new Date().toLocaleTimeString();
        this.saveActive();
        
        // Sync draft changes directly to MongoDB/Express backend
        await saveClientToDB(this.state);
        await this.syncVault();
      }
    }, 10000);
  }
}

export const stateManager = new StateManager();

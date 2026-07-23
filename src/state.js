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
      id: 'g-retire',
      type: 'Retirement',
      targetAmount: '100000000',
      targetYears: '15',
      calculatedSIP: 0,
      calculatedLumpsum: 0,
      futureValue: 0
    }
  ],
  
  // Step 5: Investments
  selectedAssets: ['Direct Equity', 'Mutual Funds & ETFs', 'Alternative Assets (AIF/PMS)'],
  stockExperience: 'Intermediate',
  preferredSectors: ['Technology', 'AI', 'Defence'],

  // Step 6: Tax
  residentialStatus: 'Resident',
  taxRegime: 'New',
  grossProceeds: 1000000000,
  taxRate: 0.15,
  taxReserve: 150000000,
  
  // Step 7: Insurance
  hasLifeInsurance: 'Yes',
  hasHealthInsurance: 'Yes',
  
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

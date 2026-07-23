// Front-end API Helper for Express & MongoDB Sync
const API_URL = 'http://localhost:3001/api';

export async function fetchClientsFromDB() {
  try {
    const response = await fetch(`${API_URL}/clients`);
    if (!response.ok) throw new Error('Failed to fetch client list');
    return await response.json();
  } catch (err) {
    console.warn('Backend API offline. Fetching from LocalStorage vault fallback.');
    return JSON.parse(localStorage.getItem('elite_wealth_os_vault')) || [];
  }
}

export async function saveClientToDB(clientData) {
  try {
    const response = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData)
    });
    if (!response.ok) throw new Error('Failed to save client data');
    return await response.json();
  } catch (err) {
    console.warn('Backend API offline. Saving draft to LocalStorage vault fallback.');
    // Local fallback sync
    let vault = JSON.parse(localStorage.getItem('elite_wealth_os_vault')) || [];
    const idx = vault.findIndex(c => c.clientId === clientData.clientId);
    if (idx >= 0) {
      vault[idx] = clientData;
    } else {
      vault.unshift(clientData);
    }
    localStorage.setItem('elite_wealth_os_vault', JSON.stringify(vault));
    return { success: true, fallback: true };
  }
}

export async function fetchClientById(clientId) {
  try {
    const response = await fetch(`${API_URL}/clients/${clientId}`);
    if (!response.ok) throw new Error('Client not found');
    return await response.json();
  } catch (err) {
    console.warn('Backend API offline. Retrieving client from LocalStorage fallback.');
    const vault = JSON.parse(localStorage.getItem('elite_wealth_os_vault')) || [];
    return vault.find(c => c.clientId === clientId) || null;
  }
}

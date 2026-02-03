/**
 * ScoreSage Admin - Cloud Data Management
 * Uses JSONBin.io for persistent storage across all users
 */

// ============================================================
// IMPORTANT: SET UP YOUR JSONBIN.IO ACCOUNT
// 
// 1. Go to https://jsonbin.io and create FREE account
// 2. Click "Create a Bin" 
// 3. Paste this initial data and save:
/*
{
  "predictions": [],
  "leagues": [
    {"id": 1, "name": "Premier League"},
    {"id": 2, "name": "La Liga"},
    {"id": 3, "name": "Serie A"},
    {"id": 4, "name": "Bundesliga"},
    {"id": 5, "name": "Ligue 1"},
    {"id": 6, "name": "Champions League"},
    {"id": 7, "name": "Europa League"}
  ],
  "stats": {"won": 0, "lost": 0, "pending": 0}
}
*/
// 4. Copy your Bin ID (from URL like jsonbin.io/v3/b/YOUR_BIN_ID)
// 5. Go to API Keys section, copy your X-Master-Key
// 6. Paste both below:
// ============================================================

const JSONBIN_BIN_ID = '698238ceae596e708f0e91b4';
const JSONBIN_API_KEY = '$2a$10$TGRuTQNJvIDo1F2ESTCx5eEwl8azX3A9Zzsn3WgQMu.I4vHha67ey';

const API_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// Check if JSONBin is configured
function isConfigured() {
    return JSONBIN_BIN_ID && !JSONBIN_BIN_ID.includes('YOUR_BIN_ID') && JSONBIN_BIN_ID.length > 10;
}

// Get all data from cloud
async function getData() {
    if (!isConfigured()) {
        console.warn('JSONBin not configured! Using local storage fallback.');
        const local = localStorage.getItem('scoresage_data');
        return local ? JSON.parse(local) : getDefaultData();
    }
    
    try {
        const response = await fetch(API_URL + '/latest', {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const result = await response.json();
        return result.record || getDefaultData();
    } catch (error) {
        console.error('Error fetching data:', error);
        const local = localStorage.getItem('scoresage_data');
        return local ? JSON.parse(local) : getDefaultData();
    }
}

// Save all data to cloud
async function saveData(data) {
    // Update stats
    data.stats = {
        won: data.predictions.filter(p => p.result === 'won').length,
        lost: data.predictions.filter(p => p.result === 'lost').length,
        pending: data.predictions.filter(p => p.result === 'pending').length
    };
    
    // Always save locally as backup
    localStorage.setItem('scoresage_data', JSON.stringify(data));
    
    if (!isConfigured()) {
        console.warn('JSONBin not configured! Saved to local storage only.');
        return true;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Failed to save');
        
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving to cloud. Data saved locally.');
        return false;
    }
}

// Get predictions
async function getPredictions() {
    const data = await getData();
    return data.predictions || [];
}

// Save predictions
async function savePredictions(predictions) {
    const data = await getData();
    data.predictions = predictions;
    return await saveData(data);
}

// Add a prediction
async function addPrediction(prediction) {
    const data = await getData();
    data.predictions.unshift(prediction);
    return await saveData(data);
}

// Get default data structure
function getDefaultData() {
    return {
        predictions: [],
        leagues: [
            {id: 1, name: 'Premier League'},
            {id: 2, name: 'La Liga'},
            {id: 3, name: 'Serie A'},
            {id: 4, name: 'Bundesliga'},
            {id: 5, name: 'Ligue 1'},
            {id: 6, name: 'Champions League'},
            {id: 7, name: 'Europa League'}
        ],
        stats: {won: 0, lost: 0, pending: 0}
    };
}

// Show loading indicator
function showSaving() {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loader-small"></span> Saving...';
    }
}

function hideSaving() {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '✓ Add Prediction';
    }
}

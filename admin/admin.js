/**
 * ScoreSage Admin - Data Management
 * Uses localStorage for simple persistent storage
 */

const STORAGE_KEY = 'scoresage_predictions';

// Get all predictions
async function getPredictions() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        return JSON.parse(data);
    }
    
    // Try to load from predictions.json file as initial data
    try {
        const response = await fetch('../predictions.json');
        const json = await response.json();
        if (json.predictions) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(json.predictions));
            return json.predictions;
        }
    } catch (e) {
        console.log('No initial data found');
    }
    
    return [];
}

// Save predictions
async function savePredictions(predictions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
    
    // Also update the main predictions.json for the public site
    // Note: This only works locally. For Vercel, data persists in localStorage
    updatePublicData(predictions);
}

// Add a prediction
async function addPrediction(prediction) {
    const predictions = await getPredictions();
    predictions.unshift(prediction); // Add to beginning
    await savePredictions(predictions);
}

// Update public data (generates downloadable JSON)
function updatePublicData(predictions) {
    const stats = {
        won: predictions.filter(p => p.result === 'won').length,
        lost: predictions.filter(p => p.result === 'lost').length,
        pending: predictions.filter(p => p.result === 'pending').length
    };
    
    const data = {
        predictions: predictions,
        leagues: [
            {id: 1, name: 'Premier League'},
            {id: 2, name: 'La Liga'},
            {id: 3, name: 'Serie A'},
            {id: 4, name: 'Bundesliga'},
            {id: 5, name: 'Ligue 1'},
            {id: 6, name: 'Champions League'},
            {id: 7, name: 'Europa League'}
        ],
        stats: stats
    };
    
    // Store for export
    localStorage.setItem('scoresage_export', JSON.stringify(data, null, 2));
}

// Export data as JSON file (for updating predictions.json on GitHub)
function exportData() {
    const data = localStorage.getItem('scoresage_export') || localStorage.getItem(STORAGE_KEY);
    if (!data) {
        alert('No data to export');
        return;
    }
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'predictions.json';
    a.click();
    URL.revokeObjectURL(url);
}


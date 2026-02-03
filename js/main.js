/**
 * ScoreSage - Main JavaScript
 * Uses JSONBin.io for cloud storage (everyone sees same data)
 */

// JSONBin.io Configuration
// TO SETUP: Go to jsonbin.io, create free account, create a bin, and paste your IDs here
const JSONBIN_BIN_ID = '698238ceae596e708f0e91b4';
const JSONBIN_API_KEY = '$2a$10$TGRuTQNJvIDo1F2ESTCx5eEwl8azX3A9Zzsn3WgQMu.I4vHha67ey';

const API_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// DOM Elements
const elements = {
    predictionsGrid: document.getElementById('predictionsGrid'),
    leagueTabs: document.getElementById('leagueTabs'),
    currentDate: document.getElementById('currentDate'),
    noPredictions: document.getElementById('noPredictions'),
    clearFilter: document.getElementById('clearFilter'),
    mobileToggle: document.getElementById('mobileToggle'),
    wonCount: document.getElementById('wonCount'),
    lostCount: document.getElementById('lostCount'),
    pendingCount: document.getElementById('pendingCount'),
    winRate: document.getElementById('winRate')
};

let currentLeague = 'all';
let allData = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    loadAllData();
    initAnimations();
    initEventListeners();
});

function setCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date().toLocaleDateString('en-US', options);
    if (elements.currentDate) {
        elements.currentDate.textContent = date;
    }
}

// Load data from JSONBin (cloud) or fallback to local JSON
async function loadAllData() {
    showLoading();
    
    try {
        // Try loading from JSONBin first
        if (JSONBIN_BIN_ID && JSONBIN_BIN_ID.length > 10) {
            const response = await fetch(API_URL + '/latest', {
                headers: { 
                    'X-Master-Key': JSONBIN_API_KEY,
                    'X-Bin-Meta': 'false'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Handle both wrapped and unwrapped responses
                allData = result.record || result;
                
                if (allData && allData.predictions) {
                    renderLeagueTabs(allData.leagues || []);
                    renderPredictions(allData.predictions);
                    renderStats(allData.stats || {});
                    console.log('Loaded from JSONBin:', allData.predictions.length, 'predictions');
                    return;
                }
            }
        }
        
        // Fallback to local predictions.json
        console.log('Falling back to local file...');
        const response = await fetch('predictions.json?v=' + Date.now());
        allData = await response.json();
        
        renderLeagueTabs(allData.leagues);
        renderPredictions(allData.predictions);
        renderStats(allData.stats);
    } catch (error) {
        console.error('Error loading data:', error);
        renderDemoPredictions();
    }
}

function renderLeagueTabs(leagues) {
    if (!elements.leagueTabs || !leagues) return;
    
    const defaultTab = elements.leagueTabs.querySelector('.league-tab[data-league="all"]');
    elements.leagueTabs.innerHTML = '';
    
    if (defaultTab) {
        elements.leagueTabs.appendChild(defaultTab);
    }
    
    const leagueFlags = {
        'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        'La Liga': '🇪🇸',
        'Serie A': '🇮🇹',
        'Bundesliga': '🇩🇪',
        'Ligue 1': '🇫🇷',
        'Champions League': '🏆',
        'Europa League': '🥈'
    };
    
    leagues.forEach(league => {
        const tab = document.createElement('button');
        tab.className = 'league-tab';
        tab.dataset.league = league.id;
        tab.innerHTML = `
            <span class="tab-icon">${leagueFlags[league.name] || '⚽'}</span>
            <span>${league.name}</span>
        `;
        tab.addEventListener('click', () => filterByLeague(league.id));
        elements.leagueTabs.appendChild(tab);
    });
}

function showLoading() {
    if (!elements.predictionsGrid) return;
    elements.predictionsGrid.innerHTML = `
        <div class="loading-state">
            <div class="loader"></div>
            <p>Loading predictions...</p>
        </div>
    `;
    if (elements.noPredictions) elements.noPredictions.classList.add('hidden');
}

function showNoPredictions() {
    if (elements.predictionsGrid) elements.predictionsGrid.innerHTML = '';
    if (elements.noPredictions) elements.noPredictions.classList.remove('hidden');
}

function renderPredictions(predictions) {
    if (!elements.predictionsGrid) return;
    
    if (!predictions || predictions.length === 0) {
        showNoPredictions();
        return;
    }
    
    if (elements.noPredictions) elements.noPredictions.classList.add('hidden');
    
    elements.predictionsGrid.innerHTML = predictions.map(pred => createPredictionCard(pred)).join('');
    
    const cards = elements.predictionsGrid.querySelectorAll('.prediction-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function createPredictionCard(pred) {
    const confidenceLevels = { 'low': 1, 'medium': 2, 'high': 3, 'very_high': 4 };
    const confidenceLevel = confidenceLevels[pred.confidence] || 2;
    
    const resultBadgeClass = { 'won': 'won', 'lost': 'lost', 'pending': 'pending' };
    const resultText = { 'won': '✓ Won', 'lost': '✗ Lost', 'pending': '⏳ Pending' };
    
    const matchDate = new Date(pred.match_date + 'T' + (pred.match_time || '15:00'));
    const timeStr = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const getInitials = (name) => name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
    
    return `
        <div class="prediction-card ${pred.is_vip == 1 ? 'vip' : ''}">
            <div class="card-header">
                <div class="league-info">
                    <span class="league-name">${pred.league_name || 'Football'}</span>
                </div>
                <div class="match-time">
                    ${pred.is_vip == 1 ? '<span class="vip-tag">👑 VIP</span>' : ''}
                    <span>${dateStr} • ${timeStr}</span>
                </div>
            </div>
            <div class="card-body">
                <div class="teams-display">
                    <div class="team">
                        <div class="team-logo">${getInitials(pred.home_team)}</div>
                        <span class="team-name">${pred.home_team}</span>
                    </div>
                    <span class="vs-badge">VS</span>
                    <div class="team">
                        <div class="team-logo">${getInitials(pred.away_team)}</div>
                        <span class="team-name">${pred.away_team}</span>
                    </div>
                </div>
                <div class="prediction-details">
                    <div class="prediction-row">
                        <span class="prediction-label">Prediction</span>
                        <span class="prediction-value tip">${pred.prediction}</span>
                    </div>
                    <div class="prediction-row">
                        <span class="prediction-label">Odds</span>
                        <span class="prediction-value odds">${parseFloat(pred.odds).toFixed(2)}</span>
                    </div>
                    <div class="prediction-row">
                        <span class="prediction-label">Confidence</span>
                        <div class="confidence-bar">
                            <div class="confidence-dots">
                                ${[1, 2, 3, 4].map(i => `
                                    <span class="confidence-dot ${i <= confidenceLevel ? 'active' : ''} ${confidenceLevel >= 3 ? 'high' : ''}"></span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="prediction-row">
                        <span class="prediction-label">Status</span>
                        <span class="result-badge ${resultBadgeClass[pred.result] || 'pending'}">${resultText[pred.result] || '⏳ Pending'}</span>
                    </div>
                </div>
            </div>
            ${pred.analysis ? `
                <div class="card-footer">
                    <p class="analysis-text">${pred.analysis}</p>
                </div>
            ` : ''}
        </div>
    `;
}

function renderDemoPredictions() {
    const demoPredictions = [
        {
            id: 1, home_team: 'Manchester United', away_team: 'Liverpool',
            match_date: new Date().toISOString().split('T')[0], match_time: '15:00',
            prediction: 'Over 2.5 Goals', odds: 1.85, confidence: 'high', result: 'pending',
            analysis: 'Both teams score frequently in derbies.', is_vip: 0, league_name: 'Premier League'
        },
        {
            id: 2, home_team: 'Real Madrid', away_team: 'Barcelona',
            match_date: new Date().toISOString().split('T')[0], match_time: '20:00',
            prediction: 'Both Teams to Score', odds: 1.65, confidence: 'very_high', result: 'pending',
            analysis: 'El Clasico always delivers goals!', is_vip: 1, league_name: 'La Liga'
        }
    ];
    
    allData = { predictions: demoPredictions, leagues: [{id:1,name:'Premier League'},{id:2,name:'La Liga'}], stats: {won:156,lost:23,pending:2} };
    renderPredictions(demoPredictions);
    renderStats(allData.stats);
}

function filterByLeague(leagueId) {
    currentLeague = leagueId;
    
    document.querySelectorAll('.league-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.league == leagueId || (leagueId === 'all' && tab.dataset.league === 'all')) {
            tab.classList.add('active');
        }
    });
    
    if (!allData) return;
    
    let filtered = allData.predictions;
    if (leagueId !== 'all') {
        filtered = allData.predictions.filter(p => p.league_id == leagueId);
    }
    
    renderPredictions(filtered);
}

function renderStats(stats) {
    if (!stats) return;
    animateCounter(elements.wonCount, stats.won || 0);
    animateCounter(elements.lostCount, stats.lost || 0);
    animateCounter(elements.pendingCount, stats.pending || 0);
    
    const completed = (stats.won || 0) + (stats.lost || 0);
    const winRate = completed > 0 ? Math.round((stats.won / completed) * 100) : 0;
    animateCounter(elements.winRate, winRate, '%');
}

function animateCounter(element, target, suffix = '') {
    if (!element) return;
    const duration = 2000;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(target * easeOutQuart);
        element.textContent = current.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function initAnimations() {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                animateCounter(el, parseInt(el.dataset.count));
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    statNumbers.forEach(el => observer.observe(el));
}

function initEventListeners() {
    if (elements.clearFilter) {
        elements.clearFilter.addEventListener('click', () => filterByLeague('all'));
    }
    
    if (elements.mobileToggle) {
        elements.mobileToggle.addEventListener('click', () => {
            document.querySelector('.nav-links')?.classList.toggle('active');
        });
    }
    
    // Secret admin access - click logo 5 times
    const mainLogo = document.getElementById('mainLogo');
    const adminLink = document.querySelector('.admin-secret-link');
    let logoClickCount = 0;
    let logoClickTimer = null;
    
    if (mainLogo && adminLink) {
        mainLogo.addEventListener('click', (e) => {
            e.preventDefault();
            logoClickCount++;
            if (logoClickTimer) clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
            if (logoClickCount >= 5) {
                adminLink.style.display = 'inline-flex';
                adminLink.style.animation = 'fadeIn 0.3s ease';
                logoClickCount = 0;
            }
        });
    }
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.pageYOffset > 100) navbar?.classList.add('scrolled');
        else navbar?.classList.remove('scrolled');
    });
}

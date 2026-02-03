/**
 * ScoreSage - Main JavaScript
 * Static version for Vercel/GitHub Pages
 */

// Load data from JSON file
const DATA_URL = 'predictions.json';

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

// State
let currentLeague = 'all';
let allData = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    loadAllData();
    initAnimations();
    initEventListeners();
});

// Set current date
function setCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date().toLocaleDateString('en-US', options);
    if (elements.currentDate) {
        elements.currentDate.textContent = date;
    }
}

// Load all data from JSON
async function loadAllData() {
    showLoading();
    
    try {
        const response = await fetch(DATA_URL + '?v=' + Date.now()); // Cache bust
        allData = await response.json();
        
        renderLeagueTabs(allData.leagues);
        renderPredictions(allData.predictions);
        renderStats(allData.stats);
    } catch (error) {
        console.error('Error loading data:', error);
        renderDemoPredictions();
    }
}

// Render league tabs
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

// Show loading state
function showLoading() {
    if (!elements.predictionsGrid) return;
    
    elements.predictionsGrid.innerHTML = `
        <div class="loading-state">
            <div class="loader"></div>
            <p>Loading predictions...</p>
        </div>
    `;
    
    if (elements.noPredictions) {
        elements.noPredictions.classList.add('hidden');
    }
}

// Show no predictions state
function showNoPredictions() {
    if (elements.predictionsGrid) {
        elements.predictionsGrid.innerHTML = '';
    }
    if (elements.noPredictions) {
        elements.noPredictions.classList.remove('hidden');
    }
}

// Render predictions
function renderPredictions(predictions) {
    if (!elements.predictionsGrid) return;
    
    if (!predictions || predictions.length === 0) {
        showNoPredictions();
        return;
    }
    
    if (elements.noPredictions) {
        elements.noPredictions.classList.add('hidden');
    }
    
    elements.predictionsGrid.innerHTML = predictions.map(pred => createPredictionCard(pred)).join('');
    
    // Animate cards
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

// Create prediction card HTML
function createPredictionCard(pred) {
    const confidenceLevels = { 'low': 1, 'medium': 2, 'high': 3, 'very_high': 4 };
    const confidenceLevel = confidenceLevels[pred.confidence] || 2;
    
    const resultBadgeClass = { 'won': 'won', 'lost': 'lost', 'pending': 'pending', 'void': 'pending' };
    const resultText = { 'won': '✓ Won', 'lost': '✗ Lost', 'pending': '⏳ Pending', 'void': '⊘ Void' };
    
    const matchDate = new Date(pred.match_date + 'T' + pred.match_time);
    const timeStr = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const getInitials = (name) => name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
    
    return `
        <div class="prediction-card ${pred.is_vip == 1 ? 'vip' : ''}" data-id="${pred.id}">
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
                        <span class="result-badge ${resultBadgeClass[pred.result]}">${resultText[pred.result]}</span>
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

// Render demo predictions (fallback)
function renderDemoPredictions() {
    const demoPredictions = [
        {
            id: 1, home_team: 'Manchester United', away_team: 'Liverpool',
            match_date: new Date().toISOString().split('T')[0], match_time: '15:00:00',
            prediction: 'Over 2.5 Goals', odds: 1.85, confidence: 'high', result: 'pending',
            analysis: 'Both teams score frequently in derbies.', is_vip: 0, league_name: 'Premier League'
        },
        {
            id: 2, home_team: 'Real Madrid', away_team: 'Barcelona',
            match_date: new Date().toISOString().split('T')[0], match_time: '20:00:00',
            prediction: 'Both Teams to Score', odds: 1.65, confidence: 'very_high', result: 'pending',
            analysis: 'El Clasico always delivers goals!', is_vip: 1, league_name: 'La Liga'
        }
    ];
    
    renderPredictions(demoPredictions);
    renderStats({ won: 156, lost: 23, pending: 5 });
}

// Filter by league
function filterByLeague(leagueId) {
    currentLeague = leagueId;
    
    // Update active tab
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

// Render stats
function renderStats(stats) {
    if (!stats) return;
    
    animateCounter(elements.wonCount, stats.won || 0);
    animateCounter(elements.lostCount, stats.lost || 0);
    animateCounter(elements.pendingCount, stats.pending || 0);
    
    const completed = (stats.won || 0) + (stats.lost || 0);
    const winRate = completed > 0 ? Math.round((stats.won / completed) * 100) : 0;
    animateCounter(elements.winRate, winRate, '%');
}

// Counter animation
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

// Initialize animations
function initAnimations() {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count);
                animateCounter(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(el => observer.observe(el));
}

// Initialize event listeners
function initEventListeners() {
    // Clear filter button
    if (elements.clearFilter) {
        elements.clearFilter.addEventListener('click', () => filterByLeague('all'));
    }
    
    // Mobile toggle
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
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.pageYOffset > 100) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    });
}

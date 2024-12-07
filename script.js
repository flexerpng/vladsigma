// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Конфигурация игры
const CONFIG = {
    TOTAL_POOL: 10000,
    INITIAL_MINING_POWER: 0.0001,
    UPDATE_INTERVAL: 1000,
    MINERS: [
        { id: 1, name: "Базовый майнер", basePower: 0.0001, basePrice: 10 },
        { id: 2, name: "Продвинутый майнер", basePower: 0.0005, basePrice: 50 },
        { id: 3, name: "Супер майнер", basePower: 0.002, basePrice: 200 },
        { id: 4, name: "Мега майнер", basePower: 0.01, basePrice: 1000 }
    ]
};

// Состояние игры
let gameState = {
    userBalance: 0,
    miningPower: CONFIG.INITIAL_MINING_POWER,
    miners: {},
    totalMined: 0,
    lastUpdate: Date.now(),
    achievements: {},
    lastCoinAnimation: Date.now()
};

// Загрузка состояния игры
function loadGameState() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        gameState = JSON.parse(savedState);
        gameState.lastUpdate = Date.now();
    }
}

// Сохранение состояния игры
function saveGameState() {
    gameState.lastUpdate = Date.now();
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

// Достижения
const ACHIEVEMENTS = [
    {
        id: 'first_miner',
        name: 'Первый майнер',
        description: 'Купите вашего первого майнера',
        icon: '🎮',
        condition: (state) => Object.values(state.miners).some(m => m.count > 0)
    },
    {
        id: 'speed_demon',
        name: 'Скоростной демон',
        description: 'Достигните скорости майнинга 0.1 USDT/с',
        icon: '⚡',
        condition: (state) => state.miningPower >= 0.1
    },
    {
        id: 'millionaire',
        name: 'Миллионер',
        description: 'Намайните 1000 USDT',
        icon: '💰',
        condition: (state) => state.totalMined >= 1000
    }
];

ACHIEVEMENTS.forEach(a => {
    gameState.achievements[a.id] = false;
});

// Инициализация майнеров
function initializeMiners() {
    const minersGrid = document.querySelector('.miners-grid');
    CONFIG.MINERS.forEach(miner => {
        gameState.miners[miner.id] = { count: 0, level: 1 };
        
        const minerCard = document.createElement('div');
        minerCard.className = 'miner-card';
        minerCard.innerHTML = `
            <h3>${miner.name}</h3>
            <p>Мощность: ${miner.basePower} USDT/с</p>
            <p>Количество: <span id="miner-${miner.id}-count">0</span></p>
            <p>Уровень: <span id="miner-${miner.id}-level">1</span></p>
            <button onclick="buyMiner(${miner.id})">Купить (${miner.basePrice} USDT)</button>
            <button onclick="upgradeMiner(${miner.id})">Улучшить</button>
        `;
        minersGrid.appendChild(minerCard);
    });
}

// Функция покупки майнера
function buyMiner(minerId) {
    const miner = CONFIG.MINERS.find(m => m.id === minerId);
    const price = miner.basePrice * (gameState.miners[minerId].count + 1);
    
    if (gameState.userBalance >= price) {
        gameState.userBalance -= price;
        gameState.miners[minerId].count++;
        gameState.miningPower += miner.basePower * gameState.miners[minerId].level;
        updateUI();
        saveGameState();
    } else {
        alert('Недостаточно средств!');
    }
}

// Функция улучшения майнера
function upgradeMiner(minerId) {
    const upgradePrice = CONFIG.MINERS.find(m => m.id === minerId).basePrice * 
                        gameState.miners[minerId].level * 2;
    
    if (gameState.userBalance >= upgradePrice) {
        gameState.userBalance -= upgradePrice;
        gameState.miners[minerId].level++;
        updateMiningPower();
        updateUI();
        saveGameState();
    } else {
        alert('Недостаточно средств для улучшения!');
    }
}

// Обновление мощности майнинга
function updateMiningPower() {
    gameState.miningPower = CONFIG.MINERS.reduce((power, miner) => {
        const minerState = gameState.miners[miner.id];
        return power + (miner.basePower * minerState.count * minerState.level);
    }, CONFIG.INITIAL_MINING_POWER);
}

// Обновление интерфейса
function updateUI() {
    document.querySelector('.balance-amount').textContent = 
        `${gameState.userBalance.toFixed(4)} USDT`;
    document.querySelector('.power-amount').textContent = 
        `${gameState.miningPower.toFixed(4)} USDT/с`;
    document.querySelector('.total-mined').textContent = 
        `Всего намайнено: ${gameState.totalMined.toFixed(4)} USDT`;
    
    // Обновление счетчиков майнеров
    Object.keys(gameState.miners).forEach(minerId => {
        document.getElementById(`miner-${minerId}-count`).textContent = 
            gameState.miners[minerId].count;
        document.getElementById(`miner-${minerId}-level`).textContent = 
            gameState.miners[minerId].level;
    });
    saveGameState();
}

// Функция создания анимации монетки
function createCoinAnimation() {
    const container = document.querySelector('.coin-container');
    const coin = document.createElement('div');
    coin.className = 'coin';
    
    // Рандомная позиция по X
    const randomX = Math.random() * (container.offsetWidth - 40);
    coin.style.left = `${randomX}px`;
    
    container.appendChild(coin);
    
    // Удаляем монетку после анимации
    setTimeout(() => {
        coin.remove();
    }, 3000);
}

// Обновление прогресс-бара
function updateProgressBar() {
    const progress = document.getElementById('mining-progress');
    const maxPower = 0.1; // Максимальная мощность для полной шкалы
    const percentage = (gameState.miningPower / maxPower) * 100;
    progress.style.width = `${Math.min(percentage, 100)}%`;
}

// Проверка достижений
function checkAchievements() {
    ACHIEVEMENTS.forEach(achievement => {
        if (!gameState.achievements[achievement.id] && achievement.condition(gameState)) {
            gameState.achievements[achievement.id] = true;
            showAchievementNotification(achievement);
            updateAchievementsDisplay();
            saveGameState();
        }
    });
}

// Показ уведомления о достижении
function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
            <h4>${achievement.name}</h4>
            <p>${achievement.description}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Обновление отображения достижений
function updateAchievementsDisplay() {
    const container = document.getElementById('achievements-list');
    container.innerHTML = '';
    
    ACHIEVEMENTS.forEach(achievement => {
        const card = document.createElement('div');
        card.className = `achievement-card ${gameState.achievements[achievement.id] ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <h4>${achievement.name}</h4>
            <p>${achievement.description}</p>
        `;
        container.appendChild(card);
    });
}

// Основной игровой цикл
function gameLoop() {
    const now = Date.now();
    const delta = (now - gameState.lastUpdate) / 1000;
    
    const mined = gameState.miningPower * delta;
    gameState.userBalance += mined;
    gameState.totalMined += mined;
    
    // Создаем анимацию монетки каждые 3 секунды
    if (now - gameState.lastCoinAnimation > 3000) {
        createCoinAnimation();
        gameState.lastCoinAnimation = now;
    }
    
    gameState.lastUpdate = now;
    
    updateUI();
    updateProgressBar();
    checkAchievements();
    saveGameState();
}

// Инициализация игры
function initGame() {
    loadGameState();
    initializeMiners();
    updateAchievementsDisplay();
    gameState.lastCoinAnimation = Date.now();
    setInterval(gameLoop, CONFIG.UPDATE_INTERVAL);
    updateUI();
}

// Реферальная система
let referralSystem = {
    init() {
        this.referralLink = document.getElementById('referral-link');
        this.copyButton = document.getElementById('copy-referral');
        this.referralCount = document.getElementById('referral-count');
        this.referralBonus = document.getElementById('referral-bonus');

        // Ждем инициализации Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            
            // Получаем данные пользователя
            const webApp = window.Telegram.WebApp;
            if (webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
                const userId = webApp.initDataUnsafe.user.id;
                const botUsername = 'crypto_mining_tapper_bot';
                this.referralLink.value = `https://t.me/${botUsername}?start=ref${userId}`;
                console.log('Реферальная ссылка создана:', this.referralLink.value);
            } else {
                this.referralLink.value = 'Ошибка получения данных пользователя';
                this.referralLink.disabled = true;
                this.copyButton.disabled = true;
                console.log('Ошибка: нет данных пользователя');
            }
        } else {
            this.referralLink.value = 'Доступно только в Telegram';
            this.referralLink.disabled = true;
            this.copyButton.disabled = true;
            console.log('Ошибка: не в Telegram WebApp');
        }

        // Обработчик копирования ссылки
        this.copyButton.addEventListener('click', () => {
            if (this.referralLink.value && !this.referralLink.disabled) {
                navigator.clipboard.writeText(this.referralLink.value).then(() => {
                    this.copyButton.textContent = 'Скопировано!';
                    this.copyButton.style.background = 'var(--success-color)';
                    
                    setTimeout(() => {
                        this.copyButton.textContent = 'Копировать';
                        this.copyButton.style.background = 'var(--accent-color)';
                    }, 2000);
                }).catch(err => {
                    console.error('Ошибка копирования:', err);
                    alert('Не удалось скопировать ссылку');
                });
            }
        });

        // Обновляем статистику рефералов
        this.updateReferralStats();
    },

    async updateReferralStats() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe.user) {
            const userId = window.Telegram.WebApp.initDataUnsafe.user.id;
            try {
                const response = await fetch(`http://localhost:5000/api/referrals/${userId}`);
                const data = await response.json();
                
                this.referralCount.textContent = data.count;
                this.referralBonus.textContent = `${data.bonus.toFixed(2)} USDT`;
                
                // Обновляем каждые 30 секунд
                setTimeout(() => this.updateReferralStats(), 30000);
            } catch (error) {
                console.error('Ошибка получения статистики:', error);
                this.referralCount.textContent = '?';
                this.referralBonus.textContent = '? USDT';
            }
        } else {
            this.referralCount.textContent = '-';
            this.referralBonus.textContent = '-';
        }
    }
};

// Инициализация реферальной системы
document.addEventListener('DOMContentLoaded', () => {
    referralSystem.init();
});

// Запуск игры при загрузке страницы
document.addEventListener('DOMContentLoaded', initGame);

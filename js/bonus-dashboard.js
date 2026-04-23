// ===== БОНУСНАЯ СИСТЕМА — DASHBOARD =====

let qrGenerated = false;
let qrVisible = false;

async function loadBonusTab() {
    await Promise.all([loadBonusBalance(), loadBonusHistory()]);
}

// ───── БАЛАНС ─────────────────────────────────
async function loadBonusBalance() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const res = await fetch(BACKEND_URL + '/api/v2/Bonus/balance', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const el = document.getElementById('bonus-balance-display');
        if (el) el.textContent = data.balance ?? 0;
    } catch (e) {
        console.error('Ошибка загрузки баланса:', e);
    }
}

// ───── QR-КОД ─────────────────────────────────
function toggleQr() {
    const container = document.getElementById('qr-code-container');
    const btn = document.getElementById('show-qr-btn');

    if (!qrGenerated) {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            // Получаем userId из токена если нет в localStorage
            fetchUserIdAndGenerateQr();
            return;
        }
        generateQr(userId);
    }

    qrVisible = !qrVisible;
    container.style.display = qrVisible ? 'flex' : 'none';
    btn.innerHTML = qrVisible
        ? '<i class="fas fa-eye-slash"></i> Скрыть QR-код'
        : '<i class="fas fa-qrcode"></i> Показать QR-код';
}

async function fetchUserIdAndGenerateQr() {
    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/User/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const userId = data.user_id;
        if (userId) {
            localStorage.setItem('userId', userId);
            generateQr(userId);
            // После генерации — показываем
            const container = document.getElementById('qr-code-container');
            const btn = document.getElementById('show-qr-btn');
            container.style.display = 'flex';
            btn.innerHTML = '<i class="fas fa-eye-slash"></i> Скрыть QR-код';
            qrVisible = true;
        }
    } catch (e) {
        console.error('Ошибка получения userId:', e);
    }
}

function generateQr(userId) {
    const container = document.getElementById('qr-code-container');
    container.innerHTML = '';

    new QRCode(container, {
        text: String(userId),
        width: 180,
        height: 180,
        colorDark: '#610303',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    qrGenerated = true;
}

// ───── ИСТОРИЯ ТРАНЗАКЦИЙ ──────────────────────
async function loadBonusHistory() {
    const token = localStorage.getItem('authToken');
    const container = document.getElementById('bonus-history-container');
    if (!container) return;

    try {
        const res = await fetch(BACKEND_URL + '/api/v2/Bonus/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const transactions = await res.json();

        if (!transactions.length) {
            container.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-star"></i>
                    <p>История пуста. Делайте заказы и получайте баллы!</p>
                </div>`;
            return;
        }

        container.innerHTML = transactions.map(tx => {
            const isEarned = tx.type === 'EARNED';
            const sign = isEarned ? '+' : '−';
            const colorClass = isEarned ? 'bonus-earned' : 'bonus-spent';
            const icon = tx.source === 'MANUAL'
                ? '<i class="fas fa-store"></i>'
                : '<i class="fas fa-shopping-bag"></i>';
            const date = new Date(tx.createdAt).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            return `
            <div class="bonus-tx-item">
                <div class="bonus-tx-icon ${colorClass}">${icon}</div>
                <div class="bonus-tx-info">
                    <span class="bonus-tx-desc">${tx.description || '—'}</span>
                    <span class="bonus-tx-date">${date}</span>
                </div>
                <div class="bonus-tx-points ${colorClass}">
                    ${sign}${Math.abs(tx.points)} баллов
                </div>
            </div>`;
        }).join('');

    } catch (e) {
        container.innerHTML = '<p style="color:#999;text-align:center;">Ошибка загрузки истории</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'bonus') {
        switchTab('bonus');
    }
});

// ───── ИНТЕГРАЦИЯ С switchTab ──────────────────
// Перехватываем переключение на вкладку bonus
const _originalSwitchTab = typeof switchTab === 'function' ? switchTab : null;

document.addEventListener('DOMContentLoaded', () => {
    // Патчим switchTab чтобы загружать бонусы при переходе
    const originalSwitchTab = window.switchTab;
    window.switchTab = function(tabName) {
        originalSwitchTab(tabName);
        if (tabName === 'bonus') {
            loadBonusTab();
        }
    };
});
// ===== СКАНЕР QR-КОДОВ ДЛЯ КАССИРА =====

let html5QrcodeScanner = null;
let currentUserId = null;
let currentUserName = null;
let scannerStarted = false;

// ───── ИНИЦИАЛИЗАЦИЯ ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');

    if (!token || (role !== 'MANAGER' && role !== 'ADMIN' &&
                   role !== 'manager' && role !== 'admin')) {
        alert('Доступ запрещён');
        window.location.href = 'login-register.html';
        return;
    }

    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login-register.html';
    });

    startScanner();
});

// ───── ЗАПУСК СКАНЕРА ─────────────────────────
function startScanner() {
    if (scannerStarted) return;

    html5QrcodeScanner = new Html5Qrcode("qr-reader");

    Html5Qrcode.getCameras().then(cameras => {
        if (!cameras || cameras.length === 0) {
            document.getElementById('qr-reader').innerHTML =
                '<p class="no-camera"><i class="fas fa-video-slash"></i> Камера недоступна.<br>Используйте ручной ввод.</p>';
            return;
        }

        // Предпочитаем заднюю камеру
        const camera = cameras.find(c => c.label.toLowerCase().includes('back')) || cameras[0];

        html5QrcodeScanner.start(
            camera.id,
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
                // QR отсканирован
                html5QrcodeScanner.stop().then(() => {
                    scannerStarted = false;
                    lookupUser(decodedText.trim());
                });
            },
            () => {} // ошибки сканирования — игнорируем
        ).then(() => { scannerStarted = true; })
         .catch(() => {
            document.getElementById('qr-reader').innerHTML =
                '<p class="no-camera"><i class="fas fa-video-slash"></i> Нет доступа к камере.<br>Используйте ручной ввод.</p>';
         });

    }).catch(() => {
        document.getElementById('qr-reader').innerHTML =
            '<p class="no-camera"><i class="fas fa-video-slash"></i> Камера недоступна.</p>';
    });
}

// ───── ПОИСК КЛИЕНТА ─────────────────────────
async function lookupUser(userId) {
    if (!userId) return;
    const token = localStorage.getItem('authToken');

    try {
        const res = await fetch(BACKEND_URL + `/api/v2/Bonus/qr-info/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Клиент не найден');
        const data = await res.json();

        currentUserId = data.userId;
        currentUserName = data.name;

        document.getElementById('client-name').textContent = data.name;
        document.getElementById('client-balance').textContent = data.balance;

        showStep('step-client');

        // Обработчик ввода суммы
        const amountInput = document.getElementById('purchase-amount');
        amountInput.value = '';
        amountInput.oninput = () => {
            const amount = parseFloat(amountInput.value);
            const preview = document.getElementById('points-preview');
            if (amount > 0) {
                const points = Math.floor(amount * 0.05);
                document.getElementById('points-to-earn').textContent = points;
                preview.style.display = 'flex';
            } else {
                preview.style.display = 'none';
            }
        };

    } catch (e) {
        alert('Клиент не найден. Проверьте QR-код или ID.');
        resetScanner();
    }
}

// ───── НАЧИСЛЕНИЕ БАЛЛОВ ──────────────────────
async function creditPoints() {
    const amount = parseFloat(document.getElementById('purchase-amount').value);
    if (!amount || amount <= 0) {
        alert('Введите сумму покупки');
        return;
    }

    const token = localStorage.getItem('authToken');
    const btn = document.querySelector('.btn-credit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Начисляем...';

    try {
        const res = await fetch(BACKEND_URL + '/api/v2/Bonus/manual-credit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUserId,
                amount: amount,
                description: `Покупка в филиале на ${amount} сом`
            })
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        // Показываем успех
        document.getElementById('success-name').textContent = currentUserName;
        document.getElementById('success-amount').textContent = amount + ' сом';
        document.getElementById('success-points').textContent = '+' + data.pointsAdded + ' баллов';
        document.getElementById('success-balance').textContent = data.newBalance + ' баллов';

        showStep('step-success');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-star"></i> Начислить баллы';

    } catch (e) {
        alert('Ошибка начисления: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-star"></i> Начислить баллы';
    }
}

// ───── СБРОС ──────────────────────────────────
function resetScanner() {
    currentUserId = null;
    currentUserName = null;

    // Очищаем поле суммы и прячем превью
    const amountInput = document.getElementById('purchase-amount');
    if (amountInput) amountInput.value = '';
    const preview = document.getElementById('points-preview');
    if (preview) preview.style.display = 'none';

    showStep('step-scan');
    startScanner();
}

function showStep(stepId) {
    document.querySelectorAll('.scanner-step').forEach(s => s.style.display = 'none');
    document.getElementById(stepId).style.display = 'block';
}
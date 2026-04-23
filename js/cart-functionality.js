// ===== КОРЗИНА =====

let cartData = [];
let stripe = null;
let stripeElements = null;
let userBonusPoints = 0;

// ───── ИНИЦИАЛИЗАЦИЯ STRIPE ────────────────────
function initStripe() {
    if (typeof Stripe === 'undefined') return;
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
}

// ───── УВЕДОМЛЕНИЯ ─────────────────────────────
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.cart-notification');
    if (existing) existing.remove();

    const n = document.createElement('div');
    n.className = 'cart-notification';
    n.textContent = message;
    n.style.cssText = `
        position:fixed;top:80px;right:20px;
        background:${type === 'success' ? '#4CAF50' : '#e53935'};
        color:white;padding:12px 20px;border-radius:8px;z-index:10000;
        box-shadow:0 4px 12px rgba(0,0,0,0.2);font-family:'Montserrat',sans-serif;
        font-size:14px;font-weight:500;transition:opacity 0.3s ease;
    `;
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 2500);
}

// ───── СЧЁТЧИК КОРЗИНЫ ─────────────────────────
function updateCartCount(count) {
    // Десктоп бейдж
    let badge = document.getElementById('cart-badge');
    if (!badge) {
        const cartBtn = document.getElementById('open-cart-button');
        if (cartBtn) {
            badge = document.createElement('span');
            badge.id = 'cart-badge';
            badge.style.cssText = `
                position:absolute;top:-8px;right:-8px;background:white;color:#610303;
                border-radius:50%;width:20px;height:20px;font-size:11px;font-weight:700;
                display:flex;align-items:center;justify-content:center;border:1px solid #610303;
            `;
            cartBtn.style.position = 'relative';
            cartBtn.appendChild(badge);
        }
    }
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }

    // Мобильный bottom nav бейдж
    let mobileBadge = document.getElementById('mobile-cart-badge');
    const mobileCartBtn = document.querySelector('.bottom-nav-item-cart');
    if (mobileCartBtn && !mobileBadge) {
        mobileBadge = document.createElement('span');
        mobileBadge.id = 'mobile-cart-badge';
        mobileBadge.className = 'nav-badge';
        mobileCartBtn.appendChild(mobileBadge);
    }
    if (mobileBadge) {
        mobileBadge.textContent = count;
        mobileBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// ───── ОТКРЫТИЕ / ЗАКРЫТИЕ ─────────────────────
function openCart() {
    document.getElementById('cart-modal').style.display = 'flex';
    loadCart();
}

function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
    const ps = document.getElementById('stripe-payment-section');
    if (ps) ps.style.display = 'none';
    const of = document.getElementById('order-form-container');
    if (of) of.style.display = 'none';
}

function backToOrderForm() {
    document.getElementById('stripe-payment-section').style.display = 'none';
    document.getElementById('order-form-container').style.display = 'block';
}

// ───── ЗАГРУЗКА КОРЗИНЫ ────────────────────────
async function loadCart() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch(BACKEND_URL + '/api/v2/Cart', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        cartData = data.items || [];
        renderCart(cartData, data.total);
        await loadBonusBalance();
        renderBonusBlock(data.total);
        updateCartCount(cartData.length);
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

// ───── ОТРИСОВКА КОРЗИНЫ ───────────────────────
function renderCart(items, total) {
    const container = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('empty-cart-state');
    const summary = document.getElementById('cart-summary');
    const formContainer = document.getElementById('order-form-container');
    const paymentSection = document.getElementById('stripe-payment-section');

    if (items.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        summary.style.display = 'none';
        formContainer.style.display = 'none';
        if (paymentSection) paymentSection.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    emptyState.style.display = 'none';
    summary.style.display = 'block';
    formContainer.style.display = 'block';
    if (paymentSection) paymentSection.style.display = 'none';

    container.innerHTML = items.map(item => {
        const imgSrc = item.menuItemImage
            ? (item.menuItemImage.startsWith('http') ? item.menuItemImage : BACKEND_URL + item.menuItemImage)
            : BACKEND_URL + '/images/menu/default.jpg';
        return `
        <div class="cart-item">
            <div class="cart-item-image"><img src="${imgSrc}" alt="${item.menuItemName}"></div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.menuItemName}</div>
                <div class="cart-item-price">${item.menuItemPrice} сом</div>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="changeQuantity(${item.id}, ${item.quantity - 1})">−</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="changeQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <button class="remove-item-btn" onclick="removeItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
                <div class="item-subtotal">${item.subtotal} сом</div>
            </div>
        </div>`;
    }).join('');

    document.getElementById('cart-total').textContent = `${total} сом`;
    renderBonusBlock(total);
}

// ───── ИЗМЕНИТЬ КОЛИЧЕСТВО ─────────────────────
async function changeQuantity(cartId, newQuantity) {
    const token = localStorage.getItem('authToken');
    if (newQuantity < 1) { removeItem(cartId); return; }
    try {
        await fetch(BACKEND_URL + `/api/v2/Cart/${cartId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQuantity })
        });
        loadCart();
    } catch { showNotification('Ошибка обновления количества', 'error'); }
}

// ───── УДАЛИТЬ ТОВАР ───────────────────────────
async function removeItem(cartId) {
    const token = localStorage.getItem('authToken');
    try {
        await fetch(BACKEND_URL + `/api/v2/Cart/${cartId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadCart();
        showNotification('Товар удалён из корзины');
    } catch { showNotification('Ошибка удаления товара', 'error'); }
}

// ───── ШАГ 1: ЗАПОЛНИТЬ АДРЕС → СОЗДАТЬ PAYMENT INTENT ──
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('authToken');
    const address = document.getElementById('orderAddress').value;
    const phone = document.getElementById('orderPhone').value;
    const comment = document.getElementById('orderComment')?.value || '';

    // Считаем баллы для списания
    const useBonus = document.getElementById('use-bonus-checkbox')?.checked || false;
    const cartTotal = parseFloat(document.getElementById('cart-total')
        .textContent.replace(/[^0-9.]/g, ''));
    const pointsToUse = useBonus ? Math.min(userBonusPoints, Math.floor(cartTotal * 0.5)) : 0;

    const submitBtn = e.target.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Подготовка к оплате...';

    try {
        const response = await fetch(BACKEND_URL + '/api/v2/Payment/create-intent', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currency: 'usd',
                deliveryAddress: address,
                phone: phone,
                comment: comment,
                pointsToUse: pointsToUse
            })
        });

        const data = await response.json();
        if (!data.success) {
            showNotification(data.message || 'Ошибка создания платежа', 'error');
            return;
        }

        showStripePaymentForm(data.clientSecret, data.pointsUsed || 0);

    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-credit-card"></i> Перейти к оплате';
    }
});

// ───── ШАГ 2: ПОКАЗАТЬ ФОРМУ ОПЛАТЫ ──────────
function showStripePaymentForm(clientSecret, pointsUsed = 0) {
    document.getElementById('order-form-container').style.display = 'none';

    const paymentSection = document.getElementById('stripe-payment-section');
    paymentSection.style.display = 'block';
    paymentSection.dataset.clientSecret = clientSecret;
    paymentSection.dataset.pointsUsed = pointsUsed; // сохраняем для confirmPayment

    const total = document.getElementById('cart-total').textContent;
    const rawTotal = parseFloat(total.replace(/[^0-9.]/g, ''));
    const finalTotal = rawTotal - pointsUsed;
    document.getElementById('payment-total').textContent = `${finalTotal} сом`;
    if (pointsUsed > 0) {
        document.getElementById('payment-total').insertAdjacentHTML('afterend',
            `<div style="font-size:12px;color:#4CAF50;margin-top:4px;">
                Скидка по баллам: −${pointsUsed} сом
            </div>`);
    }

    if (!stripe) initStripe();
    stripeElements = stripe.elements({ clientSecret });
    const paymentElement = stripeElements.create('payment', { layout: 'tabs' });
    const container = document.getElementById('stripe-payment-element');
    container.innerHTML = '';
    paymentElement.mount('#stripe-payment-element');
}

// ───── ШАГ 3: ОПЛАТИТЬ ────────────────────────
async function confirmStripePayment() {
    const payBtn = document.getElementById('stripe-pay-btn');
    payBtn.disabled = true;
    payBtn.textContent = 'Обрабатываем...';

    const { error, paymentIntent } = await stripe.confirmPayment({
        elements: stripeElements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required'
    });

    if (error) {
        showNotification(error.message, 'error');
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="fas fa-lock"></i> Оплатить';
        return;
    }

    const token = localStorage.getItem('authToken');
    const pointsUsed = document.getElementById('stripe-payment-section').dataset.pointsUsed || '0';

    try {
        await fetch(BACKEND_URL + '/api/v2/Payment/confirm', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                pointsUsed: pointsUsed
            })
        });
    } catch (e) {
        console.error('Ошибка подтверждения:', e);
    }

   const confirmData = await fetch(BACKEND_URL + '/api/v2/Payment/confirm', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            pointsUsed: pointsUsed
        })
    }).then(r => r.json());

    updateCartCount(0);
    // Редиректим на страницу успеха с orderId
    const orderId = confirmData.orderId;
    window.location.href = `order-success.html${orderId ? '?orderId=' + orderId : ''}`;
}

// ───── ОЧИСТИТЬ КОРЗИНУ ────────────────────────
document.getElementById('clearCartBtn')?.addEventListener('click', async () => {
    if (!confirm('Очистить всю корзину?')) return;
    const token = localStorage.getItem('authToken');
    try {
        await fetch(BACKEND_URL + '/api/v2/Cart/clear', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadCart();
        showNotification('Корзина очищена');
    } catch { showNotification('Ошибка очистки корзины', 'error'); }
});

// ───── БОНУСНЫЕ БАЛЛЫ ─────────────────────────
async function loadBonusBalance() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
        const res = await fetch(BACKEND_URL + '/api/v2/Bonus/balance', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        userBonusPoints = data.balance || 0;
    } catch (e) {
        userBonusPoints = 0;
    }
}

function renderBonusBlock(cartTotal) {
    const existing = document.getElementById('bonus-block');
    if (existing) existing.remove();
    if (userBonusPoints <= 0) return;

    const maxSpend = Math.min(userBonusPoints, Math.floor(cartTotal * 0.5)); // макс 50% от суммы

    const block = document.createElement('div');
    block.id = 'bonus-block';
    block.className = 'bonus-block';
    block.innerHTML = `
        <label class="bonus-label">
            <input type="checkbox" id="use-bonus-checkbox">
            <span>Использовать бонусные баллы</span>
        </label>
        <div class="bonus-info">
            <span>Баланс: <strong>${userBonusPoints} баллов</strong></span>
            <span id="bonus-discount-text" style="display:none; color:#4CAF50;">
                − <strong id="bonus-discount-amount">${maxSpend}</strong> сом
            </span>
        </div>
    `;

    // Вставляем перед кнопками формы
    const formButtons = document.querySelector('#orderForm .form-buttons');
    if (formButtons) formButtons.before(block);

    document.getElementById('use-bonus-checkbox').addEventListener('change', function() {
        const discountText = document.getElementById('bonus-discount-text');
        discountText.style.display = this.checked ? 'inline' : 'none';

        // Пересчитываем итог
        const rawTotal = parseFloat(document.getElementById('cart-total')
            .textContent.replace(/[^0-9.]/g, ''));
        const discount = this.checked ? maxSpend : 0;
        document.getElementById('payment-total-display')?.remove();

        const summary = document.getElementById('cart-summary');
        let displayRow = document.getElementById('discounted-total-row');
        if (this.checked) {
            if (!displayRow) {
                displayRow = document.createElement('div');
                displayRow.id = 'discounted-total-row';
                displayRow.className = 'summary-row';
                displayRow.innerHTML = `<span>К оплате:</span><span class="total-price" style="color:#4CAF50;">${rawTotal - discount} сом</span>`;
                summary.appendChild(displayRow);
            }
        } else {
            displayRow?.remove();
        }
    });
}

// ───── ИНИЦИАЛИЗАЦИЯ ───────────────────────────
document.getElementById('close-cart-modal')?.addEventListener('click', closeCart);

document.addEventListener('DOMContentLoaded', () => {
    initStripe();
    const token = localStorage.getItem('authToken');
    if (token) {
        fetch(BACKEND_URL + '/api/v2/Cart', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => updateCartCount((data.items || []).length))
            .catch(() => {});
    }
});
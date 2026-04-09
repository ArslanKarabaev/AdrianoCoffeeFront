// ===== КОРЗИНА =====

let cartData = [];

// Открыть корзину
function openCart() {
    document.getElementById('cart-modal').style.display = 'flex';
    loadCart();
}

// Закрыть корзину
function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

// Загрузить корзину
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
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

// Отрисовать корзину
function renderCart(items, total) {
    const container = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('empty-cart-state');
    const summary = document.getElementById('cart-summary');
    const formContainer = document.getElementById('order-form-container');

    if (items.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        summary.style.display = 'none';
        formContainer.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    emptyState.style.display = 'none';
    summary.style.display = 'block';
    formContainer.style.display = 'block';

    container.innerHTML = items.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${BACKEND_URL + item.menuItemImage || BACKEND_URL + '/images/menu/default.jpg'}" alt="${item.menuItemName}">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.menuItemName}</div>
                <div class="cart-item-price">${item.menuItemPrice} сом</div>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="changeQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="changeQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <button class="remove-item-btn" onclick="removeItem(${item.id})">
                    <i class="fas fa-trash"></i> Удалить
                </button>
                <div class="item-subtotal">${item.subtotal} сом</div>
            </div>
        </div>
    `).join('');

    document.getElementById('cart-total').textContent = `${total} сом`;
}

// Изменить количество
async function changeQuantity(cartId, newQuantity) {
    const token = localStorage.getItem('authToken');

    try {
        await fetch(BACKEND_URL + `/api/v2/Cart/${cartId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity: newQuantity })
        });

        loadCart();
    } catch (error) {
        alert('Ошибка обновления количества');
    }
}

// Удалить товар
async function removeItem(cartId) {
    const token = localStorage.getItem('authToken');

    try {
        await fetch(BACKEND_URL + `/api/v2/Cart/${cartId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        loadCart();
    } catch (error) {
        alert('Ошибка удаления товара');
    }
}

// Оформить заказ
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('authToken');
    const address = document.getElementById('orderAddress').value;
    const phone = document.getElementById('orderPhone').value;
    const comment = document.getElementById('orderComment').value;

    try {
        const response = await fetch(BACKEND_URL + '/api/v2/Orders/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                deliveryAddress: address,
                phone: phone,
                comment: comment
            })
        });

        const data = await response.json();

        if (data.success) {
            closeCart();
            document.getElementById('orderForm').reset();
        }
    } catch (error) {
        alert('Ошибка оформления заказа');
    }
});

// Очистить корзину
document.getElementById('clearCartBtn')?.addEventListener('click', async () => {
    if (!confirm('Очистить всю корзину?')) return;

    const token = localStorage.getItem('authToken');

    try {
        await fetch(BACKEND_URL + '/api/v2/Cart/clear', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        loadCart();
    } catch (error) {
        alert('Ошибка очистки корзины');
    }
});

// Инициализация
document.getElementById('close-cart-modal')?.addEventListener('click', closeCart);

// ===== СТРАНИЦА УСПЕШНОГО ЗАКАЗА =====

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login-register.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');

    if (!orderId) {
        // Нет orderId — показываем только успех без деталей
        document.getElementById('loading-state').style.display = 'none';
        return;
    }

    try {
        const res = await fetch(BACKEND_URL + `/api/v2/AdrianoCoffee/User/getOrderById/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Заказ не найден');
        const order = await res.json();

        renderOrder(order);

    } catch (e) {
        document.getElementById('loading-state').innerHTML =
            '<p style="color:#999;">Не удалось загрузить детали заказа</p>';
    }
});

function renderOrder(order) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('order-details').style.display = 'block';

    // Мета
    document.getElementById('order-number').textContent = '#' + order.id;
    document.getElementById('order-status').textContent = translateStatus(order.status);
    document.getElementById('order-date').textContent =
        new Date(order.createdAt).toLocaleString('ru-RU');

    // Адрес
    document.getElementById('order-address').textContent =
        order.deliveryAddress || 'Не указан';

    // Состав
    const itemsContainer = document.getElementById('order-items');
    itemsContainer.innerHTML = order.items.map(item => {
        const imgSrc = item.menuItemImage
            ? (item.menuItemImage.startsWith('http')
                ? item.menuItemImage
                : BACKEND_URL + item.menuItemImage)
            : BACKEND_URL + '/images/menu/default.jpg';
        return `
        <div class="order-item-row">
            <img src="${imgSrc}" alt="${item.menuItemName}" class="item-img">
            <div class="item-info">
                <span class="item-name">${item.menuItemName}</span>
                <span class="item-qty">× ${item.quantity}</span>
            </div>
            <span class="item-subtotal">${item.subtotal} сом</span>
        </div>`;
    }).join('');

    // Итого
    document.getElementById('order-total').textContent = order.totalPrice + ' сом';

    // Баллы использованы
    if (order.pointsUsed > 0) {
        document.getElementById('points-used-row').style.display = 'flex';
        document.getElementById('points-used-amount').textContent = '− ' + order.pointsUsed + ' сом';
    }

    // Сколько баллов начислится (5% от суммы)
    const willEarn = Math.floor(order.totalPrice * 0.05);
    if (willEarn > 0) {
        document.getElementById('bonus-earned-row').style.display = 'block';
        document.getElementById('bonus-earned-amount').textContent = willEarn;
    }
}

function translateStatus(status) {
    const map = {
        'PAID': '💳 Ожидает подтверждения',
        'CONFIRMED': '✅ Подтверждён',
        'PREPARING': '👨‍🍳 Готовится',
        'DELIVERING': '🚚 В пути',
        'DELIVERED': '🎉 Доставлен',
        'CANCELLED': '❌ Отменён'
    };
    return map[status] || status;
}
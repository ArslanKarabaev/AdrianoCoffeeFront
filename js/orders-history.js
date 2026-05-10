// ===== ИСТОРИЯ ЗАКАЗОВ =====

// Переключение вкладок
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    document.getElementById('tab-' + tab).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tab === 'orders') loadOrdersHistory();
}

// Загрузка истории заказов
async function loadOrdersHistory() {
    const token = localStorage.getItem('authToken');
    const container = document.getElementById('orders-history-container');

    container.innerHTML = `
        <div class="orders-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>${t('orders.loading')}</p>
        </div>`;

    try {
        const response = await fetch(BACKEND_URL + '/api/v2/Orders/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const orders = data.orders || [];

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="orders-empty">
                    <i class="fas fa-shopping-bag"></i>
                    <p>${t('orders.empty')}</p>
                    <a href="menuuser.html">${t('orders.go_to_menu')}</a>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="orders-history-list">
                ${orders.map(renderOrderCard).join('')}
            </div>`;

        document.querySelectorAll('.order-history-header').forEach(header => {
            header.addEventListener('click', () => {
                const body = header.nextElementSibling;
                body.classList.toggle('open');
                const icon = header.querySelector('.toggle-icon');
                if (icon) {
                    icon.style.transform = body.classList.contains('open')
                        ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            });
        });

    } catch (error) {
        container.innerHTML = `
            <div class="orders-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${t('orders.error')}</p>
            </div>`;
    }
}

function renderOrderCard(order) {
    const statusInfo = getOrderStatusInfo(order.status);
    const date = new Date(order.createdAt).toLocaleString('ru-RU');
    const notSpecified = t('orders.not_specified');

    const itemsHtml = order.items.map(item => {
        const imgSrc = item.menuItemImage
            ? (item.menuItemImage.startsWith('http')
                ? item.menuItemImage
                : BACKEND_URL + item.menuItemImage)
            : BACKEND_URL + '/images/menu/default.jpg';

        return `
        <div class="order-history-item">
            <div class="order-history-item-img">
                <img src="${imgSrc}" alt="${item.menuItemName}">
            </div>
            <div class="order-history-item-name">${item.menuItemName}</div>
            <div class="order-history-item-qty">×${item.quantity}</div>
            <div class="order-history-item-price">${item.subtotal} ${t('success.som')}</div>
        </div>`;
    }).join('');

    return `
    <div class="order-history-card">
        <div class="order-history-header">
            <div class="order-history-left">
                <div class="order-history-number">
                    ${statusInfo.emoji} ${t('orders.order')} #${order.id}
                </div>
                <div class="order-history-date">${date}</div>
            </div>
            <div class="order-history-right">
                <div class="order-history-total">${order.totalPrice} ${t('success.som')}</div>
                <span class="order-history-status history-status-${order.status}">
                    ${statusInfo.text}
                </span>
                <i class="fas fa-chevron-down toggle-icon"
                   style="color:#aaa;font-size:12px;transition:transform 0.2s;"></i>
            </div>
        </div>
        <div class="order-history-body">
            <div class="order-history-items">${itemsHtml}</div>
            <div class="order-history-meta">
                <div class="order-history-meta-item">
                    <span class="order-history-meta-label">${t('orders.address')}</span>
                    <span class="order-history-meta-value">
                        ${order.deliveryAddress || notSpecified}
                    </span>
                </div>
                <div class="order-history-meta-item">
                    <span class="order-history-meta-label">${t('orders.phone')}</span>
                    <span class="order-history-meta-value">
                        ${order.phone || notSpecified}
                    </span>
                </div>
                ${order.comment ? `
                <div class="order-history-meta-item">
                    <span class="order-history-meta-label">${t('orders.comment')}</span>
                    <span class="order-history-meta-value">${order.comment}</span>
                </div>` : ''}
            </div>
        </div>
    </div>`;
}

function getOrderStatusInfo(status) {
    const map = {
        'PAID':       { text: t('status.PAID.text'),       emoji: '💳' },
        'CONFIRMED':  { text: t('status.CONFIRMED.text'),  emoji: '✅' },
        'PREPARING':  { text: t('status.PREPARING.text'),  emoji: '👨‍🍳' },
        'DELIVERING': { text: t('status.DELIVERING.text'), emoji: '🚚' },
        'DELIVERED':  { text: t('status.DELIVERED.text'),  emoji: '🎉' },
        'CANCELLED':  { text: t('status.CANCELLED.text'),  emoji: '❌' },
    };
    return map[status] || { text: status, emoji: '📦' };
}
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== MANAGER ORDERS ЗАГРУЖЕН ===');

    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const BACKEND_URL = "https://adrianocoffee-backend.onrender.com";

    // Проверка авторизации и роли
    if (!token || (userRole !== 'MANAGER' && userRole !== 'manager' && userRole !== 'ADMIN' && userRole !== 'admin')) {
        alert('Доступ запрещён');
        window.location.href = 'login-register.html';
        return;
    }

    let allOrders = [];
    let currentFilter = 'ALL';

    loadOrders();

    document.getElementById('statusFilter').addEventListener('change', function(e) {
        currentFilter = e.target.value;
        renderOrders(filterOrders(allOrders, currentFilter));
    });

    document.getElementById('logout-button')?.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    function loadOrders() {
        showLoading();

        fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/Management/getAllOrders', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                if (!response.ok) throw new Error('Ошибка загрузки заказов');
                return response.json();
            })
            .then(data => {
                allOrders = data.orders || [];
                updateStatistics(allOrders);
                renderOrders(filterOrders(allOrders, currentFilter));
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showError('Не удалось загрузить заказы');
            });
    }

    function filterOrders(orders, status) {
        if (status === 'ALL') return orders;
        return orders.filter(order => order.status === status);
    }

    function updateStatistics(orders) {
        const pending = orders.filter(o => o.status === 'PENDING').length;
        const confirmed = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PREPARING').length;

        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('confirmedCount').textContent = confirmed;
        document.getElementById('totalCount').textContent = orders.length;
    }

    function renderOrders(orders) {
        const container = document.getElementById('orders-container');

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>Заказов нет</h3>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => createOrderCard(order)).join('');

        document.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showOrderDetails(btn.dataset.orderId);
            });
        });

        document.querySelectorAll('.order-card').forEach(card => {
            card.addEventListener('click', () => showOrderDetails(card.dataset.orderId));
        });
    }

    function createOrderCard(order) {
        const statusText = getStatusText(order.status);
        const date = new Date(order.createdAt).toLocaleString('ru-RU');

        const itemsPreview = order.items.slice(0, 3).map(item =>
            `<div class="item-preview"><i class="fas fa-utensils"></i> ${item.menuItemName} x${item.quantity}</div>`
        ).join('');

        const moreItems = order.items.length > 3 ? `<div class="item-preview">+${order.items.length - 3} ещё</div>` : '';

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div>
                        <div class="order-number">Заказ #${order.id}</div>
                        <div class="order-date">${date}</div>
                    </div>
                    <span class="order-status status-${order.status}">${statusText}</span>
                </div>
                <div class="order-info">
                    <div class="info-item"><span class="info-label">Гость</span><span class="info-value">${order.userFirstName} ${order.userSecondName}</span></div>
                    <div class="info-item"><span class="info-label">Телефон</span><span class="info-value">${order.phone || 'Не указан'}</span></div>
                    <div class="info-item"><span class="info-label">Адрес</span><span class="info-value">${order.deliveryAddress || 'Не указан'}</span></div>
                    <div class="info-item"><span class="info-label">Email</span><span class="info-value">${order.userEmail}</span></div>
                </div>
                <div class="order-items-preview">${itemsPreview}${moreItems}</div>
                <div class="order-footer">
                    <div class="order-total">Итого: ${order.totalPrice} сом</div>
                    <div class="order-actions">
                        <button class="btn-view-details" data-order-id="${order.id}"><i class="fas fa-eye"></i> Подробнее</button>
                    </div>
                </div>
            </div>
        `;
    }

    function showOrderDetails(orderId) {
        const order = allOrders.find(o => o.id == orderId);
        if (!order) return;

        const modal = document.getElementById('order-details-modal');
        const body = document.getElementById('order-details-body');
        const date = new Date(order.createdAt).toLocaleString('ru-RU');
        const statusText = getStatusText(order.status);

        const itemsHtml = order.items.map(item => `
            <div class="detail-item">
                <div class="detail-item-image"><img src="${BACKEND_URL + item.menuItemImage}" ...></div>
                <div class="detail-item-info">
                    <div class="detail-item-name">${item.menuItemName}</div>
                    <div class="detail-item-price">${item.menuItemPrice} сом × ${item.quantity}</div>
                </div>
                <div class="detail-item-subtotal">${item.subtotal} сом</div>
            </div>
        `).join('');

        body.innerHTML = `
            <div class="order-detail-header">
                <h2>Заказ #${order.id}</h2>
                <span class="order-status status-${order.status}">${statusText}</span>
            </div>
            <div class="detail-section">
                <h3>Информация о госте</h3>
                <div class="detail-grid">
                    <div class="info-item"><span class="info-label">Имя</span><span class="info-value">${order.userFirstName} ${order.userSecondName}</span></div>
                    <div class="info-item"><span class="info-label">Email</span><span class="info-value">${order.userEmail}</span></div>
                    <div class="info-item"><span class="info-label">Телефон</span><span class="info-value">${order.phone || 'Не указан'}</span></div>
                    <div class="info-item"><span class="info-label">Дата</span><span class="info-value">${date}</span></div>
                </div>
            </div>
            <div class="detail-section"><h3>Адрес доставки</h3><p>${order.deliveryAddress || 'Не указан'}</p></div>
            ${order.comment ? `<div class="detail-section"><h3>Комментарий</h3><p>${order.comment}</p></div>` : ''}
            <div class="detail-section"><h3>Состав заказа</h3><div class="order-items-detail">${itemsHtml}</div></div>
            <div class="detail-section"><h3>Итого: ${order.totalPrice} сом</h3></div>
            <div class="detail-section">
                <h3>Изменить статус</h3>
                <div class="status-change-form">
                    <select id="newStatus">
                        <option value="PENDING" ${order.status === 'PENDING' ? 'selected' : ''}>Ожидает</option>
                        <option value="CONFIRMED" ${order.status === 'CONFIRMED' ? 'selected' : ''}>Подтверждён</option>
                        <option value="PREPARING" ${order.status === 'PREPARING' ? 'selected' : ''}>Готовится</option>
                        <option value="READY" ${order.status === 'READY' ? 'selected' : ''}>Готов</option>
                        <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>Доставлен</option>
                        <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>Отменён</option>
                    </select>
                    <button onclick="updateOrderStatus(${order.id})"><i class="fas fa-save"></i> Сохранить</button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    window.updateOrderStatus = function(orderId) {
        const newStatus = document.getElementById('newStatus').value;

        fetch(BACKEND_URL + `/api/v2/AdrianoCoffee/Management/updateOrderStatus/${orderId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        })
            .then(response => {
                if (!response.ok) throw new Error('Ошибка обновления');
                return response.json();
            })
            .then(() => {
                document.getElementById('order-details-modal').style.display = 'none';
                loadOrders();
            })
            .catch(() => alert('Ошибка обновления'));
    };

    document.getElementById('close-order-modal')?.addEventListener('click', () => {
        document.getElementById('order-details-modal').style.display = 'none';
        document.body.style.overflow = '';
    });

    const modal = document.getElementById('order-details-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }

    function getStatusText(status) {
        const statuses = {
            'PENDING': 'Ожидает', 'CONFIRMED': 'Подтверждён', 'PREPARING': 'Готовится',
            'READY': 'Готов', 'DELIVERED': 'Доставлен', 'CANCELLED': 'Отменён'
        };
        return statuses[status] || status;
    }

    function showLoading() {
        document.getElementById('orders-container').innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Загрузка...</p></div>';
    }

    function showError(msg) {
        document.getElementById('orders-container').innerHTML = `<div class="empty-orders"><i class="fas fa-exclamation-triangle"></i><h3>Ошибка</h3><p>${msg}</p></div>`;
    }

    function logout() {
        localStorage.clear();
        window.location.href = 'login-register.html';
    }
});
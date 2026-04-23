document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    if (!token || (userRole !== 'MANAGER' && userRole !== 'manager' &&
                   userRole !== 'ADMIN' && userRole !== 'admin')) {
        alert('Доступ запрещён');
        window.location.href = 'login-register.html';
        return;
    }

    let allOrders = [];
    let currentFilter = 'ALL';

    loadOrders();

    document.getElementById('statusFilter')?.addEventListener('change', function(e) {
        currentFilter = e.target.value;
        renderOrders(filterOrders(allOrders, currentFilter));
    });

    document.getElementById('logout-button')?.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login-register.html';
    });

    // ───── ЗАГРУЗКА ────────────────────────────
    function loadOrders() {
        showLoading();
        fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/Management/getAllOrders', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => { if (!r.ok) throw new Error('Ошибка загрузки'); return r.json(); })
            .then(data => {
                allOrders = data.orders || [];
                updateStatistics(allOrders);
                renderOrders(filterOrders(allOrders, currentFilter));
            })
            .catch(() => showError('Не удалось загрузить заказы'));
    }

    function filterOrders(orders, status) {
        if (status === 'ALL') return orders;
        return orders.filter(o => o.status === status);
    }

    function updateStatistics(orders) {
        document.getElementById('pendingCount').textContent =
            orders.filter(o => o.status === 'PAID').length;
        document.getElementById('confirmedCount').textContent =
            orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PREPARING').length;
        document.getElementById('totalCount').textContent = orders.length;
    }

    // ───── ОТРИСОВКА КАРТОЧЕК ──────────────────
    function renderOrders(orders) {
        const container = document.getElementById('orders-container');

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>Заказов нет</h3>
                    <p>Пока нет заказов для отображения</p>
                </div>`;
            return;
        }

        container.innerHTML = orders.map(createOrderCard).join('');

        document.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                showOrderDetails(btn.dataset.orderId);
            });
        });

        document.querySelectorAll('.order-card').forEach(card => {
            card.addEventListener('click', () => showOrderDetails(card.dataset.orderId));
        });
    }

    function createOrderCard(order) {
        const statusInfo = getStatusInfo(order.status);
        const date = new Date(order.createdAt).toLocaleString('ru-RU');

        const itemsPreview = order.items.slice(0, 3).map(item =>
            `<div class="item-preview">
                <i class="fas fa-utensils"></i>
                ${item.menuItemName} ×${item.quantity}
            </div>`
        ).join('');
        const moreItems = order.items.length > 3
            ? `<div class="item-preview">+${order.items.length - 3} ещё</div>` : '';

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div>
                        <div class="order-number">Заказ #${order.id}</div>
                        <div class="order-date">${date}</div>
                    </div>
                    <span class="order-status status-${order.status}">
                        ${statusInfo.emoji} ${statusInfo.text}
                    </span>
                </div>
                <div class="order-info">
                    <div class="info-item">
                        <span class="info-label">Гость</span>
                        <span class="info-value">${order.userFirstName} ${order.userSecondName}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Телефон</span>
                        <span class="info-value">${order.phone || 'Не указан'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Адрес</span>
                        <span class="info-value">${order.deliveryAddress || 'Не указан'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email</span>
                        <span class="info-value">${order.userEmail}</span>
                    </div>
                </div>
                <div class="order-items-preview">${itemsPreview}${moreItems}</div>
                <div class="order-footer">
                    <div class="order-total">${order.totalPrice} сом</div>
                    <button class="btn-view-details" data-order-id="${order.id}">
                        <i class="fas fa-eye"></i> Подробнее
                    </button>
                </div>
            </div>`;
    }

    // ───── ДЕТАЛИ ЗАКАЗА ───────────────────────
    function showOrderDetails(orderId) {
        const order = allOrders.find(o => o.id == orderId);
        if (!order) return;

        const modal = document.getElementById('order-details-modal');
        const body = document.getElementById('order-details-body');
        const statusInfo = getStatusInfo(order.status);
        const date = new Date(order.createdAt).toLocaleString('ru-RU');

        const itemsHtml = order.items.map(item => {
            const imgSrc = item.menuItemImage
                ? (item.menuItemImage.startsWith('http')
                    ? item.menuItemImage
                    : BACKEND_URL + item.menuItemImage)
                : BACKEND_URL + '/images/menu/default.jpg';
            return `
            <div class="detail-item">
                <div class="detail-item-image"><img src="${imgSrc}" alt="${item.menuItemName}"></div>
                <div class="detail-item-info">
                    <div class="detail-item-name">${item.menuItemName}</div>
                    <div class="detail-item-price">${item.menuItemPrice} сом × ${item.quantity}</div>
                </div>
                <div class="detail-item-subtotal">${item.subtotal} сом</div>
            </div>`;
        }).join('');

        body.innerHTML = `
            <div class="order-detail-header">
                <h2>Заказ #${order.id}</h2>
                <span class="order-status status-${order.status}">
                    ${statusInfo.emoji} ${statusInfo.text}
                </span>
            </div>

            ${buildProgressBar(order.status)}

            <div class="detail-section">
                <h3>Информация о госте</h3>
                <div class="detail-grid">
                    <div class="info-item">
                        <span class="info-label">Имя</span>
                        <span class="info-value">${order.userFirstName} ${order.userSecondName}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email</span>
                        <span class="info-value">${order.userEmail}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Телефон</span>
                        <span class="info-value">${order.phone || 'Не указан'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Дата</span>
                        <span class="info-value">${date}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>Адрес доставки</h3>
                <p>${order.deliveryAddress || 'Не указан'}</p>
            </div>

            ${order.comment ? `
                <div class="detail-section">
                    <h3>Комментарий</h3>
                    <p>${order.comment}</p>
                </div>` : ''}

            <div class="detail-section">
                <h3>Состав заказа</h3>
                <div class="order-items-detail">${itemsHtml}</div>
            </div>

            <div class="detail-section">
                <strong style="font-size:18px;color:#610303;">Итого: ${order.totalPrice} сом</strong>
            </div>

            ${buildStatusActions(order)}
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // ───── ПРОГРЕСС-БАР ────────────────────────
    function buildProgressBar(currentStatus) {
        if (currentStatus === 'CANCELLED') return '';

        const steps = [
            { status: 'PAID',       emoji: '💳', label: 'Оплачен' },
            { status: 'CONFIRMED',  emoji: '✅', label: 'Подтверждён' },
            { status: 'PREPARING',  emoji: '👨‍🍳', label: 'Готовится' },
            { status: 'DELIVERING', emoji: '🚚', label: 'Курьер' },
            { status: 'DELIVERED',  emoji: '🎉', label: 'Доставлен' },
        ];

        const currentIndex = steps.findIndex(s => s.status === currentStatus);

        const stepsHtml = steps.map((step, i) => {
            let dotClass = '';
            let labelClass = '';
            if (i < currentIndex) { dotClass = 'done'; labelClass = 'done'; }
            else if (i === currentIndex) { dotClass = 'active'; labelClass = 'active'; }
            return `
            <div class="progress-step">
                <div class="progress-dot ${dotClass}">${step.emoji}</div>
                <div class="progress-label ${labelClass}">${step.label}</div>
            </div>`;
        }).join('');

        return `
            <div class="detail-section">
                <div class="order-progress">${stepsHtml}</div>
            </div>`;
    }

    // ───── КНОПКИ ДЕЙСТВИЙ ─────────────────────
        function buildStatusActions(order) {
        const nextStatus = getNextStatus(order.status);
        const isFinal = order.status === 'DELIVERED' || order.status === 'CANCELLED';   

        if (isFinal) {
            return `
                <div class="detail-section">
                    <div class="status-final-message">
                        <i class="fas fa-check-circle"></i>
                        Заказ завершён — дальнейшие действия недоступны
                    </div>
                </div>`;
        }

        const currentInfo = getStatusInfo(order.status); // ← было nextStatus

        let html = `<div class="detail-section"><h3>Действия</h3><div class="status-actions">`;

        html += `
            <button class="btn-status-change btn-confirm"
                    onclick="changeOrderStatus(${order.id}, '${nextStatus}')">
                ${currentInfo.actionText}
            </button>`;

        if (order.status === 'PAID') {
            html += `<hr class="status-actions-divider">`;
            html += `
                <button class="btn-status-change btn-cancel"
                        onclick="cancelOrderWithRefund(${order.id})">
                    <i class="fas fa-times-circle"></i> Отменить и вернуть деньги
                </button>`;
        }

        html += `</div></div>`;
        return html;
    }
    
    // ───── ГЛОБАЛЬНЫЕ ФУНКЦИИ ──────────────────
    window.changeOrderStatus = function(orderId, newStatus) {
        const info = getStatusInfo(newStatus);
        if (!confirm(`Изменить статус заказа #${orderId} на "${info.text}"?`)) return;

        fetch(BACKEND_URL + `/api/v2/AdrianoCoffee/Management/updateOrderStatus/${orderId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('order-details-modal').style.display = 'none';
                    document.body.style.overflow = '';
                    loadOrders();
                } else {
                    alert('Ошибка: ' + data.message);
                }
            })
            .catch(() => alert('Ошибка обновления статуса'));
    };

    window.cancelOrderWithRefund = function(orderId) {
        if (!confirm(`Отменить заказ #${orderId} и вернуть деньги клиенту?`)) return;

        fetch(BACKEND_URL + `/api/v2/Payment/refund/${orderId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('order-details-modal').style.display = 'none';
                    document.body.style.overflow = '';
                    loadOrders();
                    alert('Заказ отменён. Возврат будет зачислен в течение 5-10 рабочих дней.');
                } else {
                    alert('Ошибка возврата: ' + data.message);
                }
            })
            .catch(() => alert('Ошибка отмены заказа'));
    };

    // ───── ВСПОМОГАТЕЛЬНЫЕ ─────────────────────
    function getStatusInfo(status) {
        const map = {
            'PAID':       { text: 'Оплачен',        emoji: '💳', actionText: '✅ Подтвердить заказ' },
            'CONFIRMED':  { text: 'Подтверждён',     emoji: '✅', actionText: '👨‍🍳 Начать готовить' },
            'PREPARING':  { text: 'Готовится',       emoji: '👨‍🍳', actionText: '🚚 Передать курьеру' },
            'DELIVERING': { text: 'Передан курьеру', emoji: '🚚', actionText: '🎉 Отметить доставленным' },
            'DELIVERED':  { text: 'Доставлен',       emoji: '🎉', actionText: null },
            'CANCELLED':  { text: 'Отменён',         emoji: '❌', actionText: null },
        };
        return map[status] || { text: status, emoji: '📦', actionText: null };
    }

    function getNextStatus(current) {
        const map = {
            'PAID': 'CONFIRMED', 'CONFIRMED': 'PREPARING',
            'PREPARING': 'DELIVERING', 'DELIVERING': 'DELIVERED'
        };
        return map[current] || null;
    }

    function showLoading() {
        document.getElementById('orders-container').innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Загрузка заказов...</p>
            </div>`;
    }

    function showError(msg) {
        document.getElementById('orders-container').innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка</h3><p>${msg}</p>
            </div>`;
    }

    document.getElementById('close-order-modal')?.addEventListener('click', () => {
        document.getElementById('order-details-modal').style.display = 'none';
        document.body.style.overflow = '';
    });

    document.getElementById('order-details-modal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
});
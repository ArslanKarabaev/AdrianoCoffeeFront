// ===== СТАТИСТИКА АДМИН-ПАНЕЛИ =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== СТАТИСТИКА ЗАГРУЖЕНА ===');

    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    


    // Проверка авторизации и роли
    if (!token || (userRole !== 'ADMIN' && userRole !== 'admin')) {
        alert('Доступ запрещён');
        window.location.href = 'login-register.html';
        return;
    }

    // Глобальные переменные для графиков
    let categoryOrdersChart = null;
    let categoryRevenueChart = null;
    let ordersByHourChart = null;
    let ordersByDayChart = null;
    let ordersByMonthChart = null;

    // Загрузка статистики по умолчанию (30 дней)
    loadStatistics(30);

    // Обработчик выбора периода
    document.getElementById('periodSelect').addEventListener('change', function(e) {
        const period = e.target.value;
        
        if (period === 'custom') {
            document.getElementById('customDateRange').style.display = 'flex';
        } else {
            document.getElementById('customDateRange').style.display = 'none';
            loadStatistics(parseInt(period));
        }
    });

    // Обработчик кнопки применения своего периода
    document.getElementById('applyDates')?.addEventListener('click', function() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            alert('Выберите начальную и конечную даты');
            return;
        }
        
        loadStatistics(null, startDate, endDate);
    });

    // Обработчик выхода
    document.getElementById('logout-button')?.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login-register.html';
    });

    /**
     * Загрузить статистику
     */
    function loadStatistics(days, startDate = null, endDate = null) {
        showLoading();
        
        let url = `${BACKEND_URL}/api/v2/AdrianoCoffee/Admin/statistics/dashboard`;
        
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        } else if (days) {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - days);
            
            url += `?startDate=${formatDate(start)}&endDate=${formatDate(end)}`;
        }
        
        fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка загрузки статистики');
            return response.json();
        })
        .then(response => {
            console.log('Statistics loaded:', response);
            
            if (response.success && response.data) {
                renderStatistics(response.data);
            } else {
                showError('Не удалось загрузить статистику');
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showError('Не удалось загрузить статистику');
        });
    }

    /**
     * Отрисовать статистику
     */
    function renderStatistics(data) {
        // 1. Общая статистика
        document.getElementById('totalOrders').textContent = data.totalOrders || 0;
        document.getElementById('totalRevenue').textContent = formatMoney(data.totalRevenue || 0);
        document.getElementById('averageCheck').textContent = formatMoney(data.averageCheck || 0);
        document.getElementById('activeUsers').textContent = data.activeUsers || 0;

        // Бонусная статистика
        const bonusBlock = document.getElementById('bonusStatsBlock');
        if (bonusBlock) {
            document.getElementById('totalBonusUsed').textContent =
                (data.totalBonusPointsUsed || 0) + ' баллов';
            document.getElementById('ordersWithBonus').textContent =
                (data.ordersWithBonus || 0) + ' заказов';
        }
        
        // 2. Топ блюд
        renderTopDishes(data.topDishes, data.mostPopular, data.mostProfitable);
        
        // 3. Статистика по категориям
        renderCategoryStats(data.categoryStats);
        
        // 4. Статистика по времени
        renderTimeAnalysis(data.ordersByHour, data.ordersByDayOfWeek, data.ordersByMonth);
        
        hideLoading();
    }

    /**
     * Отрисовать топ блюд
     */
    function renderTopDishes(topDishes, mostPopular, mostProfitable) {
        // Самое популярное
        const popularContainer = document.getElementById('mostPopular');
        if (mostPopular) {
            popularContainer.innerHTML = `
                ${mostPopular.imageUrl ? `<img src="${BACKEND_URL}${mostPopular.imageUrl}" alt="${mostPopular.name}">` : ''}
                <h5>${mostPopular.name}</h5>
                <p><strong>Категория:</strong> ${translateCategory(mostPopular.category)}</p>
                <p><strong>Заказано раз:</strong> ${mostPopular.timesOrdered}</p>
                <p><strong>Всего штук:</strong> ${mostPopular.totalQuantity}</p>
                <p><strong>Выручка:</strong> ${formatMoney(mostPopular.totalRevenue)}</p>
            `;
        } else {
            popularContainer.innerHTML = '<p class="no-data">Нет данных</p>';
        }
        
        // Самое прибыльное
        const profitableContainer = document.getElementById('mostProfitable');
        if (mostProfitable) {
            profitableContainer.innerHTML = `
                ${mostProfitable.imageUrl ? `<img src="${BACKEND_URL}${mostProfitable.imageUrl}" alt="${mostProfitable.name}">` : ''}
                <h5>${mostProfitable.name}</h5>
                <p><strong>Категория:</strong> ${translateCategory(mostProfitable.category)}</p>
                <p><strong>Заказано раз:</strong> ${mostProfitable.timesOrdered}</p>
                <p><strong>Всего штук:</strong> ${mostProfitable.totalQuantity}</p>
                <p><strong>Выручка:</strong> ${formatMoney(mostProfitable.totalRevenue)}</p>
            `;
        } else {
            profitableContainer.innerHTML = '<p class="no-data">Нет данных</p>';
        }
        
        // Таблица топ-10
        const tbody = document.getElementById('topDishesBody');
        if (topDishes && topDishes.length > 0) {
            tbody.innerHTML = topDishes.map((dish, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${dish.name}</td>
                    <td><span class="category-badge category-${dish.category}">${translateCategory(dish.category)}</span></td>
                    <td>${dish.timesOrdered}</td>
                    <td>${dish.totalQuantity}</td>
                    <td>${formatMoney(dish.totalRevenue)}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">Нет данных</td></tr>';
        }
    }

    /**
     * Отрисовать статистику по категориям
     */
    function renderCategoryStats(categoryStats) {
        if (!categoryStats || categoryStats.length === 0) {
            document.getElementById('categoryStatsBody').innerHTML = 
                '<tr><td colspan="5" class="no-data">Нет данных</td></tr>';
            return;
        }
        
        // Таблица
        const tbody = document.getElementById('categoryStatsBody');
        tbody.innerHTML = categoryStats.map(cat => `
            <tr>
                <td><span class="category-badge category-${cat.category}">${translateCategory(cat.category)}</span></td>
                <td>${cat.ordersCount}</td>
                <td>${cat.totalQuantity}</td>
                <td>${formatMoney(cat.totalRevenue)}</td>
                <td>${formatMoney(cat.averageCheck)}</td>
            </tr>
        `).join('');
        
        // График - количество заказов
        const categories = categoryStats.map(c => translateCategory(c.category));
        const orderCounts = categoryStats.map(c => c.ordersCount);
        const revenues = categoryStats.map(c => c.totalRevenue);
        
        // Уничтожаем старые графики
        if (categoryOrdersChart) categoryOrdersChart.destroy();
        if (categoryRevenueChart) categoryRevenueChart.destroy();
        
        // График заказов
        const ctxOrders = document.getElementById('categoryOrdersChart').getContext('2d');
        categoryOrdersChart = new Chart(ctxOrders, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Количество заказов',
                    data: orderCounts,
                    backgroundColor: 'rgba(97, 3, 3, 0.7)',
                    borderColor: 'rgba(97, 3, 3, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Заказы по категориям'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // График выручки
        const ctxRevenue = document.getElementById('categoryRevenueChart').getContext('2d');
        categoryRevenueChart = new Chart(ctxRevenue, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Выручка',
                    data: revenues,
                    backgroundColor: [
                        '#610303', '#8b0000', '#a52a2a', '#cd5c5c',
                        '#f08080', '#fa8072', '#e9967a', '#ffa07a',
                        '#ff6347', '#ff4500'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Выручка по категориям'
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    /**
     * Отрисовать статистику по времени
     */
    function renderTimeAnalysis(ordersByHour, ordersByDay, ordersByMonth) {
        // Уничтожаем старые графики
        if (ordersByHourChart) ordersByHourChart.destroy();
        if (ordersByDayChart) ordersByDayChart.destroy();
        if (ordersByMonthChart) ordersByMonthChart.destroy();
        
        // График по часам
        if (ordersByHour) {
            const hours = Object.keys(ordersByHour).map(h => `${h}:00`);
            const counts = Object.values(ordersByHour);
            
            const ctxHour = document.getElementById('ordersByHourChart').getContext('2d');
            ordersByHourChart = new Chart(ctxHour, {
                type: 'line',
                data: {
                    labels: hours,
                    datasets: [{
                        label: 'Количество заказов',
                        data: counts,
                        borderColor: '#610303',
                        backgroundColor: 'rgba(97, 3, 3, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        // График по дням недели
        if (ordersByDay) {
            const days = Object.keys(ordersByDay);
            const counts = Object.values(ordersByDay);
            
            const ctxDay = document.getElementById('ordersByDayChart').getContext('2d');
            ordersByDayChart = new Chart(ctxDay, {
                type: 'bar',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'Количество заказов',
                        data: counts,
                        backgroundColor: 'rgba(97, 3, 3, 0.7)',
                        borderColor: 'rgba(97, 3, 3, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        // График по месяцам (показываем только если есть данные за несколько месяцев)
        if (ordersByMonth && Object.keys(ordersByMonth).length > 1) {
            document.getElementById('monthlyChartContainer').style.display = 'block';
            
            const months = Object.keys(ordersByMonth);
            const counts = Object.values(ordersByMonth);
            
            const ctxMonth = document.getElementById('ordersByMonthChart').getContext('2d');
            ordersByMonthChart = new Chart(ctxMonth, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Количество заказов',
                        data: counts,
                        borderColor: '#610303',
                        backgroundColor: 'rgba(97, 3, 3, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } else {
            document.getElementById('monthlyChartContainer').style.display = 'none';
        }
    }

    // Вспомогательные функции
    
    function formatMoney(amount) {
        return new Intl.NumberFormat('ru-RU').format(Math.round(amount)) + ' сом';
    }
    
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    function translateCategory(category) {
        const translations = {
            'COFFEE': 'Кофе',
            'BREAKFAST': 'Завтраки',
            'SALADS': 'Салаты',
            'SOUPS': 'Супы',
            'PASTAS': 'Паста',
            'HOTDISHES': 'Горячие блюда',
            'BOWLS': 'Боулы',
            'DESSERTS': 'Десерты',
            'TEAS': 'Чаи',
            'DRINKS': 'Напитки'
        };
        return translations[category] || category;
    }
    
    function showLoading() {
        document.querySelectorAll('.stat-value').forEach(el => {
            el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        });
    }
    
    function hideLoading() {
        // Загрузка скрыта автоматически при заполнении данных
    }
    
    function showError(message) {
        alert(message);
        hideLoading();
    }
});

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    window.location.href = 'login-register.html';
}

// logout-button может отсутствовать на этой странице
document.getElementById('logout-button')?.addEventListener('click', function (event) {
    event.preventDefault();
    logout();
});
// ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ С ФИЛЬТРАЦИЕЙ И ПОИСКОМ =====

// Глобальные переменные для фильтрации
let allUsers = []; // Все пользователи из базы
let filteredUsers = []; // Отфильтрованные пользователи
const BACKEND_URL = "https://adrianocoffee-backend.onrender.com";


// Инициализация обработчиков
function initUsersManagement(token) {
    console.log('=== ИНИЦИАЛИЗАЦИЯ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ ===');

    // Загружаем всех пользователей
    loadAllUsers(token);

    // Обработчик поиска
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', () => performSearch(token));
    }

    // Обработчик сброса
    const clearSearchButton = document.getElementById('clearSearchButton');
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', () => {
            document.getElementById('searchFirstName').value = '';
            document.getElementById('searchSecondName').value = '';
            loadAllUsers(token);
        });
    }

    // Обработчики фильтров статуса
    const filterActive = document.getElementById('filterActive');
    const filterInactive = document.getElementById('filterInactive');

    if (filterActive) {
        filterActive.addEventListener('change', () => applyFilters());
    }

    if (filterInactive) {
        filterInactive.addEventListener('change', () => applyFilters());
    }

    // Поиск по Enter
    const searchInputs = [
        document.getElementById('searchFirstName'),
        document.getElementById('searchSecondName')
    ];

    searchInputs.forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    performSearch(token);
                }
            });
        }
    });
}

// Загрузка всех пользователей
function loadAllUsers(token) {
    console.log('=== ЗАГРУЗКА ВСЕХ ПОЛЬЗОВАТЕЛЕЙ ===');

    showLoadingState();

    fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/Admin/getAllUsers', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            console.log('Get users response status:', response.status);
            if (!response.ok) {
                throw new Error('Ошибка при загрузке пользователей');
            }
            return response.json();
        })
        .then(data => {
            console.log('Get users response:', data);

            // Сохраняем всех пользователей
            allUsers = data.users || data || [];
            console.log('Загружено пользователей:', allUsers.length);

            // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ПЕРВОГО ПОЛЬЗОВАТЕЛЯ
            if (allUsers.length > 0) {
                console.log('=== ПРИМЕР ПОЛЬЗОВАТЕЛЯ ===');
                console.log('Весь объект:', allUsers[0]);
                console.log('Status поле:', allUsers[0].status);
                console.log('Тип status:', typeof allUsers[0].status);
                console.log('status === true:', allUsers[0].status === true);
                console.log('status === "true":', allUsers[0].status === 'true');
                console.log('status === 1:', allUsers[0].status === 1);
                console.log('===============================');
            }

            // Применяем фильтры
            applyFilters();
        })
        .catch(error => {
            console.error('Ошибка при загрузке пользователей:', error);
            showErrorState('Не удалось загрузить список пользователей');
        });
}

// Поиск пользователей по имени/фамилии
function performSearch(token) {
    const firstName = document.getElementById('searchFirstName').value.trim();
    const secondName = document.getElementById('searchSecondName').value.trim();

    console.log('=== ПОИСК ПОЛЬЗОВАТЕЛЕЙ ===');
    console.log('First Name:', firstName);
    console.log('Second Name:', secondName);

    // Если оба поля пустые, загружаем всех
    if (!firstName && !secondName) {
        loadAllUsers(token);
        return;
    }

    showLoadingState();

    // Формируем URL с параметрами
    const params = new URLSearchParams();
    if (firstName) params.append('firstName', firstName);
    if (secondName) params.append('secondName', secondName);

    fetch(BACKEND_URL + `/api/v2/AdrianoCoffee/Admin/getUserByName?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            console.log('Search response status:', response.status);
            if (!response.ok) {
                throw new Error('Пользователь не найден');
            }
            return response.json();
        })
        .then(data => {
            console.log('Search response:', data);

            // Если вернулся один пользователь, оборачиваем в массив
            allUsers = Array.isArray(data) ? data : [data];
            console.log('Найдено пользователей:', allUsers.length);

            // Применяем фильтры
            applyFilters();
        })
        .catch(error => {
            console.error('Ошибка поиска:', error);
            showErrorState('Пользователь не найден. Попробуйте другие параметры поиска.');
        });
}

// Применение фильтров по статусу
function applyFilters() {
    console.log('=== ПРИМЕНЕНИЕ ФИЛЬТРОВ ===');

    const showActive = document.getElementById('filterActive').checked;
    const showInactive = document.getElementById('filterInactive').checked;

    console.log('Show Active:', showActive);
    console.log('Show Inactive:', showInactive);

    // Фильтруем пользователей по статусу
    filteredUsers = allUsers.filter(user => {
        // Улучшенная проверка статуса
        const isActive = user.status === true || user.status === 'true' || user.status === 1;

        if (showActive && showInactive) {
            return true; // Показываем всех
        } else if (showActive) {
            return isActive; // Только активные
        } else if (showInactive) {
            return !isActive; // Только неактивные
        } else {
            return false; // Ничего не показываем
        }
    });

    console.log('Отфильтровано пользователей:', filteredUsers.length);

    // Отображаем пользователей
    renderUsers(filteredUsers);
    updateStatistics();
}

// Отрисовка пользователей в таблице
function renderUsers(users) {
    const usersTableBody = document.querySelector('#usersTable tbody');

    if (!usersTableBody) {
        console.error('ОШИБКА: Таблица пользователей не найдена');
        return;
    }

    // Очищаем таблицу
    usersTableBody.innerHTML = '';

    // Если пользователей нет
    if (users.length === 0) {
        showEmptyState();
        return;
    }

    // Отрисовываем каждого пользователя
    users.forEach(user => {
        const row = createUserRow(user);
        usersTableBody.appendChild(row);
    });

    console.log('✓ Таблица пользователей отрисована');
}

// Создание строки пользователя
function createUserRow(user) {
    const row = document.createElement('tr');

    // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ
    console.log('=== ПРОВЕРКА СТАТУСА ПОЛЬЗОВАТЕЛЯ ===');
    console.log('User ID:', user.user_id);
    console.log('User object:', user);
    console.log('Status field:', user.status);
    console.log('Type of status:', typeof user.status);
    console.log('Status === true:', user.status === true);
    console.log('Status === "true":', user.status === 'true');
    console.log('Status === 1:', user.status === 1);

    // Улучшенная проверка статуса
    const isActive = (
        user.status === true ||
        user.status === 'true' ||
        user.status === 1 ||
        user.status === '1' ||
        user.active === true ||
        user.active === 'true' ||
        user.isActive === true ||
        user.isActive === 'true'
    );

    console.log('Final isActive:', isActive);
    console.log('=====================================');

    // Добавляем класс для неактивных пользователей
    if (!isActive) {
        row.classList.add('inactive-user');
    }

    row.id = `user-${user.user_id}`;
    row.dataset.userId = user.user_id;
    row.dataset.status = isActive;

    // Статус бейдж
    const statusBadge = isActive
        ? '<span class="status-badge active"><i class="fas fa-check-circle"></i> Активен</span>'
        : '<span class="status-badge inactive"><i class="fas fa-times-circle"></i> Неактивен</span>';

    // Кнопки действий
    const toggleButton = isActive
        ? '<button class="btn-toggle-status" data-user-id="' + user.user_id + '" data-action="deactivate"><i class="fas fa-ban"></i> Деактивировать</button>'
        : '<button class="btn-toggle-status" data-user-id="' + user.user_id + '" data-action="activate"><i class="fas fa-check"></i> Активировать</button>';

    row.innerHTML = `
        <td>${user.user_id}</td>
        <td>${user.firstName || ''}</td>
        <td>${user.secondName || ''}</td>
        <td>${user.email || ''}</td>
        <td>${user.mobNum || user.phone || ''}</td>
        <td>${user.dateOfBirth || user.birthday || ''}</td>
        <td>${statusBadge}</td>
        <td>
            <div class="action-buttons">
                ${toggleButton}
            </div>
        </td>
    `;

    return row;
}

// Обновление статистики
function updateStatistics() {
    const activeUsers = allUsers.filter(u => u.status === true || u.status === 'true' || u.status === 1);
    const inactiveUsers = allUsers.filter(u => !(u.status === true || u.status === 'true' || u.status === 1));

    const usersCountEl = document.getElementById('usersCount');
    const activeCountEl = document.getElementById('activeCount');
    const inactiveCountEl = document.getElementById('inactiveCount');

    if (usersCountEl) {
        usersCountEl.innerHTML = `<i class="fas fa-users"></i> Показано: <strong>${filteredUsers.length}</strong>`;
    }

    if (activeCountEl) {
        activeCountEl.innerHTML = `<i class="fas fa-check"></i> Активных: <strong>${activeUsers.length}</strong>`;
    }

    if (inactiveCountEl) {
        inactiveCountEl.innerHTML = `<i class="fas fa-ban"></i> Неактивных: <strong>${inactiveUsers.length}</strong>`;
    }
}

// Переключение статуса пользователя
function toggleUserStatus(userId, action, token) {
    const actionText = action === 'activate' ? 'активировать' : 'деактивировать';

    if (!confirm(`Вы уверены, что хотите ${actionText} этого пользователя?`)) {
        return;
    }

    console.log(`${action} пользователя:`, userId);

    // Выбираем правильный endpoint в зависимости от действия
    const url = action === 'activate'
        ? BACKEND_URL + `/api/v2/AdrianoCoffee/Admin/restoreUser/${userId}`
        : BACKEND_URL + `/api/v2/AdrianoCoffee/Admin/deleteUser/${userId}`;

    const method = action === 'activate' ? 'PUT' : 'DELETE';

    console.log('Request URL:', url);
    console.log('Request method:', method);

    fetch(url, {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('Toggle status response:', response.status);
            if (!response.ok) {
                throw new Error('Ошибка при изменении статуса');
            }
            return response.json();
        })
        .then(data => {
            console.log('Toggle status response:', data);

            loadAllUsers(token);

            const successMessage = action === 'activate'
                ? 'Пользователь успешно активирован'
                : 'Пользователь успешно деактивирован';

            alert(successMessage);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Ошибка при изменении статуса пользователя');
        });
}

// Состояния UI
function showLoadingState() {
    const usersTableBody = document.querySelector('#usersTable tbody');
    if (usersTableBody) {
        usersTableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #3498db;"></i>
                    <p style="margin-top: 10px; color: #7f8c8d;">Загрузка данных...</p>
                </td>
            </tr>
        `;
    }
}

function showEmptyState() {
    const usersTableBody = document.querySelector('#usersTable tbody');
    if (usersTableBody) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-user-slash"></i>
                    <h4>Пользователи не найдены</h4>
                    <p>Попробуйте изменить параметры поиска или фильтры</p>
                </td>
            </tr>
        `;
    }
}

function showErrorState(message) {
    const usersTableBody = document.querySelector('#usersTable tbody');
    if (usersTableBody) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <h4>Ошибка загрузки</h4>
                    <p>${message}</p>
                </td>
            </tr>
        `;
    }
}

// Инициализация обработчиков для кнопок переключения статуса
function initToggleStatusHandlers(token) {
    const usersTable = document.getElementById('usersTable');
    if (usersTable) {
        usersTable.addEventListener('click', function(event) {
            if (event.target.classList.contains('btn-toggle-status') ||
                event.target.closest('.btn-toggle-status')) {

                const button = event.target.classList.contains('btn-toggle-status')
                    ? event.target
                    : event.target.closest('.btn-toggle-status');

                const userId = button.dataset.userId;
                const action = button.dataset.action;

                toggleUserStatus(userId, action, token);
            }
        });
    }
}
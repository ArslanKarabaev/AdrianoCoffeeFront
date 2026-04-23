// ===== УНИВЕРСАЛЬНЫЙ ЗАГРУЗЧИК МЕНЮ =====

const API_URL = BACKEND_URL + '/api/v2/AdrianoCoffee/Menu/getAllMenu';
let allMenuItems = [];

function getUserRole() {
    return localStorage.getItem('userRole') || 'GUEST';
}

function isAuthenticated() {
    return !!localStorage.getItem('authToken');
}

async function fetchAndRenderMenu() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

        const menuItems = await response.json();
        console.log('Загружено блюд:', menuItems.length);

        allMenuItems = menuItems;
        allMenuItems.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        renderMenu(allMenuItems);
        initSearch();
        initCategoryFilter();

        

        menuItems.forEach(item => {
            const container = document.getElementById(`container-${item.category}`);
            if (container) {
                container.appendChild(createDishCard(item, userRole));
            }
        });

        if (userRole === 'ADMIN' || userRole === 'admin' || userRole === 'MANAGER') {
            initAdminHandlers();
        }
    } catch (error) {
        console.error("Ошибка загрузки меню:", error);
    }
}

function createDishCard(item, userRole) {
    const div = document.createElement('div');
    div.className = 'dish-item';
    div.dataset.dishId = item.id;

    let buttons = '';
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
        buttons = `
            <div class="admin-buttons">
                <button class="edit-btn" data-id="${item.id}">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="delete-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `;
    } else if (isAuthenticated()) {
        buttons = `<button class="add-to-cart-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
            <i class="fas fa-shopping-cart"></i> Добавить в корзину
        </button>`;
    } else {
        buttons = `<button class="add-to-cart-btn guest" onclick="promptLogin()">
            <i class="fas fa-shopping-cart"></i> Добавить в корзину
        </button>`;
    }

    const imgSrc = item.imageUrl
        ? (item.imageUrl.startsWith('http') ? item.imageUrl : BACKEND_URL + item.imageUrl)
        : BACKEND_URL + '/images/menu/default.jpg';

    div.innerHTML = `
        <img src="${imgSrc}" alt="${item.name}">
        <div class="dish-info">
            <div class="name-and-gr">
                <h3>${item.name}</h3>
                <p class="volume">${item.volume || ''}</p>
            </div>
            <p class="description">${item.description || ''}</p>
            <p class="price">${item.price} сом</p>
            ${buttons}
        </div>
    `;

    // Вешаем обработчик на кнопку через JS (не inline onclick)
    const addBtn = div.querySelector('.add-to-cart-btn:not(.guest)');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            addToCart(item.id, item.name, item.price);
        });
    }

    return div;
}

// ───── ADMIN HANDLERS ──────────────────────────
let currentDishId = null;
let currentDishElement = null;

function initAdminHandlers() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            openDeleteModal(this.dataset.id, this.closest('.dish-item'));
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            openEditModal(this.dataset.id);
        });
    });
}

// ───── DELETE ──────────────────────────────────
function openDeleteModal(id, el) {
    currentDishId = id;
    currentDishElement = el;
    let modal = document.getElementById('delete-modal') || createDeleteModal();
    modal.style.display = 'flex';
}

function createDeleteModal() {
    const modal = document.createElement('div');
    modal.id = 'delete-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Подтвердите удаление</h2>
            <p>Вы уверены, что хотите удалить это блюдо?</p>
            <div class="modal-buttons">
                <button id="confirm-delete" class="btn-danger">Удалить</button>
                <button id="cancel-delete" class="btn-secondary">Отмена</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#confirm-delete').onclick = confirmDelete;
    modal.querySelector('#cancel-delete').onclick = closeDeleteModal;
    modal.onclick = e => { if (e.target === modal) closeDeleteModal(); };
    return modal;
}

async function confirmDelete() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(BACKEND_URL + `/api/v2/AdrianoCoffee/Admin/deleteItemFromMenu/${currentDishId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Ошибка удаления');
        currentDishElement?.remove();
        closeDeleteModal();
        showNotification('Блюдо удалено');
    } catch (error) {
        showNotification('Не удалось удалить блюдо', 'error');
    }
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    currentDishId = null;
    currentDishElement = null;
}

// ───── ADD TO CART ─────────────────────────────
async function addToCart(id, name, price) {
    const token = localStorage.getItem('authToken');
    if (!token) return promptLogin();

    try {
        const response = await fetch(BACKEND_URL + '/api/v2/Cart/add', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ menuItemId: id, quantity: 1 })
        });

        if (!response.ok) throw new Error('Ошибка добавления');

        // Toast уведомление вместо alert
        showNotification(`${name} добавлен в корзину`);

        // Обновляем счётчик сразу — без открытия корзины
        refreshCartCount();

    } catch (error) {
        showNotification('Ошибка добавления в корзину', 'error');
    }
}

// Обновить только счётчик корзины (тихо, без рендера)
async function refreshCartCount() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch(BACKEND_URL + '/api/v2/Cart', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        updateCartCount((data.items || []).length);
    } catch (e) {
        // молча игнорируем
    }
}

function promptLogin() {
    if (confirm('Необходимо войти в систему. Перейти на страницу входа?')) {
        window.location.href = 'login-register.html';
    }
}

// ───── RENDER (выделено из fetchAndRenderMenu) ────
function renderMenu(items) {
    const containers = document.querySelectorAll('.dishes');
    containers.forEach(c => c.innerHTML = '');

    const userRole = getUserRole();

    items.forEach(item => {
        const container = document.getElementById(`container-${item.category}`);
        if (container) {
            container.appendChild(createDishCard(item, userRole));
        }
    });

    // Скрываем секции без результатов
    document.querySelectorAll('.menu-container .menu-section').forEach(section => {
        const dishes = section.querySelector('.dishes');
        if (dishes) {
            section.style.display = dishes.children.length === 0 ? 'none' : '';
        }
    });

    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
        initAdminHandlers();
    }
}

// ───── SEARCH ─────────────────────────────────
function initSearch() {
    const input = document.getElementById('menu-search-input');
    const clearBtn = document.getElementById('menu-search-clear');
    if (!input) return;

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        clearBtn.style.display = query ? '' : 'none';

        if (!query) {
        renderMenu(allMenuItems);
        const noResults = document.getElementById('search-no-results');
        if (noResults) noResults.style.display = 'none';
        return;
}

        const filtered = allMenuItems.filter(item =>
            item.name.toLowerCase().split(' ').some(word => word.startsWith(query))
        );
        renderMenu(filtered);

        // Показываем «не найдено» если пусто
        const noResults = document.getElementById('search-no-results');
        if (noResults) noResults.style.display = filtered.length === 0 ? 'block' : 'none';
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        renderMenu(allMenuItems);
        const noResults = document.getElementById('search-no-results');
        if (noResults) noResults.style.display = 'none';
    });
}

// ───── ФИЛЬТР КАТЕГОРИЙ ───────────────────────
function initCategoryFilter() {
    const chips = document.querySelectorAll('.filter-chip');
    if (!chips.length) return;

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active'); // ← только кликнутая

            const category = chip.dataset.category;
            filterByCategory(category);

            // Сбрасываем поиск при смене категории
            const input = document.getElementById('menu-search-input');
            const clearBtn = document.getElementById('menu-search-clear');
            if (input) input.value = '';
            if (clearBtn) clearBtn.style.display = 'none';
            const noResults = document.getElementById('search-no-results');
            if (noResults) noResults.style.display = 'none';
        });
    });
}

function filterByCategory(category) {
    const sections = document.querySelectorAll('.menu-container .menu-section');

    if (category === 'ALL') {
        // Показываем все секции
        sections.forEach(s => s.style.display = '');
        renderMenu(allMenuItems);
        return;
    }

    // Скрываем все секции кроме выбранной
    sections.forEach(s => {
        const container = s.querySelector('.dishes');
        if (container && container.id === `container-${category}`) {
            s.style.display = '';
        } else {
            s.style.display = 'none';
        }
    });
}

// ───── INIT ────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    fetchAndRenderMenu();
});
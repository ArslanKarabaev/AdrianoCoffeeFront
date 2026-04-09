// ===== УНИВЕРСАЛЬНЫЙ ЗАГРУЗЧИК МЕНЮ =====

const BACKEND_URL = "https://adrianocoffee-backend.onrender.com";
const API_URL = BACKEND_URL + '/api/v2/AdrianoCoffee/Menu/getAllMenu';

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

        menuItems.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

        const containers = document.querySelectorAll('.dishes');
        containers.forEach(c => c.innerHTML = '');

        const userRole = getUserRole();

        menuItems.forEach(item => {
            const container = document.getElementById(`container-${item.category}`);
            if (container) {
                container.appendChild(createDishCard(item, userRole));
            }
        });

        if (userRole === 'ADMIN' || userRole === 'admin'|| userRole === 'MANAGER') {
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
        buttons = `<button class="add-to-cart-btn" onclick="addToCart(${item.id}, '${item.name}', ${item.price})"><i class="fas fa-shopping-cart"></i> Добавить в корзину</button>`;
    } else {
        buttons = `<button class="add-to-cart-btn guest" onclick="promptLogin()"><i class="fas fa-shopping-cart"></i> Добавить в корзину</button>`;
    }

    // <img src="${item.imageUrl ? BACKEND_URL + item.imageUrl : BACKEND_URL + '/images/menu/default.jpg'}" alt="${item.name}">
    div.innerHTML = `
        <img src="${item.imageUrl ? item.imageUrl : BACKEND_URL + '/images/menu/default.jpg'}" alt="${item.name}">
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
    return div;
}

// ADMIN HANDLERS
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

// DELETE
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
    } catch (error) {
        alert('Не удалось удалить блюдо');
    }
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    currentDishId = null;
    currentDishElement = null;
}



// USER FUNCTIONS
function addToCart(id, name, price) {
    const token = localStorage.getItem('authToken');
    if (!token) return promptLogin();

    fetch(BACKEND_URL + '/api/v2/Cart/add', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId: id, quantity: 1 })
    })
        .then(r => r.json())
        .then(() => alert(`${name} добавлен в корзину!`))
        .catch(() => alert('Ошибка добавления в корзину'));
}

function promptLogin() {
    if (confirm('Необходимо войти в систему. Перейти на страницу входа?')) {
        window.location.href = 'login-register.html';
    }
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
    fetchAndRenderMenu();
});
// ===== МЕНЮ МЕНЕДЖЕРА =====

function openEditModal(dishId) {
    const token = localStorage.getItem('authToken');

    fetch(BACKEND_URL + `/api/v2/AdrianoCoffee/Menu/getMenuById/${dishId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Не удалось загрузить данные блюда');
        return response.json();
    })
    .then(dish => {
        document.getElementById('editDishId').value = dish.id;
        document.getElementById('editDishName').value = dish.name;
        document.getElementById('editDishCategory').value = dish.category;
        document.getElementById('editDishDescription').value = dish.description || '';
        document.getElementById('editDishPrice').value = dish.price;
        document.getElementById('editDishVolume').value = dish.volume || '';
        document.getElementById('editNameEn').value = dish.nameEn || '';
        document.getElementById('editNameKg').value = dish.nameKg || '';
        document.getElementById('editDescriptionEn').value = dish.descriptionEn || '';
        document.getElementById('editDescriptionKg').value = dish.descriptionKg || '';

        if (dish.imageUrl) {
            const finalSrc = dish.imageUrl.startsWith('http')
                ? dish.imageUrl
                : BACKEND_URL + dish.imageUrl;
            document.getElementById('currentImage').src = finalSrc;
            document.getElementById('currentImagePreview').style.display = 'block';
        } else {
            document.getElementById('currentImagePreview').style.display = 'none';
        }

        document.getElementById('edit-dish-modal').style.display = 'flex';
    })
    .catch(error => {
        console.error('Ошибка загрузки блюда:', error);
        alert('Не удалось загрузить данные блюда');
    });
}

function closeEditModal() {
    document.getElementById('edit-dish-modal').style.display = 'none';
    document.getElementById('editDishForm').reset();
}

async function handleEditSubmit(event) {
    event.preventDefault();

    const token = localStorage.getItem('authToken');
    const dishId = document.getElementById('editDishId').value;
    const imageFile = document.getElementById('editDishImage').files[0];

    const formData = new FormData();
    formData.append('name', document.getElementById('editDishName').value);
    formData.append('category', document.getElementById('editDishCategory').value);
    formData.append('description', document.getElementById('editDishDescription').value);
    formData.append('price', document.getElementById('editDishPrice').value);
    formData.append('volume', document.getElementById('editDishVolume').value || '');
    formData.append('nameEn', document.getElementById('editNameEn').value || '');
    formData.append('nameKg', document.getElementById('editNameKg').value || '');
    formData.append('descriptionEn', document.getElementById('editDescriptionEn').value || '');
    formData.append('descriptionKg', document.getElementById('editDescriptionKg').value || '');
    if (imageFile) formData.append('image', imageFile);

    try {
        const response = await fetch(
            BACKEND_URL + `/api/v2/AdrianoCoffee/Management/updateMenuItem/${dishId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) throw new Error('Ошибка при обновлении блюда');

        closeEditModal();
        location.reload();

    } catch (error) {
        console.error('Ошибка при обновлении блюда:', error);
        alert('Не удалось обновить блюдо: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    window.location.href = 'login-register.html';
}

// ───── ИНИЦИАЛИЗАЦИЯ ─────
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
        window.location.href = 'login-register.html';
        return;
    }

    if (userRole !== 'MANAGER' && userRole !== 'manager' &&
        userRole !== 'ADMIN' && userRole !== 'admin') {
        alert('У вас нет доступа к этой странице');
        window.location.href = 'dashboard.html';
        return;
    }

    // Выход
    document.getElementById('logout-button')?.addEventListener('click', e => {
        e.preventDefault();
        logout();
    });

    // Кнопка закрытия модалки
    document.getElementById('close-edit-modal').onclick = closeEditModal;
    document.getElementById('cancelEdit').onclick = closeEditModal;

    // Закрытие по клику вне модалки
    const modal = document.getElementById('edit-dish-modal');
    if (modal) {
        modal.onclick = e => {
            if (e.target === modal) closeEditModal();
        };
    }

    // Форма редактирования
    document.getElementById('editDishForm')?.addEventListener('submit', handleEditSubmit);
});
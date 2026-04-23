// ===== РЕДАКТИРОВАНИЕ БЛЮДА =====

// Открытие модального окна редактирования
function openEditModal(dishId) {
    console.log('=== ОТКРЫТИЕ РЕДАКТИРОВАНИЯ ===');
    console.log('Dish ID:', dishId);

    const token = localStorage.getItem('authToken');

    // Загружаем данные блюда
    fetch(BACKEND_URL + `/api/v2/AdrianoCoffee/Menu/getMenuById/${dishId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Не удалось загрузить данные блюда');
            return response.json();
        })
        .then(dish => {
            console.log('Данные блюда:', dish);

            // Заполняем форму
            document.getElementById('editDishId').value = dish.id;
            document.getElementById('editDishName').value = dish.name;
            document.getElementById('editDishCategory').value = dish.category;
            document.getElementById('editDishDescription').value = dish.description || '';
            document.getElementById('editDishPrice').value = dish.price;
            document.getElementById('editDishVolume').value = dish.volume || '';

            // Показываем текущее изображение
            if (dish.imageUrl) {
                const finalSrc = dish.imageUrl.startsWith('http') 
             ? dish.imageUrl 
            : BACKEND_URL + dish.imageUrl;

                document.getElementById('currentImage').src = finalSrc;
                document.getElementById('currentImagePreview').style.display = 'block';
            } else {
                document.getElementById('currentImagePreview').style.display = 'none';
            }

            // Показываем модальное окно
            document.getElementById('edit-dish-modal').style.display = 'flex';
        })
        .catch(error => {
            console.error('Ошибка загрузки блюда:', error);
            alert('Не удалось загрузить данные блюда');
        });
}

// Закрытие модального окна
function closeEditModal() {
    document.getElementById('edit-dish-modal').style.display = 'none';
    document.getElementById('editDishForm').reset();
}

// Инициализация обработчиков редактирования
function initEditHandlers() {
    // Обработчик кнопки закрытия
    const closeBtn = document.getElementById('close-edit-modal');
    if (closeBtn) {
        closeBtn.onclick = closeEditModal;
    }

    // Обработчик кнопки отмены
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
        cancelBtn.onclick = closeEditModal;
    }

    // Закрытие при клике вне модалки
    const modal = document.getElementById('edit-dish-modal');
    if (modal) {
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeEditModal();
            }
        };
    }

    // Обработчик формы редактирования
    const editForm = document.getElementById('editDishForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }
}

// Обработка отправки формы редактирования
async function handleEditSubmit(event) {
    event.preventDefault();

    const token = localStorage.getItem('authToken');
    const dishId = document.getElementById('editDishId').value;
    const imageFile = document.getElementById('editDishImage').files[0];

    console.log('=== СОХРАНЕНИЕ ИЗМЕНЕНИЙ ===');
    console.log('Dish ID:', dishId);
    console.log('Image file:', imageFile ? imageFile.name : 'Нет нового изображения');

    // Собираем данные
    const formData = new FormData();
    formData.append('name', document.getElementById('editDishName').value);
    formData.append('category', document.getElementById('editDishCategory').value);
    formData.append('description', document.getElementById('editDishDescription').value);
    formData.append('price', document.getElementById('editDishPrice').value);
    formData.append('volume', document.getElementById('editDishVolume').value || '');

    // Добавляем изображение только если выбрано новое
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const response = await fetch(BACKEND_URL + `/api/v2/AdrianoCoffee/Admin/updateMenuItem/${dishId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error('Ошибка при обновлении блюда');
        }

        const data = await response.json();
        console.log('Response data:', data);

        closeEditModal();

        // Перезагружаем меню
        location.reload();

    } catch (error) {
        console.error('Ошибка при обновлении блюда:', error);
        alert('Не удалось обновить блюдо: ' + error.message);
    }
}

// Вызываем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initEditHandlers();
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
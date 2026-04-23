document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ADMIN DASHBOARD ЗАГРУЖЕН ===');

    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    

    console.log('authToken:', token ? 'Есть' : 'ОТСУТСТВУЕТ');
    console.log('userId:', userId);
    console.log('userRole:', userRole);

    // Проверка авторизации
    if (!token) {
        console.error('ОШИБКА: Токен отсутствует');
        alert('Необходима авторизация');
        window.location.href = 'login-register.html';
        return;
    }

    // Проверка роли
    if (userRole !== 'ADMIN' && userRole !== 'admin') {
        console.error('ОШИБКА: Недостаточно прав');
        alert(`У вас нет доступа к этой странице.`);
        window.location.href = 'dashboard.html';
        return;
    }

    console.log('✓ Роль подтверждена: ADMIN');

    // ===== ИНИЦИАЛИЗАЦИЯ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ =====
    initUsersManagement(token);
    initToggleStatusHandlers(token);

    // ===== ОБРАБОТЧИК ВЫХОДА =====
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            logout();
        });
    }

    // ===== ФОРМА ДОБАВЛЕНИЯ БЛЮДА =====
    const addDishForm = document.getElementById('addDishForm');
    if (addDishForm) {
        addDishForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const formData = new FormData(addDishForm);

            const categoryMap = {
                'Кофе': 'COFFEE',
                'Завтраки': 'BREAKFAST',
                'Салаты': 'SALAD',
                'Супы': 'FIRSTMEAL',
                'Пасты': 'PASTA',
                'Горячие блюда': 'SECONDMEAL',
                'Боулы': 'BOWL',
                'Десерты': 'DESSERT',
                'Чаи': 'TEA',
                'Холодные Напитки': 'DRINKS'
            };

            const selectedCategory = formData.get('dishCategory');
            const categoryEnum = categoryMap[selectedCategory] || selectedCategory.toUpperCase();
            const imageFile = formData.get('dishImage');

            if (imageFile && imageFile.size > 0) {
                // С изображением
                const finalFormData = new FormData();
                finalFormData.append('name', formData.get('dishName'));
                finalFormData.append('category', categoryEnum);
                finalFormData.append('description', formData.get('dishDescription'));
                finalFormData.append('price', formData.get('dishPrice'));
                finalFormData.append('volume', formData.get('dishVolume'));
                finalFormData.append('image', imageFile);

                console.log('Отправка блюда С изображением');

                fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/Admin/addNewItemToMenu', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: finalFormData
                })
                    .then(async response => {
                        if (!response.ok) throw new Error('Ошибка при добавлении блюда');
                        const text = await response.text();
                        return text ? JSON.parse(text) : { success: true };
                    })
                    .then(data => {
                        document.getElementById('addDishMessage').textContent = 'Блюдо успешно добавлено!';
                        document.getElementById('addDishMessage').style.color = 'green';
                        addDishForm.reset();
                    })
                    .catch(error => {
                        console.error('Ошибка:', error);
                        document.getElementById('addDishMessage').textContent = 'Произошла ошибка при добавлении блюда.';
                        document.getElementById('addDishMessage').style.color = 'red';
                    });
            } else {
                // Без изображения
                const dishData = {
                    name: formData.get('dishName'),
                    category: categoryEnum,
                    description: formData.get('dishDescription'),
                    price: parseFloat(formData.get('dishPrice')),
                    volume: formData.get('dishVolume')
                };

                console.log('Отправка блюда БЕЗ изображения');

                fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/Admin/addNewItemToMenu', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dishData)
                })
                    .then(async response => {
                        if (!response.ok) throw new Error('Ошибка при добавлении блюда');
                        const text = await response.text();
                        return text ? JSON.parse(text) : { success: true };
                    })
                    .then(data => {
                        document.getElementById('addDishMessage').textContent = 'Блюдо успешно добавлено!';
                        document.getElementById('addDishMessage').style.color = 'green';
                        addDishForm.reset();
                    })
                    .catch(error => {
                        console.error('Ошибка:', error);
                        document.getElementById('addDishMessage').textContent = 'Произошла ошибка при добавлении блюда.';
                        document.getElementById('addDishMessage').style.color = 'red';
                    });
            }
        });
    }

    // Функция выхода
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
});
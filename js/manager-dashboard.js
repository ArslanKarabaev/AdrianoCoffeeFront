document.addEventListener('DOMContentLoaded', function() {
    console.log('=== MANAGER DASHBOARD ЗАГРУЖЕН ===');

    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    // Проверка авторизации
    if (!token) {
        alert('Необходима авторизация');
        window.location.href = 'login-register.html';
        return;
    }

    // Проверка роли (MANAGER или ADMIN)
    if (userRole !== 'MANAGER' && userRole !== 'manager' && userRole !== 'ADMIN' && userRole !== 'admin') {
        alert(`У вас нет доступа к этой странице.`);
        window.location.href = 'dashboard.html';
        return;
    }

    console.log('✓ Роль подтверждена:', userRole);

    // Обработчик выхода
    document.getElementById('logout-button')?.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Форма добавления блюда
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

                fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/Management/addNewItemToMenu', {
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
                        document.getElementById('addDishMessage').textContent = 'Ошибка при добавлении блюда.';
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

                fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/Management/addNewItemToMenu', {
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
                        document.getElementById('addDishMessage').textContent = 'Ошибка при добавлении блюда.';
                        document.getElementById('addDishMessage').style.color = 'red';
                    });
            }
        });
    }

    function logout() {
        localStorage.clear();
        window.location.href = 'login-register.html';
    }
});
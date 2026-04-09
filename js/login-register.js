document.addEventListener("DOMContentLoaded", function() {
    const wrapper = document.querySelector('.wrapper');
    const loginLink = document.querySelector('.login-link');
    const registerLink = document.querySelector('.register-link');
    const iconClose = document.querySelector('.icon-close');
    const BACKEND_URL = "https://adrianocoffee-backend.onrender.com";

    // Переключение между формами
    registerLink?.addEventListener('click', () => wrapper.classList.add('active'));
    loginLink?.addEventListener('click', () => wrapper.classList.remove('active'));
    iconClose?.addEventListener('click', () => wrapper.classList.remove('active'));

    // ===== ПРОВЕРКА АВТОРИЗАЦИИ ПРИ ЗАГРУЗКЕ =====
    checkAuthOnLoad();

    // ===== ФОРМА ВХОДА =====
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            // Валидация
            if (!email || !password) {
                alert('Пожалуйста, заполните все поля');
                return;
            }

            console.log('=== НАЧАЛО ПРОЦЕССА ВХОДА ===');
            console.log('Email:', email);

            try {
                const response = await fetch(BACKEND_URL + '/api/v2/auth/authentication', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                console.log('Response status:', response.status);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
                }

                const data = await response.json();
                console.log('=== ОТВЕТ ОТ СЕРВЕРА ===');
                console.log('Полный ответ:', data);
                console.log('Token:', data.token ? 'Получен' : 'ОТСУТСТВУЕТ');
                console.log('UserId:', data.userId);
                console.log('Role:', data.role);
                console.log('Тип role:', typeof data.role);
                console.log('Status:', data.status);

                // Проверяем наличие токена
                if (data.token && data.userId) {
                    if (data.status === false || data.status === 'false' || data.status === 0) {
                        alert('Ваш аккаунт заблокирован. Обратитесь к администратору.');
                        return; // Прерываем выполнение, не сохраняем токен
                    }

                    // ВАЖНО: Сохраняем ВСЕ данные
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('userId', data.userId);

                    // КРИТИЧНО: правильно определяем роль
                    let userRole = 'USER'; // значение по умолчанию

                    if (data.role) {
                        userRole = data.role.toUpperCase(); // Приводим к верхнему регистру
                    }

                    localStorage.setItem('userRole', userRole);

                    console.log('=== СОХРАНЕНО В LOCALSTORAGE ===');
                    console.log('authToken:', localStorage.getItem('authToken') ? 'Сохранен' : 'НЕ СОХРАНЕН');
                    console.log('userId:', localStorage.getItem('userId'));
                    console.log('userRole:', localStorage.getItem('userRole'));

                    // Перенаправление в зависимости от роли
                    console.log('=== ПЕРЕНАПРАВЛЕНИЕ ===');
                    if (userRole === 'ADMIN') {
                        console.log('Роль ADMIN - перенаправление на admin-dashboard.html');
                        window.location.href = 'admin-dashboard.html';
                    }else if(userRole === 'MANAGER'){
                        console.log('Роль MANAGER - перенаправление на manager-dashboard.html');
                        window.location.href = 'manager-dashboard.html';
                    } else {
                        console.log('Роль USER - перенаправление на dashboard.html');
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    console.error('ОШИБКА: Токен или userId не получены');
                    alert('Ошибка авторизации: токен не получен');
                }
            } catch (error) {
                console.error('=== ОШИБКА ВХОДА ===');
                console.error('Error:', error);
                alert(`Ошибка при входе: ${error.message}`);
            }
        });
    }

    // ===== ФОРМА РЕГИСТРАЦИИ =====
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const firstName = document.getElementById('registerFirstName').value;
            const secondName = document.getElementById('registerSecondName').value;
            const phone = document.getElementById('registerPhone').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            // Валидация
            if (!firstName || !secondName || !phone || !email || !password) {
                alert('Пожалуйста, заполните все обязательные поля');
                return;
            }

            // Получаем дату рождения
            let formattedBirthdate = null;
            const birthdateInput = document.getElementById('registerBirthdate');

            if (birthdateInput && birthdateInput._flatpickr) {
                const selectedDate = birthdateInput._flatpickr.selectedDates[0];
                if (selectedDate) {
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    formattedBirthdate = `${year}-${month}-${day}`;
                }
            }

            try {
                const response = await fetch(BACKEND_URL + '/api/v2/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firstName,
                        secondName,
                        dateOfBirth: formattedBirthdate,
                        email,
                        mobNum: phone,
                        password,
                        role: "USER"
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
                }

                const data = await response.json();
                console.log('Register response:', data);

                if (data.token) {
                    alert('Регистрация успешна! Теперь вы можете войти.');

                    // Переключаемся на форму входа
                    wrapper.classList.remove('active');

                    // Очищаем форму регистрации
                    registerForm.reset();
                } else {
                    alert('Регистрация завершена, но токен не получен');
                }
            } catch (error) {
                console.error('Ошибка регистрации:', error);
                alert(`Ошибка при регистрации: ${error.message}`);
            }
        });
    }

    // ===== ИНИЦИАЛИЗАЦИЯ FLATPICKR =====
    const birthdateField = document.getElementById('registerBirthdate');
    if (birthdateField) {
        flatpickr(birthdateField, {
            dateFormat: "d.m.Y",
            locale: {
                firstDayOfWeek: 1,
                weekdays: {
                    shorthand: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
                    longhand: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
                },
                months: {
                    shorthand: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
                    longhand: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
                }
            },
            maxDate: "today",
            defaultDate: new Date(2000, 0, 1)
        });
    }
});

// ===== ФУНКЦИЯ ПРОВЕРКИ АВТОРИЗАЦИИ ПРИ ЗАГРУЗКЕ =====
function checkAuthOnLoad() {
    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    console.log('=== ПРОВЕРКА ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ===');
    console.log('authToken:', authToken ? 'Есть' : 'Нет');
    console.log('userRole:', userRole);

    // Если пользователь уже авторизован
    if (authToken) {
        console.log('Пользователь авторизован, перенаправление...');

        if (userRole === 'ADMIN') {
            console.log('→ Перенаправление на admin-dashboard.html');
            window.location.href = 'admin-dashboard.html';
        } else {
            console.log('→ Перенаправление на dashboard.html');
            window.location.href = 'dashboard.html';
        }
    } else {
        console.log('Пользователь не авторизован, остаёмся на странице входа');
    }
}

// ===== УТИЛИТА: ОЧИСТКА АВТОРИЗАЦИИ =====
function logout() {
    console.log('=== ВЫХОД ИЗ СИСТЕМЫ ===');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    console.log('localStorage очищен');
    window.location.href = 'login-register.html';
}
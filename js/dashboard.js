document.addEventListener('DOMContentLoaded', function () {
    const BACKEND_URL = "https://adrianocoffee-backend.onrender.com";
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    // Если токена нет, перенаправляем на страницу входа
    if (!token) {
        window.location.href = 'login-register.html';
        return;
    }

    const userForm = document.getElementById('userForm');
    const responseMessage = document.getElementById('responseMessage');

    // Вспомогательная функция для безопасного парсинга JSON
    async function safeJsonParse(response) {
        const text = await response.text();
        if (!text || text.trim() === '') {
            return { success: response.ok };
        }
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error('Сервер вернул некорректный ответ');
        }
    }

    // Функция для получения данных пользователя
    function fetchUserData() {
        if (!userId || !token) {
            console.error('Ошибка: userId или токен отсутствует');
            window.location.href = 'login-register.html';
            return;
        }

        fetch(BACKEND_URL + `/api/v2/AdrianoCoffee/User/getUserInfo/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка сервера: ${response.status}`);
                }
                return safeJsonParse(response);
            })
            .then(data => {
                document.getElementById('firstName').value = data.firstName || '';
                document.getElementById('secondName').value = data.secondName || '';
                document.getElementById('birthday').value = data.dateOfBirth || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('phone').value = data.mobNum || '';
                document.getElementById('age').value = data.age || '';
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Ошибка при загрузке данных пользователя.');
                localStorage.clear();
                window.location.href = 'login-register.html';
            });
    }

    // Обработчик отправки формы обновления данных
    if (userForm) {
        userForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const updatedData = {
                firstName: document.getElementById('firstName').value,
                secondName: document.getElementById('secondName').value,
                phone: document.getElementById('phone').value,
                birthday: document.getElementById('birthday').value,
                email: document.getElementById('email').value
            };

            fetch(BACKEND_URL + `/api/v2/AdrianoCoffee/User/UpdateUser/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Ошибка сервера: ${response.status}`);
                    }
                    return safeJsonParse(response);
                })
                .then(data => {
                    if (data.success === true || data.success === 'true') {
                        responseMessage.textContent = 'Данные успешно обновлены!';
                        responseMessage.style.color = 'green';

                        // Блокируем поля обратно
                        document.querySelectorAll('.user-form input').forEach(input => {
                            input.disabled = true;
                        });
                        document.getElementById('saveBtn').style.display = 'none';
                        document.getElementById('changeBtn').style.display = 'inline-block';
                    } else {
                        responseMessage.textContent = `Ошибка: ${data.message || 'Неизвестная ошибка'}`;
                        responseMessage.style.color = 'red';
                    }
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    responseMessage.textContent = 'Произошла ошибка при обновлении данных.';
                    responseMessage.style.color = 'red';
                });
        });
    }

    // Получаем данные пользователя при загрузке
    fetchUserData();

    // Обработчик выхода из системы
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function (event) {
            event.preventDefault();

            // Очищаем все данные
            localStorage.clear();

            // Перенаправляем на главную страницу (БЕЗ проверки токена)
            window.location.href = 'pageuser.html'; // или 'index.html'
        });
    }

    // Обработчик для кнопки "Изменить"
    const changeBtn = document.getElementById("changeBtn");
    const saveBtn = document.getElementById("saveBtn");

    if (changeBtn && saveBtn) {
        changeBtn.addEventListener("click", () => {
            document.querySelectorAll(".user-form input:not(.password-field)").forEach(input => {
                input.disabled = false;
            });
            saveBtn.style.display = "block";
            changeBtn.style.display = "none";
        });
    }

    // Обработчик для кнопки "Изменить пароль"
    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const savePasswordBtn = document.getElementById("savePasswordBtn");

    if (changePasswordBtn && savePasswordBtn) {
        changePasswordBtn.addEventListener("click", () => {
            document.querySelectorAll(".password-field").forEach(field => {
                field.disabled = false;
            });
            savePasswordBtn.style.display = "inline-block";
            changePasswordBtn.style.display = "none";
        });

        savePasswordBtn.addEventListener("click", () => {
            const newPassword = document.getElementById("newPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (!newPassword || !confirmPassword) {
                alert("Заполните все поля пароля");
                return;
            }

            if (newPassword !== confirmPassword) {
                alert("Пароли не совпадают");
                return;
            }

            fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/User/ChangePassword', {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Ошибка при изменении пароля');
                    }
                    return safeJsonParse(response);
                })
                .then(() => {
                    document.querySelectorAll(".password-field").forEach(field => {
                        field.disabled = true;
                        field.value = '';
                    });
                    savePasswordBtn.style.display = "none";
                    changePasswordBtn.style.display = "inline-block";
                })
                .catch(error => {
                    console.error("Ошибка:", error);
                    alert("Ошибка при изменении пароля");
                });
        });
    }
});
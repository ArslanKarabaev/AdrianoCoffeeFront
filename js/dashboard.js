document.addEventListener('DOMContentLoaded', function () {
    
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
    document.querySelectorAll('.logout-button').forEach(btn => {
    btn.addEventListener('click', function(event) {
        event.preventDefault();
        localStorage.clear();
        window.location.href = 'login-register.html';
    });
});

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

// ── МОДАЛКА СМЕНЫ ПАРОЛЯ ──────────────────────
const changePasswordBtn = document.getElementById('changePasswordBtn');
const passwordModal = document.getElementById('password-modal');
const closePasswordModal = document.getElementById('close-password-modal');
const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
const savePasswordBtn = document.getElementById('savePasswordBtn');
const passwordMessage = document.getElementById('password-modal-message');

function openPasswordModal() {
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    passwordMessage.textContent = '';
    passwordModal.style.display = 'flex';
}

function closeModal() {
    passwordModal.style.display = 'none';
}

if (changePasswordBtn) changePasswordBtn.addEventListener('click', openPasswordModal);
if (closePasswordModal) closePasswordModal.addEventListener('click', closeModal);
if (cancelPasswordBtn) cancelPasswordBtn.addEventListener('click', closeModal);

// Закрытие по клику вне модалки
passwordModal?.addEventListener('click', (e) => {
    if (e.target === passwordModal) closeModal();
});

if (savePasswordBtn) {
    savePasswordBtn.addEventListener('click', async () => {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!newPassword || !confirmPassword) {
            passwordMessage.style.color = 'red';
            passwordMessage.textContent = 'Заполните все поля';
            return;
        }

        if (newPassword !== confirmPassword) {
            passwordMessage.style.color = 'red';
            passwordMessage.textContent = 'Пароли не совпадают';
            return;
        }

        if (newPassword.length < 6) {
            passwordMessage.style.color = 'red';
            passwordMessage.textContent = 'Пароль должен быть не менее 6 символов';
            return;
        }

        savePasswordBtn.disabled = true;
        savePasswordBtn.textContent = 'Сохраняем...';

        try {
            const response = await fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/User/ChangePassword', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword, confirmPassword })
            });

            if (!response.ok) throw new Error('Ошибка');

            passwordMessage.style.color = 'green';
            passwordMessage.textContent = 'Пароль успешно изменён!';
            setTimeout(() => closeModal(), 1500);

        } catch (e) {
            passwordMessage.style.color = 'red';
            passwordMessage.textContent = 'Ошибка при изменении пароля';
        } finally {
            savePasswordBtn.disabled = false;
            savePasswordBtn.textContent = 'Сохранить';
        }
    });
}
});
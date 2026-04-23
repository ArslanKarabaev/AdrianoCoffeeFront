document.addEventListener("DOMContentLoaded", function () {
    const wrapper = document.querySelector('.wrapper');
    const loginLink = document.querySelector('.login-link');
    const registerLink = document.querySelector('.register-link');
    const iconClose = document.querySelector('.icon-close');

    // Переключение между формами
    registerLink?.addEventListener('click', () => wrapper.classList.add('active'));
    loginLink?.addEventListener('click', () => wrapper.classList.remove('active'));
    iconClose?.addEventListener('click', () => wrapper.classList.remove('active'));

    // ===== ПРОВЕРКА АВТОРИЗАЦИИ ПРИ ЗАГРУЗКЕ =====
    checkAuthOnLoad();

    // ===== ФОРМА ВХОДА =====
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.querySelector('.remember-forgot input[type="checkbox"]')?.checked;

            if (!email || !password) {
                showFormError('Пожалуйста, заполните все поля');
                return;
            }

            try {
                const response = await fetch(BACKEND_URL + '/api/v2/auth/authentication', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                let data = {};
                try { data = await response.json(); } catch {}

                if (!response.ok) {
                    if (response.status === 403 || response.status === 401) {
                        showFormError('Неверный email или пароль');
                    } else {
                        showFormError('Ошибка входа: ' + (data.message || response.status));
                    }
                    return;
                }

                if (data.token && data.userId) {
                    if (data.status === false || data.status === 'false' || data.status === 0) {
                        showFormError('Ваш аккаунт заблокирован. Обратитесь к администратору.');
                        return;
                    }

                    // Запомнить меня
                    if (rememberMe) {
                        localStorage.setItem('rememberedEmail', email);
                    } else {
                        localStorage.removeItem('rememberedEmail');
                    }

                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('userId', data.userId);

                    const userRole = data.role ? data.role.toUpperCase() : 'USER';
                    localStorage.setItem('userRole', userRole);

                    if (userRole === 'ADMIN') {
                        window.location.href = 'admin-dashboard.html';
                    } else if (userRole === 'MANAGER') {
                        window.location.href = 'manager-dashboard.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    showFormError('Ошибка авторизации: токен не получен');
                }
            } catch (error) {
                showFormError('Ошибка при входе: ' + error.message);
            }
        });
    }

    // ===== ЗАБЫЛИ ПАРОЛЬ =====
    const forgotLink = document.querySelector('.remember-forgot a[href="#"]');
    forgotLink?.addEventListener('click', (e) => {
        e.preventDefault();
        openForgotPasswordModal();
    });

    // ===== ФОРМА РЕГИСТРАЦИИ =====
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const firstName = document.getElementById('registerFirstName').value;
            const secondName = document.getElementById('registerSecondName').value;
            const phone = document.getElementById('registerPhone').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            if (!firstName || !secondName || !phone || !email || !password) {
                showFormError('Пожалуйста, заполните все обязательные поля');
                return;
            }

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
                        firstName, secondName,
                        dateOfBirth: formattedBirthdate,
                        email, mobNum: phone, password,
                        role: "USER"
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
                }

                const data = await response.json();

                if (data.token) {
                    showFormSuccess('Регистрация успешна! Теперь войдите в аккаунт.');
                    wrapper.classList.remove('active');
                    registerForm.reset();
                }
            } catch (error) {
                showFormError('Ошибка при регистрации: ' + error.message);
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
            maxDate: "today"
        });
    }
});

// ===== МОДАЛЬНОЕ ОКНО "ЗАБЫЛИ ПАРОЛЬ" =====
function openForgotPasswordModal() {
    // Удаляем старый модал если есть
    document.getElementById('forgot-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'forgot-modal';
    modal.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Poppins', sans-serif;
    `;

    modal.innerHTML = `
        <div style="background:white;border-radius:16px;padding:36px 32px;
                    width:90%;max-width:420px;position:relative;
                    box-shadow:0 20px 60px rgba(0,0,0,0.3);">
            
            <button onclick="document.getElementById('forgot-modal').remove()"
                    style="position:absolute;top:14px;right:16px;background:none;
                           border:none;font-size:22px;cursor:pointer;color:#aaa;">✕</button>

            <div id="forgot-step-1">
                <h3 style="margin:0 0 8px;color:#610303;font-size:20px;">Сброс пароля</h3>
                <p style="margin:0 0 20px;color:#888;font-size:14px;">
                    Введите email вашего аккаунта — мы отправим код подтверждения.
                </p>
                <input type="email" id="forgot-email" placeholder="Ваш email"
                       style="width:100%;padding:11px 14px;border:1.5px solid #e0c8c8;
                              border-radius:8px;font-size:14px;font-family:inherit;
                              outline:none;box-sizing:border-box;margin-bottom:12px;">
                <div id="forgot-error-1" style="color:#e74c3c;font-size:13px;
                     margin-bottom:10px;display:none;"></div>
                <button onclick="sendResetCode()"
                        style="width:100%;padding:12px;background:#610303;color:white;
                               border:none;border-radius:8px;font-size:14px;
                               font-weight:600;cursor:pointer;font-family:inherit;">
                    Отправить код
                </button>
            </div>

            <div id="forgot-step-2" style="display:none;">
                <h3 style="margin:0 0 8px;color:#610303;font-size:20px;">Введите код</h3>
                <p style="margin:0 0 20px;color:#888;font-size:14px;">
                    Код отправлен на вашу почту. Действует 15 минут.
                </p>
                <input type="text" id="forgot-code" placeholder="6-значный код"
                       maxlength="6"
                       style="width:100%;padding:11px 14px;border:1.5px solid #e0c8c8;
                              border-radius:8px;font-size:18px;font-family:monospace;
                              letter-spacing:6px;text-align:center;outline:none;
                              box-sizing:border-box;margin-bottom:12px;">
                <input type="password" id="forgot-new-password" placeholder="Новый пароль"
                       style="width:100%;padding:11px 14px;border:1.5px solid #e0c8c8;
                              border-radius:8px;font-size:14px;font-family:inherit;
                              outline:none;box-sizing:border-box;margin-bottom:12px;">
                <input type="password" id="forgot-confirm-password" placeholder="Подтвердите пароль"
                       style="width:100%;padding:11px 14px;border:1.5px solid #e0c8c8;
                              border-radius:8px;font-size:14px;font-family:inherit;
                              outline:none;box-sizing:border-box;margin-bottom:12px;">
                <div id="forgot-error-2" style="color:#e74c3c;font-size:13px;
                     margin-bottom:10px;display:none;"></div>
                <button onclick="confirmResetCode()"
                        style="width:100%;padding:12px;background:#610303;color:white;
                               border:none;border-radius:8px;font-size:14px;
                               font-weight:600;cursor:pointer;font-family:inherit;">
                    Сменить пароль
                </button>
                <button onclick="document.getElementById('forgot-step-1').style.display='block';
                                 document.getElementById('forgot-step-2').style.display='none';"
                        style="width:100%;padding:10px;background:none;color:#aaa;
                               border:none;font-size:13px;cursor:pointer;margin-top:8px;">
                    ← Назад
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.getElementById('forgot-email').focus();
}

async function sendResetCode() {
    const email = document.getElementById('forgot-email').value.trim();
    const errorEl = document.getElementById('forgot-error-1');

    if (!email) {
        errorEl.textContent = 'Введите email';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(BACKEND_URL + '/api/v2/auth/password-reset/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('forgot-step-1').style.display = 'none';
            document.getElementById('forgot-step-2').style.display = 'block';
        } else {
            errorEl.textContent = data.message || 'Ошибка отправки кода';
            errorEl.style.display = 'block';
        }
    } catch {
        errorEl.textContent = 'Ошибка соединения с сервером';
        errorEl.style.display = 'block';
    }
}

async function confirmResetCode() {
    const email = document.getElementById('forgot-email').value.trim();
    const code = document.getElementById('forgot-code').value.trim();
    const newPassword = document.getElementById('forgot-new-password').value;
    const confirmPassword = document.getElementById('forgot-confirm-password').value;
    const errorEl = document.getElementById('forgot-error-2');

    if (!code || !newPassword || !confirmPassword) {
        errorEl.textContent = 'Заполните все поля';
        errorEl.style.display = 'block';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'Пароли не совпадают';
        errorEl.style.display = 'block';
        return;
    }

    if (newPassword.length < 6) {
        errorEl.textContent = 'Пароль должен быть не менее 6 символов';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(BACKEND_URL + '/api/v2/auth/password-reset/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, newPassword })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('forgot-modal').remove();
            showFormSuccess('Пароль успешно изменён! Войдите с новым паролем.');
        } else {
            errorEl.textContent = data.message || 'Неверный код';
            errorEl.style.display = 'block';
        }
    } catch {
        errorEl.textContent = 'Ошибка соединения с сервером';
        errorEl.style.display = 'block';
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function showFormError(message) {
    showFormMessage(message, '#e74c3c');
}

function showFormSuccess(message) {
    showFormMessage(message, '#27ae60');
}

function showFormMessage(message, color) {
    let el = document.getElementById('form-message');
    if (!el) {
        el = document.createElement('div');
        el.id = 'form-message';
        el.style.cssText = `
            position:fixed;top:80px;left:50%;transform:translateX(-50%);
            padding:12px 24px;border-radius:8px;color:white;font-size:14px;
            font-family:'Poppins',sans-serif;font-weight:500;
            z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.2);
            transition:opacity 0.3s;text-align:center;max-width:360px;
        `;
        document.body.appendChild(el);
    }
    el.style.background = color;
    el.style.opacity = '1';
    el.textContent = message;

    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// ===== ПРОВЕРКА АВТОРИЗАЦИИ ПРИ ЗАГРУЗКЕ =====
function checkAuthOnLoad() {
    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    if (authToken) {
        if (userRole === 'ADMIN') {
            window.location.href = 'admin-dashboard.html';
        } else if (userRole === 'MANAGER') {
            window.location.href = 'manager-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
}

// ===== ВЫХОД =====
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
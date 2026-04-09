// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');

    // Если пользователь авторизован, загружаем корзину с сервера
    if (token) {
        fetchCartFromServer();
    } else {
        // Для неавторизованных пользователей показываем пустую корзину
        updateCartCount(0);
    }

    // Обработчики для кнопок "Добавить в корзину"
    const addToCartButtons = document.querySelectorAll('.dish-item button');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', addToCart);
    });

    // Настройка модального окна корзины
    setupCartModal();
});

// Функция добавления товара в корзину
function addToCart(event) {
    const token = localStorage.getItem('authToken');

    if (!token) {
        alert('Войдите в систему, чтобы добавить товары в корзину');
        window.location.href = 'login-register.html';
        return;
    }

    const dishItem = event.target.closest('.dish-item');
    const dishName = dishItem.querySelector('h3').innerText;
    const dishPrice = parseFloat(dishItem.querySelector('.price').innerText.replace('сом', '').trim());
    const dishImage = dishItem.querySelector('img').src;
    const dishDescription = dishItem.querySelector('.description').innerText;
    const dishCategory = dishItem.querySelector('.item-category').innerText;

    // Получаем menu_id из data-атрибута или другого источника
    const menuId = dishItem.dataset.menuId || 0;

    const cartItem = {
        product: {
            menu_id: menuId,
            name: dishName,
            price: dishPrice,
            description: dishDescription,
            category: dishCategory
        },
        quantity: 1,
        image: dishImage
    };

    // Отправляем запрос на добавление товара в корзину
    fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/OrderCart/addItem', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(cartItem)
    })
        .then(response => {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            if (!response.ok) {
                throw new Error('Не удалось добавить товар в корзину');
            }
            return response.json();
        })
        .then(data => {
            console.log('Товар добавлен в корзину:', data);
            fetchCartFromServer(); // Обновляем корзину

            // Показываем уведомление
            showNotification('Товар добавлен в корзину');
        })
        .catch(error => {
            console.error('Ошибка при добавлении товара:', error);

            if (error.message === 'Unauthorized') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userId');
                window.location.href = 'login-register.html';
            } else {
                alert('Произошла ошибка при добавлении товара в корзину.');
            }
        });
}

// Функция для получения корзины с сервера
function fetchCartFromServer() {
    const token = localStorage.getItem('authToken');

    if (!token) {
        updateCartCount(0);
        return;
    }

    fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/OrderCart/getAll', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            if (!response.ok) {
                throw new Error('Не удалось получить данные корзины');
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data.items)) {
                console.error("Cart items is not array:", data);
                updateCartCount(0);
                return;
            }

            // Обновляем счетчик
            updateCartCount(data.items.length);

            // Сохраняем данные корзины для модального окна
            window.cartData = data;
        })
        .catch(error => {
            console.error('Ошибка при получении корзины:', error);

            if (error.message === 'Unauthorized') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userId');
                updateCartCount(0);
            }
        });
}

// Обновление счетчика корзины
function updateCartCount(count) {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.innerText = count;
    }

    const cartButton = document.getElementById('cart-button');
    if (cartButton) {
        cartButton.setAttribute('data-count', count);
    }
}

// Настройка модального окна корзины
function setupCartModal() {
    const cartButton = document.getElementById('cart-button');
    const cartModal = document.getElementById('cart-modal');
    const closeModal = cartModal ? cartModal.querySelector('.close') : null;

    if (cartButton && cartModal) {
        cartButton.addEventListener('click', () => {
            updateCartModal();
            cartModal.style.display = 'block';
        });
    }

    if (closeModal && cartModal) {
        closeModal.addEventListener('click', () => {
            cartModal.style.display = 'none';
        });
    }

    // Закрытие при клике вне модального окна
    window.addEventListener('click', (event) => {
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });

    // Обработка формы заказа
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', submitOrder);
    }
}

// Обновление содержимого модального окна корзины
function updateCartModal() {
    const cartItemsContainer = document.querySelector('.cart-items');
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    const cartData = window.cartData;
    if (!cartData || !Array.isArray(cartData.items) || cartData.items.length === 0) {
        cartItemsContainer.innerHTML = '<p>Корзина пуста</p>';
        document.getElementById('total-price').innerText = '0';
        return;
    }

    let totalPrice = 0;

    cartData.items.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-content">
                <img src="${item.image || ''}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <p class="description">${item.description || ''}</p>
                    <div class="cart-item-quantity">
                        <button class="decrease-button" data-item-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase-button" data-item-id="${item.id}">+</button>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <p class="price">${(item.price * item.quantity).toFixed(2)} сом</p>
                    <button class="remove-button" data-item-id="${item.id}">Удалить</button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
        totalPrice += item.price * item.quantity;
    });

    document.getElementById('total-price').innerText = totalPrice.toFixed(2);
    attachButtonEvents();
}

// Привязка обработчиков к кнопкам корзины
function attachButtonEvents() {
    const removeButtons = document.querySelectorAll('.remove-button');
    const increaseButtons = document.querySelectorAll('.increase-button');
    const decreaseButtons = document.querySelectorAll('.decrease-button');

    removeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.target.dataset.itemId;
            removeFromCart(itemId);
        });
    });

    increaseButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.target.dataset.itemId;
            updateQuantity(itemId, 1);
        });
    });

    decreaseButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.target.dataset.itemId;
            updateQuantity(itemId, -1);
        });
    });
}

// Увеличение/уменьшение количества товара
function updateQuantity(itemId, change) {
    const token = localStorage.getItem('authToken');

    if (!token) {
        alert('Необходима авторизация');
        return;
    }

    fetch(`/api/v2/AdrianoCoffee/OrderCart/updateQuantity/${itemId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ change: change })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Не удалось обновить количество');
            }
            return response.json();
        })
        .then(() => {
            fetchCartFromServer();
            updateCartModal();
        })
        .catch(error => {
            console.error('Ошибка при обновлении количества:', error);
            alert('Произошла ошибка при обновлении количества.');
        });
}

// Удаление товара из корзины
function removeFromCart(itemId) {
    const token = localStorage.getItem('authToken');

    if (!token) {
        alert('Необходима авторизация');
        return;
    }

    if (!confirm('Удалить товар из корзины?')) {
        return;
    }

    fetch(`/api/v2/AdrianoCoffee/OrderCart/removeItem/${itemId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Не удалось удалить товар');
            }
            return response.json();
        })
        .then(() => {
            fetchCartFromServer();
            updateCartModal();
        })
        .catch(error => {
            console.error('Ошибка при удалении товара:', error);
            alert('Произошла ошибка при удалении товара.');
        });
}

// Отправка заказа
function submitOrder(event) {
    event.preventDefault();

    const token = localStorage.getItem('authToken');

    if (!token) {
        alert('Войдите в систему для оформления заказа');
        window.location.href = 'login-register.html';
        return;
    }

    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    const address = document.getElementById('order-address').value;

    if (!name || !phone || !address) {
        alert('Заполните все поля формы');
        return;
    }

    const orderData = {
        name: name,
        phone: phone,
        address: address
    };

    fetch(BACKEND_URL + '/api/v2/AdrianoCoffee/OrderCart/addNewOrder', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при отправке заказа');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Заказ успешно оформлен!');

                // Очищаем корзину
                window.cartData = null;
                updateCartCount(0);

                // Закрываем модальное окно
                const cartModal = document.getElementById('cart-modal');
                if (cartModal) {
                    cartModal.style.display = 'none';
                }

                // Очищаем форму
                document.getElementById('order-form').reset();

                // Обновляем корзину с сервера
                fetchCartFromServer();
            } else {
                alert('Ошибка при оформлении заказа: ' + (data.message || 'Неизвестная ошибка'));
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при оформлении заказа. Попробуйте снова.');
        });
}

// Вспомогательная функция для показа уведомлений
function showNotification(message) {
    // Можно реализовать красивое всплывающее уведомление
    // Пока используем простой alert (замените на toast notification)
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}
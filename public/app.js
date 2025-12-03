document.addEventListener('DOMContentLoaded', function() {
    // Элементы
    const productsContainer = document.getElementById('products-container');
    const selectedUc = document.getElementById('selected-uc');
    const selectedPrice = document.getElementById('selected-price');
    const playerIdInput = document.getElementById('player-id');
    const createOrderBtn = document.getElementById('create-order-btn');
    const paymentMethods = document.querySelectorAll('.payment-method');
    const supportWidget = document.querySelector('.support-widget');
    const closeSupport = document.querySelector('.close-support');
    const quickQuestions = document.querySelectorAll('.quick-question');
    const supportMessages = document.getElementById('support-messages');
    const supportInput = document.getElementById('support-input');
    const sendSupportBtn = document.getElementById('send-support-btn');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const paymentModal = document.getElementById('payment-modal');
    
    let selectedProduct = null;
    let selectedPaymentMethod = 'binance';
    let userData = null;

    // Загрузка товаров
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            const products = await response.json();
            
            productsContainer.innerHTML = '';
            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.dataset.id = product.id;
                productCard.innerHTML = `
                    <div class="uc-amount">${product.uc} UC</div>
                    <div class="uc-price">$${product.price}</div>
                    <div class="per-uc">$${product.perUc} за UC</div>
                    <button class="btn-select" data-id="${product.id}">Выбрать</button>
                `;
                productsContainer.appendChild(productCard);
                
                // Обработчик выбора
                productCard.querySelector('.btn-select').addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectProduct(product);
                });
            });
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
        }
    }

    // Выбор товара
    function selectProduct(product) {
        selectedProduct = product;
        
        // Сброс выделения
        document.querySelectorAll('.product-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Выделение выбранного
        const selectedCard = document.querySelector(`.product-card[data-id="${product.id}"]`);
        if (selectedCard) selectedCard.classList.add('selected');
        
        // Обновление информации
        selectedUc.textContent = `${product.uc} UC`;
        selectedPrice.textContent = `$${product.price}`;
        
        checkOrderReady();
    }

    // Выбор способа оплаты
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            paymentMethods.forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            selectedPaymentMethod = this.dataset.method;
            checkOrderReady();
        });
    });

    // Проверка готовности заказа
    function checkOrderReady() {
        const isReady = selectedProduct && playerIdInput.value.trim().length >= 9;
        createOrderBtn.disabled = !isReady;
    }

    playerIdInput.addEventListener('input', checkOrderReady);

    // Создание заказа
    createOrderBtn.addEventListener('click', async function() {
        if (!userData) {
            alert('Пожалуйста, войдите через Google для оформления заказа.');
            return;
        }
        
        const orderData = {
            productId: selectedProduct.id,
            playerId: playerIdInput.value.trim(),
            paymentMethod: selectedPaymentMethod
        };
        
        try {
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showPaymentModal(result);
            } else {
                alert('Ошибка: ' + result.error);
            }
        } catch (error) {
            alert('Ошибка сети. Проверьте подключение.');
        }
    });

    // Показать модальное окно оплаты
    function showPaymentModal(data) {
        const paymentDetails = document.getElementById('payment-details');
        paymentDetails.innerHTML = `
            <div class="order-info">
                <p><strong>Заказ №:</strong> ${data.order.id}</p>
                <p><strong>Количество UC:</strong> ${selectedProduct.uc}</p>
                <p><strong>Сумма:</strong> $${selectedProduct.price} ${selectedProduct.currency}</p>
                <p><strong>Player ID:</strong> ${data.order.player_id}</p>
                <p><strong>Способ оплаты:</strong> ${selectedPaymentMethod === 'binance' ? 'Binance Pay (USDT)' : 'Google Pay'}</p>
                <p><strong>Ссылка для оплаты:</strong> <a href="${data.paymentLink}" target="_blank">Перейти к оплате</a></p>
            </div>
            <div class="payment-instructions">
                <h4>Инструкция по оплате:</h4>
                <p>1. Нажмите "Подтвердить оплату"</p>
                <p>2. Будет открыта страница оплаты</p>
                <p>3. Оплатите заказ через выбранную систему</p>
                <p>4. После оплаты UC поступят в течение 5-10 минут</p>
            </div>
        `;
        
        paymentModal.style.display = 'flex';
    }

    // Поддержка
    function showSupportWidget() {
        supportWidget.style.display = 'block';
        loadFAQ();
    }

    closeSupport.addEventListener('click', () => {
        supportWidget.style.display = 'none';
    });

    // Загрузка FAQ
    async function loadFAQ() {
        try {
            const response = await fetch('/api/faq');
            const faq = await response.json();
            
            // Добавляем вопросы в быстрые
            quickQuestions.forEach((btn, index) => {
                if (faq[index]) {
                    btn.dataset.q = faq[index].q;
                    btn.textContent = faq[index].q;
                }
            });
        } catch (error) {
            console.error('Ошибка загрузки FAQ:', error);
        }
    }

    // Быстрые вопросы
    quickQuestions.forEach(btn => {
        btn.addEventListener('click', function() {
            const question = this.dataset.q;
            addMessage(question, 'user');
            
            // Имитация ответа бота
            setTimeout(() => {
                let answer = '';
                switch(question) {
                    case 'Как найти Player ID?':
                        answer = '1. Откройте PUBG Mobile<br>2. Нажмите на аватар в правом нижнем углу<br>3. Перейдите в раздел "База"<br>4. Ваш Player ID отобразится вверху (9-12 цифр)';
                        break;
                    case 'Сколько ждать доставку?':
                        answer = 'После успешной оплаты: 5–10 минут. В редких случаях до 30 минут.';
                        break;
                    case 'Как оплатить через Binance?':
                        answer = '1. Нажмите "Binance Pay" при оформлении<br>2. Вас перебросит на страницу Binance<br>3. Оплатите USDT через Binance Pay<br>4. Подтвердите транзакцию';
                        break;
                    case 'Возврат средств':
                        answer = 'При отмене заказа до оплаты: автоматически. При технических проблемах: 3-7 рабочих дней. Пишите в поддержку Telegram: @vortex_shop_support';
                        break;
                    default:
                        answer = 'Я понял ваш вопрос. Специалист поддержки ответит вам в Telegram: @vortex_shop_support';
                }
                addMessage(answer, 'bot');
            }, 1000);
        });
    });

    // Отправка сообщения
    sendSupportBtn.addEventListener('click', sendSupportMessage);
    supportInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendSupportMessage();
    });

    function sendSupportMessage() {
        const message = supportInput.value.trim();
        if (!message) return;
        
        addMessage(message, 'user');
        supportInput.value = '';
        
        // Имитация ответа
        setTimeout(() => {
            addMessage('Я передал ваш вопрос специалисту. Ответ поступит в Telegram: @vortex_shop_support', 'bot');
        }, 1500);
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = sender === 'bot' ? `<strong>Vortex Bot:</strong> ${text}` : `<strong>Вы:</strong> ${text}`;
        supportMessages.appendChild(messageDiv);
        supportMessages.scrollTop = supportMessages.scrollHeight;
    }

    // Авторизация
    async function checkAuth() {
        try {
            const response = await fetch('/api/user');
            userData = await response.json();
            
            if (userData.loggedIn === false) {
                userInfo.classList.add('hidden');
                loginBtn.style.display = 'flex';
            } else {
                // Пользователь авторизован
                userInfo.classList.remove('hidden');
                loginBtn.style.display = 'none';
                
                if (userData.avatar) {
                    userAvatar.src = userData.avatar;
                }
                userName.textContent = userData.name || userData.email;
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
        }
    }

    loginBtn.addEventListener('click', () => {
        window.location.href = '/auth/google';
    });

    logoutBtn.addEventListener('click', async () => {
        await fetch('/logout');
        window.location.reload();
    });

    // Модальное окно
    document.getElementById('cancel-payment').addEventListener('click', () => {
        paymentModal.style.display = 'none';
    });

    document.getElementById('confirm-payment').addEventListener('click', () => {
        const link = document.querySelector('#payment-details a');
        if (link) window.open(link.href, '_blank');
    });

    // Показ поддержки при клике на иконку
    document.querySelector('a[href="/support.html"]').addEventListener('click', (e) => {
        e.preventDefault();
        showSupportWidget();
    });

    // Инициализация
    loadProducts();
    checkAuth();
    checkOrderReady();
    
    // Автоматически показать поддержку через 30 секунд
    setTimeout(showSupportWidget, 30000);
});

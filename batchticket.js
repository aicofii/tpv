let isChinese = true;
let selectedDebts = []; // 右侧已选记录
let selectedButtonIndex = -1; // 跟踪模态框中选中的按钮

// 从 localStorage 加载记账数据
function loadDebts() {
    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const debts = tickets.filter(ticket => ticket.paymentMethod === (isChinese ? '记账' : 'A Cuenta'));
    return debts;
}

// 保存记账数据到 localStorage
function saveDebts(tickets) {
    localStorage.setItem('tickets', JSON.stringify(tickets));
}

// 格式化日期时间
function formatDateTime(isoDate) {
    if (!isoDate) return isChinese ? '未知' : 'Desconocido';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isChinese ? '未知' : 'Desconocido';
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    if (isChinese) {
        return date.toLocaleString('zh-CN', options).replace(/\//g, '-');
    } else {
        return date.toLocaleString('es-ES', options);
    }
}

// 显示左侧未结算记录列表
function displayLeftDebtList(debts = null) {
    const tbody = document.getElementById('left-debt-list');
    tbody.innerHTML = '';
    const debtList = (debts || loadDebts()).filter(debt => 
        !debt.isSettled && !selectedDebts.find(sd => sd.id === debt.id)
    );
    if (debtList.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5">${isChinese ? '暂无未结算记录' : 'No hay deudas pendientes'}</td>`;
        tbody.appendChild(row);
        return;
    }
    debtList.forEach(debt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${debt.id}</td>
            <td>${formatDateTime(debt.datetime)}</td>
            <td>${debt.customer}</td>
            <td>${debt.amount.toFixed(2)}</td>
            <td><button class="transfer-btn" onclick="moveToRight('${debt.id}')">→</button></td>
        `;
        tbody.appendChild(row);
    });
}

// 显示右侧已选记录列表
function displayRightDebtList() {
    const tbody = document.getElementById('right-debt-list');
    tbody.innerHTML = '';
    if (selectedDebts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5">${isChinese ? '暂无已选记录' : 'No hay deudas seleccionadas'}</td>`;
        tbody.appendChild(row);
        updateTotalAmount();
        toggleBatchSettleButton();
        return;
    }
    selectedDebts.forEach(debt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="transfer-btn" onclick="moveToLeft('${debt.id}')">←</button></td>
            <td>${debt.id}</td>
            <td>${formatDateTime(debt.datetime)}</td>
            <td>${debt.customer}</td>
            <td>${debt.amount.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
    updateTotalAmount();
    toggleBatchSettleButton();
}

// 将记录移到右侧
function moveToRight(debtId) {
    const debts = loadDebts();
    const debt = debts.find(d => d.id === debtId && !d.isSettled);
    if (debt && !selectedDebts.find(d => d.id === debtId)) {
        selectedDebts.push({ ...debt, amount: parseFloat(debt.amount) });
        displayLeftDebtList();
        displayRightDebtList();
    }
}

// 将记录移回左侧
function moveToLeft(debtId) {
    selectedDebts = selectedDebts.filter(d => d.id !== debtId);
    displayLeftDebtList();
    displayRightDebtList();
}

// 更新总金额
function updateTotalAmount() {
    const total = selectedDebts.reduce((sum, debt) => {
        const amount = typeof debt.amount === 'number' ? debt.amount : parseFloat(debt.amount) || 0;
        return sum + amount;
    }, 0);
    const totalElement = document.getElementById('total-amount');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }
}

// 控制确认结算按钮状态
function toggleBatchSettleButton() {
    const btn = document.getElementById('batch-settle-btn');
    btn.disabled = selectedDebts.length === 0;
}

// 应用查询过滤
function applySearchFilters() {
    const debtId = document.getElementById('search-debt-id').value.trim().toLowerCase();
    const customer = document.getElementById('search-customer').value.trim().toLowerCase();
    const amount = parseFloat(document.getElementById('search-amount').value);
    const debts = loadDebts().filter(debt => !debt.isSettled);
    const filteredDebts = debts.filter(debt => {
        let match = true;
        if (debtId && !debt.id.toLowerCase().includes(debtId)) match = false;
        if (customer && !debt.customer.toLowerCase().includes(customer)) match = false;
        if (!isNaN(amount) && debt.amount !== amount) match = false;
        return match;
    });
    displayLeftDebtList(filteredDebts);
}

// 恢复查询条件并显示所有未结算记录
function resetSearchFilters() {
    document.getElementById('search-debt-id').value = '';
    document.getElementById('search-customer').value = '';
    document.getElementById('search-amount').value = '';
    displayLeftDebtList();
}

// 显示支付方式选择模态框
function showPaymentModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${isChinese ? '选择支付方式' : 'Seleccionar Método de Pago'}</h2>
            <p>${isChinese ? '请选择一种支付方式以完成交易：' : 'Por favor, seleccione un método de pago para completar la transacción:'}</p>
            <div class="payment-buttons">
                <button class="modal-payment-btn card" data-index="0" onclick="settleDebtsWithPayment('${isChinese ? '刷卡' : 'Tarjeta'}', this.closest('.modal'))">${isChinese ? '刷卡' : 'Tarjeta'}</button>
                <button class="modal-payment-btn cash" data-index="1" onclick="this.closest('.modal').remove();showCashPaymentModal();">${isChinese ? '现金' : 'Efectivo'}</button>
            </div>
            <button class="modal-close-btn" data-index="2" onclick="this.closest('.modal').remove(); document.body.focus();">${isChinese ? '关闭' : 'Cerrar'}</button>
        </div>
    `;
    document.body.appendChild(modal);

    // 初始化按钮选择
    selectedButtonIndex = -1;
    const buttons = modal.querySelectorAll('.modal-payment-btn, .modal-close-btn');

    // 定义键盘事件处理函数
    const keydownHandler = (event) => handleButtonNavigation(event, modal);

    // 为模态框添加键盘事件监听器，阻止 Enter 键冒泡
    modal.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.stopPropagation();
        }
    });

    // 为每个按钮添加键盘事件监听器
    buttons.forEach(button => {
        button.addEventListener('keydown', keydownHandler);
    });

    // 自动选中第一个按钮
    if (buttons.length > 0) {
        selectedButtonIndex = 0;
        buttons[0].classList.add('selected');
        buttons[0].focus();
    }

    // 当模态框关闭时，清理事件监听器
    modal.addEventListener('remove', () => {
        buttons.forEach(button => {
            button.removeEventListener('keydown', keydownHandler);
        });
    });
}

// 处理模态框按钮导航
function handleButtonNavigation(event, modal) {
    if (!modal) return;

    const buttons = modal.querySelectorAll('.modal-payment-btn, .modal-close-btn');
    const maxIndex = buttons.length - 1;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();

        // 移除当前选中样式
        if (selectedButtonIndex >= 0) {
            buttons[selectedButtonIndex].classList.remove('selected');
        }

        // 根据按键更新索引
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            selectedButtonIndex = selectedButtonIndex > 0 ? selectedButtonIndex - 1 : maxIndex;
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            selectedButtonIndex = selectedButtonIndex < maxIndex ? selectedButtonIndex + 1 : 0;
        }

        // 应用选中样式并聚焦
        buttons[selectedButtonIndex].classList.add('selected');
        buttons[selectedButtonIndex].focus();
    } else if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        const selectedButton = buttons[selectedButtonIndex];
        if (selectedButton.classList.contains('modal-close-btn')) {
            modal.remove();
            document.body.focus();
        } else {
            selectedButton.click();
        }
    }
}

// 显示现金支付模态框
function showCashPaymentModal() {
    const totalAmount = selectedDebts.reduce((sum, debt) => sum + parseFloat(debt.amount), 0).toFixed(2);
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content cash-modal-content">
            <div class="amount-section">
                <h2>${isChinese ? '现金支付' : 'Pago en Efectivo'}</h2>
                <div>
                    <label>${isChinese ? '应付金额' : 'Monto a Pagar'}: </label>
                    <span id="payableAmount">${totalAmount} ${isChinese ? '元' : 'EUR'}</span>
                </div>
                <div>
                    <label>${isChinese ? '实收金额' : 'Monto Recibido'}: </label>
                    <span id="receivedAmount">0.00 ${isChinese ? '元' : 'EUR'}</span>
                </div>
                <div>
                    <label>${isChinese ? '找零金额' : 'Cambio'}: </label>
                    <span id="changeAmount">0.00 ${isChinese ? '元' : 'EUR'}</span>
                </div>
            </div>
            <div class="numeric-keypad">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '.', '←'].map((item, index) => `
                    <button class="numeric-btn ${item === '←' ? 'delete' : item === '.' ? 'dot' : ''}" 
                            data-index="${index}"
                            onclick="updateCashAmount(this, '${item}', ${totalAmount})">
                        ${item}
                    </button>
                `).join('')}
            </div>
            <div class="button-container">
                <button class="confirm-btn" data-index="12" onclick="confirmCashPayment(this, ${totalAmount})">${isChinese ? '确定' : 'Confirmar'}</button>
                <button class="modal-close-btn" data-index="13" onclick="this.closest('.modal').remove(); document.body.focus();">${isChinese ? '关闭' : 'Cerrar'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // 初始化实收金额
    let receivedAmount = 0;
    let decimalMode = false;
    let decimalPlaces = 0;
    const receivedAmountElement = modal.querySelector('#receivedAmount');
    const changeAmountElement = modal.querySelector('#changeAmount');

    // 初始化按钮选择
    selectedButtonIndex = -1;
    const buttons = modal.querySelectorAll('.numeric-btn, .confirm-btn, .modal-close-btn');

    // 定义键盘事件处理函数
    const keydownHandler = (event) => handleCashModalButtonNavigation(event, modal);

    // 为模态框添加键盘事件监听器，阻止 Enter 键冒泡
    modal.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.stopPropagation();
        }
    });

    // 为每个按钮添加键盘事件监听器
    buttons.forEach(button => {
        button.addEventListener('keydown', keydownHandler);
    });

    // 添加键盘输入处理（0-9 和 .）
    const numericKeyHandler = (event) => {
        const key = event.key;
        if (/^[0-9]$/.test(key) || key === '.') {
            event.preventDefault();
            const button = modal.querySelector(`.numeric-btn:not(.delete):not(.dot)[data-index="${key === '.' ? 10 : parseInt(key)}"]`) ||
                           modal.querySelector(`.numeric-btn.dot[data-index="10"]`);
            if (button) {
                button.click();
            }
        }
    };
    modal.addEventListener('keydown', numericKeyHandler);

    // 自动选中第一个数字按钮
    if (buttons.length > 0) {
        selectedButtonIndex = 0;
        buttons[0].classList.add('selected');
        buttons[0].focus();
    }

    // 当模态框关闭时，清理事件监听器
    modal.addEventListener('remove', () => {
        buttons.forEach(button => {
            button.removeEventListener('keydown', keydownHandler);
        });
        modal.removeEventListener('keydown', numericKeyHandler);
    });

    // 定义更新金额的函数
    window.updateCashAmount = function(button, value, payable) {
        if (value === '←') {
            if (decimalMode && decimalPlaces > 0) {
                receivedAmount = Math.floor(receivedAmount * Math.pow(10, decimalPlaces - 1)) / Math.pow(10, decimalPlaces - 1);
                decimalPlaces--;
                if (decimalPlaces === 0) {
                    decimalMode = false;
                }
            } else {
                receivedAmount = Math.floor(receivedAmount / 10);
            }
        } else if (value === '.') {
            if (!decimalMode) {
                decimalMode = true;
                decimalPlaces = 0;
            }
        } else {
            const num = parseInt(value);
            if (decimalMode) {
                if (decimalPlaces < 2) {
                    receivedAmount = receivedAmount + num / Math.pow(10, decimalPlaces + 1);
                    decimalPlaces++;
                }
            } else {
                receivedAmount = receivedAmount * 10 + num;
            }
        }
        receivedAmountElement.textContent = receivedAmount.toFixed(2) + (isChinese ? ' 元' : ' EUR');
        const change = receivedAmount - payable;
        changeAmountElement.textContent = change.toFixed(2) + (isChinese ? ' 元' : ' EUR');
    };

    // 定义确认现金支付的函数
    window.confirmCashPayment = function(button, payable) {
        if (receivedAmount < payable) {
            alert(isChinese ? '实收金额不足以支付订单！' : 'El monto recibido es insuficiente para pagar el pedido.');
            return;
        }
        settleDebtsWithPayment(isChinese ? '现金' : 'Efectivo', button.closest('.modal'));
    };
}

// 处理现金模态框按钮导航
function handleCashModalButtonNavigation(event, modal) {
    if (!modal) return;

    const buttons = modal.querySelectorAll('.numeric-btn, .confirm-btn, .modal-close-btn');
    const maxIndex = buttons.length - 1;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();

        // 移除当前选中样式
        if (selectedButtonIndex >= 0) {
            buttons[selectedButtonIndex].classList.remove('selected');
        }

        // 根据按键更新索引（模拟数字键盘的网格布局）
        let newIndex = selectedButtonIndex;
        if (event.key === 'ArrowUp') {
            if (selectedButtonIndex >= 3 && selectedButtonIndex <= 11) {
                newIndex = selectedButtonIndex - 3;
            } else if (selectedButtonIndex >= 12) {
                newIndex = 9;
            }
        } else if (event.key === 'ArrowDown') {
            if (selectedButtonIndex <= 8) {
                newIndex = selectedButtonIndex + 3;
            } else if (selectedButtonIndex >= 9 && selectedButtonIndex <= 11) {
                newIndex = 12;
            }
        } else if (event.key === 'ArrowLeft') {
            if (selectedButtonIndex % 3 !== 0 && selectedButtonIndex <= 11) {
                newIndex = selectedButtonIndex - 1;
            } else if (selectedButtonIndex === 13) {
                newIndex = 12;
            }
        } else if (event.key === 'ArrowRight') {
            if ((selectedButtonIndex + 1) % 3 !== 0 && selectedButtonIndex < 11) {
                newIndex = selectedButtonIndex + 1;
            } else if (selectedButtonIndex === 12) {
                newIndex = 13;
            }
        }

        // 确保索引在有效范围内
        newIndex = Math.max(0, Math.min(maxIndex, newIndex));
        selectedButtonIndex = newIndex;

        // 应用选中样式并聚焦
        buttons[selectedButtonIndex].classList.add('selected');
        buttons[selectedButtonIndex].focus();
    } else if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        const selectedButton = buttons[selectedButtonIndex];
        if (selectedButton.classList.contains('modal-close-btn')) {
            modal.remove();
            document.body.focus();
        } else if (selectedButton.classList.contains('confirm-btn')) {
            selectedButton.click();
        } else {
            selectedButton.click();
        }
    }
}

// 使用指定支付方式结算债务
function settleDebtsWithPayment(paymentMethod, modal) {
    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    let success = true;
    selectedDebts.forEach(selected => {
        const ticketIndex = tickets.findIndex(t => t.id === selected.id);
        if (ticketIndex !== -1) {
            tickets[ticketIndex].isSettled = true;
            tickets[ticketIndex].paymentMethod = paymentMethod;
            tickets[ticketIndex].isDebtOnly = false; // 确保结算后的票据在 ticket.html 中可见
        } else {
            success = false;
        }
    });
    if (success) {
        saveDebts(tickets);
        selectedDebts = [];
        displayLeftDebtList();
        displayRightDebtList();
        modal.remove();
    } else {
        alert(isChinese ? '结算失败，请检查数据！' : '¡Error en la liquidación, verifique los datos!');
    }
}

// 确认批量结算
function confirmBatchSettle() {
    if (selectedDebts.length === 0) {
        alert(isChinese ? '没有选中的记录！' : '¡No hay registros seleccionados!');
        return;
    }
    showPaymentModal();
}

// 更新页面语言
function updateLanguage() {
    document.documentElement.lang = isChinese ? 'zh' : 'es';
    document.getElementById('thDebtId').textContent = isChinese ? '记录ID' : 'ID de la Deuda';
    document.getElementById('thDatetime').textContent = isChinese ? '日期时间' : 'Fecha y Hora';
    document.getElementById('thCustomer').textContent = isChinese ? '客户' : 'Cliente';
    document.getElementById('thAmount').textContent = isChinese ? '金额' : 'Monto';
    document.getElementById('thOperation').textContent = isChinese ? '操作' : 'Operación';
    document.getElementById('back-btn').textContent = isChinese ? '返回' : 'Volver';
    document.getElementById('search-confirm-btn').textContent = isChinese ? '查询' : 'Buscar';
    document.getElementById('batch-settle-btn').textContent = isChinese ? '确认结算' : 'Confirmar Liquidación';
    document.querySelector('.left-container h2').textContent = isChinese ? '未结算记录' : 'Deudas Pendientes';
    document.querySelector('.right-container h2').textContent = isChinese ? '已选记录' : 'Deudas Seleccionadas';
    const resetBtn = document.getElementById('search-reset-btn');
    if (resetBtn) {
        resetBtn.textContent = isChinese ? '恢复' : 'Restablecer';
    }
    const summaryDiv = document.querySelector('.summary');
    if (summaryDiv) {
        summaryDiv.innerHTML = `<p>${isChinese ? '总金额: ' : 'Monto Total: '}<span id="total-amount">0.00</span></p>`;
    }
    displayLeftDebtList();
    displayRightDebtList();
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
        isChinese = JSON.parse(savedLanguage);
    }
    const style = document.createElement('style');
    style.textContent = `
        .transfer-btn {
            padding: 5px 10px;
            background-color: #3b82f6;
            color: #ffffff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            min-width: 60px;
        }
        .transfer-btn:hover {
            background-color: #2563eb;
        }
    `;
    document.head.appendChild(style);
    displayLeftDebtList();
    displayRightDebtList();
    updateLanguage();
    document.getElementById('search-confirm-btn').addEventListener('click', applySearchFilters);
    document.getElementById('search-reset-btn').addEventListener('click', resetSearchFilters);
    document.getElementById('batch-settle-btn').addEventListener('click', confirmBatchSettle);
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'deuda.html';
    });
    const inputs = [
        document.getElementById('search-debt-id'),
        document.getElementById('search-customer'),
        document.getElementById('search-amount')
    ];
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const allEmpty = inputs.every(inp => inp.value.trim() === '');
            if (allEmpty) {
                displayLeftDebtList();
            }
        });
    });
});
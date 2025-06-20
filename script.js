let isChinese = true; // Default to Chinese
let selectedAutocompleteIndex = -1; // Track selected item in autocomplete dropdown
let autocompleteItems = []; // Store current autocomplete items
let pendingOrders = []; // Store suspended orders
let currentOrderUUID = null; // Track current order UUID
let selectedButtonIndex = -1; // Track selected button in payment modal
let currentCustomer = null; // Track current customer, null means default customer

// Generate UUID for orders
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Load products and customers from localStorage or use empty array
let products = JSON.parse(localStorage.getItem('products')) || [];
let customers = JSON.parse(localStorage.getItem('customers')) || [];

// Load current order from localStorage or initialize as empty
let currentOrder = JSON.parse(localStorage.getItem('currentOrder')) || {
    uuid: null,
    data: []
};

// Initialize currentOrderUUID from saved order
currentOrderUUID = currentOrder.uuid;

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function toggleLanguage() {
    isChinese = !isChinese;
    localStorage.setItem('language', JSON.stringify(isChinese)); // 保存语言状态
    updateLanguage();
}

function updateLanguage() {
    const lang = isChinese ? 'zh' : 'es';
    document.documentElement.lang = lang;
    document.getElementById('title').textContent = isChinese ? '收银系统' : 'Sistema de Caja';
    document.getElementById('thCode').textContent = isChinese ? '编码/条码' : 'Código/Barras';
    document.getElementById('thQuantity').textContent = isChinese ? '数量' : 'Cantidad';
    document.getElementById('thStock').textContent = isChinese ? '库存' : 'Existencias';
    document.getElementById('thUnitPrice').textContent = isChinese ? '单价' : 'Precio Unitario';
    document.getElementById('thDiscount').textContent = isChinese ? '折扣' : 'Descuento';
    document.getElementById('thTaxRate').textContent = isChinese ? '税率' : 'Tasa de Impuesto';
    document.getElementById('thName').textContent = isChinese ? '名称' : 'Nombre';
    document.getElementById('thDiscountTotal').textContent = isChinese ? '折扣值' : 'Total Descuento';
    document.getElementById('thTotal').textContent = isChinese ? '总计' : 'Total';
    document.getElementById('thUnit').textContent = isChinese ? '单位' : 'Unidad';
    document.getElementById('thOperation').textContent = isChinese ? '操作' : 'Operación';
    document.getElementById('footerTotal').textContent = isChinese ? '总计: ' : 'Total: ';
    document.getElementById('customerName').textContent = isChinese ? `客户: ${currentCustomer || '普通客户'}` : `Cliente: ${currentCustomer || 'Cliente genérico'}`;
    document.querySelectorAll('.footer button')[0].textContent = isChinese ? '添加商品' : 'Agregar Artículo';
    document.querySelectorAll('.footer button')[1].textContent = isChinese ? '挂起' : 'Suspender';
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.textContent = isChinese ? '删除' : 'Eliminar';
    });
    document.getElementById('language-toggle').textContent = isChinese ? '🇪🇸' : '🇨🇳';
    updateTotals();
}

function saveCurrentOrder() {
    const tbody = document.getElementById('items');
    const orderData = [];
    for (let row of tbody.children) {
        const cells = Array.from(row.cells).slice(0, 10); // Exclude operation column
        orderData.push(cells.map(cell => cell.textContent));
    }
    currentOrder = {
        uuid: currentOrderUUID,
        data: orderData
    };
    localStorage.setItem('currentOrder', JSON.stringify(currentOrder));
}

function restoreCurrentOrder() {
    const tbody = document.getElementById('items');
    tbody.innerHTML = '';
    if (currentOrder.data.length > 0) {
        currentOrder.data.forEach(rowData => {
            const row = document.createElement('tr');
            row.innerHTML = `
                ${rowData.map((cell, i) => `<td contenteditable="true" ${i === 0 || i === 6 ? 'class="autocomplete"' : ''}>${cell}</td>`).join('')}
                <td><button class="delete-btn" onclick="deleteRow(this)">${isChinese ? '删除' : 'Eliminar'}</button></td>
            `;
            tbody.appendChild(row);
        });
        currentOrderUUID = currentOrder.uuid || generateUUID();
    }
    updateTotals();
}

function addItem() {
    const tbody = document.getElementById('items');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td contenteditable="true" class="autocomplete"></td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td contenteditable="true">0.00</td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td contenteditable="true" class="autocomplete"></td>
        <td contenteditable="true">0.00</td>
        <td contenteditable="true">0.00</td>
        <td contenteditable="true"></td>
        <td><button class="delete-btn" onclick="deleteRow(this)">${isChinese ? '删除' : 'Eliminar'}</button></td>
    `;
    tbody.appendChild(row);
    if (!currentOrderUUID) {
        currentOrderUUID = generateUUID();
    }
    saveCurrentOrder();
    updateTotals();
    row.cells[0].focus();
}

function deleteRow(element) {
    const row = element.closest('tr');
    const tbody = document.getElementById('items');
    row.remove();
    saveCurrentOrder();
    updateTotals();
    if (tbody.children.length === 0) {
        document.body.focus();
        currentOrderUUID = null; // Reset UUID when table is empty
        saveCurrentOrder();
    } else {
        const firstRow = tbody.children[0];
        if (firstRow) firstRow.cells[0].focus();
    }
}

function suspendOrder() {
    const tbody = document.getElementById('items');
    if (tbody.children.length === 0) {
        alert(isChinese ? '当前订单为空，无法挂起！' : 'El pedido actual está vacío, no se puede suspender.');
        return;
    }
    const orderData = [];
    for (let row of tbody.children) {
        const cells = Array.from(row.cells).slice(0, 10); // Exclude operation column
        orderData.push(cells.map(cell => cell.textContent));
    }
    const orderUUID = currentOrderUUID || generateUUID();
    const orderId = 'ORD' + (pendingOrders.length + 1).toString().padStart(4, '0');
    const existingOrderIndex = pendingOrders.findIndex(o => o.uuid === orderUUID);
    const order = {
        id: orderId,
        uuid: orderUUID,
        timestamp: new Date().toLocaleString(isChinese ? 'zh-CN' : 'es-ES'),
        data: orderData
    };
    if (existingOrderIndex >= 0) {
        pendingOrders[existingOrderIndex] = order; // Update existing order
    } else {
        pendingOrders.push(order); // Add new order
    }
    tbody.innerHTML = '';
    currentOrderUUID = null;
    saveCurrentOrder();
    updateTotals();
    document.body.focus();
    alert(isChinese ? `订单 ${orderId} 已挂起！` : `¡El pedido ${orderId} ha sido suspendido!`);
}

function retrieveOrder() {
    if (pendingOrders.length === 0) {
        alert(isChinese ? '没有挂起的订单！' : 'No hay pedidos suspendidos.');
        return;
    }
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${isChinese ? '挂单列表' : 'Lista de Pedidos Suspendidos'}</h2>
            <table class="pending-orders-table">
                <thead>
                    <tr>
                        <th>${isChinese ? '订单ID' : 'ID del Pedido'}</th>
                        <th>${isChinese ? '挂起时间' : 'Hora de Suspensión'}</th>
                        <th>${isChinese ? '操作' : 'Operaciones'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${pendingOrders.map(order => `
                        <tr>
                            <td>${order.id}</td>
                            <td>${order.timestamp}</td>
                            <td>
                                <button onclick="restoreOrder('${order.uuid}')">${isChinese ? '恢复' : 'Restaurar'}</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <button class="modal-close-btn" onclick="this.closest('.modal').remove()">${isChinese ? '关闭' : 'Cerrar'}</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function restoreOrder(orderUUID) {
    const order = pendingOrders.find(o => o.uuid === orderUUID);
    if (!order) return;
    const tbody = document.getElementById('items');
    tbody.innerHTML = '';
    order.data.forEach(rowData => {
        const row = document.createElement('tr');
        row.innerHTML = `
            ${rowData.map((cell, i) => `<td contenteditable="true" ${i === 0 || i === 6 ? 'class="autocomplete"' : ''}>${cell}</td>`).join('')}
            <td><button class="delete-btn" onclick="deleteRow(this)">${isChinese ? '删除' : 'Eliminar'}</button></td>
        `;
        tbody.appendChild(row);
    });
    currentOrderUUID = orderUUID;
    saveCurrentOrder();
    updateTotals();
    document.querySelector('.modal').remove();
    tbody.children[0]?.cells[0].focus();
}

function updateTotals() {
    const rows = document.getElementById('items').getElementsByTagName('tr');
    let totalItems = 0;
    let totalAmount = 0;

    for (let row of rows) {
        const qty = parseInt(row.cells[1].textContent) || 0;
        const price = parseFloat(row.cells[3].textContent) || 0;
        const discount = parseFloat(row.cells[4].textContent) || 0;
        const taxRate = parseFloat(row.cells[5].textContent) || 0;
        const discountTotal = discount > 0 ? (qty * price * (discount / 100)).toFixed(2) : "0.00";
        row.cells[7].textContent = discountTotal;
        const rowTotal = (qty * price - parseFloat(discountTotal)) * (1 + taxRate / 100);
        row.cells[8].textContent = rowTotal.toFixed(2);
        totalItems += qty;
        totalAmount += rowTotal;
    }

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('footerAmount').textContent = totalAmount.toFixed(2) + (isChinese ? ' 元' : ' EUR');
    return totalAmount.toFixed(2); // 返回总金额以便在现金支付模态框中使用
}

function showAutocomplete(cell, value) {
    const existingDropdown = cell.querySelector('.autocomplete-dropdown');
    if (existingDropdown) existingDropdown.remove();

    selectedAutocompleteIndex = -1;
    autocompleteItems = [];

    if (!value || value.trim() === '') return;

    const columnIndex = cell.cellIndex;
    let matches = [];

    // 规范化输入值，去除首尾空格
    const normalizedValue = value.trim().toLowerCase();

    if (columnIndex === 0) {
        // 对于“编码/条码”列，同时匹配 id 和 barcode
        matches = products.filter(product =>
            product.id.toLowerCase().includes(normalizedValue) ||
            product.barcode.toLowerCase().includes(normalizedValue)
        );
    } else if (columnIndex === 6) {
        // 对于“名称”列，匹配 name
        matches = products.filter(product =>
            product.name.toLowerCase().includes(normalizedValue)
        );
    }

    if (matches.length === 0) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    matches.forEach(product => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = `${product.id} - ${product.barcode} - ${product.name}`;
        item.addEventListener('click', () => {
            selectProduct(cell, product);
        });
        dropdown.appendChild(item);
        autocompleteItems.push(item);
    });

    cell.appendChild(dropdown);
}

function selectProduct(cell, product) {
    const row = cell.closest('tr');
    row.cells[0].textContent = product.barcode; // 始终显示 barcode
    row.cells[2].textContent = product.stock;
    row.cells[3].textContent = product.unitPrice.toFixed(2);
    row.cells[5].textContent = (product.taxRate * 100).toFixed(2);
    row.cells[6].textContent = product.name;
    row.cells[9].textContent = product.unit;
    const dropdown = cell.querySelector('.autocomplete-dropdown');
    if (dropdown) dropdown.remove();
    saveCurrentOrder();
    updateTotals();
    selectedAutocompleteIndex = -1;
    autocompleteItems = [];
    if (cell.cellIndex === 0) {
        row.cells[1].focus();
    }
}

function printReceipt() {
    const rows = document.getElementById('items').getElementsByTagName('tr');
    let receiptContent = isChinese ? '=== 收银小票 ===\n\n' : '=== Receipt ===\n\n';
    receiptContent += isChinese ? '商品清单:\n' : 'Item List:\n';
    receiptContent += '----------------------------------------\n';

    let totalAmount = 0;
    for (let row of rows) {
        const name = row.cells[6].textContent;
        const qty = parseInt(row.cells[1].textContent) || 0;
        const price = parseFloat(row.cells[3].textContent) || 0;
        const discount = parseFloat(row.cells[4].textContent) || 0;
        const taxRate = parseFloat(row.cells[5].textContent) || 0;
        const discountTotal = discount > 0 ? (qty * price * (discount / 100)).toFixed(2) : "0.00";
        const rowTotal = ((qty * price - parseFloat(discountTotal)) * (1 + taxRate / 100)).toFixed(2);
        receiptContent += `${name} x${qty}\n`;
        receiptContent += isChinese ? `单价: ${price.toFixed(2)} 元` : `Unit Price: ${price.toFixed(2)} EUR`;
        if (discount > 0) {
            receiptContent += isChinese ? `, 折扣: ${discount}%` : `, Discount: ${discount}%`;
        }
        receiptContent += isChinese ? `, 税率: ${taxRate}%` : `, Tax Rate: ${taxRate}%`;
        receiptContent += isChinese ? `, 小计: ${rowTotal} 元\n` : `, Subtotal: ${rowTotal} EUR\n`;
        totalAmount += parseFloat(rowTotal);
    }

    receiptContent += '----------------------------------------\n';
    receiptContent += isChinese ? `总计: ${totalAmount.toFixed(2)} 元\n` : `Total: ${totalAmount.toFixed(2)} EUR\n`;
    receiptContent += isChinese ? `\n打印时间: ${new Date().toLocaleString('zh-CN')}\n` : `\nPrint Time: ${new Date().toLocaleString('es-ES')}\n`;
    receiptContent += isChinese ? '感谢您的惠顾！\n' : 'Thank you for your purchase!\n';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>${isChinese ? '收银小票' : 'Receipt'}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                pre { white-space: pre-wrap; font-size: 14px; }
            </style>
        </head>
        <body>
            <pre>${receiptContent}</pre>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function saveOrderToTickets(paymentMethod = isChinese ? '现金' : 'Efectivo', selectedCustomer = null, isDebt = false) {
    const tbody = document.getElementById('items');
    if (tbody.children.length === 0) {
        console.warn('订单为空，无法保存到票据列表');
        return false; // 返回 false 表示保存失败
    }

    let totalAmount = 0;
    for (let row of tbody.children) {
        const qty = parseInt(row.cells[1].textContent) || 0;
        const price = parseFloat(row.cells[3].textContent) || 0;
        const discount = parseFloat(row.cells[4].textContent) || 0;
        const taxRate = parseFloat(row.cells[5].textContent) || 0;
        const discountTotal = discount > 0 ? (qty * price * (discount / 100)) : 0;
        const rowTotal = (qty * price - discountTotal) * (1 + taxRate / 100);
        totalAmount += rowTotal;
    }

    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const ticketId = 'TCK' + (tickets.length + 1).toString().padStart(4, '0');
    const newTicket = {
        id: ticketId,
        type: '销售',
        datetime: new Date().toISOString(),
        customer: selectedCustomer || currentCustomer || '普通客户',
        paymentMethod: paymentMethod,
        amount: parseFloat(totalAmount.toFixed(2)), // 确保金额为浮点数
        isSettled: !isDebt, // 记账订单未结算
        isInvoiced: false,
        isDebtOnly: isDebt // 记账订单标记为仅记账
    };

    try {
        tickets.push(newTicket);
        localStorage.setItem('tickets', JSON.stringify(tickets));
        console.log(`票据 ${ticketId} 已保存到 localStorage: `, newTicket);
        return true; // 返回 true 表示保存成功
    } catch (error) {
        console.error('保存票据失败: ', error);
        return false; // 返回 false 表示保存失败
    }
}

function showCustomerSelectionModal(paymentModal) {
    const modal = document.createElement('div');
    modal.className = 'modal customer-selection-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${isChinese ? '选择客户' : 'Seleccionar Cliente'}</h2>
            <p>${isChinese ? '请输入客户信息以完成记账：' : 'Por favor, ingrese la información del cliente para completar la cuenta:'}</p>
            <form id="customer-selection-form">
                <div class="form-group">
                    <label for="company-name">${isChinese ? '公司名称' : 'Nombre de la Empresa'}:</label>
                    <input type="text" id="company-name" class="autocomplete-customer" required>
                </div>
                <div class="form-group">
                    <label for="trade-name">${isChinese ? '商业名称' : 'Nombre Comercial'}:</label>
                    <input type="text" id="trade-name" class="autocomplete-customer">
                </div>
                <div class="form-group">
                    <label for="tax-id">${isChinese ? '税号' : 'NIF'}:</label>
                    <input type="text" id="tax-id" class="autocomplete-customer" required>
                </div>
                <div class="form-group">
                    <label for="phone">${isChinese ? '电话' : 'Teléfono'}:</label>
                    <input type="tel" id="phone" class="autocomplete-customer">
                </div>
                <div class="modal-buttons">
                    <button type="button" class="modal-close-btn" data-index="0">${isChinese ? '关闭' : 'Cerrar'}</button>
                    <button type="submit" class="modal-confirm-btn" data-index="1">${isChinese ? '确认' : 'Confirmar'}</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // 自动完成功能
    const inputs = modal.querySelectorAll('.autocomplete-customer');
    inputs.forEach(input => {
        input.addEventListener('input', debounce(function() {
            const field = input.id;
            const value = input.value.trim().toLowerCase();
            if (!value) return;

            const matchedCustomer = customers.find(customer =>
                (field === 'company-name' && customer.companyName.toLowerCase().includes(value)) ||
                (field === 'trade-name' && customer.tradeName.toLowerCase().includes(value)) ||
                (field === 'tax-id' && customer.taxId.toLowerCase().includes(value)) ||
                (field === 'phone' && customer.phone.toLowerCase().includes(value))
            );

            if (matchedCustomer) {
                modal.querySelector('#company-name').value = matchedCustomer.companyName;
                modal.querySelector('#trade-name').value = matchedCustomer.tradeName;
                modal.querySelector('#tax-id').value = matchedCustomer.taxId;
                modal.querySelector('#phone').value = matchedCustomer.phone;
            }
        }, 300));
    });

    // 关闭按钮
    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
        modal.remove();
        paymentModal.style.display = 'flex'; // 恢复支付模态框
    });

    // 表单提交
    const form = modal.querySelector('#customer-selection-form');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const companyName = modal.querySelector('#company-name').value;
        const taxId = modal.querySelector('#tax-id').value;
        const selectedCustomer = customers.find(c => c.companyName === companyName && c.taxId === taxId);
        if (!selectedCustomer) {
            alert(isChinese ? '未找到匹配的客户，请检查输入！' : 'No se encontró un cliente coincidente, ¡verifique la entrada!');
            return;
        }
        if (saveOrderToTickets(isChinese ? '记账' : 'A Cuenta', selectedCustomer.companyName, true)) {
            document.getElementById('items').innerHTML = '';
            currentOrderUUID = null;
            saveCurrentOrder();
            updateTotals();
            modal.remove();
            paymentModal.remove();
        } else {
            alert(isChinese ? '保存订单失败，请检查订单数据！' : 'Error al guardar el pedido, ¡verifique los datos del pedido!');
        }
    });

    // 键盘导航
    const buttons = modal.querySelectorAll('.modal-close-btn, .modal-confirm-btn');
    selectedButtonIndex = -1;

    const keydownHandler = (event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            if (selectedButtonIndex >= 0) {
                buttons[selectedButtonIndex].classList.remove('selected');
            }
            if (event.key === 'ArrowLeft') {
                selectedButtonIndex = selectedButtonIndex > 0 ? selectedButtonIndex - 1 : buttons.length - 1;
            } else {
                selectedButtonIndex = selectedButtonIndex < buttons.length - 1 ? selectedButtonIndex + 1 : 0;
            }
            buttons[selectedButtonIndex].classList.add('selected');
            buttons[selectedButtonIndex].focus();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            buttons[selectedButtonIndex].click();
        }
    };

    buttons.forEach(button => {
        button.addEventListener('keydown', keydownHandler);
    });

    if (buttons.length > 0) {
        selectedButtonIndex = 0;
        buttons[0].classList.add('selected');
        buttons[0].focus();
    }

    modal.addEventListener('remove', () => {
        buttons.forEach(button => {
            button.removeEventListener('keydown', keydownHandler);
        });
    });
}

function showPaymentModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${isChinese ? '选择支付方式' : 'Seleccionar Método de Pago'}</h2>
            <p>${isChinese ? '请选择一种支付方式以完成交易：' : 'Por favor, seleccione un método de pago para completar la transacción:'}</p>
            <div class="payment-buttons">
                <button class="modal-payment-btn card" data-index="0" onclick="if(saveOrderToTickets('${isChinese ? '刷卡' : 'Tarjeta'}')){document.getElementById('items').innerHTML='';currentOrderUUID=null;saveCurrentOrder();updateTotals();this.closest('.modal').remove();}else{alert('${isChinese ? '保存订单失败，请检查订单数据！' : 'Error al guardar el pedido, ¡verifique los datos del pedido!'}');}">${isChinese ? '刷卡' : 'Tarjeta'}</button>
                <button class="modal-payment-btn cash" data-index="1" onclick="this.closest('.modal').remove();showCashPaymentModal();">${isChinese ? '现金' : 'Efectivo'}</button>
                <button class="modal-payment-btn account" data-index="2" onclick="this.closest('.modal').style.display='none';showCustomerSelectionModal(this.closest('.modal'))">${isChinese ? '记账' : 'A Cuenta'}</button>
            </div>
            <button class="modal-close-btn" data-index="3" onclick="this.closest('.modal').remove(); document.body.focus();">${isChinese ? '关闭' : 'Cerrar'}</button>
        </div>
    `;
    document.body.appendChild(modal);
    console.log('Payment modal created and appended to body');

    // 初始化按钮选择
    selectedButtonIndex = -1;
    const buttons = modal.querySelectorAll('.modal-payment-btn, .modal-close-btn');

    // 定义键盘事件处理函数
    const keydownHandler = (event) => handleButtonNavigation(event, modal);

    // 为模态框添加键盘事件监听器，阻止 Enter 键冒泡
    modal.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.stopPropagation(); // 阻止 Enter 键冒泡到文档
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

function showCashPaymentModal() {
    const totalAmount = updateTotals(); // 获取当前订单总金额
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
    console.log('Cash payment modal created and appended to body');

    // 初始化实收金额
    let receivedAmount = 0;
    let decimalMode = false; // 跟踪是否进入小数模式
    let decimalPlaces = 0; // 跟踪小数点后的位数
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
            event.stopPropagation(); // 阻止 Enter 键冒泡到文档
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
            event.preventDefault(); // 阻止默认输入行为
            const button = modal.querySelector(`.numeric-btn:not(.delete):not(.dot)[data-index="${key === '.' ? 10 : parseInt(key)}"]`) ||
                           modal.querySelector(`.numeric-btn.dot[data-index="10"]`);
            if (button) {
                button.click(); // 模拟点击对应的数字或小数点按钮
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
        modal.removeEventListener('keydown', numericKeyHandler); // 清理数字键盘监听器
    });

    // 定义更新金额的函数
    window.updateCashAmount = function(button, value, payable) {
        if (value === '←') {
            if (decimalMode && decimalPlaces > 0) {
                // 删除小数部分最后一位
                receivedAmount = Math.floor(receivedAmount * Math.pow(10, decimalPlaces - 1)) / Math.pow(10, decimalPlaces - 1);
                decimalPlaces--;
                if (decimalPlaces === 0) {
                    decimalMode = false; // 小数部分删除完，退出小数模式
                }
            } else {
                // 删除整数部分最后一位
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

    // 定义确认支付的函数
    window.confirmCashPayment = function(button, payable) {
        if (receivedAmount < payable) {
            alert(isChinese ? '实收金额不足以支付订单！' : 'El monto recibido es insuficiente para pagar el pedido.');
            return;
        }
        if (saveOrderToTickets(isChinese ? '现金' : 'Efectivo')) {
            document.getElementById('items').innerHTML = '';
            currentOrderUUID = null;
            saveCurrentOrder();
            updateTotals();
            button.closest('.modal').remove();
            document.body.focus();
        } else {
            alert(isChinese ? '保存订单失败，请检查订单数据！' : 'Error al guardar el pedido, ¡verifique los datos del pedido!');
        }
    };
}

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
        event.stopPropagation(); // 再次确保 Enter 键不冒泡
        const selectedButton = buttons[selectedButtonIndex];
        if (selectedButton.classList.contains('modal-close-btn')) {
            modal.remove(); // 关闭模态框
            document.body.focus(); // 将焦点转移到页面主体
        } else {
            selectedButton.click(); // 触发支付按钮的点击事件
        }
    }
}

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
                newIndex = selectedButtonIndex - 3; // 上移一行
            } else if (selectedButtonIndex >= 12) {
                newIndex = 9; // 从确定/关闭按钮跳到最后一行
            }
        } else if (event.key === 'ArrowDown') {
            if (selectedButtonIndex <= 8) {
                newIndex = selectedButtonIndex + 3; // 下移一行
            } else if (selectedButtonIndex >= 9 && selectedButtonIndex <= 11) {
                newIndex = 12; // 从最后一行跳到确定按钮
            }
        } else if (event.key === 'ArrowLeft') {
            if (selectedButtonIndex % 3 !== 0 && selectedButtonIndex <= 11) {
                newIndex = selectedButtonIndex - 1; // 左移
            } else if (selectedButtonIndex === 13) {
                newIndex = 12; // 从关闭跳到确定
            }
        } else if (event.key === 'ArrowRight') {
            if ((selectedButtonIndex + 1) % 3 !== 0 && selectedButtonIndex < 11) {
                newIndex = selectedButtonIndex + 1; // 右移
            } else if (selectedButtonIndex === 12) {
                newIndex = 13; // 从确定跳到关闭
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
        event.stopPropagation(); // 再次确保 Enter 键不冒泡
        const selectedButton = buttons[selectedButtonIndex];
        if (selectedButton.classList.contains('modal-close-btn')) {
            modal.remove(); // 关闭模态框
            document.body.focus(); // 将焦点转移到页面主体
        } else if (selectedButton.classList.contains('confirm-btn')) {
            selectedButton.click(); // 触发确认支付
        } else {
            selectedButton.click(); // 触发数字按钮
        }
    }
}

function showProducts() {
    window.location.href = 'product.html';
}

function showCustomers() {
    window.location.href = 'customer.html';
}

function showReceipts() {
    window.location.href = 'ticket.html';
}

function showAccounting() {
    window.location.href = 'deuda.html';
}

function issueInvoice() {
    alert(isChinese ? '开发票 (F5)' : 'Issue Invoice (F5)');
}

function switchUser() {
    alert(isChinese ? '切换用户 (F11)' : 'Switch User (F11)');
}

function openCashDrawer() {
    alert(isChinese ? '打开钱箱 (F12)' : 'Open Cash Drawer (F12)');
}

document.addEventListener('keydown', function(event) {
    // 如果存在模态框，阻止文档级别的 Enter 键处理
    if (document.querySelector('.modal')) {
        if (event.key === 'Enter') {
            event.stopPropagation();
            return;
        }
    }

    const target = event.target;
    const isEditable = target.isContentEditable;
    const dropdown = isEditable ? target.querySelector('.autocomplete-dropdown') : null;

    if (!isEditable && event.key === 'Enter') {
        event.preventDefault();
        if (document.getElementById('items').children.length === 0) {
            addItem();
        } else {
            showPaymentModal();
        }
        return;
    }

    if (event.key === ' ' && document.getElementById('items').children.length > 0) {
        event.preventDefault();
        printReceipt();
        return;
    }

    if (event.key === 'F6') {
        event.preventDefault();
        retrieveOrder();
        return;
    }

    if (!isEditable) return;

    const row = target.closest('tr');
    const cells = Array.from(row.cells).filter(cell => cell.isContentEditable);
    const cellIndex = cells.indexOf(target);
    const rows = Array.from(document.getElementById('items').getElementsByTagName('tr'));
    const rowIndex = rows.indexOf(row);

    if (dropdown && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault();
        if (autocompleteItems.length === 0) return;

        if (selectedAutocompleteIndex >= 0) {
            autocompleteItems[selectedAutocompleteIndex].classList.remove('selected');
        }

        if (event.key === 'ArrowUp') {
            selectedAutocompleteIndex = selectedAutocompleteIndex > 0 ? selectedAutocompleteIndex - 1 : autocompleteItems.length - 1;
        } else if (event.key === 'ArrowDown') {
            selectedAutocompleteIndex = selectedAutocompleteIndex < autocompleteItems.length - 1 ? selectedAutocompleteIndex + 1 : 0;
        }

        autocompleteItems[selectedAutocompleteIndex].classList.add('selected');
        autocompleteItems[selectedAutocompleteIndex].scrollIntoView({ block: 'nearest' });
    } else if (dropdown && event.key === 'Enter') {
        event.preventDefault();
        if (selectedAutocompleteIndex >= 0) {
            const product = products.find(p =>
                `${p.id} - ${p.barcode} - ${p.name}` === autocompleteItems[selectedAutocompleteIndex].textContent
            );
            if (product) selectProduct(target, product);
        } else {
            showPaymentModal();
        }
    } else if (event.key === 'ArrowDown' && rowIndex === rows.length - 1 && !dropdown) {
        event.preventDefault();
        addItem();
    } else if (event.key === 'Enter') {
        event.preventDefault();
        showPaymentModal();
    } else if (event.key === 'Delete') {
        event.preventDefault();
        deleteRow(target);
    } else if (event.key === 'ArrowLeft' && cellIndex > 0) {
        event.preventDefault();
        cells[cellIndex - 1].focus();
    } else if (event.key === 'ArrowRight' && cellIndex < cells.length - 1) {
        event.preventDefault();
        cells[cellIndex + 1].focus();
    } else if (event.key === 'ArrowUp' && rowIndex > 0 && !dropdown) {
        event.preventDefault();
        const prevRowCells = Array.from(rows[rowIndex - 1].cells).filter(cell => cell.isContentEditable);
        prevRowCells[Math.min(cellIndex, prevRowCells.length - 1)].focus();
    } else if (event.key === 'ArrowDown' && rowIndex < rows.length - 1 && !dropdown) {
        event.preventDefault();
        const nextRowCells = Array.from(rows[rowIndex + 1].cells).filter(cell => cell.isContentEditable);
        nextRowCells[Math.min(cellIndex, nextRowCells.length - 1)].focus();
    }
});

document.addEventListener('input', debounce(function(event) {
    const target = event.target;
    if (target.isContentEditable && target.classList.contains('autocomplete')) {
        showAutocomplete(target, target.textContent);
    }
    saveCurrentOrder();
    updateTotals();
}, 300));

// Initialize page by restoring current order
document.addEventListener('DOMContentLoaded', function() {
    // 从 localStorage 加载语言状态
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
        isChinese = JSON.parse(savedLanguage);
    }
    restoreCurrentOrder();
    updateLanguage();
});
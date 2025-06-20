let isChinese = true; // 默认语言为中文，稍后从 localStorage 加载
let isFiltered = false; // 跟踪是否已应用筛选

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
        // 中文格式：YYYY-MM-DD HH:mm:ss
        return date.toLocaleString('zh-CN', options).replace(/\//g, '-');
    } else {
        // 西班牙语格式：DD/MM/YYYY HH:mm:ss
        return date.toLocaleString('es-ES', options);
    }
}

// 从 localStorage 加载票据数据，过滤掉仅记账票据
function loadTickets() {
    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const filteredTickets = tickets.filter(ticket => !ticket.isDebtOnly); // 过滤 isDebtOnly 为 true 的票据
    console.log('加载的票据数据:', filteredTickets); // 调试日志
    return filteredTickets;
}

// 保存票据数据到 localStorage
function saveTickets(tickets) {
    localStorage.setItem('tickets', JSON.stringify(tickets));
    console.log('保存的票据数据:', tickets); // 调试日志
}

// 显示票据列表
function displayTicketList(tickets = null) {
    const tbody = document.getElementById('ticket-list');
    if (!tbody) {
        console.error('未找到 ticket-list 元素');
        return;
    }
    tbody.innerHTML = '';
    const ticketList = tickets || loadTickets();
    if (ticketList.length === 0) {
        console.log('票据列表为空');
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7">${isChinese ? '暂无票据数据' : 'No hay datos de tickets'}</td>`;
        tbody.appendChild(row);
        return;
    }
    // 按日期时间降序排序
    ticketList.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    ticketList.forEach(ticket => {
        console.log('渲染票据:', ticket); // 调试日志
        const row = document.createElement('tr');
        // 根据 isInvoiced 字段和语言设置类型
        const ticketType = ticket.isInvoiced 
            ? (isChinese ? '发票' : 'Invoice') 
            : (isChinese ? '小票' : 'Ticket');
        row.innerHTML = `
            <td>${ticket.id || '未知'}</td>
            <td>${ticketType}</td>
            <td>${formatDateTime(ticket.datetime)}</td>
            <td>${ticket.customer || '未知'}</td>
            <td>${ticket.paymentMethod || '未知'}</td>
            <td>${typeof ticket.amount === 'number' ? ticket.amount.toFixed(2) : '0.00'}</td>
            <td>
                <button class="view-btn" onclick="viewTicket('${ticket.id}')">${isChinese ? '查看' : 'Ver'}</button>
                <button class="issue-btn" onclick="showCustomerSelectionModalForInvoice('${ticket.id}')" ${ticket.isInvoiced || ticket.hasInvoiced ? 'disabled' : ''}>${isChinese ? '开票' : 'Emitir Factura'}</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 查看票据详情
function viewTicket(ticketId) {
    const tickets = loadTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
        console.error('未找到票据:', ticketId);
        return;
    }
    const modal = document.getElementById('ticketModal');
    const detailsBody = document.getElementById('ticketDetails');
    if (!modal || !detailsBody) {
        console.error('模态框或详情元素未找到');
        return;
    }
    // 根据语言显示字段
    const ticketType = ticket.isInvoiced 
        ? (isChinese ? '发票' : 'Invoice') 
        : (isChinese ? '小票' : 'Ticket');
    detailsBody.innerHTML = `
        <tr><td>${isChinese ? '票据ID' : 'ID del Ticket'}</td><td>${ticket.id || '未知'}</td></tr>
        <tr><td>${isChinese ? '类型' : 'Tipo'}</td><td>${ticketType}</td></tr>
        <tr><td>${isChinese ? '日期时间' : 'Fecha y Hora'}</td><td>${formatDateTime(ticket.datetime)}</td></tr>
        <tr><td>${isChinese ? '客户' : 'Cliente'}</td><td>${ticket.customer || '未知'}</td></tr>
        <tr><td>${isChinese ? '支付方式' : 'Método de Pago'}</td><td>${ticket.paymentMethod || '未知'}</td></tr>
        <tr><td>${isChinese ? '金额' : 'Monto'}</td><td>${typeof ticket.amount === 'number' ? ticket.amount.toFixed(2) : '0.00'}</td></tr>
    `;
    modal.style.display = 'flex';
    // 添加关闭按钮事件
    const closeBtn = modal.querySelector('.modal-close-btn');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 显示客户选择模态框用于开票
function showCustomerSelectionModalForInvoice(ticketId) {
    const modal = document.createElement('div');
    modal.className = 'modal customer-selection-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${isChinese ? '选择客户' : 'Seleccionar Cliente'}</h2>
            <p>${isChinese ? '请输入客户信息以完成开票：' : 'Por favor, ingrese la información del cliente para completar la factura:'}</p>
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

    // 加载客户数据
    const customers = JSON.parse(localStorage.getItem('customers')) || [];

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
        // 执行开票操作
        const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex === -1) {
            console.error('未找到票据:', ticketId);
            modal.remove();
            return;
        }
        // 标记原始小票为已开票
        tickets[ticketIndex].hasInvoiced = true;
        // 创建新发票记录
        const originalTicket = tickets[ticketIndex];
        const newTicketId = 'TCK' + (tickets.length + 1).toString().padStart(4, '0');
        const newInvoice = {
            id: newTicketId,
            type: originalTicket.type,
            datetime: originalTicket.datetime,
            customer: selectedCustomer.companyName,
            paymentMethod: originalTicket.paymentMethod,
            amount: originalTicket.amount,
            isSettled: originalTicket.isSettled,
            isInvoiced: true,
            isDebtOnly: originalTicket.isDebtOnly,
            hasInvoiced: false // 新发票记录不标记为已开票
        };
        tickets.push(newInvoice);
        saveTickets(tickets);
        displayTicketList(isFiltered ? applyFilteredTickets() : null); // 保持筛选状态
        modal.remove();
    });

    // 键盘导航
    const buttons = modal.querySelectorAll('.modal-close-btn, .modal-confirm-btn');
    let selectedButtonIndex = -1;

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

// 开票操作（已修改为通过客户选择模态框调用）
function issueInvoice(ticketId) {
    // 此函数保留但不再直接调用，逻辑已移至 showCustomerSelectionModalForInvoice
}

// 显示查询模态框
function showSearchModal() {
    // 移除现有的查询模态框（如果有）
    const existingModal = document.querySelector('.search-modal');
    if (existingModal) {
        existingModal.classList.remove('open');
        setTimeout(() => existingModal.remove(), 300); // 等待动画完成
        return;
    }
    const modal = document.createElement('div');
    modal.className = 'search-modal';
    modal.innerHTML = `
        <div class="search-modal-content">
            <h2>${isChinese ? '查询票据' : 'Buscar Tickets'}</h2>
            <div class="search-field">
                <label>${isChinese ? '票据ID' : 'ID del Ticket'}</label>
                <input type="text" id="search-ticket-id" placeholder="${isChinese ? '输入票据ID' : 'Ingrese ID del ticket'}">
            </div>
            <div class="search-field">
                <label>${isChinese ? '客户名称' : 'Nombre del Cliente'}</label>
                <input type="text" id="search-customer" placeholder="${isChinese ? '输入客户名称' : 'Ingrese nombre del cliente'}">
            </div>
            <div class="search-field">
                <label>${isChinese ? '金额' : 'Monto'}</label>
                <input type="number" id="search-amount" step="0.01" placeholder="${isChinese ? '输入金额' : 'Ingrese monto'}">
            </div>
            <div class="search-field">
                <label>${isChinese ? '类型' : 'Tipo'}</label>
                <select id="search-type">
                    <option value="">${isChinese ? '全部' : 'Todos'}</option>
                    <option value="invoice">${isChinese ? '发票' : 'Invoice'}</option>
                    <option value="ticket">${isChinese ? '小票' : 'Ticket'}</option>
                </select>
            </div>
            <div class="search-field">
                <label>${isChinese ? '开始日期' : 'Fecha de Inicio'}</label>
                <input type="date" id="search-start-date">
            </div>
            <div class="search-field">
                <label>${isChinese ? '结束日期' : 'Fecha de Fin'}</label>
                <input type="date" id="search-end-date">
            </div>
            <button id="search-confirm-btn">${isChinese ? '确定' : 'Confirmar'}</button>
        </div>
    `;
    document.body.appendChild(modal);
    // 应用滑入动画
    setTimeout(() => {
        modal.classList.add('open');
    }, 10);
    // 处理确定按钮点击
    document.getElementById('search-confirm-btn').onclick = applySearchFilters;
    // 处理点击页面其他位置关闭
    document.addEventListener('click', function handleClickOutside(event) {
        const modalContent = modal.querySelector('.search-modal-content');
        if (!modalContent.contains(event.target) && !event.target.closest('#search-btn')) {
            modal.classList.remove('open');
            setTimeout(() => {
                modal.remove();
                document.removeEventListener('click', handleClickOutside); // 移除事件监听
            }, 300); // 等待动画完成
        }
    });
}

// 应用查询过滤
function applySearchFilters() {
    const ticketId = document.getElementById('search-ticket-id').value.trim().toLowerCase();
    const customer = document.getElementById('search-customer').value.trim().toLowerCase();
    const amount = parseFloat(document.getElementById('search-amount').value);
    const type = document.getElementById('search-type').value;
    const startDate = document.getElementById('search-start-date').value;
    const endDate = document.getElementById('search-end-date').value;
    const tickets = loadTickets();
    const filteredTickets = tickets.filter(ticket => {
        let match = true;
        if (ticketId && !ticket.id.toLowerCase().includes(ticketId)) {
            match = false;
        }
        if (customer && !ticket.customer.toLowerCase().includes(customer)) {
            match = false;
        }
        if (!isNaN(amount) && ticket.amount !== amount) {
            match = false;
        }
        if (type) {
            const isInvoiced = ticket.isInvoiced;
            if (type === 'invoice' && !isInvoiced) {
                match = false;
            } else if (type === 'ticket' && isInvoiced) {
                match = false;
            }
        }
        if (startDate) {
            const ticketDate = new Date(ticket.datetime);
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); // 设置为当天的开始
            if (ticketDate < start) {
                match = false;
            }
        }
        if (endDate) {
            const ticketDate = new Date(ticket.datetime);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // 设置为当天的结束
            if (ticketDate > end) {
                match = false;
            }
        }
        return match;
    });
    displayTicketList(filteredTickets);
    // 更新按钮为“恢复”
    isFiltered = true;
    updateSearchButton();
    // 关闭模态框
    const modal = document.querySelector('.search-modal');
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => modal.remove(), 300); // 等待动画完成
    }
}

// 恢复初始列表
function resetTicketList() {
    isFiltered = false;
    displayTicketList(); // 显示所有票据
    updateSearchButton();
}

// 更新查询/恢复按钮的状态
function updateSearchButton() {
    const searchBtn = document.getElementById('search-btn');
    if (isFiltered) {
        searchBtn.textContent = isChinese ? '恢复' : 'Restablecer';
        searchBtn.classList.add('reset-btn');
        searchBtn.classList.remove('search-btn-style');
        searchBtn.onclick = resetTicketList;
    } else {
        searchBtn.textContent = isChinese ? '查询' : 'Buscar';
        searchBtn.classList.remove('reset-btn');
        searchBtn.classList.add('search-btn-style');
        searchBtn.onclick = showSearchModal;
    }
}

// 更新页面语言
function updateLanguage() {
    const lang = isChinese ? 'zh' : 'es';
    document.documentElement.lang = lang;
    document.getElementById('thTicketId').textContent = isChinese ? '票据ID' : 'ID del Ticket';
    document.getElementById('thType').textContent = isChinese ? '类型' : 'Tipo';
    document.getElementById('thDatetime').textContent = isChinese ? '日期时间' : 'Fecha y Hora';
    document.getElementById('thCustomer').textContent = isChinese ? '客户' : 'Cliente';
    document.getElementById('thPaymentMethod').textContent = isChinese ? '支付方式' : 'Método de Pago';
    document.getElementById('thAmount').textContent = isChinese ? '金额' : 'Monto';
    document.getElementById('thOperation').textContent = isChinese ? '操作' : 'Operación';
    document.getElementById('batch-invoice').textContent = isChinese ? '批量开票' : 'Facturación Masiva';
    updateSearchButton(); // 更新查询/恢复按钮文本
    displayTicketList(isFiltered ? applyFilteredTickets() : null); // 保持筛选状态
}

// 重新应用筛选（用于语言切换或开票后）
function applyFilteredTickets() {
    const ticketId = localStorage.getItem('search-ticket-id') || '';
    const customer = localStorage.getItem('search-customer') || '';
    const amount = parseFloat(localStorage.getItem('search-amount'));
    const type = localStorage.getItem('search-type') || '';
    const startDate = localStorage.getItem('search-start-date') || '';
    const endDate = localStorage.getItem('search-end-date') || '';
    const tickets = loadTickets();
    return tickets.filter(ticket => {
        let match = true;
        if (ticketId && !ticket.id.toLowerCase().includes(ticketId.toLowerCase())) {
            match = false;
        }
        if (customer && !ticket.customer.toLowerCase().includes(customer.toLowerCase())) {
            match = false;
        }
        if (!isNaN(amount) && ticket.amount !== amount) {
            match = false;
        }
        if (type) {
            const isInvoiced = ticket.isInvoiced;
            if (type === 'invoice' && !isInvoiced) {
                match = false;
            } else if (type === 'ticket' && isInvoiced) {
                match = false;
            }
        }
        if (startDate) {
            const ticketDate = new Date(ticket.datetime);
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (ticketDate < start) {
                match = false;
            }
        }
        if (endDate) {
            const ticketDate = new Date(ticket.datetime);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (ticketDate > end) {
                match = false;
            }
        }
        return match;
    });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    console.log('ticket.js 初始化');
    // 从 localStorage 加载语言状态
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
        isChinese = JSON.parse(savedLanguage);
    }
    const tbody = document.getElementById('ticket-list');
    if (!tbody) {
        console.error('ticket-list 元素未找到');
        return;
    }
    // 动态添加操作按钮样式
    const style = document.createElement('style');
    style.textContent = `
        .view-btn, .issue-btn {
            padding: 5px 10px;
            margin: 0 5px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            color: #ffffff;
        }
        .view-btn {
            background-color: #3b82f6;
        }
        .view-btn:hover {
            background-color: #2563eb;
        }
        .issue-btn {
            background-color: #10b981;
        }
        .issue-btn:hover {
            background-color: #059669;
        }
        .issue-btn:disabled {
            background-color: #6b7280;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
    // 为批量开票按钮添加跳转事件
    const batchInvoiceBtn = document.getElementById('batch-invoice');
    if (batchInvoiceBtn) {
        batchInvoiceBtn.addEventListener('click', () => {
            window.location.href = 'batchInvoice.html';
        });
    } else {
        console.error('未找到批量开票按钮');
    }
    displayTicketList();
    updateLanguage();
    updateSearchButton(); // 初始化按钮状态
});
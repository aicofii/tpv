let isChinese = true;
let selectedTickets = []; // 右侧已选小票

// 从 localStorage 加载票据数据
function loadTickets() {
    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    return tickets;
}

// 保存票据数据到 localStorage
function saveTickets(tickets) {
    localStorage.setItem('tickets', JSON.stringify(tickets));
}

// 显示左侧待开票小票列表
function displayLeftTicketList(tickets = null) {
    const tbody = document.getElementById('left-ticket-list');
    tbody.innerHTML = '';
    const ticketList = (tickets || loadTickets()).filter(ticket => 
        !ticket.isInvoiced && !ticket.hasInvoiced && !selectedTickets.find(st => st.id === ticket.id)
    );
    if (ticketList.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5">${isChinese ? '暂无待开票小票' : 'No hay tickets pendientes'}</td>`;
        tbody.appendChild(row);
        return;
    }
    ticketList.forEach(ticket => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ticket.id}</td>
            <td>${ticket.datetime}</td>
            <td>${ticket.customer}</td>
            <td>${ticket.amount.toFixed(2)}</td>
            <td><button class="transfer-btn" onclick="moveToRight('${ticket.id}')">→</button></td>
        `;
        tbody.appendChild(row);
    });
}

// 显示右侧已选小票列表
function displayRightTicketList() {
    const tbody = document.getElementById('right-ticket-list');
    tbody.innerHTML = '';
    if (selectedTickets.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5">${isChinese ? '暂无已选小票' : 'No hay tickets seleccionados'}</td>`;
        tbody.appendChild(row);
        updateTotalAmount();
        toggleBatchInvoiceButton();
        return;
    }
    selectedTickets.forEach(ticket => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="transfer-btn" onclick="moveToLeft('${ticket.id}')">←</button></td>
            <td>${ticket.id}</td>
            <td>${ticket.datetime}</td>
            <td>${ticket.customer}</td>
            <td>${ticket.amount.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
    updateTotalAmount();
    toggleBatchInvoiceButton();
}

// 将小票移到右侧
function moveToRight(ticketId) {
    const tickets = loadTickets();
    const ticket = tickets.find(t => t.id === ticketId && !t.isInvoiced && !t.hasInvoiced);
    if (ticket && !selectedTickets.find(t => t.id === ticketId)) {
        selectedTickets.push({ ...ticket, amount: parseFloat(ticket.amount) });
        displayLeftTicketList();
        displayRightTicketList();
    }
}

// 将小票移回左侧
function moveToLeft(ticketId) {
    selectedTickets = selectedTickets.filter(t => t.id !== ticketId);
    displayLeftTicketList();
    displayRightTicketList();
}

// 更新总金额
function updateTotalAmount() {
    const total = selectedTickets.reduce((sum, ticket) => {
        const amount = typeof ticket.amount === 'number' ? ticket.amount : parseFloat(ticket.amount) || 0;
        return sum + amount;
    }, 0);
    const totalElement = document.getElementById('total-amount');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }
}

// 控制确认开票按钮状态
function toggleBatchInvoiceButton() {
    const btn = document.getElementById('batch-invoice-btn');
    btn.disabled = selectedTickets.length === 0;
}

// 应用查询过滤
function applySearchFilters() {
    const ticketId = document.getElementById('search-ticket-id').value.trim().toLowerCase();
    const date = document.getElementById('search-date').value;
    const customer = document.getElementById('search-customer').value.trim().toLowerCase();
    const amount = parseFloat(document.getElementById('search-amount').value);
    const tickets = loadTickets().filter(ticket => !ticket.isInvoiced && !ticket.hasInvoiced);
    const filteredTickets = tickets.filter(ticket => {
        let match = true;
        if (ticketId && !ticket.id.toLowerCase().includes(ticketId)) match = false;
        if (date && !ticket.datetime.startsWith(date)) match = false;
        if (customer && !ticket.customer.toLowerCase().includes(customer)) match = false;
        if (!isNaN(amount) && ticket.amount !== amount) match = false;
        return match;
    });
    displayLeftTicketList(filteredTickets);
}

// 恢复查询条件并显示所有小票
function resetSearchFilters() {
    document.getElementById('search-ticket-id').value = '';
    document.getElementById('search-date').value = '';
    document.getElementById('search-customer').value = '';
    document.getElementById('search-amount').value = '';
    displayLeftTicketList();
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 显示客户选择模态框用于批量开票
function showCustomerSelectionModalForBatchInvoice() {
    const modal = document.getElementById('customer-selection-modal');
    modal.style.display = 'flex';

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
        modal.style.display = 'none';
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
        // 执行批量开票操作
        const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
        // 标记所有选中的小票为已开票
        selectedTickets.forEach(selected => {
            const ticketIndex = tickets.findIndex(t => t.id === selected.id);
            if (ticketIndex !== -1) {
                tickets[ticketIndex].hasInvoiced = true;
            }
        });
        // 计算总金额并创建一张合并的发票
        const totalAmount = selectedTickets.reduce((sum, ticket) => {
            const amount = typeof ticket.amount === 'number' ? ticket.amount : parseFloat(ticket.amount) || 0;
            return sum + amount;
        }, 0);
        const newTicketId = 'TCK' + (tickets.length + 1).toString().padStart(4, '0');
        const latestDate = selectedTickets.reduce((latest, ticket) => {
            const currentDate = new Date(ticket.datetime);
            return !latest || currentDate > latest ? currentDate : latest;
        }, null);
        const newInvoice = {
            id: newTicketId,
            datetime: latestDate ? latestDate.toISOString() : new Date().toISOString(),
            customer: selectedCustomer.companyName,
            paymentMethod: selectedTickets[0]?.paymentMethod || '未知',
            amount: totalAmount,
            isSettled: false,
            isInvoiced: true,
            isDebtOnly: false,
            hasInvoiced: false
        };
        tickets.push(newInvoice);
        saveTickets(tickets);
        selectedTickets = [];
        displayLeftTicketList();
        displayRightTicketList();
        modal.style.display = 'none';
        alert(isChinese ? '批量开票成功！' : '¡Facturación masiva completada!');
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

// 确认开票
function confirmBatchInvoice() {
    if (selectedTickets.length === 0) return;
    showCustomerSelectionModalForBatchInvoice();
}

// 更新页面语言
function updateLanguage() {
    document.documentElement.lang = isChinese ? 'zh' : 'es';
    document.getElementById('thTicketId').textContent = isChinese ? '票据ID' : 'ID del Ticket';
    document.getElementById('thDatetime').textContent = isChinese ? '日期时间' : 'Fecha y Hora';
    document.getElementById('thCustomer').textContent = isChinese ? '客户' : 'Cliente';
    document.getElementById('thAmount').textContent = isChinese ? '金额' : 'Monto';
    document.getElementById('thOperation').textContent = isChinese ? '操作' : 'Operación';
    document.getElementById('back-btn').textContent = isChinese ? '返回' : 'Volver';
    document.getElementById('search-confirm-btn').textContent = isChinese ? '查询' : 'Buscar';
    document.getElementById('batch-invoice-btn').textContent = isChinese ? '确认开票' : 'Confirmar Facturación';
    document.querySelector('.left-container h2').textContent = isChinese ? '待开票小票' : 'Tickets Pendientes';
    document.querySelector('.right-container h2').textContent = isChinese ? '已选小票' : 'Tickets Seleccionados';

    // 更新恢复按钮文本
    const resetBtn = document.getElementById('search-reset-btn');
    if (resetBtn) {
        resetBtn.textContent = isChinese ? '恢复' : 'Restablecer';
    }

    // 保持并重置摘要区域的 span
    const summaryDiv = document.querySelector('.summary');
    if (summaryDiv) {
        summaryDiv.innerHTML = `<p>${isChinese ? '总金额: ' : 'Monto Total: '}<span id="total-amount">0.00</span></p>`;
    }

    displayLeftTicketList();
    displayRightTicketList();
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
        isChinese = JSON.parse(savedLanguage);
    }
    // 动态添加转移按钮样式
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

    displayLeftTicketList();
    displayRightTicketList();
    updateLanguage();

    document.getElementById('search-confirm-btn').addEventListener('click', applySearchFilters);
    document.getElementById('batch-invoice-btn').addEventListener('click', confirmBatchInvoice);
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'ticket.html';
    });

    // 添加恢复按钮事件监听
    const resetBtn = document.getElementById('search-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSearchFilters);
    }

    // 监听输入框变化
    const inputs = [
        document.getElementById('search-ticket-id'),
        document.getElementById('search-date'),
        document.getElementById('search-customer'),
        document.getElementById('search-amount')
    ];
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const allEmpty = inputs.every(inp => inp.value.trim() === '');
            if (allEmpty) {
                displayLeftTicketList();
            }
        });
    });
});
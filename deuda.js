let isChinese = true; // 默认语言为中文，稍后从 localStorage 加载

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

// 从 localStorage 加载记账数据（筛选支付方式为“记账”或“A Cuenta”的票据）
function loadDebts() {
    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const debts = tickets.filter(ticket => ticket.paymentMethod === (isChinese ? '记账' : 'A Cuenta'));
    console.log('加载的记账数据:', debts);
    return debts;
}

// 保存记账数据到 localStorage（更新 tickets）
function saveDebts(tickets) {
    localStorage.setItem('tickets', JSON.stringify(tickets));
    console.log('保存的记账数据:', tickets);
}

// 显示记账列表
function displayDebtList(debts = null) {
    const tbody = document.getElementById('debt-list');
    if (!tbody) {
        console.error('未找到 debt-list 元素');
        return;
    }
    tbody.innerHTML = '';
    const debtList = debts || loadDebts();
    if (debtList.length === 0) {
        console.log('记账列表为空');
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6">${isChinese ? '暂无记账数据' : 'No hay datos de deudas'}</td>`;
        tbody.appendChild(row);
        return;
    }
    // 按日期时间降序排序
    debtList.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    debtList.forEach(debt => {
        console.log('渲染记账记录:', debt);
        const row = document.createElement('tr');
        const status = debt.isSettled ? (isChinese ? '已结算' : 'Saldado') : (isChinese ? '未结算' : 'Pendiente');
        row.innerHTML = `
            <td>${debt.id || '未知'}</td>
            <td>${debt.customer || '未知'}</td>
            <td>${formatDateTime(debt.datetime)}</td>
            <td>${typeof debt.amount === 'number' ? debt.amount.toFixed(2) : '0.00'}</td>
            <td>${status}</td>
            <td>
                <button class="view-btn" onclick="viewDebt('${debt.id}')">${isChinese ? '查看' : 'Ver'}</button>
                <button class="settle-btn" onclick="settleDebt('${debt.id}')" ${debt.isSettled ? 'disabled' : ''}>${isChinese ? '结算' : 'Saldar'}</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 查看记账详情
function viewDebt(debtId) {
    const debts = loadDebts();
    const debt = debts.find(d => d.id === debtId);
    if (!debt) {
        console.error('未找到记账记录:', debtId);
        return;
    }
    const modal = document.getElementById('debtModal');
    const detailsBody = document.getElementById('debtDetails');
    if (!modal || !detailsBody) {
        console.error('模态框或详情元素未找到');
        return;
    }
    const status = debt.isSettled ? (isChinese ? '已结算' : 'Saldado') : (isChinese ? '未结算' : 'Pendiente');
    detailsBody.innerHTML = `
        <tr><td>${isChinese ? '记录ID' : 'ID de la Deuda'}</td><td>${debt.id || '未知'}</td></tr>
        <tr><td>${isChinese ? '客户' : 'Cliente'}</td><td>${debt.customer || '未知'}</td></tr>
        <tr><td>${isChinese ? '日期时间' : 'Fecha y Hora'}</td><td>${formatDateTime(debt.datetime)}</td></tr>
        <tr><td>${isChinese ? '金额' : 'Monto'}</td><td>${typeof debt.amount === 'number' ? debt.amount.toFixed(2) : '0.00'}</td></tr>
        <tr><td>${isChinese ? '状态' : 'Estado'}</td><td>${status}</td></tr>
    `;
    modal.style.display = 'flex';
    const closeBtn = modal.querySelector('.modal-close-btn');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
}

// 结算记账
function settleDebt(debtId) {
    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const ticketIndex = tickets.findIndex(t => t.id === debtId);
    if (ticketIndex === -1) {
        console.error('未找到记账记录:', debtId);
        return;
    }
    tickets[ticketIndex].isSettled = true;
    saveDebts(tickets);
    displayDebtList();
}

// 显示查询模态框
function showSearchModal() {
    const existingModal = document.querySelector('.search-modal');
    if (existingModal) {
        existingModal.classList.remove('open');
        setTimeout(() => existingModal.remove(), 300);
        return;
    }
    const modal = document.createElement('div');
    modal.className = 'search-modal';
    modal.innerHTML = `
        <div class="search-modal-content">
            <h2>${isChinese ? '查询记账' : 'Buscar Deudas'}</h2>
            <div class="search-field">
                <label>${isChinese ? '记录ID' : 'ID de la Deuda'}</label>
                <input type="text" id="search-debt-id" placeholder="${isChinese ? '输入记录ID' : 'Ingrese ID de la deuda'}">
            </div>
            <div class="search-field">
                <label>${isChinese ? '客户名称' : 'Nombre del Cliente'}</label>
                <input type="text" id="search-customer" placeholder="${isChinese ? '输入客户名称' : 'Ingrese nombre del cliente'}">
            </div>
            <div class="search-field">
                <label>${isChinese ? '金额' : 'Monto'}</label>
                <input type="number" id="search-amount" step="0.01" placeholder="${isChinese ? '输入金额' : 'Ingrese monto'}">
            </div>
            <button id="search-confirm-btn">${isChinese ? '确定' : 'Confirmar'}</button>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
        modal.classList.add('open');
    }, 10);
    document.getElementById('search-confirm-btn').onclick = applySearchFilters;
    document.addEventListener('click', function handleClickOutside(event) {
        const modalContent = modal.querySelector('.search-modal-content');
        if (!modalContent.contains(event.target) && !event.target.closest('#search-btn')) {
            modal.classList.remove('open');
            setTimeout(() => {
                modal.remove();
                document.removeEventListener('click', handleClickOutside);
            }, 300);
        }
    });
}

// 应用查询过滤
function applySearchFilters() {
    const debtId = document.getElementById('search-debt-id').value.trim().toLowerCase();
    const customer = document.getElementById('search-customer').value.trim().toLowerCase();
    const amount = parseFloat(document.getElementById('search-amount').value);
    const debts = loadDebts();
    const filteredDebts = debts.filter(debt => {
        let match = true;
        if (debtId && !debt.id.toLowerCase().includes(debtId)) {
            match = false;
        }
        if (customer && !debt.customer.toLowerCase().includes(customer)) {
            match = false;
        }
        if (!isNaN(amount) && debt.amount !== amount) {
            match = false;
        }
        return match;
    });
    displayDebtList(filteredDebts);
    const modal = document.querySelector('.search-modal');
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => modal.remove(), 300);
    }
}

// 更新页面语言
function updateLanguage() {
    const lang = isChinese ? 'zh' : 'es';
    document.documentElement.lang = lang;
    document.getElementById('title').textContent = isChinese ? '记账列表' : 'Lista de Deudas';
    document.getElementById('thDebtId').textContent = isChinese ? '记录ID' : 'ID de la Deuda';
    document.getElementById('thCustomer').textContent = isChinese ? '客户' : 'Cliente';
    document.getElementById('thDatetime').textContent = isChinese ? '日期时间' : 'Fecha y Hora';
    document.getElementById('thAmount').textContent = isChinese ? '金额' : 'Monto';
    document.getElementById('thStatus').textContent = isChinese ? '状态' : 'Estado';
    document.getElementById('thOperation').textContent = isChinese ? '操作' : 'Operación';
    document.getElementById('search-btn').textContent = isChinese ? '查询' : 'Buscar';
    document.getElementById('batch-settle-btn').textContent = isChinese ? '批量结算' : 'Liquidación Masiva';
    displayDebtList();
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    console.log('deuda.js 初始化');
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
        isChinese = JSON.parse(savedLanguage);
    }
    const tbody = document.getElementById('debt-list');
    if (!tbody) {
        console.error('debt-list 元素未找到');
        return;
    }
    const style = document.createElement('style');
    style.textContent = `
        .view-btn, .settle-btn {
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
        .settle-btn {
            background-color: #10b981;
        }
        .settle-btn:hover {
            background-color: #059669;
        }
        .settle-btn:disabled {
            background-color: #6b7280;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
    displayDebtList();
    updateLanguage();
    document.getElementById('search-btn').addEventListener('click', showSearchModal);
    document.getElementById('batch-settle-btn').addEventListener('click', () => {
        window.location.href = 'batchticket.html';
    });
});
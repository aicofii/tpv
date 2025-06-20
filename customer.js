let customers = JSON.parse(localStorage.getItem('customers')) || [];

// 显示客户列表
function displayCustomerList() {
    const tbody = document.getElementById('customer-list');
    tbody.innerHTML = '';
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.id || '-'}</td>
            <td>${customer.companyName}</td>
            <td>${customer.tradeName}</td>
            <td>${customer.taxId}</td>
            <td>${customer.phone}</td>
            <td>${customer.address || '-'}</td>
            <td>${customer.email || '-'}</td>
            <td><button class="delete-btn" data-customer-id="${customer.id || customer.taxId}">删除</button></td>
        `;
        tbody.appendChild(row);
    });

    // 为删除按钮绑定事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteCustomer(btn.dataset.customerId));
    });
}

// 显示添加客户模态框
function showAddCustomerModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>添加新客户</h2>
            <form id="add-customer-form">
                <label>
                    客户代码:
                    <input type="text" id="customer-id">
                </label>
                <label>
                    公司名称:
                    <input type="text" id="company-name" required>
                </label>
                <label>
                    商业名称:
                    <input type="text" id="trade-name" required>
                </label>
                <label>
                    税号:
                    <input type="text" id="tax-id" required>
                </label>
                <label>
                    电话:
                    <input type="tel" id="phone" required>
                </label>
                <label>
                    地址:
                    <input type="text" id="address">
                </label>
                <label>
                    邮箱:
                    <input type="email" id="email">
                </label>
                <div class="modal-buttons">
                    <button type="button" class="modal-close-btn">取消</button>
                    <button type="submit" class="modal-confirm-btn">确认</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // 绑定取消按钮事件
    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());

    // 绑定表单提交事件
    const form = document.getElementById('add-customer-form');
    form.addEventListener('submit', addCustomer);
}

// 添加客户
function addCustomer(event) {
    event.preventDefault();
    const newCustomer = {
        id: document.getElementById('customer-id').value || null,
        companyName: document.getElementById('company-name').value,
        tradeName: document.getElementById('trade-name').value,
        taxId: document.getElementById('tax-id').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value || null,
        email: document.getElementById('email').value || null
    };
    customers.push(newCustomer);
    localStorage.setItem('customers', JSON.stringify(customers));
    document.querySelector('.modal').remove();
    displayCustomerList();
}

// 删除客户
function deleteCustomer(customerId) {
    if (confirm('确定删除此客户？')) {
        customers = customers.filter(c => (c.id || c.taxId) !== customerId);
        localStorage.setItem('customers', JSON.stringify(customers));
        displayCustomerList();
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    displayCustomerList();

    // 绑定返回按钮
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // 绑定增加客户按钮
    document.getElementById('add-customer-btn').addEventListener('click', showAddCustomerModal);
});
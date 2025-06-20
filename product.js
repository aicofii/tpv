let products = JSON.parse(localStorage.getItem('products')) || [];

// 显示产品列表
function displayProductList() {
    const tbody = document.getElementById('product-list');
    tbody.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.barcode}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.unitPrice.toFixed(2)}</td>
            <td>${(product.taxRate * 100).toFixed(2)}%</td>
            <td>${product.unit}</td>
            <td><button class="delete-btn" onclick="deleteProduct('${product.id}')">删除</button></td>
        `;
        tbody.appendChild(row);
    });
}

// 显示添加产品模态框
function showAddProductModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>添加新产品</h2>
            <form id="add-product-form">
                <label>
                    产品代码:
                    <input type="text" id="product-id" required>
                </label>
                <label>
                    条码:
                    <input type="text" id="barcode" required>
                </label>
                <label>
                    品名:
                    <input type="text" id="name" required>
                </label>
                <label>
                    类别:
                    <input type="text" id="category" required>
                </label>
                <label>
                    价格:
                    <input type="number" id="unit-price" step="0.01" min="0" required>
                </label>
                <label>
                    税率 (%):
                    <input type="number" id="tax-rate" step="0.01" min="0" max="100" required>
                </label>
                <label>
                    单位:
                    <input type="text" id="unit" required>
                </label>
                <label>
                    库存:
                    <input type="number" id="stock" min="0" required>
                </label>
                <div class="modal-buttons">
                    <button type="button" class="modal-close-btn" onclick="this.closest('.modal').remove()">取消</button>
                    <button type="submit" class="modal-confirm-btn">确认</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('add-product-form').addEventListener('submit', addProduct);
}

// 添加产品
function addProduct(event) {
    event.preventDefault();
    const newProduct = {
        id: document.getElementById('product-id').value,
        barcode: document.getElementById('barcode').value,
        name: document.getElementById('name').value,
        category: document.getElementById('category').value,
        unitPrice: parseFloat(document.getElementById('unit-price').value),
        taxRate: parseFloat(document.getElementById('tax-rate').value) / 100,
        unit: document.getElementById('unit').value,
        stock: parseInt(document.getElementById('stock').value)
    };
    products.push(newProduct);
    localStorage.setItem('products', JSON.stringify(products));
    document.querySelector('.modal').remove();
    displayProductList();
    
}

// 删除产品
function deleteProduct(productId) {
    if (confirm('确定删除此产品？')) {
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('products', JSON.stringify(products));
        displayProductList();
    }
}

// 初始化产品列表
displayProductList();
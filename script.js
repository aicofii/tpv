let isChinese = true; // Default to Chinese
let selectedAutocompleteIndex = -1; // Track selected item in autocomplete dropdown
let autocompleteItems = []; // Store current autocomplete items

// Product list with ID, Barcode, Name, Unit Price, Tax Rate, Unit, Stock
const products = [
    { id: "P001", barcode: "123456789012", name: "Wireless Mouse", unitPrice: 25.00, taxRate: 0.21, unit: "Piece", stock: 100 },
    { id: "P002", barcode: "234567890123", name: "Bluetooth Keyboard", unitPrice: 45.00, taxRate: 0.21, unit: "Piece", stock: 50 },
    { id: "P003", barcode: "345678901234", name: "USB-C Cable", unitPrice: 15.00, taxRate: 0.21, unit: "Piece", stock: 200 },
    { id: "P004", barcode: "456789012345", name: "Laptop Stand", unitPrice: 30.00, taxRate: 0.21, unit: "Piece", stock: 80 },
    { id: "P005", barcode: "567890123456", name: "External Hard Drive", unitPrice: 80.00, taxRate: 0.21, unit: "Piece", stock: 30 },
    { id: "P006", barcode: "678901234567", name: "Webcam", unitPrice: 50.00, taxRate: 0.21, unit: "Piece", stock: 60 },
    { id: "P007", barcode: "789012345678", name: "Wireless Earbuds", unitPrice: 60.00, taxRate: 0.21, unit: "Pair", stock: 90 },
    { id: "P008", barcode: "890123456789", name: "Monitor", unitPrice: 120.00, taxRate: 0.21, unit: "Piece", stock: 20 },
    { id: "P009", barcode: "901234567890", name: "Mouse Pad", unitPrice: 10.00, taxRate: 0.21, unit: "Piece", stock: 150 },
    { id: "P010", barcode: "012345678901", name: "HDMI Cable", unitPrice: 12.00, taxRate: 0.21, unit: "Piece", stock: 120 }
];

function toggleLanguage() {
    isChinese = !isChinese;
    updateLanguage();
}

function updateLanguage() {
    const lang = isChinese ? 'zh' : 'es';
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
    document.querySelectorAll('.footer button')[0].textContent = isChinese ? '添加商品' : 'Agregar Artículo';
    document.querySelectorAll('.footer button')[1].textContent = isChinese ? '清空' : 'Limpiar';
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.textContent = isChinese ? '删除' : 'Eliminar';
    });
    // Update flag icon
    document.getElementById('flag-icon').textContent = isChinese ? '🇪🇸' : '🇨🇳';
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
    updateTotals();
    row.cells[0].focus();
}

function deleteRow(element) {
    const row = element.closest('tr');
    const tbody = document.getElementById('items');
    row.remove();
    updateTotals();
    // Refocus after deletion
    if (tbody.children.length === 0) {
        document.body.focus(); // Focus on body if table is empty
    } else {
        // Focus on the first editable cell of the first remaining row
        const firstRow = tbody.children[0];
        if (firstRow) firstRow.cells[0].focus();
    }
}

function clearItems() {
    const tbody = document.getElementById('items');
    tbody.innerHTML = '';
    updateTotals();
    document.body.focus(); // Focus on body after clearing
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
        // Update Discount Total
        const discountTotal = discount > 0 ? (qty * price * (discount / 100)).toFixed(2) : "0.00";
        row.cells[7].textContent = discountTotal;
        // Total calculation (price * qty - discount total) * (1 + tax rate)
        const rowTotal = (qty * price - parseFloat(discountTotal)) * (1 + taxRate / 100);
        row.cells[8].textContent = rowTotal.toFixed(2);
        totalItems += qty;
        totalAmount += rowTotal;
    }

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('footerAmount').textContent = totalAmount.toFixed(2) + (isChinese ? ' 元' : ' EUR');
}

// Autocomplete functionality
function showAutocomplete(cell, value) {
    const existingDropdown = cell.querySelector('.autocomplete-dropdown');
    if (existingDropdown) existingDropdown.remove();

    selectedAutocompleteIndex = -1; // Reset selected index
    autocompleteItems = []; // Reset autocomplete items

    if (!value) return;

    const columnIndex = cell.cellIndex;
    const field = columnIndex === 0 ? 'barcode' : columnIndex === 6 ? 'name' : 'id';
    const matches = products.filter(product =>
        product[field].toLowerCase().includes(value.toLowerCase())
    );

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
    row.cells[0].textContent = product.barcode; // Barcode
    row.cells[2].textContent = product.stock; // Stock
    row.cells[3].textContent = product.unitPrice.toFixed(2); // Unit Price
    row.cells[5].textContent = (product.taxRate * 100).toFixed(2); // Tax Rate
    row.cells[6].textContent = product.name; // Name
    row.cells[9].textContent = product.unit; // Unit
    const dropdown = cell.querySelector('.autocomplete-dropdown');
    if (dropdown) dropdown.remove();
    updateTotals();
    selectedAutocompleteIndex = -1;
    autocompleteItems = [];
    // Auto-focus on the quantity column (second column) if the selection was made in the barcode column
    if (cell.cellIndex === 0) {
        row.cells[1].focus();
    }
}

// Print receipt function
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

    // Create a new window for printing
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

// Placeholder functions for new header buttons
function showProducts() {
    alert(isChinese ? '显示商品列表 (F1)' : 'Show Products (F1)');
}

function showCustomers() {
    alert(isChinese ? '显示客户列表 (F2)' : 'Show Customers (F2)');
}

function showReceipts() {
    alert(isChinese ? '显示单据列表 (F3)' : 'Show Receipts (F3)');
}

function showAccounting() {
    alert(isChinese ? '显示记账列表 (F4)' : 'Show Accounting (F4)');
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

// Handle keyboard events
document.addEventListener('keydown', function(event) {
    const target = event.target;
    const isEditable = target.isContentEditable;
    const dropdown = isEditable ? target.querySelector('.autocomplete-dropdown') : null;

    // Handle Enter when table is empty or for printing receipt
    if (!isEditable && event.key === 'Enter') {
        event.preventDefault();
        if (document.getElementById('items').children.length === 0) {
            addItem();
        } else {
            printReceipt();
        }
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
        // Handle autocomplete navigation
        if (autocompleteItems.length === 0) return;

        // Remove previous selection
        if (selectedAutocompleteIndex >= 0) {
            autocompleteItems[selectedAutocompleteIndex].classList.remove('selected');
        }

        if (event.key === 'ArrowUp') {
            selectedAutocompleteIndex = selectedAutocompleteIndex > 0 ? selectedAutocompleteIndex - 1 : autocompleteItems.length - 1;
        } else if (event.key === 'ArrowDown') {
            selectedAutocompleteIndex = selectedAutocompleteIndex < autocompleteItems.length - 1 ? selectedAutocompleteIndex + 1 : 0;
        }

        // Highlight new selection
        autocompleteItems[selectedAutocompleteIndex].classList.add('selected');
        autocompleteItems[selectedAutocompleteIndex].scrollIntoView({ block: 'nearest' });
    } else if (dropdown && event.key === 'Enter') {
        event.preventDefault();
        // Select the highlighted autocomplete item
        if (selectedAutocompleteIndex >= 0) {
            const product = products.find(p =>
                `${p.id} - ${p.barcode} - ${p.name}` === autocompleteItems[selectedAutocompleteIndex].textContent
            );
            if (product) selectProduct(target, product);
        } else {
            printReceipt();
        }
    } else if (event.key === 'ArrowDown' && rowIndex === rows.length - 1 && !dropdown) {
        event.preventDefault();
        addItem();
    } else if (event.key === 'Enter') {
        event.preventDefault();
        printReceipt();
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

// Handle input for autocomplete and discount calculation
document.addEventListener('input', function(event) {
    const target = event.target;
    if (target.isContentEditable && target.classList.contains('autocomplete')) {
        showAutocomplete(target, target.textContent);
    }
    updateTotals();
});

updateLanguage();
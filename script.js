// Global variables
let accountData = {
    name: '',
    balance: 0,
    currency: 'USD',
    transactions: []
};

// DOM elements
const accountTab = document.getElementById('account');
const transferTab = document.getElementById('transfer');
const receiveTab = document.getElementById('receive');
const historyTab = document.getElementById('history');
const exportImportTab = document.getElementById('export-import');
const tabButtons = document.querySelectorAll('.tab-navigation button');
const modeToggle = document.getElementById('mode-toggle');
const transactionList = document.getElementById('transactionList');
const balanceWidget = document.getElementById('balance-widget');

// Event listeners
document.getElementById('saveAccount').addEventListener('click', saveAccount);
document.getElementById('sendTransfer').addEventListener('click', sendTransfer);
document.getElementById('recordReceive').addEventListener('click', recordReceive);
document.getElementById('exportData').addEventListener('click', exportData);
document.getElementById('importData').addEventListener('click', importData);
modeToggle.addEventListener('click', toggleMode);

tabButtons.forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
});

// Functions
function saveAccount() {
    const name = document.getElementById('accountName').value.trim();
    const balanceInput = document.getElementById('balance').value.trim();
    const currency = document.getElementById('currency').value;

    if (!name) {
        alert('Please enter an account name.');
        return;
    }

    if (!balanceInput) {
        alert('Please enter an initial balance.');
        return;
    }

    const balance = parseFloat(balanceInput);
    if (isNaN(balance) || balance < 0) {
        alert('Please enter a valid positive number for the balance.');
        return;
    }

    accountData.name = name;
    accountData.balance = balance;
    accountData.currency = currency;
    saveToCookie();
    updateBalanceWidget();
    alert('Account details saved successfully!');
}

function sendTransfer() {
    const amountInput = document.getElementById('transferAmount').value.trim();
    const recipient = document.getElementById('recipientName').value.trim();
    const description = document.getElementById('transferDescription').value.trim();

    if (!amountInput) {
        alert('Please enter a transfer amount.');
        return;
    }

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive number for the transfer amount.');
        return;
    }

    if (amount > accountData.balance) {
        alert('Insufficient funds for this transfer!');
        return;
    }

    const transaction = {
        type: 'transfer',
        recipient: recipient || 'Unknown Recipient',
        amount: amount,
        description: description || 'No description provided',
        date: new Date().toISOString()
    };
    
    accountData.balance -= amount;
    accountData.transactions.push(transaction);
    
    saveToCookie();
    updateHistory();
    updateBalanceWidget();
    
    alert('Transfer sent successfully!');
}

function recordReceive() {
    const amountInput = document.getElementById('receiveAmount').value.trim();
    const sender = document.getElementById('senderName').value.trim();
    const description = document.getElementById('receiveDescription').value.trim();

    if (!amountInput) {
        alert('Please enter a receive amount.');
        return;
    }

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive number for the receive amount.');
        return;
    }

    const transaction = {
        type: 'receive',
        sender: sender || 'Unknown Sender',
        amount: amount,
        description: description || 'No description provided',
        date: new Date().toISOString()
    };
    
    accountData.balance += amount;
    accountData.transactions.push(transaction);
    
    saveToCookie();
    updateHistory();
    updateBalanceWidget();
    
    alert('Funds received and recorded successfully!');
}

function updateHistory() {
    transactionList.innerHTML = '';
    
    accountData.transactions.forEach((transaction, index) => {
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.innerHTML = `
            <p>Type: ${transaction.type}</p>
            <p>Amount: ${transaction.amount.toFixed(2)} ${accountData.currency}</p>
            <p>Date: ${new Date(transaction.date).toLocaleString()}</p>
            <p>${transaction.type === 'transfer' ? 'Recipient' : 'Sender'}: ${transaction.type === 'transfer' ? transaction.recipient : transaction.sender}</p>
            <p>Description: ${transaction.description}</p>
            <button onclick="downloadReceipt(${index})">Download Receipt</button>
        `;
        
        transactionList.appendChild(li);
    });
}

function downloadReceipt(index) {
    if (index < 0 || index >= accountData.transactions.length) {
        alert('Invalid transaction index.');
        return;
    }

    const transaction = accountData.transactions[index];
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Set background color
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add PAYZ logo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAYZ', canvas.width / 2, 60);

    // Add simple logo shape
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 100, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#0070ba';
    ctx.fill();

    // Set text style for content
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'left';

    // Draw receipt content
    const lineHeight = 30;
    let y = 180;

    function drawLine(text) {
        ctx.fillText(text, 30, y);
        y += lineHeight;
    }

    drawLine('Transaction Receipt');
    drawLine('------------------------');
    drawLine(`Type: ${transaction.type.toUpperCase()}`);
    drawLine(`Amount: ${transaction.amount.toFixed(2)} ${accountData.currency}`);
    drawLine(`Date: ${new Date(transaction.date).toLocaleString()}`);
    drawLine(`${transaction.type === 'transfer' ? 'Recipient' : 'Sender'}:`);
    drawLine(`  ${transaction.type === 'transfer' ? transaction.recipient : transaction.sender}`);
    drawLine(`Account Holder: ${accountData.name}`);    
    drawLine('Description:');

    // Wrap description text
    const words = transaction.description.split(' ');
    let line = '';
    for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > canvas.width - 60 && line !== '') {
            drawLine(`  ${line}`);
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    drawLine(`  ${line}`);

    // Add a decorative element
    ctx.strokeStyle = '#0070ba';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, y + 20);
    ctx.lineTo(canvas.width - 30, y + 20);
    ctx.stroke();

    // Add footer
    ctx.textAlign = 'center';
    ctx.fillText('Thank you for using PAYZ!', canvas.width / 2, canvas.height - 60);
    ctx.fillText('Join us now!', canvas.width / 2, canvas.height - 30);
    ctx.fillText('https://tenoco.github.io/PAYZ/', canvas.width / 2, canvas.height - 10);

    // Convert canvas to image and download
    canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PAYZ_receipt_${transaction.date}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

function saveToCookie() {
    try {
        const encodedData = encodeURIComponent(JSON.stringify(accountData));
        document.cookie = `accountData=${encodedData}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/; SameSite=Strict`;
    } catch (error) {
        console.error('Error saving data to cookie:', error);
        alert('Failed to save account data. Please try again.');
    }
}

function loadFromCookie() {
    try {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'accountData') {
                accountData = JSON.parse(decodeURIComponent(value));
                document.getElementById('accountName').value = accountData.name;
                document.getElementById('balance').value = accountData.balance;
                document.getElementById('currency').value = accountData.currency;
                updateHistory();
                updateBalanceWidget();
                break;
            }
        }
    } catch (error) {
        console.error('Error loading data from cookie:', error);
        alert('Failed to load account data. Using default values.');
        // Reset to default values if loading fails
        accountData = {
            name: '',
            balance: 0,
            currency: 'USD',
            transactions: []
        };
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    tabButtons.forEach(button => button.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

function toggleMode() {
    document.body.classList.toggle('light-mode');
    saveThemeToCookie();
}

function saveThemeToCookie() {
    const isLightMode = document.body.classList.contains('light-mode');
    document.cookie = `theme=${isLightMode ? 'light' : 'dark'}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/; SameSite=Strict`;
}

function loadThemeFromCookie() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'theme') {
            if (value === 'light') {
                document.body.classList.add('light-mode');
            }
            break;
        }
    }
}

function updateBalanceWidget() {
    balanceWidget.textContent = `Balance: ${accountData.balance.toFixed(2)} ${accountData.currency}`;
}

function exportData() {
    try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(accountData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "payz_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Failed to export data. Please try again.');
    }
}

function importData() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (validateImportedData(importedData)) {
                    accountData = importedData;
                    saveToCookie();
                    loadFromCookie();
                    alert('Data imported successfully!');
                } else {
                    throw new Error('Invalid data structure');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Error importing data. Please make sure the file is valid and try again.');
            }
        };
        reader.readAsText(file);
    } else {
        alert('Please select a file to import.');
    }
}

function validateImportedData(data) {
    return (
        data &&
        typeof data.name === 'string' &&
        typeof data.balance === 'number' &&
        typeof data.currency === 'string' &&
        Array.isArray(data.transactions)
    );
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadThemeFromCookie();
    loadFromCookie();
});
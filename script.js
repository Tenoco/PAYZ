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
    accountData.name = document.getElementById('accountName').value;
    accountData.balance = parseFloat(document.getElementById('balance').value);
    accountData.currency = document.getElementById('currency').value;
    saveToCookie();
    updateBalanceWidget();
    alert('Account details saved!');
}

function sendTransfer() {
    const amount = parseFloat(document.getElementById('transferAmount').value);
    if (amount > accountData.balance) {
        alert('Insufficient funds!');
        return;
    }
    const transaction = {
        type: 'transfer',
        recipient: document.getElementById('recipientName').value,
        amount: amount,
        description: document.getElementById('transferDescription').value,
        date: new Date().toISOString()
    };
    
    accountData.balance -= amount;
    accountData.transactions.push(transaction);
    
    saveToCookie();
    updateHistory();
    updateBalanceWidget();
    
    alert('Transfer sent!');
}

function recordReceive() {
    const amount = parseFloat(document.getElementById('receiveAmount').value);
    const transaction = {
        type: 'receive',
        sender: document.getElementById('senderName').value,
        amount: amount,
        description: document.getElementById('receiveDescription').value,
        date: new Date().toISOString()
    };
    
    accountData.balance += amount;
    accountData.transactions.push(transaction);
    
    saveToCookie();
    updateHistory();
    updateBalanceWidget();
    
    alert('Funds received and recorded!');
}

function updateHistory() {
    transactionList.innerHTML = '';
    
    accountData.transactions.forEach(transaction => {
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.innerHTML = `
            <p>Type: ${transaction.type}</p>
            <p>Amount: ${transaction.amount} ${accountData.currency}</p>
            <p>Date: ${new Date(transaction.date).toLocaleString()}</p>
            <p>${transaction.type === 'transfer' ? 'Recipient' : 'Sender'}: ${transaction.type === 'transfer' ? transaction.recipient : transaction.sender}</p>
            <p>Description: ${transaction.description}</p>
            <button onclick="downloadReceipt(${accountData.transactions.indexOf(transaction)})">Download Receipt</button>
        `;
        
        transactionList.appendChild(li);
    });
}

function downloadReceipt(index) {
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
   drawLine(`Amount: ${transaction.amount} ${accountData.currency}`);
   drawLine(`Date: ${new Date(transaction.date).toLocaleString()}`);
   drawLine(`${transaction.type === 'transfer' ? 'Recipient' : 'Sender'}:`);
   drawLine(`  ${transaction.type === 'transfer' ? transaction.recipient : transaction.sender}`);
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
   ctx.fillText('Thank you for using PAYZ!', canvas.width / 2, canvas.height - 30);

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
     document.cookie =
         `accountData=${encodeURIComponent(
             JSON.stringify(accountData)
         )}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
}

function loadFromCookie() {
     const cookies =
         document.cookie.split(';');
     for (let cookie of cookies) {
         const [name, value] =
             cookie.trim().split('=');
         if (name === 'accountData') {
             accountData =
                 JSON.parse(decodeURIComponent(value));
             document.getElementById(
                 'accountName'
             ).value =
                 accountData.name;

             document.getElementById(
                 'balance'
             ).value =
                 accountData.balance;

             document.getElementById(
                 'currency'
             ).value =
                 accountData.currency;

             updateHistory();
             updateBalanceWidget();
             break; // Exit loop after finding the cookie
         }
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
     const isLightMode =
         document.body.classList.contains(
             'light-mode'
         );
     document.cookie =
         `theme=${isLightMode ? 'light' : 'dark'}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
}

function loadThemeFromCookie() {
     const cookies =
         document.cookie.split(';');
     for (let cookie of cookies) {
         const [name, value] =
             cookie.trim().split('=');
         if (name === 'theme') {
             if (value === 'light') { // Check for light theme
                 document.body.classList.add(
                     'light-mode'
                 );
             }
             break; // Exit loop after finding the cookie
         }
     }
}

function updateBalanceWidget() {
     balanceWidget.textContent =
         `Balance: ${accountData.balance.toFixed(2)} ${accountData.currency}`;
}

function exportData() {
     const dataStr =
         "data:text/json;charset=utf-8," +
         encodeURIComponent(JSON.stringify(accountData));
     const downloadAnchorNode =
         document.createElement('a');
     downloadAnchorNode.setAttribute("href", dataStr);
     downloadAnchorNode.setAttribute("download", "payz_data.json");
     document.body.appendChild(downloadAnchorNode);
     downloadAnchorNode.click();
     downloadAnchorNode.remove();
}

function importData() {
     const fileInput =
         document.getElementById(
             'importFile'
         );
     const file =
         fileInput.files[0];
     if (file) {
         const reader =
             new FileReader();
         reader.onload =
             function(e) {
                 try {
                     accountData =
                         JSON.parse(e.target.result);
                     saveToCookie();
                     loadFromCookie();
                     alert(
                         'Data imported successfully!'
                     );
                 } catch (error) {
                     alert(
                         'Error importing data. Please make sure the file is valid.'
                     );
                 }
             };
         reader.readAsText(file);
     } else {
         alert(
             'Please select a file to import.'
         );
     }
}

// Initialize
loadThemeFromCookie(); // Load theme on startup
loadFromCookie(); // Load account data on startup
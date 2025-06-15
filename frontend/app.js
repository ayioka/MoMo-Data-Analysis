let allTransactions = [];
let typeChart = null;
let monthlyChart = null;

document.addEventListener('DOMContentLoaded', function () {
  // Initialize filter buttons
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);

  // Process data button
  document.getElementById('process-btn').addEventListener('click', processData);
});

function processData() {
  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Handle both array format and object with transactions property
      allTransactions = Array.isArray(data) ? data : data.transactions || [];
      
      if (!allTransactions || allTransactions.length === 0) {
        throw new Error('No transactions found in the data');
      }
      
      updateDashboard(allTransactions);
      renderTable(allTransactions);
      renderCharts(allTransactions);
    })
    .catch(error => {
      console.error('Error loading data:', error);
      alert('Error loading transaction data. Please check console for details.');
    });
}

function applyFilters() {
  const searchText = document.getElementById('search-text').value.toLowerCase();
  const typeFilter = document.getElementById('filter-type').value;
  const dateFrom = document.getElementById('filter-date-from').value;
  const dateTo = document.getElementById('filter-date-to').value;
  const amountMin = parseFloat(document.getElementById('filter-amount-min').value) || 0;
  const amountMax = parseFloat(document.getElementById('filter-amount-max').value) || Infinity;

  const filtered = allTransactions.filter(tx => {
    // Search text filter
    const matchesSearch = !searchText || 
      (tx.type && tx.type.toLowerCase().includes(searchText)) ||
      (tx.recipient && tx.recipient.toLowerCase().includes(searchText)) ||
      (tx.recipient_number && tx.recipient_number.toString().toLowerCase().includes(searchText)) ||
      (tx.message && tx.message.toLowerCase().includes(searchText));

    // Type filter
    const matchesType = !typeFilter || tx.type === typeFilter;

    // Date filter
    const txDate = new Date(tx.date);
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
    const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : new Date(8640000000000000);
    const matchesDate = txDate >= fromDate && txDate <= toDate;

    // Amount filter
    const matchesAmount = (tx.amount || 0) >= amountMin && (tx.amount || 0) <= amountMax;

    return matchesSearch && matchesType && matchesDate && matchesAmount;
  });

  updateDashboard(filtered);
  renderTable(filtered);
  
  // Destroy existing charts before rendering new ones
  if (typeChart) typeChart.destroy();
  if (monthlyChart) monthlyChart.destroy();
  renderCharts(filtered);
}

function resetFilters() {
  document.getElementById('search-text').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value = '';
  document.getElementById('filter-amount-min').value = '';
  document.getElementById('filter-amount-max').value = '';

  updateDashboard(allTransactions);
  renderTable(allTransactions);
  
  // Destroy existing charts before rendering new ones
  if (typeChart) typeChart.destroy();
  if (monthlyChart) monthlyChart.destroy();
  renderCharts(allTransactions);
}

function updateDashboard(data) {
  const totalAmount = data.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const totalTransactions = data.length;
  const uniqueRecipients = new Set(
    data.map(tx => tx.recipient_number || tx.recipient)
      .filter(recipient => recipient && recipient !== 'N/A')
  ).size;

  document.getElementById('total-amount').textContent = `${totalAmount.toLocaleString()} RWF`;
  document.getElementById('total-transactions').textContent = totalTransactions.toLocaleString();
  document.getElementById('unique-recipients').textContent = uniqueRecipients.toLocaleString();
}

function renderTable(data) {
  const tbody = document.querySelector('#transactions-table tbody');
  tbody.innerHTML = '';

  if (data.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="6" class="text-center">No transactions found</td>`;
    tbody.appendChild(row);
    return;
  }

  data.forEach((tx, index) => {
    const recipient = tx.recipient || tx.recipient_number || 'N/A';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(tx.date)}</td>
      <td>${tx.type || 'N/A'}</td>
      <td>${(tx.amount || 0).toLocaleString()} RWF</td>
      <td>${recipient}</td>
      <td>${tx.balance ? tx.balance.toLocaleString() : 'N/A'} RWF</td>
      <td>
        <button class="btn btn-sm btn-outline-primary view-details" data-id="${index}">
          View
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Add event listeners to view buttons
  document.querySelectorAll('.view-details').forEach(button => {
    button.addEventListener('click', function () {
      const id = this.getAttribute('data-id');
      viewTransactionDetails(allTransactions[id]);
    });
  });
}

function renderCharts(data) {
  // Prepare data for charts
  const typeTotals = {};
  const monthlyTotals = {};

  data.forEach(tx => {
    // By type
    const type = tx.type || 'Unknown';
    typeTotals[type] = (typeTotals[type] || 0) + (tx.amount || 0);

    // By month
    const date = tx.date ? new Date(tx.date) : new Date();
    const month = date.toLocaleString('default', { year: 'numeric', month: 'short' });
    monthlyTotals[month] = (monthlyTotals[month] || 0) + (tx.amount || 0);
  });

  // Pie Chart: Transaction Volume by Type
  const typeCtx = document.getElementById('typeChart').getContext('2d');
  typeChart = new Chart(typeCtx, {
    type: 'pie',
    data: {
      labels: Object.keys(typeTotals),
      datasets: [{
        data: Object.values(typeTotals),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#8AC24A', '#607D8B',
          '#FF5733', '#33FF57'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });

  // Bar Chart: Monthly Summary
  const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
  monthlyChart = new Chart(monthlyCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(monthlyTotals).sort((a, b) => new Date(a) - new Date(b)),
      datasets: [{
        label: 'Total Amount (RWF)',
        data: Object.values(monthlyTotals),
        backgroundColor: '#36A2EB'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toLocaleString() + ' RWF';
            }
          }
        }
      }
    }
  });
}

function viewTransactionDetails(tx) {
  const modalBody = document.getElementById('transaction-details');
  modalBody.innerHTML = `
    <div><strong>Date:</strong> ${formatDate(tx.date)}</div>
    <div><strong>Type:</strong> ${tx.type || 'N/A'}</div>
    <div><strong>Amount:</strong> ${(tx.amount || 0).toLocaleString()} RWF</div>
    <div><strong>Recipient:</strong> ${tx.recipient || tx.recipient_number || 'N/A'}</div>
    <div><strong>Balance:</strong> ${tx.balance ? tx.balance.toLocaleString() : 'N/A'} RWF</div>
    <div><strong>Fee:</strong> ${tx.fee ? tx.fee.toLocaleString() : '0'} RWF</div>
    <div><strong>Reference:</strong> ${tx.reference || 'N/A'}</div>
    <div><strong>Message:</strong> ${tx.message || 'N/A'}</div>
  `;

  const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
  modal.show();
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
}
document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    document.getElementById('dashboard-link').addEventListener('click', function(e) {
        e.preventDefault();
        showView('dashboard-view');
    });
    
    document.getElementById('transactions-link').addEventListener('click', function(e) {
        e.preventDefault();
        showView('transactions-view');
        loadTransactions();
    });
    
    document.getElementById('analytics-link').addEventListener('click', function(e) {
        e.preventDefault();
        showView('analytics-view');
        loadAnalytics();
    });
    
    // Filter button
    document.getElementById('filter-btn').addEventListener('click', function() {
        loadTransactions();
    });
    
    // Initialize the dashboard
    showView('dashboard-view');
    loadDashboard();
});

function showView(viewId) {
    document.getElementById('dashboard-view').classList.add('d-none');
    document.getElementById('transactions-view').classList.add('d-none');
    document.getElementById('analytics-view').classList.add('d-none');
    
    document.getElementById(viewId).classList.remove('d-none');
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    if (viewId === 'dashboard-view') {
        document.getElementById('dashboard-link').classList.add('active');
    } else if (viewId === 'transactions-view') {
        document.getElementById('transactions-link').classList.add('active');
    } else if (viewId === 'analytics-view') {
        document.getElementById('analytics-link').classList.add('active');
    }
}

function loadDashboard() {
    fetch('/api/transactions/summary')
        .then(response => response.json())
        .then(data => {
            // Update summary cards
            document.getElementById('total-transactions').textContent = data.total_transactions.toLocaleString();
            document.getElementById('total-amount').textContent = data.total_amount.toLocaleString() + ' RWF';
            document.getElementById('unique-recipients').textContent = data.unique_recipients.toLocaleString();
            
            // Load recent transactions
            fetch('/api/transactions?limit=5')
                .then(response => response.json())
                .then(transactions => {
                    const tbody = document.querySelector('#recent-transactions tbody');
                    tbody.innerHTML = '';
                    
                    transactions.forEach(tx => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${formatDate(tx.date)}</td>
                            <td>${tx.type}</td>
                            <td>${tx.amount.toLocaleString()} RWF</td>
                            <td>${tx.recipient || 'N/A'}</td>
                            <td>${tx.balance.toLocaleString()} RWF</td>
                        `;
                        tbody.appendChild(row);
                    });
                });
            
            // Load charts
            loadTypeChart();
            loadMonthlyChart();
        });
}

function loadTransactions() {
    const typeFilter = document.getElementById('type-filter').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    
    let url = '/api/transactions?';
    const params = [];
    
    if (typeFilter) {
        params.push(`type=${encodeURIComponent(typeFilter)}`);
    }
    
    if (dateFrom) {
        params.push(`date_from=${encodeURIComponent(dateFrom)}`);
    }
    
    if (dateTo) {
        params.push(`date_to=${encodeURIComponent(dateTo)}`);
    }
    
    url += params.join('&');
    
    fetch(url)
        .then(response => response.json())
        .then(transactions => {
            const tbody = document.querySelector('#transactions-table tbody');
            tbody.innerHTML = '';
            
            transactions.forEach(tx => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(tx.date)}</td>
                    <td>${tx.type}</td>
                    <td>${tx.amount.toLocaleString()} RWF</td>
                    <td>${tx.recipient || 'N/A'}</td>
                    <td>${tx.balance.toLocaleString()} RWF</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-details" data-id="${tx.id}">
                            <i class="bi bi-eye"></i> View
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Add event listeners to view buttons
            document.querySelectorAll('.view-details').forEach(button => {
                button.addEventListener('click', function() {
                    const txId = this.getAttribute('data-id');
                    viewTransactionDetails(txId);
                });
            });
        });
}

function loadTypeChart() {
    fetch('/api/transactions/stats')
        .then(response => response.json())
        .then(stats => {
            const typeCounts = {};
            
            stats.forEach(stat => {
                if (!typeCounts[stat.type]) {
                    typeCounts[stat.type] = 0;
                }
                typeCounts[stat.type] += stat.count;
            });
            
            const types = Object.keys(typeCounts);
            const counts = types.map(type => typeCounts[type]);
            
            const ctx = document.getElementById('typeChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: types,
                    datasets: [{
                        data: counts,
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                            '#9966FF', '#FF9F40', '#8AC24A', '#607D8B'
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
        });
}

function loadMonthlyChart() {
    fetch('/api/transactions/summary')
        .then(response => response.json())
        .then(data => {
            const months = data.monthly_stats.map(stat => stat.month);
            const counts = data.monthly_stats.map(stat => stat.count);
            
            const ctx = document.getElementById('monthlyChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Transactions',
                        data: counts,
                        backgroundColor: '#36A2EB'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        });
}

function loadAnalytics() {
    fetch('/api/transactions/stats')
        .then(response => response.json())
        .then(stats => {
            // Distribution Chart
            const typeAmounts = {};
            
            stats.forEach(stat => {
                if (!typeAmounts[stat.type]) {
                    typeAmounts[stat.type] = 0;
                }
                typeAmounts[stat.type] += stat.total_amount;
            });
            
            const distTypes = Object.keys(typeAmounts);
            const amounts = distTypes.map(type => typeAmounts[type]);
            
            const distCtx = document.getElementById('distributionChart').getContext('2d');
            new Chart(distCtx, {
                type: 'doughnut',
                data: {
                    labels: distTypes,
                    datasets: [{
                        data: amounts,
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                            '#9966FF', '#FF9F40', '#8AC24A', '#607D8B'
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
            
            // Monthly Amount Chart
            const monthlyAmounts = {};
            const allMonths = [...new Set(stats.map(stat => stat.month))].sort();
            
            stats.forEach(stat => {
                if (!monthlyAmounts[stat.month]) {
                    monthlyAmounts[stat.month] = 0;
                }
                monthlyAmounts[stat.month] += stat.total_amount;
            });
            
            const sortedMonths = allMonths.sort();
            const monthlyAmountValues = sortedMonths.map(month => monthlyAmounts[month] || 0);
            
            const amountCtx = document.getElementById('amountChart').getContext('2d');
            new Chart(amountCtx, {
                type: 'line',
                data: {
                    labels: sortedMonths,
                    datasets: [{
                        label: 'Transaction Amount (RWF)',
                        data: monthlyAmountValues,
                        borderColor: '#FF6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            // Type Over Time Chart
            const typeOverTimeData = {};
            const allTypes = [...new Set(stats.map(stat => stat.type))];
            
            allTypes.forEach(type => {
                typeOverTimeData[type] = sortedMonths.map(month => {
                    const stat = stats.find(s => s.type === type && s.month === month);
                    return stat ? stat.count : 0;
                });
            });
            
            const typeColors = {
                'Incoming Money': '#FF6384',
                'Payment to Code Holder': '#36A2EB',
                'Transfer to Mobile Number': '#FFCE56',
                'Bank Deposit': '#4BC0C0',
                'Airtime Bill Payment': '#9966FF',
                'Cash Power Bill Payment': '#FF9F40',
                'Third Party Transaction': '#8AC24A',
                'Withdrawal from Agent': '#607D8B',
                'Bank Transfer': '#9C27B0',
                'Bundle Purchase': '#009688'
            };
            
            const typeOverTimeCtx = document.getElementById('typeOverTimeChart').getContext('2d');
            new Chart(typeOverTimeCtx, {
                type: 'bar',
                data: {
                    labels: sortedMonths,
                    datasets: allTypes.map(type => ({
                        label: type,
                        data: typeOverTimeData[type],
                        backgroundColor: typeColors[type] || '#000000'
                    }))
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            stacked: true
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true
                        }
                    }
                }
            });
        });
    
    // Load transaction types for filter dropdown
    fetch('/api/transactions/stats')
        .then(response => response.json())
        .then(stats => {
            const typeSelect = document.getElementById('type-filter');
            const types = [...new Set(stats.map(stat => stat.type))];
            
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                typeSelect.appendChild(option);
            });
        });
}

function viewTransactionDetails(txId) {
    fetch(`/api/transactions/${txId}`)
        .then(response => response.json())
        .then(transaction => {
            const modalBody = document.getElementById('transaction-details');
            modalBody.innerHTML = `
                <div class="detail-row">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${formatDate(transaction.date)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Transaction Type</div>
                    <div class="detail-value">${transaction.type}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Amount</div>
                    <div class="detail-value">${transaction.amount.toLocaleString()} RWF</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Recipient</div>
                    <div class="detail-value">${transaction.recipient || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Recipient Number</div>
                    <div class="detail-value">${transaction.recipient_number || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Fee</div>
                    <div class="detail-value">${transaction.fee.toLocaleString()} RWF</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Balance After</div>
                    <div class="detail-value">${transaction.balance.toLocaleString()} RWF</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Transaction ID</div>
                    <div class="detail-value">${transaction.transaction_id || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Message</div>
                    <div class="detail-value">${transaction.message}</div>
                </div>
            `;
            
            const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
            modal.show();
        });
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}
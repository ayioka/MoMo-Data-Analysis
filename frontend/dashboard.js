cessRate = data.total_transactions > 0 ? 
                    Math.round((data.successful / data.total_transactions) * 100) : 100;
                document.getElementById('success-rate').textContent = `${successRate}% success rate`;
                
                // Calculate failure rate
                const failureRate = data.total_transactions > 0 ? 
                    Math.round((data.failed / data.total_transactions) * 100) : 0;
                document.getElementById('failure-rate').textContent = `${failureRate}% failure rate`;
            })
            .catch(error => console.error('Error loading summary data:', error));
    }
    
    // Load chart data
    function loadChartData() {
        // Get selected period
        const selectedPeriod = document.querySelector('.chart-btn.active')?.dataset.period || 'daily';
        
        // Load volume chart data
        fetch('/api/chart/volume')
            .then(response => response.json())
            .then(data => {
                renderVolumeChart(data.labels, data.data, selectedPeriod);
            });
        
        // Load type chart data
        fetch('/api/chart/types')
            .then(response => response.json())
            .then(data => {
                renderTypeChart(data.labels, data.counts);
            });
    }
    
    // Render volume chart
    function renderVolumeChart(labels, data, period = 'daily') {
        const ctx = document.getElementById('volumeChart').getContext('2d');
        
        // D

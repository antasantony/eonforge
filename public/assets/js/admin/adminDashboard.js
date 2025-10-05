document.addEventListener('DOMContentLoaded', function() {
  // Chart.js Implementation
  const ctx = document.getElementById('salesChart').getContext('2d');
  
  // Generate sample data for the chart
  function generateChartData(days = 30) {
    const labels = [];
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Random data with some trend
      const baseValue = Math.random() * 1000 + 500;
      const trend = i > days / 2 ? 1 : 1.2; // Increase trend in recent days
      const dailyVariation = (Math.random() - 0.5) * 200;
      data.push(Math.round(baseValue * trend + dailyVariation));
    }
    
    return { labels, data };
  }
  
  // Initialize chart with responsive size
  const chartData = generateChartData();
  const salesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: 'Sales ($)',
        data: chartData.data,
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        borderColor: '#4361ee',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#4361ee',
        pointBorderColor: '#fff',
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#4361ee',
        pointHoverBorderColor: '#fff',
        pointHitRadius: 10,
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#fff',
          titleColor: '#333',
          bodyColor: '#666',
          borderColor: '#eee',
          borderWidth: 1,
          padding: 12,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              return '$' + context.parsed.y.toLocaleString();
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#f0f0f0'
          },
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      }
    }
  });
  
  // Update chart when period changes
  document.getElementById('chart-period').addEventListener('change', function() {
    const days = parseInt(this.value);
    const newData = generateChartData(days);
    
    salesChart.data.labels = newData.labels;
    salesChart.data.datasets[0].data = newData.data;
    salesChart.update();
  });
  
  // Update stats when date changes
  document.getElementById('dashboard-date').addEventListener('change', function() {
    // In a real app, you would fetch data for the selected date
    const totalSales = Math.floor(Math.random() * 20000) + 10000;
    const newUsers = Math.floor(Math.random() * 100) + 50;
    const conversionRate = (Math.random() * 2 + 2).toFixed(1);
    
    document.getElementById('total-sales').textContent = totalSales.toLocaleString();
    document.getElementById('new-users').textContent = newUsers;
    document.getElementById('conversion-rate').textContent = conversionRate;
  });
  
  // Mobile menu toggle
  const menuToggle = document.createElement('button');
  menuToggle.className = 'menu-toggle';
  menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
  document.querySelector('.header').insertBefore(menuToggle, document.querySelector('.header').firstChild);
  
  menuToggle.addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('active');
  });
  
  // Dropdown menu functionality
  const dropdownToggles = document.querySelectorAll('.sidebar-menu > li > a');
  dropdownToggles.forEach(toggle => {
    if (toggle.nextElementSibling && toggle.nextElementSibling.classList.contains('dropdown-menu')) {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        const dropdown = this.nextElementSibling;
        dropdown.classList.toggle('show');
        
        // Rotate icon
        const icon = this.querySelector('.fa-chevron-down');
        if (icon) {
          icon.classList.toggle('rotate');
        }
      });
    }
  });
  
  // Simulate loading data
  setTimeout(() => {
    const productCount = Math.floor(Math.random() * 500) + 800;
    document.getElementById('total-products').textContent = productCount.toLocaleString();
  }, 500);
  
});
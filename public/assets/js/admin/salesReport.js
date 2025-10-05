// assets/js/admin/salesReport.js

// Ensure SweetAlert2 is included in your project
// Add this to your HTML head if not already present:
// <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

document.addEventListener('DOMContentLoaded', () => {
  const reportPeriod = document.getElementById('report-period');
  const customDateRange = document.getElementById('custom-date-range');
  const startDate = document.getElementById('start-date');
  const endDate = document.getElementById('end-date');
  const generateReportBtn = document.getElementById('generate-report');
  const downloadPdfBtn = document.getElementById('download-pdf');
  const downloadExcelBtn = document.getElementById('download-excel');

  // Toggle custom date range visibility
  reportPeriod.addEventListener('change', () => {
    customDateRange.classList.toggle('hidden', reportPeriod.value !== 'custom');
  });

  // Generate report on button click
  generateReportBtn.addEventListener('click', async () => {
    const period = reportPeriod.value;
    const params = new URLSearchParams({ period });

    if (period === 'custom') {
      const start = startDate.value;
      const end = endDate.value;

      // Validate dates
      if (!start || !end) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Input',
          text: 'Please select both start and end dates.',
          confirmButtonColor: '#4361ee', // primary color from Tailwind config
          confirmButtonText: 'OK',
        });
        return;
      }
      if (new Date(start) > new Date(end)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Date Range',
          text: 'Start date cannot be after end date.',
          confirmButtonColor: '#4361ee',
          confirmButtonText: 'OK',
        });
        return;
      }

      params.append('startDate', start);
      params.append('endDate', end);
    }

    try {
      // Show loading state
      Swal.fire({
        title: 'Generating Report',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch(`/admin/sales-report/filter?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales report');
      }

      const data = await response.json();

      // Update summary cards
      document.getElementById('total-sales-count').textContent = data.totalSalesCount || '0';
      document.getElementById('total-items-sold').textContent = data.totalItemsSold || '0';
      document.getElementById('total-order-amount').textContent = (data.totalOrderAmount || 0).toFixed(2);
      document.getElementById('total-discount').textContent = (data.totalDiscount || 0).toFixed(2);


      // Update sales table
      const tbody = document.querySelector('tbody');
      tbody.innerHTML = '';

      if (data.salesData && data.salesData.length > 0) {
        data.salesData.forEach(sale => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="px-4 py-3 text-gray-700">${sale.orderId}</td>
            <td class="px-4 py-3 text-gray-700">${sale.customerName}</td>
            <td class="px-4 py-3 text-gray-700">${sale.date}</td>
            <td class="px-4 py-3 text-gray-700">$${sale.orderAmount.toFixed(2)}</td>
            <td class="px-4 py-3 text-gray-700">$${sale.discount.toFixed(2)}</td>
            <td class="px-4 py-3 text-gray-700">${sale.couponCode || 'N/A'}</td>
            <td class="px-4 py-3 text-gray-700">${sale.finalAmount || 'N/A'}</td>
            <td class="px-4 py-3 text-gray-700">${sale.paymentMethod || 'N/A'}</td>
          `;
          tbody.appendChild(row);
        });
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="px-4 py-3 text-center text-gray-500">
              No sales data available for the selected period.
            </td>
          </tr>
        `;
      }

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Report Generated',
        text: 'Sales report has been successfully updated.',
        confirmButtonColor: '#4361ee',
        confirmButtonText: 'OK',
        timer: 2000, // Auto-dismiss after 2 seconds
        timerProgressBar: true,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while generating the report. Please try again.',
        confirmButtonColor: '#4361ee',
        confirmButtonText: 'OK',
      });
    }
  });

  // Download PDF
  downloadPdfBtn.addEventListener('click', async () => {
    const period = reportPeriod.value;
    const params = new URLSearchParams({ period });

    if (period === 'custom') {
      const start = startDate.value;
      const end = endDate.value;
      if (!start || !end || new Date(start) > new Date(end)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Date Range',
          text: 'Please select a valid date range for download.',
          confirmButtonColor: '#4361ee',
          confirmButtonText: 'OK',
        });
        return;
      }
      params.append('startDate', start);
      params.append('endDate', end);
    }

    Swal.fire({
      title: 'Preparing PDF',
      text: 'Your download will start shortly...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Trigger download
    window.location.href = `/admin/sales-report/download/pdf?${params.toString()}`;
    
    Swal.close(); // Close loading alert after initiating download
  });

  // Download Excel
  downloadExcelBtn.addEventListener('click', async () => {
    const period = reportPeriod.value;
    const params = new URLSearchParams({ period });

    if (period === 'custom') {
      const start = startDate.value;
      const end = endDate.value;
      if (!start || !end || new Date(start) > new Date(end)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Date Range',
          text: 'Please select a valid date range for download.',
          confirmButtonColor: '#4361ee',
          confirmButtonText: 'OK',
        });
        return;
      }
      params.append('startDate', start);
      params.append('endDate', end);
    }

    Swal.fire({
      title: 'Preparing Excel',
      text: 'Your download will start shortly...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Trigger download
    window.location.href = `/admin/sales-report/download/excel?${params.toString()}`;
    
    Swal.close(); // Close loading alert after initiating download
  });
});
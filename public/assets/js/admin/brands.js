 document.addEventListener('DOMContentLoaded', function() {
      // Mobile sidebar toggle
      const sidebar = document.getElementById('sidebar');
      const sidebarOverlay = document.getElementById('sidebarOverlay');
      const openSidebarBtn = document.getElementById('openSidebar');
      const closeSidebarBtn = document.getElementById('closeSidebar');
      
      if (openSidebarBtn && sidebar && sidebarOverlay && closeSidebarBtn) {
        openSidebarBtn.addEventListener('click', () => {
          sidebar.classList.remove('-translate-x-full');
          sidebarOverlay.classList.add('active');
        });
        
        closeSidebarBtn.addEventListener('click', () => {
          sidebar.classList.add('-translate-x-full');
          sidebarOverlay.classList.remove('active');
        });
        
        sidebarOverlay.addEventListener('click', () => {
          sidebar.classList.add('-translate-x-full');
          sidebarOverlay.classList.remove('active');
        });
      } else {
        console.error('Sidebar elements not found');
      }

      // Brand management functionality
      const addBrandBtn = document.getElementById('add-brand-btn');
      const brandModal = document.getElementById('brand-modal');
      const closeModalBtn = document.getElementById('close-modal');
      const cancelBtn = document.getElementById('cancel-btn');
      const brandForm = document.getElementById('brand-form');
      const messageElement = document.getElementById('modalMessage');
      const brandImagePreview = document.getElementById('brand-image-preview');
      const brandName = document.getElementById('brand-name');
      const brandImage = document.getElementById('brand-image');
      const brandIdInput = document.getElementById('brand-id');
      const modalTitle = document.getElementById('modal-title');
      const saveBtn = document.getElementById('save-btn');

      // Open modal for adding new brand
      addBrandBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Add New Brand';
        saveBtn.textContent = 'Save Brand';
        brandForm.reset();
        brandImagePreview.style.display = 'none';
        brandIdInput.value = '';
        messageElement.textContent = '';
        brandModal.classList.remove('hidden');
      });

      // Close modal
      function closeModal() {
        brandModal.classList.add('hidden');
        brandForm.reset();
        brandImagePreview.style.display = 'none';
        messageElement.textContent = '';
        brandIdInput.value = '';
        modalTitle.textContent = 'Add New Brand';
        saveBtn.textContent = 'Save Brand';
      }

      closeModalBtn.addEventListener('click', closeModal);
      cancelBtn.addEventListener('click', closeModal);

      brandForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(brandForm);
        const brandId = brandIdInput.value;
        const url = brandId ? `/admin/brand/${brandId}` : '/admin/brand';
        const method = brandId ? 'PUT' : 'POST';

        try {
          const response = await fetch(url, {
            method: method,
            body: formData,
          });
          const result = await response.json();

          if (result.success) {
            messageElement.textContent = result.message;
            messageElement.style.color = 'green';
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            messageElement.textContent = result.message;
            messageElement.style.color = 'red';
          }
        } catch (error) {
          console.error('Error', error);
          messageElement.textContent = 'Something went wrong. Please try again.';
          messageElement.style.color = 'red';
        }
      });

      brandImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function () {
            brandImagePreview.style.display = 'block';
            brandImagePreview.src = reader.result;
          };
          reader.readAsDataURL(file);
        }
      });
    });

    // Open modal for editing brand
    function openEditModal(brandId, name, imageUrl) {
      const modalTitle = document.getElementById('modal-title');
      const saveBtn = document.getElementById('save-btn');
      const brandName = document.getElementById('brand-name');
      const brandIdInput = document.getElementById('brand-id');
      const brandImagePreview = document.getElementById('brand-image-preview');
      const messageElement = document.getElementById('modalMessage');
      const brandModal = document.getElementById('brand-modal');
      
      modalTitle.textContent = 'Edit Brand';
      saveBtn.textContent = 'Update Brand';
      brandName.value = name;
      brandIdInput.value = brandId;
      brandImagePreview.src = imageUrl;
      brandImagePreview.style.display = 'block';
      messageElement.textContent = '';
      brandModal.classList.remove('hidden');
    }

    async function toggleBrandStatus(brandId, isBlocked) {
      const action = isBlocked ? 'block' : 'unblock';

      const { isConfirmed } = await Swal.fire({
        title: `Are you sure?`,
        text: `You are about to ${action} this brand`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `Yes, ${action} it!`
      });

      if (isConfirmed) {
        try {
          const response = await fetch(`/admin/brand/${brandId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isBlocked })
          });

          const result = await response.json();

          if (response.ok) {
            Swal.fire('Success', result.message, 'success').then(() => {
              window.location.reload();
            });
          } else {
            Swal.fire('Error', result.message || 'Failed to update status', 'error');
          }
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Something went wrong', 'error');
        }
      }
    }
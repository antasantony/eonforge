
    const addBrandBtn = document.getElementById('add-brand-btn');
    const brandModal = document.getElementById('brand-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const brandForm = document.getElementById('brand-form');
    const messageElement = document.getElementById('modalMessage')
    const brandImagePreview = document.getElementById('brand-image-preview');
    const brandName = document.getElementById('brand-name')
    const brandImage = document.getElementById('brand-image')

    // Open modal for adding new brand
    addBrandBtn.addEventListener('click', () => {
      brandModal.classList.remove('hidden');
    });

    // Close modal
    function closeModal() {
      brandModal.classList.add('hidden');
      brandForm.reset();
      brandImagePreview.style.display = 'none';
      messageElement.style.display = 'none'
    }

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

   



    brandForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(brandForm);

      try {
        const response = await fetch('/admin/addBrand', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

       
        if (result.success) {
          messageElement.textContent = result.message;
          messageElement.style.color = 'green'
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          //  brandForm.reset();
        }
      
        else {
          messageElement.textContent = result.message;
          messageElement.style.color = 'red'
        }
      } catch (error) {
        console.error('Error', error);
        messageElement.textContent = 'Something went wrong.Please try again.'
        messageElement.style.color = 'red'
      }
    })
    document.getElementById('brand-image').addEventListener('change', (e) => {
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



    async function confirmDelete(brandId) {
      const { isConfirmed } = await Swal.fire({
        title: 'Are you sure?',
        text: "This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (isConfirmed) {
        try {
          const response = await fetch(`/admin/brand/${brandId}`, {
            method: 'DELETE'
          });

          const result = await response.json();

          if (response.ok) {
            Swal.fire('Deleted!', result.message, 'success').then(() => {
              window.location.reload();
            });
          } else {
            Swal.fire('Error', result.message || 'Failed to delete brand', 'error');
          }
        } catch (error) {
          console.error('Error deleting brand:', error);
          Swal.fire('Error', 'Something went wrong while deleting brand', 'error');
        }
      }
    }




 
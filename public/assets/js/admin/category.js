// DOM Elements
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryModal = document.getElementById('category-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const categoryForm = document.getElementById('category-form');
    const modalTitle = document.getElementById('modal-title');
    const categoryIdInput = document.getElementById('category-id');
    const categoryNameInput = document.getElementById('category-name');
    const categoryDescInput = document.getElementById('category-desc');
    const offerPriceInput = document.getElementById('offer-price');
    const hasOfferInput = document.getElementById('has-offer');
    const categoryStatusInput = document.getElementById('category-status');

     const messageElement = document.getElementById('modalMessage');


    // Open modal for adding new category
    addCategoryBtn.addEventListener('click', () => {
      modalTitle.textContent = 'Add New Category';
      categoryForm.reset();
      categoryIdInput.value = '';
      categoryModal.classList.remove('hidden');
    });

    // Close modal
    function closeModal() {
      categoryModal.classList.add('hidden');
    }

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Open modal for editing category
    function openEditModal(id, name, description, isListed, offerPrice, hasOffer) {
      modalTitle.textContent = 'Edit Category';
      categoryIdInput.value = id;
      categoryNameInput.value = name;
      categoryDescInput.value = description || '';
      offerPriceInput.value = offerPrice || '';
      hasOfferInput.checked = hasOffer;
      categoryStatusInput.checked = isListed;
      categoryModal.classList.remove('hidden');
    }

    // Form submission
    categoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
        const name = categoryNameInput.value.trim();
        const description = categoryDescInput.value.trim();

      if (name === '' || description === '') {
         messageElement.textContent = 'Category name and description are required.';
       
          return
        }
      const categoryData = {
        name,
        description,
        offerPrice: parseFloat(offerPriceInput.value) || 0,
        hasOffer: hasOfferInput.checked,
        isListed: categoryStatusInput.checked
      };
      console.log("Sending category data:", categoryData);

        
      const categoryId = categoryIdInput.value;
      const url = categoryId ? `/admin/addCategory/${categoryId}` : '/admin/addCategory';
      const method = categoryId ? 'PUT' : 'POST';

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData)
        });
           const result = await response.json();

          
        if (response.ok) {
          messageElement.textContent = result.message; 
          messageElement.style.color = 'green';
          setTimeout(() => {
             window.location.reload();
          },1000);
         
        } else {
          messageElement.textContent = result.error || 'Something went wrong';
           messageElement.style.color = 'red';
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Failed to save category');
      }
    });

    // Toggle category status (list/unlist)
   async function toggleCategoryStatus(id, newStatus) {
  try {
    const response = await fetch(`/admin/category/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isListed: newStatus }),
    });

    const result = await response.json();

    if (response.ok) {
      location.reload();
    } else {
      alert(result.error || 'Failed to update status');
    }
  } catch (err) {
    console.error(err);
    alert('Something went wrong');
  }
}
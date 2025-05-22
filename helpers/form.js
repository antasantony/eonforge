  category page validation
  
 const categoryForm = document.getElementById('category-form');
categoryForm.addEventListener('submit',handleFormSubmit)
function handleFormSubmit(event) {
  event.preventDefault();
  if (!validateForm()) {
    return;
  }

  const name = document.getElementsByName('name')[0].value.trim();
  const description = document.getElementById('category-desc').value.trim();

  fetch('/admin/addCategory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(err.error);
        });
      }
      return response.json();
    })
    .then((data) => {
      location.reload();
    })
    .catch((error) => {
      if (error.message === 'Category already exists') {
        Swal.fire({
          icon: 'error',
          title: 'Oops',
          text: 'Category already exists',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops',
          text: 'An error occurred while adding the category',
        });
      }
    });
}

function validateForm() {
  clearErrorMessage();
  const name = document.getElementsByName('name')[0].value.trim();
  const description = document.getElementById('description').value.trim();
  let isValid = true;

  if (name === '') {
    displayErrorMessage('name-error', 'Please enter a name');
    isValid = false;
  } else if (!/^[a-zA-Z\s]+$/.test(name)) {
    displayErrorMessage('name-error', 'Category name should contain only alphabetic characters');
    isValid = false;
  }

  if (description === '') {
    displayErrorMessage('description-error', 'Please enter a description');
    isValid = false;
  }

  return isValid;
}

function displayErrorMessage(elementId, message) {
  var errorElement = document.getElementById(elementId);
  errorElement.innerText = message;
  errorElement.style.display = 'block';
}

function clearErrorMessage() {
  var errorElements = document.getElementsByClassName('error-message');
  Array.from(errorElements).forEach((element) => {
    element.innerText = '';
    element.style.display = 'none';
  });
}




categoryinfo==const categoryInfo = async (req,res) => {
    try {
       let search="";
        if(req.query.search){
            search = req.query.search;
           
        }
        let page=1;
        if(req.query.page){
            page =parseInt(req.query.page) 
        }
        const limit = 4;
        const skip = (page-1)*limit;

        const categoryData = await Category.find({})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages  =Math.ceil(totalCategories/limit);
        res.render('category',
            {cat:categoryData,
            curentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories,
            search
        })
    } catch (error) {
         console.error(error);
         res.redirect('/pageError')
    }
    
}
  


if (variant.hasOffer && variant.offerPrice >= variant.regularPrice) {
  return res.status(400).json({ success: false, message: "Offer price must be less than regular price" });
}
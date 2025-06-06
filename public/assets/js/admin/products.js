
let currentInput = null;
    let cropper = null;
    let currentFile = null;
    let currentVariantEntry = null;
    const wrap = document.getElementById("cropper-wrapper");
    const imgTag = document.getElementById("cropper-image");

    function hookCropperOn(input, variantEntry) {
      input.addEventListener("change", (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
          Swal.fire("Error", "Please select a valid image file", "error");
          e.target.value = "";
          return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB
          Swal.fire("Error", "Image size must be less than 5MB", "error");
          e.target.value = "";
          return;
        }
        
        // Check if we already have 4 images
        const existingImages = variantEntry.querySelector('.variant-image-preview-container').querySelectorAll('img').length;
        if (existingImages >= 4) {
          Swal.fire("Error", "Maximum 4 images allowed per variant", "error");
          e.target.value = "";
          return;
        }
        
        currentInput = e.target;
        currentFile = file;
        currentVariantEntry = variantEntry;
        processImage();
      });
    }

    function processImage() {
      if (!currentFile) return;
      
      imgTag.src = URL.createObjectURL(currentFile);
      wrap.classList.remove("hidden");
      if (cropper) cropper.destroy();
      cropper = new Cropper(imgTag, {
        viewMode: 2,
        aspectRatio: 1,
        responsive: true,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
      });
    }

    function updateImageCounter(variantEntry) {
      const container = variantEntry.querySelector('.variant-image-preview-container');
      const imageCount = container.querySelectorAll('img').length;
      const counter = variantEntry.querySelector('.image-counter');
      
      if (counter) {
        counter.textContent = `${imageCount}/4 Images`;
        counter.className = `image-counter ${imageCount >= 3 && imageCount <= 4 ? 'valid' : 'invalid'}`;
      }
      
      // Update error message
      const errorDiv = variantEntry.querySelector('.image-error');
      if (imageCount < 3) {
        errorDiv.classList.remove("hidden");
      } else {
        errorDiv.classList.add("hidden");
      }
    }

    window.toggleVariants = function (productId) {
      const variantRows = document.querySelectorAll(`[id^="variant-row-${productId}"]`);
      const toggleBtn = document.getElementById(`toggle-btn-${productId}`);
      const icon = toggleBtn.querySelector('i');
      
      variantRows.forEach((row) => row.classList.toggle("hidden"));
      
      if (variantRows[0].classList.contains("hidden")) {
        icon.className = "fas fa-chevron-right text-xs";
      } else {
        icon.className = "fas fa-chevron-down text-xs";
      }
    };

    window.toggleProductStatus = async function (productId, isBlocked) {
      const action = isBlocked === 'true' ? 'unblock' : 'block';
      const result = await Swal.fire({
        title: `Are you sure?`,
        text: `This product will be ${action}ed.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: `Yes, ${action} it!`,
      });

      if (!result.isConfirmed) return;

      try {
        const res = await fetch(`/admin/products/${productId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBlocked: action === 'block' })
        });
        const data = await res.json();
        if (data.success) {
          await Swal.fire(`${action.charAt(0).toUpperCase() + action.slice(1)}ed!`, data.message || `Product ${action}ed.`, "success");
          setTimeout(() => location.reload(), 200);
        } else {
          Swal.fire("Error", data.message || `Failed to ${action} product`, "error");
        }
      } catch (err) {
        console.error("Error toggling product status:", err);
        Swal.fire("Error", "Something went wrong while fetching product data", "error");
      }
    };

    window.toggleVariantStatus = async function (productId, variantId, isBlocked) {
      const action = isBlocked === 'true' ? 'unblock' : 'block';
      const result = await Swal.fire({
        title: `Are you sure?`,
        text: `This variant will be ${action}ed.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: `Yes ${action} variant!`,
      });

      if (!result.isConfirmed) return;

      try {
        const endpoint = action === 'unblock' 
          ? `/admin/products/${productId}/variants/unblock/${variantId}`
          : `/admin/products/${productId}/variants/block/${variantId}`;
        const response = await fetch(endpoint, {
          method: "PATCH",
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (data.success) {
          await Swal.fire(`${action.charAt(0).toUpperCase() + action.slice(1)}ed!`, data.message, "success");
          setTimeout(() => {
            location.reload();
          }, 200);
        } else {
          Swal.fire("Error", data.message || "Something went wrong!", "error");
        }
      } catch (err) {
        console.error("Error toggling variant status:", err);
        Swal.fire("Error", "Something went wrong while fetching variant data", "error");
      }
    };

    document.addEventListener("DOMContentLoaded", function () {
      const addProductBtn = document.getElementById("add-product-btn");
      const productModal = document.getElementById("product-modal");
      const closeModalBtn = document.getElementById("close-modal");
      const cancelBtn = document.getElementById("cancel-btn");
      const productForm = document.getElementById("product-form");
      const modalTitle = document.getElementById("modal-title");
      const productIdInput = document.getElementById("product-id");
      const variantIdInput = document.getElementById("variant-id");
      const submitBtnText = document.getElementById("submit-btn-text");
      const colorVariantsContainer = document.getElementById("color-variants-container");
      const addColorVariantBtn = document.getElementById("add-color-variant");

      function addColorVariant(variant = { _id: "", colorName: "", colorValue: "#000000", regularPrice: "", offerPrice: "", stock: "", productImage: [], hasOffer: false }) {
        const index = colorVariantsContainer.children.length;
        const variantEntry = document.createElement("div");
        variantEntry.className = "variant-entry relative";
        
        const images = Array.isArray(variant.productImage) ? variant.productImage : variant.productImage ? [variant.productImage] : [];
        const imageCount = images.length;
        
        // Initialize uploaded files array
        variantEntry.uploadedFiles = [];
        
        variantEntry.innerHTML = `
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-gray-800 flex items-center">
              <span class="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs mr-2">${index + 1}</span>
              Color Variant ${index + 1}
            </h4>
            <div class="image-counter ${imageCount >= 3 && imageCount <= 4 ? 'valid' : 'invalid'}">
              ${imageCount}/4 Images
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div class="group">
              <label for="color-name-${index}" class="block text-xs font-medium text-gray-700 mb-1">
                Color Name <span class="text-red-500">*</span>
              </label>
              <input type="text" id="color-name-${index}" name="colorVariants[${index}].colorName" 
                     value="${variant.colorName || ""}" 
                     class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm" 
                     placeholder="e.g., Ocean Blue" >
            </div>
            <span class="error-message  text-red-500>" id="error5" ></span>
            <div class="group">
              <label for="color-value-${index}" class="block text-xs font-medium text-gray-700 mb-1">Color</label>
              <div class="flex items-center space-x-2">
                <input type="color" id="color-value-${index}" name="colorVariants[${index}].colorValue" 
                       value="${variant.colorValue || "#000000"}" 
                       class="w-10 h-8 border border-gray-300 rounded cursor-pointer">
                <input type="text" value="${variant.colorValue || "#000000"}" 
                       class="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                       onchange="document.getElementById('color-value-${index}').value = this.value">
              </div>
            </div>
            
            <div class="group">
              <label for="regular-price-${index}" class="block text-xs font-medium text-gray-700 mb-1">
                Regular Price <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                <input type="number" id="regular-price-${index}" name="colorVariants[${index}].regularPrice" 
                       value="${variant.regularPrice || ""}" step="0.01" min="0" 
                       class="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
                       placeholder="0.00" >
              </div>
              <span class="error-message  text-red-500>" id="error6"></span>
            </div>
            
            <div class="group">
              <label for="offer-price-${index}" class="block text-xs font-medium text-gray-700 mb-1">
                Sale Price <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                <input type="number" id="offer-price-${index}" name="colorVariants[${index}].offerPrice" 
                       value="${variant.offerPrice || ""}" step="0.01" min="0" 
                       class="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
                       placeholder="0.00" >
              </div>
              <span class="error-message  text-red-500>" id="error47></span>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div class="group">
              <label for="stock-${index}" class="block text-xs font-medium text-gray-700 mb-1">
                Stock Quantity <span class="text-red-500">*</span>
              </label>
              <input type="number" id="stock-${index}" name="colorVariants[${index}].stock" 
                     value="${variant.stock || ""}" min="0" 
                     class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
                     placeholder="0" >
            </div>
            <span class="error-message  text-red-500" id="error8"></span>
            <div class="flex items-end">
              <label class="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <input type="checkbox" id="has-offer-${index}" name="colorVariants[${index}].hasOffer" 
                       class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2" 
                       ${variant.hasOffer ? "checked" : ""}>
                <span class="text-xs font-medium text-gray-700">Enable Variant Offer</span>
              </label>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Product Images <span class="text-red-500">*</span>
              <span class="text-xs text-gray-500 ml-1">(Add 3-4 images one by one)</span>
            </label>
            
            <div class="image-upload-area mb-3" onclick="document.getElementById('product-image-${index}').click()">
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-2">
                  <i class="fas fa-plus text-primary text-sm"></i>
                </div>
                <p class="text-xs font-medium text-gray-700 mb-1">Add Image</p>
                <p class="text-xs text-gray-500">PNG, JPG up to 5MB</p>
              </div>
              <input type="file" id="product-image-${index}" name="colorVariants[${index}].productImage[]" 
                     accept="image/*" class="hidden" multiple>
            </div>
            <span class="error-message  text-red-500>" id="error9"</span>
            <div class="variant-image-preview-container grid grid-cols-4 gap-2 mb-2">
              ${images.map((img, imgIdx) => `
                <div class="relative group">
                  <img src="${img}" class="variant-image-preview w-full h-16 object-cover rounded-lg" />
                  <button type="button" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onclick="removeImage(this, ${index})">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              `).join("")}
            </div>
            
            <div class="image-error text-red-600 text-xs mt-1 hidden flex items-center">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              <span>Please add between 3-4 images for this variant.</span>
            </div>
            
            ${images.length > 0 ? `
              <div class="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" id="remove-image-${index}" name="colorVariants[${index}].removeImage[]" 
                         class="w-3 h-3 text-yellow-600 border-yellow-300 rounded focus:ring-yellow-500">
                  <span class="text-xs text-yellow-800">Replace all existing images</span>
                </label>
              </div>
              ${images.map((img, imgIdx) => `<input type="hidden" name="colorVariants[${index}].existingImage[${imgIdx}]" value="${img}">`).join("")}
            ` : ""}
            
            <input type="hidden" name="colorVariants[${index}]._id" value="${variant._id || ""}">
          </div>
          
          <button type="button" class="remove-variant-btn" title="Remove this variant">
            <i class="fas fa-trash"></i>
          </button>
        `;
        
        colorVariantsContainer.appendChild(variantEntry);

        // Single image handling with cropper
        const imageInput = variantEntry.querySelector(`input[name="colorVariants[${index}].productImage[]"]`);
        const previewContainer = variantEntry.querySelector(".variant-image-preview-container");
        const uploadArea = variantEntry.querySelector(".image-upload-area");

        if (imageInput) {
          hookCropperOn(imageInput, variantEntry);
        }

        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
          e.preventDefault();
          uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
          uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
          e.preventDefault();
          uploadArea.classList.remove('dragover');
          
          const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
          if (files.length > 0) {
            const file = files[0]; // Only take the first file
            const dt = new DataTransfer();
            dt.items.add(file);
            imageInput.files = dt.files;
            imageInput.dispatchEvent(new Event('change'));
          }
        });

        // Remove variant functionality
        const removeBtn = variantEntry.querySelector(".remove-variant-btn");
        if (removeBtn) {
          removeBtn.addEventListener("click", () => {
            if (colorVariantsContainer.children.length <= 1) {
              Swal.fire("Error", "At least one color variant is ", "error");
              return;
            }
            
            Swal.fire({
              title: 'Remove Variant?',
              text: 'This action cannot be undone.',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#ef4444',
              cancelButtonColor: '#6b7280',
              confirmButtonText: 'Yes, remove it!'
            }).then((result) => {
              if (result.isConfirmed) {
                variantEntry.remove();
                // Renumber remaining variants
                Array.from(colorVariantsContainer.children).forEach((entry, idx) => {
                  const title = entry.querySelector('h4');
                  if (title) {
                    title.innerHTML = `
                      <span class="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs mr-2">${idx + 1}</span>
                      Color Variant ${idx + 1}
                    `;
                  }
                });
              }
            });
          });
        }

        return variantEntry;
      }

      // Function to remove individual images
      window.removeImage = function(button, variantIndex) {
        const imageDiv = button.parentElement;
        const variantEntry = imageDiv.closest('.variant-entry');
        
        // Remove from uploaded files array if it exists
        if (variantEntry.uploadedFiles) {
          const imgIndex = Array.from(imageDiv.parentElement.children).indexOf(imageDiv);
          const existingImagesCount = variantEntry.querySelectorAll('input[name*="existingImage"]').length;
          
          // If this is a newly uploaded image (index >= existing images count)
          if (imgIndex >= existingImagesCount) {
            const newImageIndex = imgIndex - existingImagesCount;
            if (newImageIndex >= 0 && newImageIndex < variantEntry.uploadedFiles.length) {
              variantEntry.uploadedFiles.splice(newImageIndex, 1);
            }
          }
        }
        
        imageDiv.remove();
        updateImageCounter(variantEntry);
      };

      // Enhanced form validation
      // Enhanced form validation
  function validateForm() {
    let isValid = true;

    // Clear previous error messages
    document.querySelectorAll('.error-message').forEach(span => {
      span.style.display = 'none';
      span.textContent = '';
    });

    // Validate basic fields
    const productName = document.getElementById("product-name").value.trim();
    const brand = document.getElementById("product-brand").value;
    const category = document.getElementById("product-category").value;
    const description = document.getElementById("product-description").value.trim();

    if (!productName) {
      document.getElementById("error1").textContent = "Product name is required.";
      document.getElementById("error1").style.display = 'block';
      isValid = false;
    }

    if (!brand) {
      document.getElementById("error2").textContent = "Please select a brand.";
      document.getElementById("error2").style.display = 'block';
      isValid = false;
    }

    if (!category) {
      document.getElementById("error3").textContent = "Please select a category.";
      document.getElementById("error3").style.display = 'block';
      isValid = false;
    }

    if (!description) {
      document.getElementById("error4").textContent = "Product description is required.";
      document.getElementById("error4").style.display = 'block';
      isValid = false;
    }

    // Validate variants
    const variants = document.querySelectorAll("#color-variants-container .variant-entry");
    if (variants.length === 0) {
      document.getElementById("error5").textContent = "At least one color variant is required.";
      document.getElementById("error5").style.display = 'block';
      isValid = false;
    }

    variants.forEach((entry, idx) => {
      const colorName = entry.querySelector(`input[name="colorVariants[${idx}].colorName"]`).value.trim();
      const regularPrice = entry.querySelector(`input[name="colorVariants[${idx}].regularPrice"]`).value;
      const offerPrice = entry.querySelector(`input[name="colorVariants[${idx}].offerPrice"]`).value;
      const stock = entry.querySelector(`input[name="colorVariants[${idx}].stock"]`).value;
      const existingImages = entry.querySelectorAll(`input[name="colorVariants[${idx}].existingImage"]`).length;
      const newImages = entry.uploadedFiles ? entry.uploadedFiles.length : 0;
      const removeImage = entry.querySelector(`input[name="colorVariants[${idx}].removeImage"]`)?.checked || false;
      const variantId = entry.querySelector(`input[name="colorVariants[${idx}]._id"]`).value;

      const totalImages = removeImage ? newImages : newImages + existingImages;

      if (!colorName) {
        entry.querySelector(`#error5-${idx}`).textContent = `Color name is required for variant ${idx + 1}.`;
        entry.querySelector(`#error5-${idx}`).style.display = 'block';
        
        isValid = false;
      }

      if (!regularPrice || parseFloat(regularPrice) <= 0) {
        entry.querySelector(`#error6-${idx}`).textContent = `Valid regular price is required for variant ${idx + 1}.`;
        entry.querySelector(`#error6-${idx}`).style.display = 'block';
        isValid = false;
      }

      if (!offerPrice || parseFloat(offerPrice) <= 0) {
        entry.querySelector(`#error7-${idx}`).textContent = `Valid sale price is required for variant ${idx + 1}.`;
        entry.querySelector(`#error7-${idx}`).style.display = 'block';
        isValid = false;
      }

      if (parseFloat(offerPrice) > parseFloat(regularPrice)) {
        entry.querySelector(`#error7-${idx}`).textContent = `Sale price cannot be higher than regular price for variant ${idx + 1}.`;
        entry.querySelector(`#error7-${idx}`).style.display = 'block';
        isValid = false;
      }

      if (!stock || parseInt(stock) < 0) {
        entry.querySelector(`#error8-${idx}`).textContent = `Valid stock quantity is required for variant ${idx + 1}.`;
        entry.querySelector(`#error8-${idx}`).style.display = 'block';
        isValid = false;
      }

      if (!variantId && totalImages < 3) {
        entry.querySelector(`#error9-${idx}`).textContent = `Minimum 3 images required for variant ${idx + 1}.`;
        entry.querySelector(`#error9-${idx}`).style.display = 'block';
        isValid = false;
      }

      if (totalImages > 4) {
        entry.querySelector(`#error9-${idx}`).textContent = `Maximum 4 images allowed for variant ${idx + 1}.`;
        entry.querySelector(`#error9-${idx}`).style.display = 'block';
        isValid = false;
      }
    });

    return isValid;
  }

      //---------------------------LOADING PROCESSING-----------------------------------//

        // // Show loading state
        // const submitBtn = document.querySelector('#product-form button[type="submit"]');
        // const originalText = submitBtn.innerHTML;
        // submitBtn.classList.add('loading');
        // submitBtn.disabled = true;
        // submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
        //---------------------------LOADING PROCESSING-----------------------------------//

      productForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  const formData = new FormData();
  const variants = buildVariantsJson();

  // Append product fields
  formData.append("productName", document.getElementById("product-name").value);
  formData.append("brand", document.getElementById("product-brand").value);
  formData.append("category", document.getElementById("product-category").value);
  formData.append("description", document.getElementById("product-description").value);
  formData.append("hasOffer", document.getElementById("product-offer").checked);

  // Append variant fields
  variants.forEach((variant, idx) => {
    formData.append(`colorVariants[${idx}][colorName]`, variant.colorName);
    formData.append(`colorVariants[${idx}][colorValue]`, variant.colorValue);
    formData.append(`colorVariants[${idx}][regularPrice]`, variant.regularPrice);
    formData.append(`colorVariants[${idx}][offerPrice]`, variant.offerPrice);
    formData.append(`colorVariants[${idx}][stock]`, variant.stock);
    formData.append(`colorVariants[${idx}][hasOffer]`, variant.hasOffer);
    formData.append(`colorVariants[${idx}][removeImage]`, variant.removeImage);
    if (variant._id) {
      formData.append(`colorVariants[${idx}][_id]`, variant._id);
    }
    variant.existingImage.forEach((img, imgIdx) => {
      formData.append(`colorVariants[${idx}][existingImage][${imgIdx}]`, img);
    });
  });

  // Append images as colorVariants[idx][productImage][]
  document.querySelectorAll("#color-variants-container .variant-entry").forEach((entry, idx) => {
    if (entry.uploadedFiles && entry.uploadedFiles.length >= 3) {
      entry.uploadedFiles.forEach((file, fileIdx) => {
        formData.append(`colorVariants[${idx}][productImage][]`, file);
      });
    } else {
      Swal.fire("Error", `Variant ${idx + 1} must have at least 3 images`, "error");
      return;
    }
  });

  const productId = productIdInput.value;
  const variantId = variantIdInput.value;
  const url = variantId 
    ? `/admin/products/${productId}/variants/${variantId}` 
    : productId 
      ? `/admin/product/${productId}` 
      : "/admin/addProducts";
  const method = productId ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      body: formData,
    });

    const result = await response.json();
    if (response.ok && result.success) {
      Swal.fire({
        title: "Success!",
        text: result.message || "Product saved successfully",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        setTimeout(() => location.reload(), 500);
      });
    } else {
      Swal.fire("Error", result.message || `Server error (Status: ${response.status})`, "error");
    }
  } catch (err) {
    console.error("Error submitting form:", err);
    Swal.fire("Error", "Failed to connect to the server. Please try again.", "error");
  }
});

      // Cropper event handlers
      document.getElementById("cropper-cancel").onclick = () => {
        wrap.classList.add("hidden");
        if (cropper) {
          cropper.destroy();
          cropper = null;
        }
        if (currentInput) {
          currentInput.value = "";
        }
        currentInput = null;
        currentFile = null;
        currentVariantEntry = null;
      };

      document.getElementById("cropper-done").onclick = async () => {
        if (!cropper || !currentInput || !currentVariantEntry) return;
        
        cropper.getCroppedCanvas({ 
          width: 800, 
          height: 800
        }).toBlob((blob) => {
          const fileName = `crop_${Date.now()}.png`;
          const file = new File([blob], fileName, { type: "image/png" });
          
          // Add the cropped file to the variant's uploaded files array
          if (!currentVariantEntry.uploadedFiles) {
            currentVariantEntry.uploadedFiles = [];
          }
          currentVariantEntry.uploadedFiles.push(file);
          
          // Add the image to preview
          const previewContainer = currentVariantEntry.querySelector('.variant-image-preview-container');
          const div = document.createElement("div");
          div.className = "relative group";
          div.innerHTML = `
            <img src="${URL.createObjectURL(file)}" class="variant-image-preview w-full h-16 object-cover rounded-lg" />
            <button type="button" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onclick="removeImage(this, ${Array.from(colorVariantsContainer.children).indexOf(currentVariantEntry)})">
              <i class="fas fa-times"></i>
            </button>
          `;
          previewContainer.appendChild(div);
          
          // Update counter and validation
          updateImageCounter(currentVariantEntry);
          
          // Clear the input for next selection
          currentInput.value = "";
          
          // Hide cropper
          wrap.classList.add("hidden");
          cropper.destroy();
          cropper = null;
          currentInput = null;
          currentFile = null;
          currentVariantEntry = null;
        }, "image/png");
      };

      // Add variant button
      addColorVariantBtn.addEventListener("click", () => addColorVariant());

      // Add product button
      addProductBtn.addEventListener("click", () => {
        productModal.classList.remove("hidden");
        modalTitle.textContent = "Add New Product";
        submitBtnText.textContent = "Add Product";
        productForm.reset();
        colorVariantsContainer.innerHTML = "";
        addColorVariant();
        productIdInput.value = "";
        variantIdInput.value = "";
      });

      // Close modal handlers
      closeModalBtn.addEventListener("click", () => {
        productModal.classList.add("hidden");
      });

      cancelBtn.addEventListener("click", () => {
        productModal.classList.add("hidden");
      });

      // Close modal on outside click
      productModal.addEventListener("click", (e) => {
        if (e.target === productModal) {
          productModal.classList.add("hidden");
        }
      });

      function buildVariantsJson() {
        const variants = [];
        document.querySelectorAll("#color-variants-container .variant-entry").forEach((entry, idx) => {
          const variant = {
            colorName: entry.querySelector(`input[name="colorVariants[${idx}].colorName"]`).value,
            colorValue: entry.querySelector(`input[name="colorVariants[${idx}].colorValue"]`).value,
            regularPrice: parseFloat(entry.querySelector(`input[name="colorVariants[${idx}].regularPrice"]`).value) || 0,
            offerPrice: parseFloat(entry.querySelector(`input[name="colorVariants[${idx}].offerPrice"]`).value) || 0,
            stock: parseInt(entry.querySelector(`input[name="colorVariants[${idx}].stock"]`).value) || 0,
            hasOffer: entry.querySelector(`input[name="colorVariants[${idx}].hasOffer"]`).checked,
            _id: entry.querySelector(`input[name="colorVariants[${idx}]._id"]`).value || "",
            removeImage: entry.querySelector(`input[name="colorVariants[${idx}].removeImage"]`)?.checked || false,
            existingImage: Array.from(entry.querySelectorAll(`input[name="colorVariants[${idx}].existingImage"]`)).map(input => input.value)
            
          };
          variants.push(variant);
        });
        return variants;
      }
document.querySelectorAll("#color-variants-container .variant-entry").forEach((entry, idx) => {
  if (entry.uploadedFiles) {
    console.log(`Variant ${idx + 1}: ${entry.uploadedFiles.length} images`, entry.uploadedFiles.map(f => f.name));
  }
});
      window.openEditModal = async function(productId, variantId = null) {
        try {
          

          const response = await fetch(`/admin/products/${productId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          
          Swal.close();
          
          if (!data.success) {
            Swal.fire("Error", data.message || "Failed to fetch product data", "error");
            return;
          }

          const product = data.product;
          productModal.classList.remove("hidden");
          modalTitle.textContent = variantId ? "Edit Variant" : "Edit Product";
          submitBtnText.textContent = "Update Product";
          productIdInput.value = productId;
          variantIdInput.value = variantId || "";

          // Populate product fields
          document.getElementById("product-name").value = product.productName || "";
          document.getElementById("product-brand").value = product.brand?._id || "";
          document.getElementById("product-category").value = product.category?._id || "";
          document.getElementById("product-description").value = product.description || "";
          document.getElementById("product-offer").checked = product.hasOffer || false;

          // Clear and populate color variants
          colorVariantsContainer.innerHTML = "";
          if (variantId) {
            const variant = product.colorVariants.find(v => v._id === variantId);
            if (variant) {
              addColorVariant({
                _id: variant._id,
                colorName: variant.colorName,
                colorValue: variant.colorValue,
                regularPrice: variant.regularPrice,
                offerPrice: variant.offerPrice,
                stock: variant.stock,
                productImage: variant.productImage,
                hasOffer: variant.hasOffer
              });
            }
          } else {
            product.colorVariants.forEach(variant => {
              addColorVariant({
                _id: variant._id,
                colorName: variant.colorName,
                colorValue: variant.colorValue,
                regularPrice: variant.regularPrice,
                offerPrice: variant.offerPrice,
                stock: variant.stock,
                productImage: variant.productImage,
                hasOffer: variant.hasOffer
              });
            });
          }

          // Ensure fields are editable
          document.getElementById("product-name").removeAttribute("disabled");
          document.getElementById("product-brand").removeAttribute("disabled");
          document.getElementById("product-category").removeAttribute("disabled");
        } catch (err) {
          console.error("Error fetching product data:", err);
          Swal.close();
          Swal.fire("Error", "Something went wrong while fetching product data", "error");
        }
      };
    });
    













    
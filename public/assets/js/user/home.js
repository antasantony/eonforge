document.addEventListener("DOMContentLoaded", () => {
// Account Dropdown (close only when clicking outside)
const accountToggle = document.querySelector(".account-toggle")
const accountDropdown = document.querySelector(".account-dropdown")

if (accountToggle && accountDropdown) {
  accountToggle.addEventListener("click", () => {
    // Show dropdown (do not toggle on/off)
    accountDropdown.classList.remove("hidden")
  })

  document.addEventListener("click", (event) => {
    const isClickInside = accountToggle.contains(event.target) || accountDropdown.contains(event.target)
    if (!isClickInside) {
      accountDropdown.classList.add("hidden")
    }
  })
}




    // Search Clear Button
    const searchInput = document.querySelector(".search-input")
    const searchClearBtn = document.querySelector(".search-clear-btn")
  
    if (searchInput && searchClearBtn) {
      // Initially hide the clear button if input is empty
      searchClearBtn.style.display = searchInput.value ? "block" : "none"
  
      searchInput.addEventListener("input", function () {
        searchClearBtn.style.display = this.value ? "block" : "none"
      })
  
      searchClearBtn.addEventListener("click", function () {
        searchInput.value = ""
        searchInput.focus()
        this.style.display = "none"
      })
    }
  
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector(".mobile-menu-btn")
    const mainNav = document.querySelector(".main-nav")
  
    if (mobileMenuBtn && mainNav) {
      mobileMenuBtn.addEventListener("click", function () {
        this.classList.toggle("active")
        mainNav.classList.toggle("active")
      })
    }
  
    // Mobile Dropdown Toggle
    const dropdowns = document.querySelectorAll(".dropdown")
  
    dropdowns.forEach((dropdown) => {
      const link = dropdown.querySelector("a")
  
      link.addEventListener("click", (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault()
          dropdown.classList.toggle("active")
        }
      })
    })
  

        // Carousel JavaScript
      
        // Carousel JavaScript
        const slides = document.querySelectorAll('.carousel-slide');
        const indicators = document.querySelectorAll('.indicator');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        let currentIndex = 0;
        const slideInterval = 5000;

        function showSlide(index) {
            if (index >= slides.length) index = 0;
            if (index < 0) index = slides.length - 1;

            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });

            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('bg-white', i === index);
                indicator.classList.toggle('bg-gray-400', i !== index);
            });

            currentIndex = index;
        }

        function nextSlide() {
            showSlide(currentIndex + 1);
        }

        function prevSlide() {
            showSlide(currentIndex - 1);
        }

        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);

        indicators.forEach((indicator, i) => {
            indicator.addEventListener('click', () => showSlide(i));
        });

        let autoSlide = setInterval(nextSlide, slideInterval);

        const carousel = document.querySelector('.carousel-container');
        carousel.addEventListener('mouseenter', () => clearInterval(autoSlide));
        carousel.addEventListener('mouseleave', () => {
            autoSlide = setInterval(nextSlide, slideInterval);
        });

        showSlide(currentIndex);

     
       
 

        // Search Bar Toggle
        const searchToggle = document.getElementById('search-toggle');
        const searchBar = document.getElementById('search-bar');
        const searchClose = document.getElementById('search-close');

        searchToggle.addEventListener('click', () => {
            searchBar.classList.toggle('opacity-0');
            searchBar.classList.toggle('invisible');
        });

        searchClose.addEventListener('click', () => {
            searchBar.classList.add('opacity-0');
            searchBar.classList.add('invisible');
        });


  
    // Wishlist Button Toggle
    const wishlistButtons = document.querySelectorAll(".btn-wishlist")
  
    wishlistButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const icon = this.querySelector("i")
  
        if (icon.classList.contains("far")) {
          icon.classList.remove("far")
          icon.classList.add("fas")
          icon.style.color = "#e74c3c"
  
          // Show notification
          showNotification("Product added to wishlist!")
        } else {
          icon.classList.remove("fas")
          icon.classList.add("far")
          icon.style.color = ""
  
          // Show notification
          showNotification("Product removed from wishlist!")
        }
      })
    })
  
    // Add to Cart Button
    const addToCartButtons = document.querySelectorAll(".btn-add-to-cart")
  
    addToCartButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const productId = this.getAttribute("data-product-id")
  
        // Simulate adding to cart
        showNotification("Product added to cart!")
  
        // You would typically send an AJAX request to add the item to the cart
        console.log(`Product ${productId} added to cart`)
      })
    })
  
    // Quick View Button
    const quickViewButtons = document.querySelectorAll(".btn-quick-view")
  
    quickViewButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const productId = this.getAttribute("data-product-id")
  
        // You would typically open a modal with product details
        alert(`Quick view for product ${productId}`)
      })
    })
  
    // Newsletter Form Submission
    const newsletterForm = document.querySelector(".newsletter-form")
  
    if (newsletterForm) {
      newsletterForm.addEventListener("submit", function (e) {
        e.preventDefault()
        const email = this.querySelector('input[type="email"]').value
  
        if (!email) {
          alert("Please enter your email address")
          return
        }
  
        // Here you would typically send the email to your server
        showNotification("Thank you for subscribing to our newsletter!")
        this.reset()
      })
    }
  
    // Pagination
    const paginationLinks = document.querySelectorAll(".page-link")
  
    paginationLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        if (!this.parentElement.classList.contains("disabled")) {
          e.preventDefault()
  
          // Remove active class from all links
          paginationLinks.forEach((link) => {
            link.parentElement.classList.remove("active")
          })
  
          // Add active class to clicked link if it's a number
          if (!this.getAttribute("aria-label")) {
            this.parentElement.classList.add("active")
          }
  
          // Here you would typically load new content or navigate to a new page
          console.log(`Navigating to page ${this.textContent.trim()}`)
        }
      })
    })
  
    // Notification function
    function showNotification(message) {
      // Create notification element
      const notification = document.createElement("div")
      notification.className = "notification"
      notification.textContent = message
  
      // Style the notification
      notification.style.position = "fixed"
      notification.style.bottom = "20px"
      notification.style.right = "20px"
      notification.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
      notification.style.color = "#fff"
      notification.style.padding = "12px 20px"
      notification.style.borderRadius = "4px"
      notification.style.zIndex = "1000"
      notification.style.opacity = "0"
      notification.style.transform = "translateY(20px)"
      notification.style.transition = "opacity 0.3s, transform 0.3s"
  
      // Add to DOM
      document.body.appendChild(notification)
  
      // Trigger animation
      setTimeout(() => {
        notification.style.opacity = "1"
        notification.style.transform = "translateY(0)"
      }, 10)
  
      // Remove after 3 seconds
      setTimeout(() => {
        notification.style.opacity = "0"
        notification.style.transform = "translateY(20px)"
  
        setTimeout(() => {
          document.body.removeChild(notification)
        }, 300)
      }, 3000)
    }
  
    // Animation on Scroll
    const animateOnScroll = () => {
      const elements = document.querySelectorAll(".product-card, .brand-card, .gender-card")
  
      elements.forEach((element) => {
        const elementPosition = element.getBoundingClientRect().top
        const windowHeight = window.innerHeight
  
        if (elementPosition < windowHeight - 100) {
          element.style.opacity = "1"
          element.style.transform = "translateY(0)"
        }
      })
    }
  
    // Set initial styles for animation
    document.querySelectorAll(".product-card, .brand-card, .gender-card").forEach((element) => {
      element.style.opacity = "0"
      element.style.transform = "translateY(20px)"
      element.style.transition = "all 0.5s ease"
    })
  
    // Run animation on load and scroll
    window.addEventListener("load", animateOnScroll)
    window.addEventListener("scroll", animateOnScroll)
  })
  
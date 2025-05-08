document.addEventListener('DOMContentLoaded', function() {
    // Try Again button functionality for 500 page
    const tryAgainBtn = document.getElementById('tryAgain');
    if (tryAgainBtn) {
      tryAgainBtn.addEventListener('click', function() {
        // Show loading state
        const icon = this.querySelector('i');
        icon.classList.add('fa-spin');
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Trying...';
        
        // Try reloading after 1 second (simulate network delay)
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
    }
    
    // Add animation to error code
    const errorCode = document.querySelector('h1');
    if (errorCode) {
      let counter = 0;
      const originalText = errorCode.textContent;
      
      const animateErrorCode = () => {
        if (counter < 5) {
          errorCode.textContent = Math.floor(Math.random() * 1000);
          counter++;
          setTimeout(animateErrorCode, 100);
        } else {
          errorCode.textContent = originalText;
        }
      };
      
      // Animate when page loads
      setTimeout(animateErrorCode, 500);
      
      // Animate when mouse hovers
      errorCode.addEventListener('mouseenter', animateErrorCode);
    }
    
    // Add pulse animation to buttons on hover
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', function() {
        this.classList.add('pulse');
        setTimeout(() => {
          this.classList.remove('pulse');
        }, 500);
      });
    });
  });
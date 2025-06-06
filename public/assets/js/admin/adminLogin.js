// document.addEventListener('DOMContentLoaded', function() {
//     const loginForm = document.querySelector('form');
    
//     // Form validation
//     loginForm.addEventListener('submit', function(event) {
//         const username = document.getElementById('username').value.trim();
//         const password = document.getElementById('password').value.trim();
        
//         if (!username || !password) {
//             event.preventDefault();
//             showError('Please enter both username and password');
//         }
//     });
    
//     // Show error message function
//     function showError(message) {
//         // Check if error element already exists
//         let errorElement = document.querySelector('.error-message');
        
//         if (!errorElement) {
//             // Create error element if it doesn't exist
//             errorElement = document.createElement('div');
//             errorElement.className = 'error-message';
//             const formElement = document.querySelector('.login-form');
//             formElement.insertBefore(errorElement, formElement.firstChild);
//         }
        
//         errorElement.textContent = message;
//     }
    
//     // Password visibility toggle
//     const passwordField = document.getElementById('password');
    
//     // Add password strength indicator (optional enhancement)
//     passwordField.addEventListener('input', function() {
//         // This is just a placeholder for password strength checking
//         // In a real application, you would implement proper password strength checking
//         const password = this.value;
        
//         if (password.length > 0) {
//             // Password strength logic would go here
//         }
//     });
    
//     // Remember me functionality
//     const rememberCheckbox = document.getElementById('remember');
    
//     // Check if there's a saved username in localStorage
//     const savedUsername = localStorage.getItem('eonforge_admin_username');
//     if (savedUsername) {
//         document.getElementById('username').value = savedUsername;
//         rememberCheckbox.checked = true;
//     }
    
//     // Save username if remember me is checked
//     loginForm.addEventListener('submit', function() {
//         if (rememberCheckbox.checked) {
//             localStorage.setItem('eonforge_admin_username', document.getElementById('username').value);
//         } else {
//             localStorage.removeItem('eonforge_admin_username');
//         }
//     });
// });
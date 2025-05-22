// document.addEventListener("DOMContentLoaded", () => {
//     // Toggle password visibility
//     const togglePasswordButtons = document.querySelectorAll(".toggle-password")
  
//     togglePasswordButtons.forEach((button) => {
//       button.addEventListener("click", function () {
//         const input = this.previousElementSibling
//         const icon = this.querySelector("i")
  
//         if (input.type === "password") {
//           input.type = "text"
//           icon.classList.remove("fa-eye")
//           icon.classList.add("fa-eye-slash")
//         } else {
//           input.type = "password"
//           icon.classList.remove("fa-eye-slash")
//           icon.classList.add("fa-eye")
//         }
//       })
//     })
  
//     // Form validation
//     const loginForm = document.getElementById("loginForm")
//     const signupForm = document.getElementById("signupForm")
  
//     if (loginForm) {
//       loginForm.addEventListener("submit", (e) => {
//         e.preventDefault()
  
//         // Reset previous errors
//         clearErrors()
  
//         const email = document.getElementById("email").value
//         const password = document.getElementById("password").value
//         let isValid = true
  
//         // Validate email
//         if (!validateEmail(email)) {
//           showError("email", "Please enter a valid email address")
//           isValid = false
//         }
  
//         // Validate password
//         if (password.length < 6) {
//           showError("password", "Password must be at least 6 characters")
//           isValid = false
//         }
  
//         if (isValid) {
//           // Simulate form submission
//           simulateFormSubmission("login", {
//             email,
//             password,
//             remember: document.getElementById("remember").checked,
//           })
//         }
//       })
//     }
  
//     if (signupForm) {
//       // Password strength indicator
//       const passwordInput = document.getElementById("password")
//       if (passwordInput) {
//         passwordInput.addEventListener("input", function () {
//           updatePasswordStrength(this.value)
//         })
//       }
  
//       signupForm.addEventListener("submit", (e) => {
//         e.preventDefault()
  
//         // Reset previous errors
//         clearErrors()
  
//         const firstName = document.getElementById("firstName").value
//         const lastName = document.getElementById("lastName").value
//         const email = document.getElementById("email").value
//         const password = document.getElementById("password").value
//         const confirmPassword = document.getElementById("confirmPassword").value
//         const terms = document.getElementById("terms").checked
  
//         let isValid = true
  
//         // Validate first name
//         if (firstName.trim() === "") {
//           showError("firstName", "First name is required")
//           isValid = false
//         }
  
//         // Validate last name
//         if (lastName.trim() === "") {
//           showError("lastName", "Last name is required")
//           isValid = false
//         }
  
//         // Validate email
//         if (!validateEmail(email)) {
//           showError("email", "Please enter a valid email address")
//           isValid = false
//         }
  
//         // Validate password
//         if (password.length < 8) {
//           showError("password", "Password must be at least 8 characters")
//           isValid = false
//         } else if (!validatePasswordStrength(password)) {
//           showError("password", "Password must include uppercase, lowercase, number, and special character")
//           isValid = false
//         }
  
//         // Validate confirm password
//         if (password !== confirmPassword) {
//           showError("confirmPassword", "Passwords do not match")
//           isValid = false
//         }
  
//         // Validate terms
//         if (!terms) {
//           showError("terms", "You must agree to the Terms of Service and Privacy Policy")
//           isValid = false
//         }
  
//         if (isValid) {
//           // Simulate form submission
//           simulateFormSubmission("signup", {
//             firstName,
//             lastName,
//             email,
//             password,
//           })
//         }
//       })
//     }
  
//     // Social login buttons
//     const socialButtons = document.querySelectorAll(".btn-social")
  
//     socialButtons.forEach((button) => {
//       button.addEventListener("click", function () {
//         const provider = this.classList.contains("google") ? "Google" : "Facebook"
//         alert(`${provider} authentication will be implemented on the server side.`)
//       })
//     })
  
//     // Helper functions
//     function validateEmail(email) {
//       const re =
//         /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
//       return re.test(String(email).toLowerCase())
//     }
  
//     function validatePasswordStrength(password) {
//       // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
//       const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
//       return re.test(password)
//     }
  
//     function showError(field, message) {
//       const errorElement = document.getElementById(`${field}Error`)
//       if (errorElement) {
//         errorElement.textContent = message
//       }
  
//       const inputGroup = document.getElementById(field).closest(".input-group")
//       if (inputGroup) {
//         inputGroup.classList.add("error")
//       }
//     }
  
//     function clearErrors() {
//       const errorMessages = document.querySelectorAll(".error-message")
//       errorMessages.forEach((element) => {
//         element.textContent = ""
//       })
  
//       const inputGroups = document.querySelectorAll(".input-group")
//       inputGroups.forEach((group) => {
//         group.classList.remove("error")
//         group.classList.remove("success")
//       })
//     }
  
//     function updatePasswordStrength(password) {
//       const strengthBars = document.querySelectorAll(".strength-bar")
  
//       // Reset all bars
//       strengthBars.forEach((bar) => {
//         bar.className = "strength-bar"
//       })
  
//       if (password.length === 0) return
  
//       // Calculate password strength
//       let strength = 0
//       if (password.length >= 8) strength++
//       if (/[A-Z]/.test(password)) strength++
//       if (/[a-z]/.test(password)) strength++
//       if (/[0-9]/.test(password)) strength++
//       if (/[^A-Za-z0-9]/.test(password)) strength++
  
//       // Update strength bars
//       for (let i = 0; i < strength && i < 4; i++) {
//         if (strength <= 2) {
//           strengthBars[i].classList.add("weak")
//         } else if (strength <= 3) {
//           strengthBars[i].classList.add("medium")
//         } else {
//           strengthBars[i].classList.add("strong")
//         }
//       }
//     }
  
//     function simulateFormSubmission(type, data) {
//       // Show loading state
//       const submitButton = document.querySelector(".btn-submit")
//       const originalText = submitButton.textContent
//       submitButton.textContent = "Processing..."
//       submitButton.disabled = true
  
//       // Simulate API call
//       setTimeout(() => {
//         console.log(`${type} form submitted with data:`, data)
  
//         // Reset button
//         submitButton.textContent = originalText
//         submitButton.disabled = false
  
//         // Show success message
//         alert(`${type === "login" ? "Login" : "Registration"} successful! Redirecting to dashboard...`)
  
//         // Redirect (in a real app, this would happen after successful authentication)
//         // window.location.href = '/dashboard';
//       }, 1500)
//     }
//   })

// document.getElementById('signup-form').addEventListener('submit',async(e)=>{
//     e.preventDefault();

//     const form =e.target;
//     const formData=new URLSearchParams(new formData(form))

//     try{
//         const res = await fetch("/signup",{
//             method:'POST',
//             headers:{
//                 "Content-Type": "application/x-www-form-urlencoded",
//             },
//             body:formData,
//         });

//         const data = await res.json();

//         const msgElem= document.getElementById("message");
//         if(data.success){
//             msgElem.style.color = "green";
//             msgElem.textContent = data.message;
//             form.reset();
//         }else {
//             msgElem.style.color = "red";
//             msgElem.textContent = data.message;
//           }
//     }catch(error){
//         console.error("Error:",error)
//     }
   
// });
  




document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("signup-form");

    const nameid = document.getElementById("firstName");
    const lnameid = document.getElementById("lastName");
    const emailid = document.getElementById("email");
    const passid = document.getElementById("password");
    const cpassid = document.getElementById("confirmPassword");

    const error1 = document.getElementById("error1");
    const error2 = document.getElementById("error2");
    const error3 = document.getElementById("error3");
    const error4 = document.getElementById("error4");
    const error5 = document.getElementById("error5");

    function nameValidate() {
        const nameval = nameid.value.trim();
        const namepattern = /^[A-Za-z\s]+$/;
        if (!nameval) {
            error1.textContent = "Please enter your first name";
            error1.style.display = "block";
            return false;
        } else if (!namepattern.test(nameval)) {
            error1.textContent = "Only alphabets and spaces allowed";
            error1.style.display = "block";
            return false;
        }
        error1.style.display = "none";
        return true;
    }

    function lnameValidate() {
        const lnameval = lnameid.value.trim();
        const lnamepattern = /^[A-Za-z\s]+$/;
        if (!lnameval) {
            error3.textContent = "Please enter your last name";
            error3.style.display = "block";
            return false;
        } else if (!lnamepattern.test(lnameval)) {
            error3.textContent = "Only alphabets and spaces allowed";
            error3.style.display = "block";
            return false;
        }
        error3.style.display = "none";
        return true;
    }

    function emailValidate() {
        const emailval = emailid.value.trim();
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!pattern.test(emailval)) {
            error2.textContent = "Invalid email format";
            error2.style.display = "block";
            return false;
        }
        error2.style.display = "none";
        return true;
    }


    function passValidate() {
        const passval = passid.value;
        const cpassval = cpassid.value;
        const hasLetter = /[a-zA-Z]/.test(passval);
        const hasDigit = /\d/.test(passval);

        if (passval.length < 8 || !hasLetter || !hasDigit) {
            error4.textContent = "Password must be 8+ characters with letters & numbers";
            error4.style.display = "block";
            return false;
        }
        error4.style.display = "none";

        if (passval !== cpassval) {
            error5.textContent = "Passwords do not match";
            error5.style.display = "block";
            return false;
        }
        error5.style.display = "none";

        return true;
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const isNameValid = nameValidate();
        const isLNameValid = lnameValidate();
        const isEmailValid = emailValidate();
        const isPassValid = passValidate();

        if (!isNameValid || !isLNameValid || !isEmailValid || !isPassValid) {
            return;
        }

        const formData = new URLSearchParams(new FormData(form));

        try {
            const res = await fetch("/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: formData
            });

            const data = await res.json();
            const msgElem = document.getElementById("message");

            if (data.success) {
                msgElem.style.color = "green";
                msgElem.textContent = data.message;
                form.reset();
                window.location.href = "/verify-otp"; 
            } else {
                msgElem.style.color = "red";
                msgElem.textContent = data.message;
            }
        } catch (err) {
            console.error("Signup error:", err);
        }
    });


    //========== eye setting  =============  //
    const toggleButtons = document.querySelectorAll(".toggle-password");

  toggleButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const input = this.previousElementSibling;
      const icon = this.querySelector("i");

      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  });

});



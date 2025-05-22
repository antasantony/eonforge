// // Password strength checker
// function checkPasswordStrength() {
//   const password = document.getElementById('newPassword').value;
//   const strengthBars = [
//     document.getElementById('strength-1'),
//     document.getElementById('strength-2'),
//     document.getElementById('strength-3'),
//     document.getElementById('strength-4')
//   ];
//   const helpText = document.getElementById('password-help');


//   // Reset all bars
//   strengthBars.forEach(bar => {
//     bar.classList.remove('bg-red-500', 'bg-yellow-400', 'bg-green-500');
//     bar.classList.add('bg-gray-500/50');
//   });

//   if (password.length === 0) {
//     helpText.textContent = '';
//     return;
//   }

//   // Weak (length only)
//   if (password.length < 8) {
//     strengthBars[0].classList.replace('bg-gray-500/50', 'bg-red-500');
//     helpText.textContent = 'Too short (min 8 characters)';
//     return;
//   }

//   // Medium (length + some complexity)
//   const hasLetters = /[a-zA-Z]/.test(password);
//   const hasNumbers = /\d/.test(password);
//   const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  
//   let strength = 1;
//   strengthBars[0].classList.replace('bg-gray-500/50', 'bg-yellow-400');
  
//   if (hasLetters && hasNumbers) {
//     strength++;
//     strengthBars[1].classList.replace('bg-gray-500/50', 'bg-yellow-400');
//   }
  
//   if (hasLetters && hasNumbers && hasSpecial) {
//     strength++;
//     strengthBars[2].classList.replace('bg-gray-500/50', 'bg-green-500');
//   }
  
//   if (password.length > 12 && hasLetters && hasNumbers && hasSpecial) {
//     strength++;
//     strengthBars[3].classList.replace('bg-gray-500/50', 'bg-green-500');
//   }
  
//   // Help text
//   const messages = ['Weak', 'Fair', 'Good', 'Strong'];
//   helpText.textContent = `${messages[strength-1]} password` + 
//     (strength < 4 ? ' - add special characters' : '');
// }

// // Password match checker
// document.getElementById('confirmPassword').addEventListener('input', function() {
//   const matchElement = document.getElementById('password-match');
//   if (this.value !== document.getElementById('newPassword').value) {
//     matchElement.classList.remove('hidden');
//   } else {
//     matchElement.classList.add('hidden');
//   }
// });

// // Form submission
// document.getElementById('resetForm').addEventListener('submit', function(e) {
//   const password = document.getElementById('newPassword').value;
//   const confirmPassword = document.getElementById('confirmPassword').value;
  
//   if (password !== confirmPassword) {
//     e.preventDefault();
//     document.getElementById('password-match').classList.remove('hidden');
//     return;
//   }
  
//   if (password.length < 8) {
//     e.preventDefault();
//     alert('Password must be at least 8 characters');
//     return;
//   }
// });
// const form = document.querySelector('#resetForm')
// form.addEventListener('submit',async (e)=>{

//   e.preventDefault();
//   const newPassword = document.querySelector('#newPassword').value
// const response = fetch('/reset-password',{
//   method:patch,
//   headers:{'Content-Type':application/json},
//   body:JSON.stringify({newPassword})
// });

// const data= await response.json();

// if(data.success){
//   alert(data.message)
//   window.location.href="/login"
// }else{
//   alert(data.message)
// }


// });

const form = document.getElementById('resetForm');
const messageBox = document.getElementById('messageBox');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    messageBox.textContent = "Passwords don't match!";
    messageBox.classList.remove('hidden');
    messageBox.classList.add('text-red-300');
    return;
  }

  try {
    const response = await fetch('/reset-password', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newPassword })
    });

    const data = await response.json();
    messageBox.classList.remove('hidden');

    if (data.success) {
      messageBox.textContent = data.message || "Password updated successfully!";
      messageBox.classList.remove('text-red-300');
      messageBox.classList.add('text-green-300');

      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else {
      messageBox.textContent = data.message || "Something went wrong!";
      messageBox.classList.remove('text-green-300');
      messageBox.classList.add('text-red-300');
    }
  } catch (error) {
    console.log('newpaa error:',error)
    messageBox.textContent = "Server error. Please try again.";
    messageBox.classList.remove('text-green-300');
    messageBox.classList.add('text-red-300');
    messageBox.classList.remove('hidden');
  }



 
 // ===== TIMER LOGIC =====
  function startTimer() {
    clearInterval(interval);
    timeLeft = 60;


    resendBtn.disabled = true;
    resendBtn.style.pointerEvents = 'none';
    resendBtn.style.opacity = 0.5;


    verifyBtn.disabled = false;
    verifyBtn.innerText = "Verify";
    verifyBtn.style.cursor = "pointer";
    verifyBtn.style.background = "";

    interval = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      countdownEl.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

      timeLeft--;

      if (timeLeft < 0) {
        clearInterval(interval);
        countdownEl.textContent = "Expired";
        verifyBtn.disabled = true;
        verifyBtn.innerText = "OTP Expired";
        verifyBtn.style.cursor = "not-allowed";
        verifyBtn.style.background = "#999";


        resendBtn.disabled = false;
        resendBtn.style.pointerEvents = 'auto';
        resendBtn.style.opacity = 1;


      }
    }, 1000);
  }

  startTimer(); // start countdown on page load

  // ===== RESEND OTP FUNCTION =====
  function resendOTP(event) {
    if (event) event.preventDefault();

    clearInterval(interval);
    timeLeft = 60;

    resendBtn.disabled = true;
    resendBtn.style.pointerEvents = 'none';
    resendBtn.style.opacity = 0.5;


    otpInputs.forEach(input => input.value = "");
    otpInputs[0].focus();

    countdownEl.classList.remove("expired");

    fetch("/forgotResend-otp", {
      method: "POST",
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          Swal.fire({
            icon: "success",
            title: "OTP Resent Successfully",
            showConfirmButton: false,
            timer: 1500,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: response.message || "An error occurred while resending OTP.",
          });
        }
        startTimer();
      })
      .catch(() => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Could not resend OTP. Try again later.",
        });
      });
  }

  // Make it globally available for inline <a onclick="resendOTP(event)">
  window.resendOTP = resendOTP;
});













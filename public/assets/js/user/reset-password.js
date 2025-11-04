const form = document.getElementById('resetForm');
const messageBox = document.getElementById('messageBox');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

   const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasDigit = /\d/.test(newPassword);

 
    if (!newPassword || !confirmPassword) {
      messageBox.textContent = 'Please fill in both fields.';
      messageBox.classList.remove('hidden', 'text-green-500');
      messageBox.classList.add('text-red-300');
      return;
    }

    
    if (!hasLetter || !hasDigit) {
      messageBox.textContent = 'Password must include letters and numbers.';
      messageBox.classList.remove('hidden', 'text-green-500');
      messageBox.classList.add('text-red-300');
      return;
    }

    if (newPassword !== confirmPassword) {
      messageBox.textContent = "Passwords don't match!";
      messageBox.classList.remove('hidden', 'text-green-500');
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













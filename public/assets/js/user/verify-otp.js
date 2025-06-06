
  

document.addEventListener("DOMContentLoaded", () => {
  const otpInputs = document.querySelectorAll(".otp-input");
  const otpForm = document.getElementById("otpForm");
  const countdownEl = document.getElementById("countdown");
  const verifyBtn = document.querySelector(".verify-btn");
  const resendBtn = document.querySelector(".resend-btn")

  let timeLeft = 60; // seconds
  let interval;

  // ===== OTP INPUT HANDLING =====
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", function () {
      if (this.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !this.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    input.addEventListener("keypress", (e) => {
      if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text").trim();

      if (/^\d+$/.test(pasteData)) {
        for (let i = 0; i < pasteData.length && i < otpInputs.length; i++) {
          otpInputs[i].value = pasteData[i];
        }
        if (pasteData.length < otpInputs.length) {
          otpInputs[pasteData.length].focus();
        }
      }
    });

    input.addEventListener("focus", function () {
      this.style.transform = "scale(1.05)";
    });

    input.addEventListener("blur", function () {
      this.style.transform = "scale(1)";
    });
  });

  // ===== FORM SUBMISSION =====
  otpForm.addEventListener("submit", function (e) {
    e.preventDefault();

    let otp = "";
    let isComplete = true;

    otpInputs.forEach((input) => {
      if (input.value) {
        otp += input.value;
      } else {
        isComplete = false;
      }
    });

    if (!isComplete) {
      alert("Please enter all 6 digits.");
      return;
    }

    fetch("/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ otp }),
      credentials:'include'
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          Swal.fire({
            icon: "success",
            title: "OTP verified successfully",
            showConfirmButton: false,
            timer: 1500,
          }).then(() => {
            window.location.href = response.redirectUrl;
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: response.message,
          });
        }
      })
      .catch(() => {
        Swal.fire({
          icon: "error",
          title: "Invalid OTP",
          text: "Please try again",
        });
      });
  });

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

    fetch("/resend-otp", {
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

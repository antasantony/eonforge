document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    const errorMessage = document.getElementById("error-message");
    const emailInput = form.email;
    const passwordInput = form.password;


  emailInput.addEventListener("input", () => {
    errorMessage.textContent = "";
  });

  passwordInput.addEventListener("input", () => {
    errorMessage.textContent = "";
  });

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const formData = {
            email: form.email.value,
            password: form.password.value
        };
        

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = result.redirectUrl;
            } else {
                errorMessage.style.display = "block";
                errorMessage.textContent = result.message;
            }

        } catch (err) {
            errorMessage.style.display = "block";
            errorMessage.textContent = "Something went wrong. Please try again.";
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

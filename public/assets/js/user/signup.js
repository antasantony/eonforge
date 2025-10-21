document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("signup-form");

    const nameid = document.getElementById("firstName");
    const lnameid = document.getElementById("lastName");
    const emailid = document.getElementById("email");
    const passid = document.getElementById("password");
    const cpassid = document.getElementById("confirmPassword");
    const submitBTn = document.getElementById("btn-submit");
   
    const text = document.getElementById("btn-text");

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
        //Button disable
       
       


        if (!isNameValid || !isLNameValid || !isEmailValid || !isPassValid) {
            return;
        }
        submitBTn.disabled=true;
        submitBTn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

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



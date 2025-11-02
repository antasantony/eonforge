
        document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    const errorMessage = document.getElementById("error-message");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const formData = {
            email: form.email.value,
            password: form.password.value
        };

        try {
            const response = await fetch("/admin/login", {
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
});


document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgotForm');
    const messageEl = document.getElementById('messageElement');
    const emailInput = document.getElementById('email');

    form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    if (!email) {
        messageEl.classList.remove('text-green-500');
        messageEl.classList.add('text-red-500');
        messageEl.textContent = 'Email is required.';
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        messageEl.classList.remove('text-green-500');
        messageEl.classList.add('text-red-500');
        messageEl.textContent = 'Please enter a valid email address.';
        return;
    }

    // Show loading state
    submitButton.textContent = "Processing...";
    submitButton.disabled = true;
    submitButton.classList.add("opacity-70", "cursor-not-allowed");

    try {
        const response = await fetch('/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const result = await response.json();

        messageEl.classList.remove('text-green-500', 'text-red-500');
        messageEl.classList.add(result.success ? 'text-green-500' : 'text-red-500');
        messageEl.textContent = result.message;

        if (result.success) {
            setTimeout(() => {
                window.location.href = result.redirectUrl || '/forgotPassword-otp';
            }, 1000);
        } else {
            // Restore button if not redirecting
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            submitButton.classList.remove("opacity-70", "cursor-not-allowed");
        }
    } catch (error) {
        console.error('Network error:', error);
        messageEl.classList.remove('text-green-500');
        messageEl.classList.add('text-red-500');
        messageEl.textContent = 'Network error. Please try again.';

        // Restore button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.classList.remove("opacity-70", "cursor-not-allowed");
    }
});

});
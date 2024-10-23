document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('contactForm');
    var submitButton = document.getElementById('submitButton');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Disable the submit button and change text
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        // Get form values
        var params = {
            from_name: document.getElementById('name').value,
            email_id: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };

        // Send email using EmailJS
        emailjs.send('service_vvrmokl', 'template_md8hsmf', params)
            .then(function(response) {
                console.log('Original email sent successfully', response);
                // Send auto-reply
                return emailjs.send('service_vvrmokl', 'template_2kii9zg', {
                    to_email: params.email_id,
                    to_name: params.from_name
                });
            })
            .then(function(response) {
                console.log('Auto-reply sent successfully', response);
                alert('Your message has been sent successfully, and you should receive a confirmation email shortly.');
                form.reset(); // Reset form fields
            })
            .catch(function(error) {
                console.error('Failed...', error);
                alert('Failed to send the message. Please try again later.');
            })
            .finally(function() {
                // Re-enable the submit button and restore text
                submitButton.disabled = false;
                submitButton.textContent = 'Send Message';
            });
    });
});
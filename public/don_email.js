document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('donorForm');
    var submitButton = document.getElementById('submitButton');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Disable the submit button and change text
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        // Get form values
        var params = {
            firstName: document.getElementById('Fname').value,
            lastName: document.getElementById('Lname').value,
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            bloodGroup: document.getElementById('bloodGroup').value,
            phoneNumber: document.getElementById('pno').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            disease: document.getElementById('disease').value
        };

        fetch('http://localhost:3009/api/donors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Donor information saved successfully') {
                // Redirect to thank you page
                window.location.href = 'donor-thank-you.html';
            } else {
                alert('Error saving donor information: ' + data.error);
            }
        })
        .catch(error => {
            alert('Error saving donor information: ' + error);
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit';
        });
    });
});





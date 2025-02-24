/**
 * Copyright (c) @2024 JNL Enterprises. All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * JNL Enterprises ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with JNL Enterprises.
 */

document.getElementById('unfollow-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get the email value
    var email = this.email.value;

    // Regular expression for validating an email address
    var emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Check if the email is valid
    if (email && !emailPattern.test(email)) {
        alert('Please enter a valid email address.');
        return; // Stop form submission if email is invalid
    }


    // Get form data
    var templateParams = {
        name: this.name.value,
        email: this.email.value,
        subject: this.subject.value,
        message: this.message.value
    };

    // Send email using EmailJS
    emailjs.send('service_hapgp9f', 'template_tbtdfcj', templateParams)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            alert('Message sent successfully!');
        }, function(error) {
            console.log('FAILED...', error);
            alert('Failed to send the message.');
        });
});
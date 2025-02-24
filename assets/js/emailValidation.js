/**
 * Copyright (c) @2024 JNL Enterprises. All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * JNL Enterprises ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with JNL Enterprises.
 */

document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get form fields
    const emailField = this.email;
    const emailValue = emailField.value;

    // Regular expression for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate email format
    if (!emailRegex.test(emailValue)) {
        alert('Please enter a valid email address.');
        emailField.focus();
        return;
    }

    // If validation passes, prepare template params
    var templateParams = {
        name: this.name.value,
        email: emailValue,
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
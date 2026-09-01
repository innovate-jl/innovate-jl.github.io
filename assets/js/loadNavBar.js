/**
 * Copyright (c) @2024 JNL Enterprises. All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * JNL Enterprises ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with JNL Enterprises.
 */
// Load the navbar
// Determine the correct path to navbar.html based on the current location
// Function to determine the correct path to navbar.html
function getNavbarPath() {
    // Get the current URL path
    const currentPath = window.location.pathname;
    
    // Check if we are in the root or in a subdirectory
    if (currentPath === '/' || currentPath.match(/^\/[^\/]+\/$/)) {
        return 'navbar.html';
    }

    // If we are in a nested directory like /blog/
    const depth = (currentPath.match(/\//g) || []).length;

    // Calculate the relative path
    let relativePath = '';
    for (let i = 1; i < depth; i++) {
        relativePath += '../';
    }
    relativePath += 'navbar.html';

    return relativePath;
}

// Load the navbar
fetch(getNavbarPath())
    .then(response => {
        if (!response.ok) throw new Error(`Unable to load navigation (${response.status})`);
        return response.text();
    })
    .then(data => {
        const placeholder = document.getElementById('navbar-placeholder');
        if (placeholder) placeholder.innerHTML = data;
    })
    .catch(error => console.error('Error loading the navbar:', error));


function toggleMenu(button) {
    const links = document.querySelector('.nav-links');
    if (!links) return;
    const isOpen = links.classList.toggle('active');
    button.setAttribute('aria-expanded', String(isOpen));
}

function toggleDropdown(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const dropdownContent = button.nextElementSibling;
    const isOpen = dropdownContent.classList.toggle('active');
    button.setAttribute('aria-expanded', String(isOpen));
}
    

/**
 * Copyright (c) @2024 JNL Enterprises. All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * JNL Enterprises ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with JNL Enterprises.
 */
// Shared site integrations. Keeping these in the common navigation loader means
// every public page uses the same Analytics and AdSense account configuration.
const ADSENSE_CLIENT = 'ca-pub-2540056840638247';
const ANALYTICS_ID = 'G-BK5N7HVC46';

function addAsyncScript(src, options = {}) {
    if ([...document.scripts].some(script => script.src === src)) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    if (options.crossOrigin) script.crossOrigin = options.crossOrigin;
    document.head.appendChild(script);
}

function loadSiteIntegrations() {
    if (!document.querySelector('meta[name="google-adsense-account"]')) {
        const accountMeta = document.createElement('meta');
        accountMeta.name = 'google-adsense-account';
        accountMeta.content = ADSENSE_CLIENT;
        document.head.appendChild(accountMeta);
    }

    addAsyncScript(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`, { crossOrigin: 'anonymous' });
    addAsyncScript(`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`);

    if (!window.__unifolllowAnalyticsConfigured) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', ANALYTICS_ID);
        window.__unifolllowAnalyticsConfigured = true;
    }
}

loadSiteIntegrations();

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
    

/**
 * Copyright (c) @2024 JNL Enterprises. All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * JNL Enterprises ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with JNL Enterprises.
 */

function openTab(evt, tabName) {
    // Hide all tab content
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }

    // Remove the 'active' class from all tab buttons
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    // Show the current tab content and add 'active' class to the button
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

// Initialize the default tab
document.addEventListener("DOMContentLoaded", function() {
    document.querySelector(".tablinks.active").click();
});

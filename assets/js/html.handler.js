/**
 * Copyright (c) @2024 JNL Enterprises. All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * JNL Enterprises ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with JNL Enterprises.
 */


export function computeDifferenceFromHTML(files) {
    const downloadButton = document.getElementById('download-follower-info');

    return new Promise((resolve, reject) => {
        console.log("Hit the HTML handler");
        // Convert FileList to Array to use forEach
        const filesArray = Array.from(files);

        let followersInput, followingInput;
        filesArray.forEach(file => {
            if (file.name === "followers_1.html") followersInput = file;
            else if (file.name === "following.html") followingInput = file;
        });

        if (!followersInput || !followingInput) {
            downloadButton.textContent = 'Nothing to Download';
            downloadButton.disabled = true;
            reject("Error: Please select exactly two files: 'followers_1.html' and 'following.html'.");
            return;
        }

        console.log("Passed verification, starting to read files");
        const readers = [followersInput, followingInput].map(file => new Promise((res) => {
            const reader = new FileReader();
            reader.onload = e => res(extractUsernamesFromHTML(e.target.result));
            reader.readAsText(file);
        }));

        Promise.all(readers).then(([extractedFollowers, extractedFollowing]) => {
            const difference = extractedFollowing.filter(username => !extractedFollowers.includes(username));
            difference.sort();
            resolve(difference);
        }).catch(err => reject(err));
    });
}

function extractUsernamesFromHTML(html) {
    const usernameRegex = /https:\/\/www\.instagram\.com\/(?:_u\/)?([^\/"<'>]+)/g;
    const userSet = new Set(); // Use a Set to automatically remove duplicates
    let match;

    while ((match = usernameRegex.exec(html)) !== null) {
        userSet.add(match[1]); // Add each username to the Set
    }

    return Array.from(userSet); // Convert Set back to Array
}
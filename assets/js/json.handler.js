/**
 * Copyright (c) @2024 JNL Enterprises. All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * JNL Enterprises ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with JNL Enterprises.
 */

export function computeDifferenceFromJSON(files) {
    const downloadButton = document.getElementById('download-follower-info');

    return new Promise((resolve, reject) => {
        console.log("Hit the JSON handler");
        const filesArray = Array.from(files);

        let followersInput, followingInput;
        filesArray.forEach(file => {
            if (file.name === "followers_1.json") followersInput = file;
            else if (file.name === "following.json") followingInput = file;
        });

        if (!followersInput || !followingInput) {
            downloadButton.textContent = 'Nothing to Download';
            downloadButton.disabled = true;
            reject("Error: Please select exactly two files: 'followers_1.json' and 'following.json'.");
            return;
        }

        console.log("Passed verification, starting to read files");
        const readFile = (file) => new Promise((res) => {
            const reader = new FileReader();
            reader.onload = e => res(JSON.parse(e.target.result));
            reader.readAsText(file);
        });

        Promise.all([readFile(followersInput), readFile(followingInput)]).then(([followersContent, followingContent]) => {
            const extractedFollowers = extractUsernamesFromJSON(followersContent);
            const extractedFollowing = extractUsernamesFromJSON(followingContent, true); // Assuming 'true' is necessary for distinguishing the data type

            const difference = extractedFollowing.filter(username => !extractedFollowers.includes(username));
            difference.sort();

            resolve(difference);
        }).catch(err => reject(err));
    });
}

function extractUsernamesFromJSON(data, isFollowing = false) {
    const usernames = [];
    // The parsing logic might vary based on whether it's followers or following data
    if (isFollowing) {
        // Extract usernames from the following JSON structure
        data.relationships_following.forEach(item => {
            item.string_list_data.forEach(userDetail => {
                usernames.push(userDetail.value); // Assuming 'value' holds the username
            });
        });
    } else {
        // Extract usernames from the followers JSON structure
        data.forEach(item => {
            item.string_list_data.forEach(userDetail => {
                usernames.push(userDetail.value); // Assuming 'value' holds the username
            });
        });
    }
    return usernames; // Return the extracted list of usernames
}
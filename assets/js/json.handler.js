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

        const readFile = (file) => new Promise((res) => {
            const reader = new FileReader();
            reader.onload = e => res(JSON.parse(e.target.result));
            reader.readAsText(file);
        });

        Promise.all([readFile(followersInput), readFile(followingInput)])
            .then(([followersContent, followingContent]) => {
                const extractedFollowers = extractFollowersUsernames(followersContent);
                const extractedFollowing = extractFollowingUsernames(followingContent);

                const followersSet = new Set(extractedFollowers);
                const followingSet = new Set(extractedFollowing);

                const difference = [...followingSet].filter(user => !followersSet.has(user));
                difference.sort();

                resolve(difference);
            })
            .catch(err => reject(err));
    });
}

// For followers_1.json
function extractFollowersUsernames(data) {
    //console.log("Followers Data: ", data);
    const usernames = new Set();
    data.forEach(item => {
        if (item.string_list_data) {
            item.string_list_data.forEach(userDetail => {
                if (userDetail.value) usernames.add(userDetail.value);
            });
        }
    });
    return Array.from(usernames);
}

// For following.json
function extractFollowingUsernames(data) {
    const usernames = new Set();
    if (data.relationships_following) {
        data.relationships_following.forEach(item => {
            usernames.add(item.title);
        });
    }
    return Array.from(usernames);
}
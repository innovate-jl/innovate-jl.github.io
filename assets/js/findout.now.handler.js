/**
 * Copyright (c) @2024 JNL Enterprises. All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * JNL Enterprises ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with JNL Enterprises.
 */

import { computeDifferenceFromHTML } from './html.handler.js';
import { computeDifferenceFromJSON } from './json.handler.js';

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-upload');
    const textarea = document.getElementById('output-textarea');
    const findOutNowButton = document.getElementById('find-out-now');
    const downloadButton = document.getElementById('download-follower-info');
    
    // Function to handle the click event
    async function processFiles() {
        const files = fileInput.files;
        let htmlFiles = [];
        let jsonFiles = [];
        let numFiles = 0;
        let txtFile = null;

        // Classify files by type
        for (let i = 0; i < files.length; i++) {
            if (files[i].name.endsWith('.html')) {
                htmlFiles.push(files[i]);
                numFiles ++;
            } else if (files[i].name.endsWith('.json')) {
                jsonFiles.push(files[i]);
                numFiles ++;
            } else if (files[i].name.match(/known-following-\d{4}-\d{2}-\d{2}\.txt$/)) {
                txtFile = files[i];
                numFiles ++;
            }
        }
        
        console.log("Found HTML files with count: ", htmlFiles.length);
        console.log("Found JSON files with count: ", jsonFiles.length);
        // Action determined by file types
        if ((htmlFiles.length === 2 || jsonFiles.length === 2) && numFiles <= 3) {
            let computedDiff;
            if (htmlFiles.length === 2) {
                try{
                    // Compute difference from HTML files
                    computedDiff = await computeDifferenceFromHTML(htmlFiles);
                } catch (err) {
                    textarea.value = err;
                    downloadButton.textContent = 'Nothing to Download';
                    downloadButton.disabled = true;
                    return;
                }
            } else if (jsonFiles.length === 2) {
                try{
                    // Compute difference from JSON files
                    computedDiff = await computeDifferenceFromJSON(jsonFiles);
                } catch (err) {
                    textarea.value = err;
                    downloadButton.textContent = 'Nothing to Download';
                    downloadButton.disabled = true;
                    return;
                }
            }
            // If a TXT file is provided, compare its content with the computed difference
            if (txtFile) {
                downloadButton.textContent = 'Merge with Existing Known Following File';
                const txtContent = await txtFile.text();
                // only output the difference between the computed difference and the known difference
                const finalDiff = compareDifferences(computedDiff, txtContent);
                if(finalDiff.length === 0) {
                    textarea.value = "Congratulations, no new unfollowers detected! You're all caught up.";
                    downloadButton.textContent = 'Nothing to Download';
                    downloadButton.disabled = true;
                } else {
                    // Display the final difference
                    textarea.value = finalDiff.join('\n');
                }
            } else {
                // No TXT file, just display the computed difference
                textarea.value = computedDiff.join('\n');
            }
        } else {
            // Inform the user about invalid selection
            textarea.value = "Invalid file selection. Please select exactly two files: \n'followers_1.html' and 'following.html' \nOR \n'followers_1.json' and 'following.json' \nOptional: known-following.txt.";
            downloadButton.textContent = 'Nothing to Download';
            downloadButton.disabled = true;
        }   
    }

    // Add click event listener to the button
    findOutNowButton.addEventListener('click', function(event) {
        textarea.value = "";
        downloadButton.textContent = 'Download Follower Information';
        downloadButton.disabled = false;
        event.preventDefault(); 
        processFiles();
    });
});

// Function to compare the computed difference with the known difference
function compareDifferences(computedDiff, knownDiff) {
    let resultArr = [];
    let knownDiffLines = knownDiff.split('\n');

    for (let diff of computedDiff) {
        if (!knownDiffLines.includes(diff)) {
            resultArr.push(diff);
        }
    }
    return resultArr;
}
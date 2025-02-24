/**
 * Copyright (c) @2024 JNL Enterprises. All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * JNL Enterprises ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with JNL Enterprises.
 */
document.addEventListener('DOMContentLoaded', function() {    
    const downloadButton = document.getElementById('download-follower-info');

    function handleDownload() {
        // Get the content from the textarea
        var content = document.getElementById('output-textarea').value;
        // Create a Blob with the content
        var blob = new Blob([content], { type: 'text/plain' });
        // Create a link to download the blob content
        var downloadLink = document.createElement('a');
        // Use the current date to create a unique filename
        var date = new Date();
        var dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        downloadLink.download = `known-following-${dateString}.txt`;
        // Create a URL for the blob
        downloadLink.href = window.URL.createObjectURL(blob);


        // Check the button text and decide the filename and possibly other actions
        if (downloadButton.textContent === 'Merge with Existing Known Following File') {
            // read the existing text file from the file input
            var fileInput = document.getElementById('file-upload');
            var files = fileInput.files;
            var txtFile = null;
            for (let i = 0; i < files.length; i++) {
                if (files[i].name.match(/known-following-\d{4}-\d{2}-\d{2}\.txt$/)) {
                    txtFile = files[i];
                }
            }

            // Merge the content of the existing file with the current content
            if (txtFile) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    var existingContent = event.target.result;
                    var mergedContent = mergeDifferences(existingContent, content);
                    var mergedBlob = new Blob([mergedContent], { type: 'text/plain' });
                    // Create a URL for the merged blob
                    downloadLink.href = window.URL.createObjectURL(mergedBlob);
                    downloadLink.download = `known-following-${dateString}.txt`;
                    // Append the link to the document temporarily
                    document.body.appendChild(downloadLink);
                    // Trigger the download
                    downloadLink.click();
                    // Clean up by removing the link
                    document.body.removeChild(downloadLink);
                };
                reader.readAsText(txtFile);
            }
        } else {
            // Append the link to the document temporarily
            document.body.appendChild(downloadLink);
            // Trigger the download
            downloadLink.click();
            // Clean up by removing the link
            document.body.removeChild(downloadLink);

            // Change the button text to indicate that the file has been downloaded
            downloadButton.textContent = 'Download Complete';
        }
    }

    // Add click event listener to the button
    downloadButton.addEventListener('click', function(event) {
        event.preventDefault(); 
        handleDownload();
    });
});

// merge differences function
function mergeDifferences(existingContent, newContent) {
    var existingLines = existingContent.split('\n');
    var newLines = newContent.split('\n');
    var mergedLines = existingLines.concat(newLines);
    var mergedSet = new Set(mergedLines);
    return Array.from(mergedSet).join('\n');
}
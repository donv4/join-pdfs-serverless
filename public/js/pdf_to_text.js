// PDF to Text Converter
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const uploadArea = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const optionsSection = null; // No optionsSection in HTML
    const actionButtons = document.getElementById('actionButtons');
    const fileInfo = document.getElementById('fileInfoSection');
    const fileName = document.getElementById('fileNameDisplay');
    const fileSize = document.getElementById('fileSizeDisplay');
    const convertBtn = document.getElementById('extractBtn');
    const cancelBtn = document.getElementById('clearBtn');
    const progressOverlay = document.getElementById('progressOverlay');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const resultSection = document.getElementById('successOverlay');
    const textPreview = document.getElementById('textPreview');
    const pageCount = document.getElementById('pageCount');
    const charCount = document.getElementById('textLength');
    const resultSize = document.getElementById('successSize');
    // Add these missing element references (add near line 4):
    const browseBtn = document.getElementById('browseBtn');
    const fileList = document.getElementById('fileList');
    const extractStats = document.getElementById('extractStats');
    const successPages = document.getElementById('successPages');
    const successChars = document.getElementById('successChars');
    ////    const copyTextBtn = document.getElementById('copyTextBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const newFileBtn = document.getElementById('newExtractBtn');

    let currentFile = null;

    // File selection
    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    //alert("File selected: " + file.name);
        console.log("File change event triggered");
        console.log("actionButtons element:", actionButtons);
        console.log("fileInfo element:", fileInfo);
    });

    // Drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        uploadArea.classList.add('dragover');
    }

    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }

    uploadArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file && file.type === 'application/pdf') {
            handleFileSelect(file);
        } else {
            showNotification('Please select a PDF file', 'error');
        }
    });

     // File handling - UPDATED
    function handleFileSelect(file) {
        console.log("Handling file:", file.name, file.size);
        
        if (file.type !== 'application/pdf') {
            showNotification('Please select a PDF file', 'error');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            showNotification('File size must be less than 50MB', 'error');
            return;
        }

        currentFile = file;

        // Update UI elements if they exist
        if (fileName) {
            fileName.textContent = file.name;
        }
        if (fileSize) {
            fileSize.textContent = formatFileSize(file.size);
        }
        if (actionButtons) {
            actionButtons.style.display = 'flex';
        }
        if (fileInfo) {
            fileInfo.style.display = 'block';
        }
        if (extractStats) {
            extractStats.style.display = 'block';
        }

        showNotification('PDF file selected. Click "Extract Text" to continue.', 'success');
    }

    // Convert button
    convertBtn.addEventListener('click', async function() {
        if (!currentFile) return;

        // Show progress
        progressOverlay.style.display = 'flex';
        progressText.textContent = 'Uploading file...';
        progressFill.style.width = '30%';

        try {
            const formData = new FormData();
            formData.append('file', currentFile);
            
            // Get checkbox values
            const preserveFormatting = document.getElementById('preserveFormatting');
            const addPageNumbers = document.getElementById('addPageNumbers');
            
            // Append checkbox values with fallbacks
            formData.append('preserveFormatting', preserveFormatting ? preserveFormatting.checked : true);
            formData.append('addPageNumbers', addPageNumbers ? addPageNumbers.checked : true);

            const response = await fetch('/api/pdf-to-text', {
                method: 'POST',
                body: formData
            });

            progressFill.style.width = '90%';

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            
            progressFill.style.width = '100%';
            progressText.textContent = 'Complete!';

            // Show results after delay
            setTimeout(() => {
                progressOverlay.style.display = 'none';
                showResults(result);
            }, 500);

        } catch (error) {
            progressOverlay.style.display = 'none';
            showNotification(`Error: ${error.message}`, 'error');
            console.error('Conversion error:', error);
        }
    });

    // Cancel button
    cancelBtn.addEventListener('click', function() {
        resetUI();
    });

    // Show results - UPDATED VERSION with proper download handling
    function showResults(result) {
        console.log("Show results called with:", result);
        
        // Update page count
        if (pageCount) {
            pageCount.textContent = result.page_count || '0';
        }
        
        // Update character count
        if (charCount) {
            charCount.textContent = result.char_count?.toLocaleString() || '0';
        }
        
        // Update success overlay stats
        if (successPages) {
            successPages.textContent = result.page_count || '0';
        }
        if (successChars) {
            successChars.textContent = result.char_count?.toLocaleString() || '0';
        }
        if (successSize) {
            successSize.textContent = result.file_size_kb ? result.file_size_kb + ' KB' : 'N/A';
        }
        
        // Show preview (first 2000 chars from API)
        if (textPreview) {
            textPreview.textContent = result.text || 'No text extracted';
        }
        
        // Set up download button - FIXED
        if (downloadBtn) {
            // Clear any previous handlers
            downloadBtn.onclick = null;
            downloadBtn.href = '#';
            downloadBtn.style.pointerEvents = 'auto'; // Ensure clickable
            
            if (result.download_url) {
                // Use server-generated download URL
                downloadBtn.onclick = function(e) {
                    e.preventDefault();
                    console.log("Downloading from:", result.download_url);
                    
                    // Create a hidden iframe for download
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = 'none';
                    iframe.src = result.download_url;
                    document.body.appendChild(iframe);
                    
                    // Remove iframe after download starts
                    setTimeout(() => {
                        if (iframe.parentNode) {
                            document.body.removeChild(iframe);
                        }
                    }, 3000);
                    
                    showNotification('Download started! Check your downloads folder.', 'success');
                };
            } else {
                // Fallback: client-side download
                downloadBtn.onclick = function(e) {
                    e.preventDefault();
                    console.log("Client-side download fallback");
                    
                    const fullText = result.full_text || result.text || '';
                    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = result.filename || 'extracted_text.txt';
                    document.body.appendChild(a);
                    a.click();
                    
                    // Clean up
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);
                    
                    showNotification('Text downloaded!', 'success');
                };
            }
        }
        
        // Show stats section if it exists
        if (extractStats) {
            extractStats.style.display = 'block';
        }
        
        // Show result section
        if (resultSection) {
            resultSection.style.display = 'block';
            // Scroll to results
            setTimeout(() => {
                resultSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
        
        showNotification('Text extraction successful! Click Download to save.', 'success');
    }

//    // Copy text button
////    copyTextBtn.addEventListener('click', function() {
//        const text = textPreview.textContent;
//        navigator.clipboard.writeText(text).then(() => {
//            showNotification('Text copied to clipboard!', 'success');
//        }).catch(err => {
//            showNotification('Failed to copy text', 'error');
//        });
//    });

    // New file button
    newFileBtn.addEventListener('click', resetUI);

    // Reset UI
    function resetUI() {
        currentFile = null;
        fileInput.value = '';
//        optionsSection.style.display = 'none';
        actionButtons.style.display = 'none';
        fileInfo.style.display = 'none';
        resultSection.style.display = 'none';
        textPreview.textContent = '';
    }

    // Helper functions
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showNotification(message, type = 'info') {
        // Use your existing notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
});
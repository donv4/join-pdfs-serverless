// PDF to Word Converter
document.addEventListener('DOMContentLoaded', function() {
    console.log('PDF to Word converter loaded');
    
    // Elements
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const convertBtn = document.getElementById('convertBtn');
    const progressOverlay = document.getElementById('progressOverlay');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const resultSection = document.getElementById('resultSection');
    const downloadBtn = document.getElementById('downloadBtn');
    const newConvertBtn = document.getElementById('newConvertBtn');
    
    let currentFile = null;
    
    // File selection
    browseBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // Drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, function() {
            uploadZone.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, function() {
            uploadZone.classList.remove('drag-over');
        }, false);
    });
    
    uploadZone.addEventListener('drop', function(e) {
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            handleFileSelect(file);
        } else {
            alert('Please drop a PDF file only.');
        }
    });
    
    function handleFileSelect(file) {
        if (file.size > 50 * 1024 * 1024) {
            alert('File size must be less than 50MB');
            return;
        }
        
        currentFile = file;
        
        // Update UI
        fileName.textContent = file.name;
        fileSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        fileInfo.style.display = 'block';
        
        // Scroll to file info
        fileInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Convert to Word
    convertBtn.addEventListener('click', async function() {
        if (!currentFile) {
            alert('Please select a PDF file first.');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', currentFile);
        
        // Show progress
        progressOverlay.style.display = 'flex';
        progressText.textContent = 'Uploading and converting...';
        progressFill.style.width = '30%';
        
        try {
            // Simulate progress
            setTimeout(() => {
                progressFill.style.width = '60%';
                progressText.textContent = 'Converting PDF to Word format...';
            }, 1000);
            
            const response = await fetch('/pdf-to-word', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                // Show success
                progressFill.style.width = '100%';
                progressText.textContent = 'Conversion complete!';
                
                setTimeout(() => {
                    progressOverlay.style.display = 'none';
                    resultSection.style.display = 'block';
                    
                    // Set download link
                    downloadBtn.href = result.download_url;
                    downloadBtn.download = result.filename;
                    
                    // Scroll to result
                    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);
                
            } else {
                throw new Error(result.error || 'Conversion failed');
            }
        } catch (error) {
            progressOverlay.style.display = 'none';
            alert('Error: ' + error.message);
            console.error('Conversion error:', error);
        }
    });
    
    // New conversion
    newConvertBtn.addEventListener('click', function() {
        currentFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        resultSection.style.display = 'none';
        fileName.textContent = 'No file selected';
        fileSize.textContent = '0 MB';
        
        // Scroll to upload zone
        uploadZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    
    // Download button
    downloadBtn.addEventListener('click', function(e) {
        if (!this.href || this.href === '#') {
            e.preventDefault();
            alert('No file available for download.');
        }
    });
});
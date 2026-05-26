// PDF to Image Converter JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const formatButtons = document.querySelectorAll('.format-btn');
    const qualitySlider = document.getElementById('qualitySlider');
    const convertBtn = document.getElementById('convertBtn');
    const uploadForm = document.getElementById('uploadForm');
    
    // File input change handler
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            fileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
            convertBtn.disabled = false;
        } else {
            fileName.textContent = 'No file chosen';
            convertBtn.disabled = true;
        }
    });
    
    // Format button selection
    formatButtons.forEach(button => {
        button.addEventListener('click', function() {
            formatButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Quality slider value display
    qualitySlider.addEventListener('input', function() {
        // Update any quality display if needed
        console.log('Quality set to:', this.value);
    });
    
    // Form submission handler
    uploadForm.addEventListener('submit', function(e) {
        const file = fileInput.files[0];
        
        if (!file) {
            e.preventDefault();
            alert('Please select a PDF file first');
            return;
        }
        
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            e.preventDefault();
            alert('Please select a PDF file (.pdf)');
            return;
        }
        
        // Validate file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            e.preventDefault();
            alert('File size exceeds 50MB limit. Please choose a smaller file.');
            return;
        }
        
        // Show loading state
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
        convertBtn.disabled = true;
    });
    
    // Helper function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Drag and drop functionality
    const uploadArea = document.getElementById('uploadArea');
    
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
        uploadArea.style.backgroundColor = 'rgba(106, 17, 203, 0.1)';
        uploadArea.style.border = '2px dashed #6a11cb';
    }
    
    function unhighlight() {
        uploadArea.style.backgroundColor = '';
        uploadArea.style.border = '';
    }
    
    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            
            // Validate it's a PDF
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                fileInput.files = files;
                
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
            } else {
                alert('Please drop a PDF file (.pdf)');
            }
        }
    }
});
// public/js/meme_bookmaker.js
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewGrid = document.getElementById('previewGrid');
    const generateBtn = document.getElementById('generateBtn');
    
    let uploadedImages = []; // Stores objects: { file, base64, title: "" }

    // Click to upload triggers
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag and drop visual hooks
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        }, false);
    });

    // Handle dropped items
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                const imgObj = {
                    id: Date.now() + Math.random(),
                    file: file,
                    base64: reader.result,
                    title: ""
                };
                uploadedImages.push(imgObj);
                renderPreviews();
            };
        });
    }

    window.removeImage = function(id) {
        uploadedImages = uploadedImages.filter(item => item.id !== id);
        renderPreviews();
    };

    window.updateTitle = function(id, text) {
        const img = uploadedImages.find(item => item.id === id);
        if (img) img.title = text;
    };

    function renderPreviews() {
        previewGrid.innerHTML = '';
        if (uploadedImages.length === 0) {
            generateBtn.disabled = true;
            return;
        }
        
        generateBtn.disabled = false;
        uploadedImages.forEach(img => {
            const card = document.createElement('div');
            card.className = 'meme-card';
            card.innerHTML = `
                <button class="remove-btn" onclick="removeImage(${img.id})">✕</button>
                <img src="${img.base64}" alt="Meme Preview" />
                <div class="card-controls">
                    <input type="text" placeholder="Add Caption / Title..." value="${img.title}" oninput="updateTitle(${img.id}, this.value)" />
                </div>
            `;
            previewGrid.appendChild(card);
        });
    }

    // Helper utility to safely convert base64 strings to raw binary data arrays for pdf-lib
    function base64ToUint8Array(base64Str) {
        const base64Data = base64Str.split(',')[1];
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    generateBtn.addEventListener('click', async () => {
        if (!window.PDFLib) {
            alert('PDF generation engine is still loading. Please try again in a few seconds.');
            return;
        }

        generateBtn.innerText = 'Compiling Book... 🚀';
        generateBtn.disabled = true;

        try {
            const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
            const pdfDoc = await PDFDocument.create();
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            for (const imgData of uploadedImages) {
                const page = pdfDoc.addPage(); 
                const { width, height } = page.getSize();

                // FIX: Convert base64 data directly to raw bytes array buffer
                const imageBytes = base64ToUint8Array(imgData.base64);
                let embeddedImg;
                
                // Map file types correctly into the processing stream
                if (imgData.file.type === 'image/jpeg' || imgData.file.type === 'image/jpg') {
                    embeddedImg = await pdfDoc.embedJpg(imageBytes);
                } else if (imgData.file.type === 'image/png') {
                    embeddedImg = await pdfDoc.embedPng(imageBytes);
                } else {
                    continue; // Skip unsupported image data fields
                }

                // Compute scaling factors to keep elements contained inside the page borders
                const maxImgWidth = width - 80;
                const maxImgHeight = height - 180;
                const scale = Math.min(maxImgWidth / embeddedImg.width, maxImgHeight / embeddedImg.height);
                const finalW = embeddedImg.width * scale;
                const finalH = embeddedImg.height * scale;
                
                page.drawImage(embeddedImg, {
                    x: (width - finalW) / 2,
                    y: (height - finalH) / 2 + 40,
                    width: finalW,
                    height: finalH,
                });

                if (imgData.title.trim() !== "") {
                    const text = imgData.title;
                    const fontSize = 20;
                    const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
                    
                    page.drawText(text, {
                        x: (width - textWidth) / 2,
                        y: 80,
                        size: fontSize,
                        font: helveticaFont,
                        color: rgb(0.1, 0.1, 0.1),
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = "My_Meme_Table_Book.pdf";
            link.click();
        } catch (error) {
            console.error("Compilation Error Details:", error);
            alert('An error occurred during PDF compilation. Please ensure all uploaded files are valid standard JPG or PNG images.');
        } finally {
            generateBtn.innerText = 'Compile Meme Book 📚';
            generateBtn.disabled = false;
        }
    });

});

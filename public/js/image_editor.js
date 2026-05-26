// public/js/image_editor.js - COMPLETE CLIENT-SIDE IMAGE CONTROLLER
document.addEventListener('DOMContentLoaded', () => {
    const upload = document.getElementById('editorUpload');
    const canvas = document.getElementById('editorCanvas');
    const ctx = canvas.getContext('2d');
    const placeholder = document.getElementById('editorPlaceholder');
    const saveBtn = document.getElementById('saveImageBtn');

    const brightness = document.getElementById('brightness');
    const contrast = document.getElementById('contrast');
    const saturation = document.getElementById('saturation');
    const blur = document.getElementById('blur');
    const rotateLeft = document.getElementById('rotateLeft');
    const rotateRight = document.getElementById('rotateRight');

    let originalImage = null;
    let rotationDegree = 0;

    if (!upload) return;

    upload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            originalImage = new Image();
            originalImage.onload = () => {
                placeholder.style.display = 'none';
                canvas.style.display = 'inline-block';
                saveBtn.disabled = false;
                rotationDegree = 0;
                applyFiltersAndRender();
            };
            originalImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    function applyFiltersAndRender() {
        if (!originalImage) return;

        if (rotationDegree % 180 === 0) {
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
        } else {
            canvas.width = originalImage.height;
            canvas.height = originalImage.width;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotationDegree * Math.PI) / 180);

        ctx.filter = `
            brightness(${brightness.value}%) 
            contrast(${contrast.value}%) 
            saturate(${saturation.value}%) 
            blur(${blur.value}px)
        `;

        ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
        ctx.restore();
    }

    [brightness, contrast, saturation, blur].forEach(slider => {
        slider.addEventListener('input', applyFiltersAndRender);
    });

    rotateLeft.addEventListener('click', () => { rotationDegree = (rotationDegree - 90) % 360; applyFiltersAndRender(); });
    rotateRight.addEventListener('click', () => { rotationDegree = (rotationDegree + 90) % 360; applyFiltersAndRender(); });

    saveBtn.addEventListener('click', () => {
        const formatSelect = document.getElementById('formatSelect')?.value || 'png';
        const mimeType = `image/${formatSelect === 'jpg' ? 'jpeg' : formatSelect}`;
        const dataUrl = canvas.toDataURL(mimeType, 0.92);
        
        const link = document.createElement('a');
        link.download = `edited_${Date.now()}.${formatSelect}`;
        link.href = dataUrl;
        link.click();
    });
});

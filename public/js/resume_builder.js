// public/js/resume_builder.js - Dynamic Sync Resume Engine

(function() {
    const pdfScript = document.createElement('script');
    pdfScript.src = '/js/lib/pdf-lib.min.js';
    pdfScript.async = false;
    document.head.appendChild(pdfScript);

    pdfScript.onload = () => {
        if (window.PDFLib) {
            initBuilderApplication();
        }
    };

    function initBuilderApplication() {
        const inputName = document.getElementById('inputName');
        const inputEmail = document.getElementById('inputEmail');
        const inputPhone = document.getElementById('inputPhone');
        const inputExp = document.getElementById('inputExp');
        const inputEdu = document.getElementById('inputEdu');
        const compileBtn = document.getElementById('compileBtn');
        const livePreviewTarget = document.getElementById('livePreviewTarget');

        // Check if data was automatically forwarded from the Optimizer tool
        const optimizedText = sessionStorage.getItem('resume_extracted_text');
        if (optimizedText) {
            parseTextIntoFormFields(optimizedText);
            sessionStorage.removeItem('resume_extracted_text'); // Clear cache string
        }

        // Real-Time Live Preview Sync Engine Handler
        function updateLivePreviewSheet() {
            if (!livePreviewTarget) return;

            // Format line breaks into legible web breaks for textareas
            const formattedExp = (inputExp.value || '').replace(/\n/g, '<br>');
            const formattedEdu = (inputEdu.value || '').replace(/\n/g, '<br>');

            livePreviewTarget.innerHTML = `
                <div style="border-bottom: 2px solid #0d6efd; padding-bottom: 10px; margin-bottom: 20px;">
                    <h2 style="color: #0d6efd; margin: 0; font-weight: bold; font-size: 24px;">${inputName.value || 'Your Name'}</h2>
                    <p style="color: #666; margin: 5px 0 0 0; font-size: 13px;">
                        📧 ${inputEmail.value || 'email@example.com'} &nbsp;|&nbsp; 📱 ${inputPhone.value || '(555) 555-5555'}
                    </p>
                </div>

                ${inputExp.value.trim() !== "" ? `
                    <div style="margin-bottom: 25px;">
                        <h4 style="color: #0d6efd; margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px;">Professional Experience</h4>
                        <p style="color: #333; margin: 5px 0 0 0; font-size: 13px; white-space: pre-line;">${inputExp.value}</p>
                    </div>
                ` : ''}

                ${inputEdu.value.trim() !== "" ? `
                    <div>
                        <h4 style="color: #0d6efd; margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px;">Education & Credentials</h4>
                        <p style="color: #333; margin: 5px 0 0 0; font-size: 13px; white-space: pre-line;">${inputEdu.value}</p>
                    </div>
                ` : ''}
            `;
        }

        // Attach layout input listeners to track live string adjustments
        [inputName, inputEmail, inputPhone, inputExp, inputEdu].forEach(input => {
            if (input) input.addEventListener('input', updateLivePreviewSheet);
        });

        // Trigger baseline render check on page load
        updateLivePreviewSheet();

        function parseTextIntoFormFields(rawText) {
            const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            const phoneMatch = rawText.match(/[\+]?[(]?[0-9]{3}[)]?[-s\.]?[0-9]{3}[-s\.]?[0-9]{4,6}/);
            
            if (emailMatch) inputEmail.value = emailMatch[0];
            if (phoneMatch) inputPhone.value = phoneMatch[0];

            const lowerText = rawText.toLowerCase();
            const expIndex = lowerText.indexOf('experience');
            const eduIndex = lowerText.indexOf('education');

            if (expIndex !== -1) {
                const endIdx = (eduIndex > expIndex) ? eduIndex : rawText.length;
                inputExp.value = rawText.substring(expIndex + 10, endIdx).trim();
            } else {
                inputExp.value = rawText.substring(0, Math.floor(rawText.length / 2)).trim();
            }

            if (eduIndex !== -1) {
                inputEdu.value = rawText.substring(eduIndex + 9).trim();
            }
            
            // Sync values to template preview target right after data extraction loops finish
            updateLivePreviewSheet();
        }

        compileBtn.addEventListener('click', async () => {
            compileBtn.innerText = "Compiling PDF Template... ⚙️";
            compileBtn.disabled = true;

            try {
                const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
                const pdfDoc = await PDFDocument.create();
                const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
                const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

                const page = pdfDoc.addPage();
                const { width, height } = page.getSize();
                let y = height - 50;

                const name = inputName.value || "Your Name";
                page.drawText(name, { x: 50, y: y, size: 24, font: fontBold, color: rgb(0.05, 0.27, 0.63) });
                y -= 25;

                const contact = `${inputEmail.value || 'email@example.com'}  |  ${inputPhone.value || '(555) 555-5555'}`;
                page.drawText(contact, { x: 50, y: y, size: 10, font: fontReg, color: rgb(0.4, 0.4, 0.4) });
                y -= 35;

                function drawSection(title, bodyText) {
                    page.drawText(title.toUpperCase(), { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.05, 0.27, 0.63) });
                    page.drawLine({ start: { x: 50, y: y - 4 }, end: { x: width - 50, y: y - 4 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
                    y -= 22;

                    const lines = bodyText.split('\n');
                    lines.forEach(line => {
                        const words = line.split(' ');
                        let currentLine = "";
                        words.forEach(word => {
                            let testLine = currentLine + word + " ";
                            if (fontReg.widthOfTextAtSize(testLine, 10) > width - 100) {
                                page.drawText(currentLine, { x: 50, y: y, size: 10, font: fontReg, color: rgb(0.2, 0.2, 0.2) });
                                y -= 14;
                                currentLine = word + " ";
                            } else {
                                currentLine = testLine;
                            }
                        });
                        if (currentLine.trim() !== "") {
                            page.drawText(currentLine, { x: 50, y: y, size: 10, font: fontReg, color: rgb(0.2, 0.2, 0.2) });
                            y -= 14;
                        }
                    });
                    y -= 20;
                }

                if (inputExp.value.trim() !== "") drawSection("Professional Experience", inputExp.value);
                if (inputEdu.value.trim() !== "") drawSection("Education & Credentials", inputEdu.value);

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${name.replace(/\s+/g, '_')}_Optimized_Resume.pdf`;
                link.click();

            } catch (err) {
                console.error(err);
                alert("An error occurred compiling the document.");
            } finally {
                compileBtn.innerText = "Download Updated Resume 🚀";
                compileBtn.disabled = false;
            }
        });
    }
})();

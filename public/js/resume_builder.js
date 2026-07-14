// public/js/resume_builder.js - Client-Side Resume Engine

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

        // Check if data was automatically forwarded from the Optimizer tool
        const optimizedText = sessionStorage.getItem('resume_extracted_text');
        if (optimizedText) {
            parseTextIntoFormFields(optimizedText);
            sessionStorage.removeItem('resume_extracted_text'); // Clear session
        }

        function parseTextIntoFormFields(rawText) {
            // Regex miners to cleanly capture common details
            const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            const phoneMatch = rawText.match(/[\+]?[(]?[0-9]{3}[)]?[-s\.]?[0-9]{3}[-s\.]?[0-9]{4,6}/);
            
            if (emailMatch) inputEmail.value = emailMatch[0];
            if (phoneMatch) inputPhone.value = phoneMatch[0];

            // Attempt basic layout text dividing for Experience and Education blocks
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

                // 1. Draw Header (Name & Contact)
                const name = inputName.value || "Your Name";
                page.drawText(name, { x: 50, y: y, size: 24, font: fontBold, color: rgb(0.05, 0.27, 0.63) });
                y -= 25;

                const contact = `${inputEmail.value || 'email@example.com'}  |  ${inputPhone.value || '(555) 555-5555'}`;
                page.drawText(contact, { x: 50, y: y, size: 10, font: fontReg, color: rgb(0.4, 0.4, 0.4) });
                y -= 35;

                // Helper block to safely draw wrapped sections
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

                // 2. Draw Sections
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

// public/js/docx_converter.js - Client-Side Word Decryption Engine

(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const actionCard = document.getElementById('actionCard');
        const convertBtn = document.getElementById('convertBtn');
        const resetBtn = document.getElementById('resetBtn');
        const statusTitle = document.getElementById('statusTitle');
        const statusMeta = document.getElementById('statusMeta');

        let targetFileBlob = null;

        if (!dropZone) return;

        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) stageWordFile(e.target.files[0]);
        });

        // Drag/Drop visual bindings
        ['dragenter', 'dragover'].forEach(name => {
            dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        });
        ['dragleave', 'drop'].forEach(name => {
            dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length > 0) stageWordFile(e.dataTransfer.files[0]);
        });

        function stageWordFile(file) {
            if (!file.name.endsWith('.docx')) {
                alert('Please select a valid Microsoft Word .docx file structure.');
                return;
            }
            targetFileBlob = file;
            dropZone.style.display = 'none';
            actionCard.style.display = 'block';
            statusTitle.innerText = file.name;
            statusMeta.innerText = `Size: ${(file.size / 1024).toFixed(1)} KB - Ready to process serverless.`;
        }

        convertBtn.addEventListener('click', async () => {
            if (!window.JSZip || !window.PDFLib) {
                alert('Core rendering libraries are loading. Retry in a moment.');
                return;
            }

            convertBtn.innerText = 'Extracting XML Layout... ⚙️';
            convertBtn.disabled = true;

            try {
                // 1. Unzip the .docx structure using local JSZip
                const zip = await window.JSZip.loadAsync(targetFileBlob);
                
                // 2. Locate the core text layout XML file
                const documentXmlFile = zip.file("word/document.xml");
                if (!documentXmlFile) throw new Error("Invalid DOCX internal asset tree.");

                const xmlText = await documentXmlFile.async("string");

                // 3. Simple regex token extractor to clean out the layout XML tags and isolate raw strings
                const textParagraphs = [];
                const paragraphRegex = /<w:p(?: [^>]*|)>([\s\S]*?)<\/w:p>/g;
                const textRegex = /<w:t(?: [^>]*|)>([^<]*?)<\/w:t>/g;
                
                let pMatch;
                while ((pMatch = paragraphRegex.exec(xmlText)) !== null) {
                    let pText = "";
                    let tMatch;
                    const pContent = pMatch[1];
                    while ((tMatch = textRegex.exec(pContent)) !== null) {
                        pText += tMatch[1];
                    }
                    if (pText.trim() !== "") textParagraphs.push(pText);
                }

                // 4. Pipe strings straight into pdf-lib document canvas engine
                const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
                const pdfDoc = await PDFDocument.create();
                const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

                let page = pdfDoc.addPage();
                let { width, height } = page.getSize();
                let cursorY = height - 50;

                textParagraphs.forEach(paragraph => {
                    if (cursorY < 60) { // Multi-page bleed handler protection
                        page = pdfDoc.addPage();
                        cursorY = height - 50;
                    }

                    // Simple clean wrap to keep sentences constrained to margins
                    const words = paragraph.split(' ');
                    let currentLine = "";

                    words.forEach(word => {
                        const testLine = currentLine + word + " ";
                        if (font.widthOfTextAtSize(testLine, 11) > width - 100) {
                            page.drawText(currentLine, { x: 50, y: cursorY, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
                            cursorY -= 16;
                            currentLine = word + " ";
                        } else {
                            currentLine = testLine;
                        }
                    });

                    if (currentLine.trim() !== "") {
                        page.drawText(currentLine, { x: 50, y: cursorY, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
                        cursorY -= 24; // Paragraph spacing break vertical offset
                    }
                });

                // 5. Binary generation compile and auto-trigger file download
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(blob);
                downloadLink.download = targetFileBlob.name.replace('.docx', '.pdf');
                downloadLink.click();

            } catch (err) {
                console.error(err);
                alert('Conversion failure. Ensure the file isn\'t password protected or empty.');
            } finally {
                convertBtn.innerText = 'Convert to PDF 🚀';
                convertBtn.disabled = false;
            }
        });

        resetBtn.addEventListener('click', () => {
            targetFileBlob = null;
            fileInput.value = "";
            actionCard.style.display = 'none';
            dropZone.style.display = 'block';
        });
    });
})();

const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const docxPath = path.join(__dirname, '..', 'ACİL DURUM EYLEM PLANI.docx');

mammoth.extractRawText({ path: docxPath })
    .then(result => {
        fs.writeFileSync('docx-content.txt', result.value);
        console.log('Saved to docx-content.txt');
        console.log('Length:', result.value.length);
    })
    .catch(err => {
        console.error('Error:', err);
    });

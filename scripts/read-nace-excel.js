const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(process.cwd(), 'public', 'Nacekod.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Sheet:', sheetName);
console.log('Total rows:', data.length);
console.log('\nFirst 10 rows:');
data.slice(0, 10).forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row);
});

// Sütun yapısını anla
if (data.length > 0) {
    console.log('\nColumn structure:');
    console.log('A column (NACE Code):', data[1]?.[0]);
    console.log('B column (Activity):', data[1]?.[1]);
    console.log('C column (Danger Class):', data[1]?.[2]);
}


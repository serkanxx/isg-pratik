const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'data', 'risks.json');

function formatText(text) {
    if (!text) return text;

    // 1. Tüm harfleri küçük yap
    let formatted = text.toLocaleLowerCase('tr-TR');

    // 2. İlk harfi büyük yap
    if (formatted.length > 0) {
        formatted = formatted.charAt(0).toLocaleUpperCase('tr-TR') + formatted.slice(1);
    }

    // 3. Noktadan sonraki ilk harfi büyük yap (Boşluklu veya boşluksuz)
    // Regex: Nokta(.), opsiyonel boşluk(\s*), ve bir harf([a-zğüşıöç])
    formatted = formatted.replace(/(\.\s*)([a-zğüşıöç])/g, (match, separator, char) => {
        return separator + char.toLocaleUpperCase('tr-TR');
    });

    return formatted;
}

try {
    const data = fs.readFileSync(filePath, 'utf8');
    let risks = JSON.parse(data);
    let count = 0;

    if (Array.isArray(risks)) {
        risks.forEach(category => {
            if (category.items && Array.isArray(category.items)) {
                category.items.forEach(item => {
                    // Fields: measures (Kontrol Tedbirleri), risk, hazard (Tehlike)
                    ['measures', 'risk', 'hazard'].forEach(field => {
                        if (item[field]) {
                            const original = item[field];
                            const formatted = formatText(original);
                            if (original !== formatted) {
                                item[field] = formatted;
                                count++;
                            }
                        }
                    });
                });
            }
        });
    }

    if (count > 0) {
        fs.writeFileSync(filePath, JSON.stringify(risks, null, 2), 'utf8');
        console.log(`Updated ${count} fields in risks.json.`);
    } else {
        console.log("No changes needed.");
    }

} catch (err) {
    console.error("Error:", err);
}

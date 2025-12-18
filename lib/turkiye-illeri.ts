// Türkiye'deki tüm il isimleri
export const TURKIYE_ILLERI = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta',
  'İçel', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli',
  'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin',
  'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun',
  'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa',
  'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale',
  'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis',
  'Osmaniye', 'Düzce'
];

// İl isimlerinin alternatif yazılışları ve kısaltmaları
export const IL_ALTERNATIFLERI: Record<string, string[]> = {
  'İstanbul': ['istanbul', 'ist', 'ist.', 'istanbul'],
  'Ankara': ['ankara', 'ank', 'ank.'],
  'İzmir': ['izmir', 'izm', 'izm.'],
  'Bursa': ['bursa', 'brs'],
  'Antalya': ['antalya', 'ant', 'ant.'],
  'Adana': ['adana', 'adn'],
  'Konya': ['konya', 'kon'],
  'Gaziantep': ['gaziantep', 'gaz', 'gaz.'],
  'Mersin': ['mersin', 'icel', 'içel', 'mers'],
  'Kocaeli': ['kocaeli', 'koc', 'izmit'],
  'Diyarbakır': ['diyarbakir', 'diyarbakır', 'diy', 'diy.'],
  'Hatay': ['hatay', 'antakya'],
  'Manisa': ['manisa', 'man'],
  'Kayseri': ['kayseri', 'kay'],
  'Samsun': ['samsun', 'sam'],
  'Kahramanmaraş': ['kahramanmaras', 'kahramanmaraş', 'maras', 'maraş', 'kmaraş'],
  'Van': ['van'],
  'Denizli': ['denizli', 'den'],
  'Şanlıurfa': ['sanliurfa', 'şanlıurfa', 'urfa', 'sanliurfa'],
  'Tekirdağ': ['tekirdag', 'tekirdağ', 'tek', 'tek.'],
  'Malatya': ['malatya', 'mal'],
  'Erzurum': ['erzurum', 'erz'],
  'Trabzon': ['trabzon', 'tra'],
  'Ordu': ['ordu', 'ord'],
  'Balıkesir': ['balikesir', 'balıkesir', 'bal', 'bal.'],
  'Aydın': ['aydin', 'aydın', 'ayd'],
  'Muğla': ['mugla', 'muğla', 'mug'],
  'Eskişehir': ['eskisehir', 'eskişehir', 'esk', 'esk.'],
  'Mardin': ['mardin', 'mar'],
  'Afyonkarahisar': ['afyonkarahisar', 'afyon', 'afy'],
  'Sivas': ['sivas', 'siv'],
  'Batman': ['batman', 'bat'],
  'Elazığ': ['elazig', 'elazığ', 'ela'],
  'Zonguldak': ['zonguldak', 'zon'],
  'Kütahya': ['kutahya', 'kütahya', 'kut'],
  'Sakarya': ['sakarya', 'sak', 'adapazari', 'adapazarı'],
  'Ağrı': ['agri', 'ağrı', 'agr'],
  'Çorum': ['corum', 'çorum', 'cor'],
  'Giresun': ['giresun', 'gir'],
  'Isparta': ['isparta', 'ısparta', 'isp'],
  'Rize': ['rize', 'riz'],
  'Kastamonu': ['kastamonu', 'kas'],
  'Niğde': ['nigde', 'niğde', 'nig'],
  'Nevşehir': ['nevsehir', 'nevşehir', 'nev'],
  'Kırklareli': ['kirklareli', 'kırklareli', 'kir'],
  'Yozgat': ['yozgat', 'yoz'],
  'Bolu': ['bolu', 'bol'],
  'Çanakkale': ['canakkale', 'çanakkale', 'can'],
  'Kırşehir': ['kirsehir', 'kırşehir', 'kir'],
  'Sinop': ['sinop', 'sin'],
  'Amasya': ['amasya', 'ama'],
  'Burdur': ['burdur', 'bur'],
  'Bilecik': ['bilecik', 'bil'],
  'Artvin': ['artvin', 'art'],
  'Gümüşhane': ['gumushane', 'gümüşhane', 'gum'],
  'Kars': ['kars', 'kar'],
  'Bitlis': ['bitlis', 'bit'],
  'Bingöl': ['bingol', 'bingöl', 'bin'],
  'Adıyaman': ['adiyaman', 'adıyaman', 'adi'],
  'Tunceli': ['tunceli', 'tun'],
  'Hakkari': ['hakkari', 'hak'],
  'Edirne': ['edirne', 'edi'],
  'Çankırı': ['cankiri', 'çankırı', 'can'],
  'Karabük': ['karabuk', 'karabük', 'kar'],
  'Kilis': ['kilis', 'kil'],
  'Osmaniye': ['osmaniye', 'osm'],
  'Düzce': ['duzce', 'düzce', 'duz'],
  'Yalova': ['yalova', 'yal'],
  'Ardahan': ['ardahan', 'ard'],
  'Iğdır': ['igdir', 'ığdır', 'igd'],
  'Bartın': ['bartin', 'bartın', 'bar'],
  'Karaman': ['karaman', 'kar'],
  'Kırıkkale': ['kirikkale', 'kırıkkale', 'kir'],
  'Bayburt': ['bayburt', 'bay'],
  'Aksaray': ['aksaray', 'aks'],
  'Şırnak': ['sirnak', 'şırnak', 'sir'],
  'Muş': ['mus', 'muş']
};

// İl ismini bul (fuzzy matching)
export function findIlName(text: string): string | null {
  const normalizedText = text.toLowerCase().trim();
  
  // Önce tam eşleşme kontrolü
  for (const il of TURKIYE_ILLERI) {
    if (normalizedText.includes(il.toLowerCase())) {
      return il;
    }
  }
  
  // Alternatif yazılışları kontrol et
  for (const [il, alternatifler] of Object.entries(IL_ALTERNATIFLERI)) {
    for (const alt of alternatifler) {
      if (normalizedText.includes(alt.toLowerCase())) {
        return il;
      }
    }
  }
  
  // Fuzzy matching - Levenshtein distance benzeri basit yaklaşım
  // Eksik veya yanlış yazılmış il isimlerini bul
  for (const il of TURKIYE_ILLERI) {
    const ilLower = il.toLowerCase();
    const ilLength = ilLower.length;
    
    // İl isminin en az %70'i eşleşiyorsa kabul et
    let matchCount = 0;
    let ilIndex = 0;
    
    for (let i = 0; i < normalizedText.length && ilIndex < ilLength; i++) {
      if (normalizedText[i] === ilLower[ilIndex]) {
        matchCount++;
        ilIndex++;
      } else if (ilIndex > 0 && normalizedText[i] === ilLower[ilIndex - 1]) {
        // Tekrar eden karakter
        continue;
      }
    }
    
    const matchRatio = matchCount / ilLength;
    if (matchRatio >= 0.7 && matchCount >= 3) {
      return il;
    }
  }
  
  return null;
}

// Metinde il isimlerini bul (fuzzy matching ile)
export function findIlsInText(text: string): string[] {
  const foundIls: string[] = [];
  const textLower = text.toLowerCase();
  
  // Önce tam eşleşmeleri bul
  for (const il of TURKIYE_ILLERI) {
    const ilLower = il.toLowerCase();
    // Tam kelime olarak veya kelime içinde geçiyorsa
    if (textLower.includes(ilLower) && !foundIls.includes(il)) {
      foundIls.push(il);
    }
  }
  
  // Alternatif yazılışları kontrol et
  for (const [il, alternatifler] of Object.entries(IL_ALTERNATIFLERI)) {
    if (foundIls.includes(il)) continue;
    
    for (const alt of alternatifler) {
      if (textLower.includes(alt.toLowerCase())) {
        foundIls.push(il);
        break;
      }
    }
  }
  
  // Fuzzy matching - eksik veya yanlış yazılmış il isimlerini bul
  const words = text.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[.,;:!?()\[\]{}'"]/g, '').toLowerCase();
    if (cleanWord.length < 3) continue;
    
    // Her il için benzerlik kontrolü
    for (const il of TURKIYE_ILLERI) {
      if (foundIls.includes(il)) continue;
      
      const ilLower = il.toLowerCase();
      const ilLength = ilLower.length;
      
      // En az 3 karakter eşleşiyorsa ve uzunluk benzeriyse
      if (cleanWord.length >= 3 && Math.abs(cleanWord.length - ilLength) <= 2) {
        // Karakter bazlı eşleşme kontrolü
        let matchCount = 0;
        let wordIndex = 0;
        let ilIndex = 0;
        
        // İlk ve son karakterler eşleşiyorsa bonus
        if (cleanWord[0] === ilLower[0]) matchCount += 2;
        if (cleanWord[cleanWord.length - 1] === ilLower[ilLength - 1]) matchCount += 2;
        
        // Ortadaki karakterleri kontrol et
        for (let i = 0; i < Math.min(cleanWord.length, ilLength); i++) {
          if (cleanWord[i] === ilLower[i]) {
            matchCount++;
          }
        }
        
        // En az %60 eşleşme varsa kabul et
        const matchRatio = matchCount / Math.max(cleanWord.length, ilLength);
        if (matchRatio >= 0.6 && matchCount >= 3) {
          foundIls.push(il);
          break;
        }
      }
    }
  }
  
  return foundIls;
}

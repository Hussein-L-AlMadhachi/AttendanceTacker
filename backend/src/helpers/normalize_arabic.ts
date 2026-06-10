const ARABIC_TRANSALTION: { [key: string]: string } = {
    'ا': 'ا',
    'أ': "ا",
    'إ': "ا",
    'آ': "ا",
    'ى': "ا",
    'ب': 'ب',
    'ت': 'ت',
    'ث': 'ث',
    'ج': 'ج',
    'ح': 'ح',
    'خ': 'خ',
    'د': 'د',
    'ذ': 'ذ',
    'ر': 'ر',
    'ز': 'ز',
    'س': 'س',
    'ش': 'ش',
    'ص': 'س',
    'ض': 'ض',
    'ط': 'ط',
    'ظ': 'ظ',
    'ع': 'ع',
    'غ': 'غ',
    'ف': 'ف',
    'ق': 'ق',
    'ك': 'ك',
    'ل': 'ل',
    'م': 'م',
    'ن': 'ن',
    'ه': 'ه',
    'و': 'و',
    'ؤ': "و",
    'ي': 'ي',
    'ئ': "ي",
    'ء': "ا",
    'ة': "ه"
};


export function normalize_arabic(text: unknown): string {
    const safeText = String(text ?? '');

    return safeText
        .split('')
        .map(letter => ARABIC_TRANSALTION[letter] || letter)
        .join('');
}
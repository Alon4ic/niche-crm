export function parseLocalizedNumber(raw: unknown): number | null {
    if(typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
    if (typeof raw !== 'string') return null;
    
    let s = raw.replace(/[\s\u00A0\u202f]/g, '');
    if (s === '') return null;

    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');

    if (lastComma !== -1 && lastDot !== -1) {
        const decimalSep = lastComma > lastDot ? ',' : '.';
        const thousandsSep = decimalSep === ',' ? '.' : ',';
        s = s.split(thousandsSep).join('').replace(decimalSep, '.');
    } else if (lastComma !== -1) {
        if (s.split(',').length - 1 > 1) {
            s = s.split(',').join('');
        } else {
            const digitsAfter = s.length - lastComma - 1;
            if (digitsAfter === 3) return null;
            s = s.replace(',', '.');
        }
    } else if (lastDot !== -1 && s.split('.').length - 1 > 1) {
        s = s.split('.').join('');
    }
    if(!/^-?\d+(\.\d+)?$/.test(s)) return null;
    return Number(s);
}
import RelativeTime from '@yaireo/relative-time'

const relativeTime = new RelativeTime();

export function getRelativeTime(date: Date) {
    return relativeTime.from(date);
}

export function computeAgeFromBirthdate(birthdate?: string | Date | null): string {
    if (!birthdate) return '';
    const b = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
    if (Number.isNaN(b.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    return age >= 0 ? `${age}` : '';
}
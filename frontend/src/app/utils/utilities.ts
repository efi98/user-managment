import RelativeTime from '@yaireo/relative-time'
import {BASE_URL} from "@consts";

const relativeTime = new RelativeTime();

export function getRelativeTime(date: Date) {
    return relativeTime.from(date);
}

export function getAvatar(imgUrl: any, value: any)  {
    console.log(imgUrl, value);
    imgUrl = `${BASE_URL}${imgUrl}`;
    return `
            <div style="display:flex; align-items:center; gap:6px;">
                <img src="${imgUrl}" 
                     style="width:20px; height:20px; border-radius:50%;" />
                <span>${value}</span>
            </div>
        `;
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
export function yearsAgo(years: number): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
}

export function formatDateInput(date: Date): string {
    return date.toISOString().substring(0, 10);
}
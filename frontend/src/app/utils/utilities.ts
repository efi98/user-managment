import RelativeTime from '@yaireo/relative-time'

const relativeTime = new RelativeTime();

export function getRelativeTime(date: Date) {
    return relativeTime.from(date);
}
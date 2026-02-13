
export function isNullOrEmpty(data: Object): boolean {
    return !data || Object.keys(data).length === 0;
}

// TODO replace argument type with something more specific, not Object
export function isNullOrEmpty(data: Object): boolean {
    return !data || Object.keys(data).length === 0;
}
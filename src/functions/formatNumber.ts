export function formatNumber(num: number): string {
    return num.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
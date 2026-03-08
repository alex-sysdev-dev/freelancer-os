export const CHART_COLORS = ['#5ec7b7', '#7fb5ff', '#7a8fff', '#8de4d6', '#59a8e2', '#a4b8ff'];

export function usd(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

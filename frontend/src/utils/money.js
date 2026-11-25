// La tienda cotiza en dólares enteros: sin decimales y con el símbolo `$`.
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const money = (value) => formatter.format(Number(value) || 0);

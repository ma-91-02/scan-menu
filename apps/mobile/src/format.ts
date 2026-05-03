export function formatCurrency(value: number, code = "USD") {
  return `${value}${code === "USD" ? "$" : ` ${code}`}`;
}

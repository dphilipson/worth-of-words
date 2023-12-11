export function capitalize(s: string): string {
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

export function pluralize(n: number, item: string): string {
  return pluralizeNonstandard(n, item, item + "s");
}

export function pluralizeNonstandard(
  n: number,
  single: string,
  multiple: string,
): string {
  return `${n} ${n === 1 ? single : multiple}`;
}

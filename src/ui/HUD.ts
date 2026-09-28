export function must<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Elemen tidak ditemukan: ${selector}`);
  return element;
}

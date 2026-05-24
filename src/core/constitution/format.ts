export const SECTION_HEADER_RE = /^## \[(\w+)\]/;
export const ITEM_RE = /^\*\*([A-Z]+-\d+)\*\* —/;
export const REQUIRED_SECTION_TAGS = ['inv', 'wfl'];

export function nextId(tag: string, existingItems: string[]): string {
  const prefix = tag.toUpperCase();
  const idRe = new RegExp(`^\\*\\*${prefix}-(\\d+)\\*\\* —`);
  let max = 0;
  for (const item of existingItems) {
    const m = item.match(idRe);
    if (m) {
      const n = parseInt(m[1]!, 10);
      if (n > max) max = n;
    }
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export function computeFingerprint(invItems: string[], decItems: string[], bndItems: string[] = []): string {
  const str = [...invItems, ...decItems, ...bndItems].join('\n');
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

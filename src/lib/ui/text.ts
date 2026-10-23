/**
 * Turn stored text (which may contain Markdown) into one clean line for cards
 * and page headers: no markup, no line breaks, collapsed spaces.
 */
export function plainText(src: string | null | undefined): string {
  return (src ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/(\*\*|__|\*|_|`|~~)(.+?)\1/g, '$2')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Class for a name in a narrow podium column: multi-word names wrap onto two
 * lines; a single very long word drops a size and ends in "…" instead of
 * breaking mid-word.
 */
export function podiumName(name: string): string {
  const longest = Math.max(0, ...name.split(/\s+/).map((w) => w.length));
  return longest > 11 ? 'block truncate text-[13px]' : 'line-clamp-2 text-sm sm:text-[15px]';
}

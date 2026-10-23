/**
 * Re-mounts on every navigation, so each page's content fades up into place
 * instead of appearing all at once. The header and footer (in the layout) stay put.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}

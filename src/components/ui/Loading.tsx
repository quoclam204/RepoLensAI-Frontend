/** Minimal loading placeholder; feature teams replace with real UX. */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p role="status">{label}</p>;
}

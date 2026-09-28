/** Minimal error placeholder; feature teams replace with real UX. */
export function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" style={{ color: "#b42318" }}>
      {message}
    </p>
  );
}

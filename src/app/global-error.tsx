"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#0c1220", color: "#e9ecf2" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#8190a8", marginTop: "0.5rem", maxWidth: 420 }}>
            A critical error occurred while loading CivicPulse. Please try again.
          </p>
          {error?.digest && <p style={{ color: "#62718c", fontFamily: "monospace", fontSize: 12 }}>Ref: {error.digest}</p>}
          <button
            onClick={reset}
            style={{ marginTop: "1.5rem", background: "#16b783", color: "#fff", border: 0, borderRadius: 12, padding: "0.7rem 1.4rem", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

// Simple status page that shows if the JS is loading and Supabase config is present.
// Useful for debugging deploy issues.

export function StatusPage() {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
  const buildTime = new Date().toISOString();
  const bundleHash =
    document
      .querySelector<HTMLScriptElement>('script[src*="/assets/index-"]')
      ?.src.match(/index-([A-Za-z0-9_-]+)\.js/)?.[1] || "unknown";

  const ok = url && key && url.startsWith("https://") && key.startsWith("eyJ");
  const masked = key ? `${key.slice(0, 20)}...${key.slice(-10)}` : "(missing)";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#0a0a0f",
        color: "#f4f4f5",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          padding: 24,
          background: "#15151c",
          border: "1px solid #27272a",
          borderRadius: 16,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          Occaz — Status
        </h1>
        <p style={{ fontSize: 13, color: "#a1a1aa", marginTop: 4 }}>
          Diagnostic page — does not require auth or Supabase connection
        </p>

        <div
          style={{
            marginTop: 20,
            padding: 12,
            background: ok ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${ok ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            borderRadius: 10,
            color: ok ? "#34d399" : "#f87171",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {ok ? "✓ All systems go" : "✗ Misconfiguration detected"}
        </div>

        <table
          style={{
            width: "100%",
            marginTop: 16,
            fontSize: 12,
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "6px 0", color: "#a1a1aa" }}>JS bundle</td>
              <td style={{ padding: "6px 0", fontFamily: "monospace" }}>
                {bundleHash}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#a1a1aa" }}>Loaded at</td>
              <td style={{ padding: "6px 0", fontFamily: "monospace" }}>{buildTime}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#a1a1aa" }}>
                VITE_SUPABASE_URL
              </td>
              <td
                style={{
                  padding: "6px 0",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  color: url ? "#34d399" : "#f87171",
                }}
              >
                {url || "(missing)"}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#a1a1aa" }}>
                VITE_SUPABASE_ANON_KEY
              </td>
              <td
                style={{
                  padding: "6px 0",
                  fontFamily: "monospace",
                  color: key ? "#34d399" : "#f87171",
                }}
              >
                {masked}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#a1a1aa" }}>User agent</td>
              <td
                style={{
                  padding: "6px 0",
                  fontSize: 11,
                  wordBreak: "break-all",
                }}
              >
                {navigator.userAgent}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <a
            href="/"
            style={{
              flex: 1,
              padding: "10px 16px",
              background: "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontWeight: 500,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Go to home
          </a>
          <button
            onClick={() => {
              try {
                localStorage.clear();
              } catch (e) {}
              window.location.reload();
            }}
            style={{
              flex: 1,
              padding: "10px 16px",
              background: "#27272a",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Clear cache & reload
          </button>
        </div>
      </div>
    </div>
  );
}

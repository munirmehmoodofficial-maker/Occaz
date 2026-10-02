import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
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
              maxWidth: 600,
              width: "100%",
              padding: 24,
              background: "#15151c",
              border: "1px solid #27272a",
              borderRadius: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                display: "grid",
                placeItems: "center",
                fontSize: 24,
                marginBottom: 16,
              }}
            >
              !
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
            <p
              style={{
                fontSize: 13,
                color: "#a1a1aa",
                marginTop: 4,
                marginBottom: 16,
              }}
            >
              The app crashed during render. Details below:
            </p>
            <pre
              style={{
                fontSize: 11,
                lineHeight: 1.5,
                padding: 12,
                background: "#0a0a0f",
                border: "1px solid #27272a",
                borderRadius: 8,
                overflow: "auto",
                maxHeight: 280,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "#f87171",
              }}
            >
              {this.state.error.name}: {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack?.split("\n").slice(0, 8).join("\n")}
            </pre>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={this.reset}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              <button
                onClick={() => {
                  // Clear all local storage and reload
                  try {
                    localStorage.clear();
                  } catch (e) {}
                  window.location.href = "/";
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
    return this.props.children;
  }
}

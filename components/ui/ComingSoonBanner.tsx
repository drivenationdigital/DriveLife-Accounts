export function ComingSoonBanner({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="section">
      <div className="section-body">
        <div
          style={{
            padding: 32,
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              color: "var(--ink)",
              marginBottom: 8,
            }}
          >
            {title}
          </h3>
          <p>{message ?? "This section will be available soon."}</p>
        </div>
      </div>
    </div>
  );
}

export function FoundationPage() {
  return (
    <main className="foundation" aria-labelledby="boardops-title">
      <section className="foundation-card">
        <p className="eyebrow">PHASE 01 · ARCHITECTURE</p>
        <h1 id="boardops-title">BoardOps</h1>
        <p>
          The clean React/Vite web surface is running. Business modules remain intentionally absent until the architecture foundation is verified.
        </p>
        <dl>
          <div><dt>Web</dt><dd>React + Vite</dd></div>
          <div><dt>API</dt><dd>Cloudflare Workers + Hono</dd></div>
          <div><dt>Mobile</dt><dd>Flutter Android/iOS</dd></div>
        </dl>
      </section>
    </main>
  );
}

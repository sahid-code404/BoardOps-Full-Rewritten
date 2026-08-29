import { useEffect, useState } from "react";

import { BoardOpsButton, GlassSurface, StatusChip } from "../../design";

type PreviewTheme = "light" | "dark";

const kpis = [
  { label: "Residents", value: "248", delta: "+12 this month", tone: "success" as const },
  { label: "Collection", value: "₹1.84L", delta: "92.4% posted", tone: "info" as const },
  { label: "Pending", value: "₹15.2K", delta: "8 accounts", tone: "warning" as const },
];

export function FoundationPage() {
  const [theme, setTheme] = useState<PreviewTheme>("dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  return (
    <main className="design-preview" aria-labelledby="boardops-title">
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />

      <section className="preview-shell">
        <header className="preview-header">
          <div>
            <p className="eyebrow">PHASE 02 · SHARED DESIGN LANGUAGE</p>
            <h1 id="boardops-title">BoardOps</h1>
            <p className="lede">
              Premium institutional clarity with the purple/graphite identity,
              bounded glass, large rounded geometry, and purposeful motion.
            </p>
          </div>

          <div className="theme-switch" aria-label="Preview theme">
            <BoardOpsButton
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
              tone={theme === "light" ? "primary" : "neutral"}
            >
              Light
            </BoardOpsButton>
            <BoardOpsButton
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
              tone={theme === "dark" ? "primary" : "neutral"}
            >
              Dark
            </BoardOpsButton>
          </div>
        </header>

        <div className="kpi-grid" aria-label="Design-system KPI examples">
          {kpis.map((kpi) => (
            <GlassSurface className="kpi-card" key={kpi.label}>
              <div className="kpi-card__topline">
                <span>{kpi.label}</span>
                <StatusChip tone={kpi.tone}>{kpi.delta}</StatusChip>
              </div>
              <strong>{kpi.value}</strong>
            </GlassSurface>
          ))}
        </div>

        <div className="preview-grid">
          <GlassSurface className="showcase-card" strength="strong">
            <div className="showcase-card__header">
              <div>
                <span className="section-label">Glass system</span>
                <h2>One bounded blur layer</h2>
              </div>
              <StatusChip tone="success">GPU-aware</StatusChip>
            </div>
            <p>
              Parent surfaces own the backdrop blur. Nested content uses
              translucent fills instead of stacking expensive filters.
            </p>
            <div className="sample-row">
              <div className="mini-surface">Soft</div>
              <div className="mini-surface mini-surface--raised">Raised</div>
              <div className="mini-surface mini-surface--accent">Accent</div>
            </div>
          </GlassSurface>

          <GlassSurface className="showcase-card" strength="soft">
            <div className="showcase-card__header">
              <div>
                <span className="section-label">Motion + accessibility</span>
                <h2>Fast, understandable feedback</h2>
              </div>
              <StatusChip>240 ms default</StatusChip>
            </div>
            <p>
              Controls use transform and opacity, preserve visible focus, and
              respect reduced-motion preferences without hiding state.
            </p>
            <div className="button-row">
              <BoardOpsButton tone="primary">Primary action</BoardOpsButton>
              <BoardOpsButton>Secondary</BoardOpsButton>
            </div>
          </GlassSurface>
        </div>

        <footer className="preview-footer">
          <span>Web · React + Vite</span>
          <span>Mobile · Flutter</span>
          <span>Shared canonical tokens</span>
        </footer>
      </section>
    </main>
  );
}

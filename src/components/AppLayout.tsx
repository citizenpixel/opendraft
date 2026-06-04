import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

function AppLayout({ children }: AppLayoutProps) {
  return (
    <main className="app-shell">
      <header className="app-header" aria-label="OpenDraft project values">
        <div>
          <p className="app-kicker">OpenDraft</p>
          <h1>Local-first Fountain screenwriting.</h1>
        </div>
        <ul className="value-list" aria-label="Project values">
          <li>Free</li>
          <li>Open-source</li>
          <li>No accounts</li>
          <li>No tracking</li>
        </ul>
      </header>

      <section className="workspace" aria-label="Screenplay writing canvas">
        {children}
      </section>
    </main>
  );
}

export default AppLayout;

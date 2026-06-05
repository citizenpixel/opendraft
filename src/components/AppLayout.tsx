import type { ReactNode } from "react";
import AppMenu from "./AppMenu";

type AppLayoutProps = {
  children: ReactNode;
  onExportFountain: () => Promise<void>;
  onExportPdf: () => Promise<void>;
};

function AppLayout({ children, onExportFountain, onExportPdf }: AppLayoutProps) {
  return (
    <main className="app-shell">
      <header className="app-header" aria-label="OpenDraft project values">
        <AppMenu onExportFountain={onExportFountain} onExportPdf={onExportPdf} />
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

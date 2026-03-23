export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile / small-screen fallback */}
      <div className="lg:hidden flex items-center justify-center h-screen p-8 text-center text-text-secondary">
        <p>
          DesignLens works best on desktop (1024px+).
          <br />
          Please resize your browser window.
        </p>
      </div>

      {/* Full workspace — only shown on lg+ */}
      <div className="hidden lg:flex h-screen overflow-hidden">{children}</div>
    </>
  );
}

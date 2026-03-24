export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <main role="main" className="flex flex-col md:flex-row h-screen overflow-hidden">
      {children}
    </main>
  );
}

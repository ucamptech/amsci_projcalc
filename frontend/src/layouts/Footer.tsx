export default function Footer() {
  return (
    <footer className="mt-auto bg-card">
      <div className="px-4 sm:px-6 py-4 text-sm text-muted-foreground flex items-center justify-between">
        <span>© {new Date().getFullYear()} JANUS - Project Charter App</span>
        <span className="hidden sm:inline">All rights reserved.</span>
      </div>
    </footer>
  );
}

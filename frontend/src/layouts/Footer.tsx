export default function Footer() {
  return (
    <footer className="bg-card mt-auto">
      <div className="text-muted-foreground flex items-center justify-between px-4 py-4 text-sm sm:px-6">
        <span>© {new Date().getFullYear()} AMSCI - Project Charter App</span>
        <span className="hidden sm:inline">All rights reserved.</span>
      </div>
    </footer>
  );
}

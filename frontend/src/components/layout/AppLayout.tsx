import { Link, NavLink, Outlet } from 'react-router'

// The current page's link is highlighted; NavLink also marks it with aria-current="page" for screen readers
function navLinkClasses({ isActive }: { isActive: boolean }) {
  return `rounded-control px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-raised text-ink' : 'text-muted hover:text-ink'
  }`
}

// The frame around every page: top bar, the page itself (<Outlet />), footer
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-header">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5 rounded-control">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
              aria-hidden="true"
            >
              <path d="M5 17h14M6 17l1.5-5.5A2 2 0 0 1 9.4 10h5.2a2 2 0 0 1 1.9 1.5L18 17" />
              <circle cx="8" cy="17" r="2" />
              <circle cx="16" cy="17" r="2" />
            </svg>
            <span className="font-display text-xl font-bold tracking-tight">CarGarage</span>
          </Link>

          <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
            {/* "end": Services is active only on "/" itself, not on every page below it */}
            <NavLink to="/" end className={navLinkClasses}>
              Services
            </NavLink>
            <NavLink to="/facelift-kits" className={navLinkClasses}>
              Facelift kits
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <p className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted">
          © {new Date().getFullYear()} CarGarage · Car care and detailing
        </p>
      </footer>
    </div>
  )
}
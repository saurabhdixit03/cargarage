import { NavLink, Outlet } from 'react-router'

const sections = [
  { to: '/admin', label: 'Bookings', end: true },
  { to: '/admin/services', label: 'Services', end: false },
]

// The staff area: a row of section tabs above every staff page.
// "end" on Bookings: /admin is only "active" on exactly /admin, not on /admin/services.
export function AdminLayout() {
  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Staff sections" className="flex gap-6 overflow-x-auto border-b border-line">
        {sections.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            end={section.end}
            className={({ isActive }) =>
              `-mb-px border-b-2 pb-3 text-sm font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-accent ${
                isActive ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
              }`
            }
          >
            {section.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
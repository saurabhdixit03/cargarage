// The statuses come from the API types, so the badge always matches the backend
import type { AppointmentStatus } from '../../api/types'

const statusClasses: Record<AppointmentStatus, string> = {
  PENDING: 'bg-pending-soft text-pending',
  ACCEPTED: 'bg-accepted-soft text-accepted',
  COMPLETED: 'bg-completed-soft text-completed',
  REJECTED: 'bg-rejected-soft text-rejected',
  CANCELLED: 'bg-cancelled-soft text-cancelled',
}

const statusLabels: Record<AppointmentStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

// A coloured pill. Same status, same look, on every screen.
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  )
}
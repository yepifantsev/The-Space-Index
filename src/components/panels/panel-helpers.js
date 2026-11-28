const EASTERN_TIME_ZONE = 'America/New_York'

export function formatEasternClock(value) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value)).replace(':00', '')
}

export function formatEasternNavigation(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const month = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN_TIME_ZONE, month: 'short' }).format(date)
  const day = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN_TIME_ZONE, day: 'numeric' }).format(date)
  return `${month} ${day}, ${formatEasternClock(date)}`
}

export function formatLocationNavigation(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const month = new Intl.DateTimeFormat('en-US', { timeZone: __SITE_TIME_ZONE__, month: 'short' }).format(date)
  const day = new Intl.DateTimeFormat('en-US', { timeZone: __SITE_TIME_ZONE__, day: 'numeric' }).format(date)
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: __SITE_TIME_ZONE__,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date).replace(':00', '')
  return `${month} ${day}, ${time}`
}

export function formatEasternDate(value) {
  const date = new Date(value)
  const month = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN_TIME_ZONE, month: 'short' }).format(date)
  const day = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN_TIME_ZONE, day: 'numeric' }).format(date)
  return `${month} ${day}`
}

export function formatLaunchStatus(status) {
  const labels = {
    Go: 'Go for launch',
    Success: 'Succeeded',
    TBC: 'To be confirmed',
    TBD: 'To be determined',
    Hold: 'On hold',
    Failure: 'Failed',
    'In Flight': 'In flight',
  }
  return labels[status] ?? status
}

export function launchStatusStyle(status) {
  const colors = {
    Go: '#67c9a2',
    Success: '#67c9a2',
    Hold: '#e5c95f',
    Failure: '#d66b63',
    'In Flight': '#e5c95f',
  }
  return colors[status] ? `color: ${colors[status]}` : undefined
}

export function formatCneosDate(value) {
  const match = /^(\d{4})-([A-Z][a-z]{2})-(\d{2}) (\d{2}:\d{2})$/.exec(value)
  if (!match) return String(value)
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(match[2])
  if (monthIndex < 0) return String(value)
  const date = new Date(Date.UTC(
    Number(match[1]),
    monthIndex,
    Number(match[3]),
    Number(match[4].slice(0, 2)),
    Number(match[4].slice(3, 5)),
  ))
  return new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function kpColor(kp) {
  if (!Number.isFinite(kp)) return '#67c9a2'
  if (kp >= 7) return '#f06b64'
  if (kp >= 5) return '#f2a65a'
  if (kp >= 3) return '#e5c95f'
  return '#67c9a2'
}

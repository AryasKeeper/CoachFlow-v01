// Date formatting utilities to replace date-fns and fix Jest worker errors

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return 'Date TBD'
    
    return d.toLocaleDateString('en-US', options || {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return 'Date TBD'
  }
}

export function formatDateTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return 'Date TBD'
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch {
    return 'Date TBD'
  }
}

export function formatTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
    
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

export function formatRelativeTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
    
    const now = new Date()
    const diffInMs = now.getTime() - d.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInHours / 24
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`
    } else {
      return formatDate(d)
    }
  } catch {
    return ''
  }
}

export function formatMessageTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
    
    const now = new Date()
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    } else if (diffInHours < 168) { // 7 days
      return d.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return d.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric'
      })
    }
  } catch {
    return ''
  }
}
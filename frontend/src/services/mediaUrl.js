
export function getMediaUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('data:')) return trimmed

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  if (trimmed.startsWith('media/')) return `/${trimmed}`
  return trimmed
}

import { useState } from 'react'

// A small photo from a link, or a plain tile with a picture icon if the link is empty or doesn't load.
// It remembers which link failed, so typing a new link tries again without any extra code.
export function Thumb({ url, className = '' }: { url: string; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (!url || failedUrl === url) {
    return (
      <div className={`flex items-center justify-center rounded-control bg-header text-muted ${className}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="m21 16-5-5-8 8" />
        </svg>
      </div>
    )
  }
  return <img src={url} alt="" onError={() => setFailedUrl(url)} className={`rounded-control bg-header object-cover ${className}`} />
}
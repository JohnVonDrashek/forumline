import { useMemo } from 'react'
import { createAvatar } from '@dicebear/core'
import { avataaars } from '@dicebear/collection'
import { shapes } from '@dicebear/collection'

interface AvatarProps {
  seed: string
  type?: 'user' | 'thread'
  size?: number
  className?: string
  avatarUrl?: string | null
}

export default function Avatar({ seed, type = 'user', size = 40, className = '', avatarUrl }: AvatarProps) {
  const fallbackSvg = useMemo(() => {
    if (avatarUrl) return '' // Skip generation when we have a URL
    const avatar = createAvatar(type === 'user' ? avataaars : shapes, {
      seed,
      size,
    })
    return avatar.toDataUri()
  }, [seed, type, size, avatarUrl])

  return (
    <img
      src={avatarUrl || fallbackSvg}
      alt=""
      className={`rounded-full object-cover ${className}`}
      style={!className.includes('h-') ? { width: size, height: size } : undefined}
    />
  )
}

export type SocialPlatform =
  | 'instagram' | 'facebook' | 'x' | 'youtube' | 'flickr' | '500px'
  | 'linkedin'  | 'pinterest' | 'tiktok' | 'vimeo' | 'bluesky' | 'threads'
  | 'custom'

export interface SocialAccount {
  id:         string
  platform:   SocialPlatform
  url:        string
  label:      string | null
  sort_order: number
}

export const PLATFORM_LIST: Array<{
  value:       SocialPlatform
  label:       string
  placeholder: string
}> = [
  { value: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourclub' },
  { value: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/yourclubpage' },
  { value: 'x',         label: 'X (Twitter)', placeholder: 'https://x.com/yourclub' },
  { value: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@yourclub' },
  { value: 'flickr',    label: 'Flickr',    placeholder: 'https://flickr.com/groups/yourclub' },
  { value: '500px',     label: '500px',     placeholder: 'https://500px.com/yourclub' },
  { value: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/yourclub' },
  { value: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@yourclub' },
  { value: 'vimeo',     label: 'Vimeo',     placeholder: 'https://vimeo.com/yourclub' },
  { value: 'bluesky',   label: 'Bluesky',   placeholder: 'https://bsky.app/profile/yourclub.bsky.social' },
  { value: 'threads',   label: 'Threads',   placeholder: 'https://threads.net/@yourclub' },
  { value: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/yourclub' },
  { value: 'custom',    label: 'Custom — enter a name and URL', placeholder: 'https://...' },
]

export function platformLabel(platform: SocialPlatform, customLabel: string | null): string {
  if (platform === 'custom') return customLabel || 'Custom'
  return PLATFORM_LIST.find(p => p.value === platform)?.label ?? platform
}

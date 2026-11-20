import type { Metadata } from 'next'
import PlayPreview from '@/components/game/PlayPreview'

export const metadata: Metadata = {
  title: 'Try a 1st Alarm: free promotional exam practice | RankUp',
  description:
    'Ten Massachusetts fire promotional exam questions, five air, instant explanations. Free to try, no account needed.',
}

export default function PlayPage() {
  return <PlayPreview />
}

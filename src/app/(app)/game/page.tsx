import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AlarmGame from '@/components/game/AlarmGame'

export default async function GamePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <AlarmGame />
}

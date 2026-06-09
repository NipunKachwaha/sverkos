import { supabase } from '@/lib/supabase'
import { Webhook } from 'svix'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers() // ← await add karo

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
  const evt = wh.verify(body, {
    'svix-id': headersList.get('svix-id')!,
    'svix-timestamp': headersList.get('svix-timestamp')!,
    'svix-signature': headersList.get('svix-signature')!,
  }) as any

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data
    await supabase.from('profiles').insert({
      id,
      email: email_addresses[0].email_address,
      name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
    })
  }

  return Response.json({ success: true })
}
import { supabase } from '@/lib/supabase'
import { Webhook } from 'svix'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const headersList = await headers()

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("❌ CLERK_WEBHOOK_SECRET is missing in .env.local");
      return new Response('Error: Missing Secret', { status: 500 });
    }

    const svix_id = headersList.get('svix-id');
    const svix_timestamp = headersList.get('svix-timestamp');
    const svix_signature = headersList.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("❌ Missing Svix headers from Clerk");
      return new Response('Error: Missing Svix headers', { status: 400 });
    }

    const wh = new Webhook(webhookSecret);
    let evt: any;

    // 1. Signature Verification Check
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err: any) {
      console.error('❌ Svix verification failed:', err.message);
      return new Response(`Error: Verification failed`, { status: 400 });
    }

    // 2. Database Insert Check
    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data;
      
      const { error } = await supabase.from('profiles').insert({
        id,
        email: email_addresses[0]?.email_address,
        name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
      });

      if (error) {
        console.error("❌ Supabase Insert Error:", error);
        return new Response(`Database Error`, { status: 500 });
      }
      
      console.log("✅ User successfully inserted into Supabase!");
    }

    return Response.json({ success: true });
    
  } catch (error: any) {
    console.error("❌ Global Webhook Error:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
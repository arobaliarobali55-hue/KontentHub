import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { ensureProfile } from '@/lib/db/profiles'
import { ensureUserPreferences } from '@/lib/db/preferences'
import { ensureUsage } from '@/lib/db/usage'
import { db } from '@/lib/firebase/server'
import { deleteUserFolder } from '@/lib/cloudinary'

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data
    const email = email_addresses?.[0]?.email_address

    if (!email) {
      return new Response('No email address provided', { status: 400 })
    }

    const full_name = [first_name, last_name].filter(Boolean).join(' ') || null

    try {
      // 1. Create profile
      await ensureProfile({ id, email, full_name })
      // 2. Create default preferences
      await ensureUserPreferences(id)
      // 3. Create default usage stats
      await ensureUsage(id)

      console.log(`Successfully created db records for user ${id}`)
    } catch (error) {
      console.error(`Failed to create db records for user ${id}`, error)
      return new Response('Error creating user records', { status: 500 })
    }
  } else if (eventType === 'user.deleted') {
    const { id } = evt.data;
    if (id) {
      try {
        console.log(`Processing deletion webhook for user ${id}...`);
        // 1. Delete all user images from Cloudinary under kontenthub/users/{userId}
        await deleteUserFolder(id);

        // 2. Delete all user's generated posts from Firestore
        const postsRef = db.collection("generated_posts").where("user_id", "==", id);
        const postsSnap = await postsRef.get();
        const batch = db.batch();
        postsSnap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // 3. Delete user preferences, usage, profile, and subscription records from Firestore
        await db.collection("user_preferences").doc(id).delete().catch(() => {});
        await db.collection("usage").doc(id).delete().catch(() => {});
        await db.collection("profiles").doc(id).delete().catch(() => {});
        await db.collection("subscriptions").doc(id).delete().catch(() => {});

        console.log(`Successfully cleaned up all records and Cloudinary files for deleted user ${id}`);
      } catch (error) {
        console.error(`Failed to clean up records for deleted user ${id}:`, error);
        return new Response('Error deleting user records', { status: 500 });
      }
    }
  }

  return new Response('', { status: 200 })
}

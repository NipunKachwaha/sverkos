export const supabaseGuidelines = `
## Supabase Guidelines

Always use Supabase for:
- Database: @supabase/supabase-js
- Auth: Already handled by Clerk (do NOT use Supabase Auth)
- Storage: supabase.storage for file uploads
- Realtime: supabase.channel() for live updates

### Database Pattern:
\`\`\`typescript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Query:
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)

// Insert:
const { data, error } = await supabase
  .from('table_name')
  .insert({ field: value })
\`\`\`

### NEVER use:
- convex (not installed)
- Supabase Auth (Clerk handles auth)
- Direct SQL queries
`
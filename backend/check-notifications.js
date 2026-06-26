require('dotenv').config({ path: require('path').join(__dirname, 'src', '.env') });
// Try loading env from different locations
const envPaths = ['.env', '../.env', 'src/.env'];
for (const p of envPaths) {
  try { require('dotenv').config({ path: require('path').join(__dirname, p) }); } catch(_) {}
}

const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them as env vars.'); process.exit(1); }

const sb = createClient(url, key);
sb.from('notifications')
  .select('id, user_id, type, title, message, related_entity_id, related_entity_type, is_read, created_at')
  .order('created_at', { ascending: false })
  .limit(10)
  .then(({ data, error }) => {
    if (error) { console.error('Error:', error); return; }
    console.log('Recent notifications:');
    (data || []).forEach(n => {
      console.log('---');
      console.log('  id:', n.id);
      console.log('  type:', n.type);
      console.log('  title:', n.title);
      console.log('  related_entity_id:', n.related_entity_id);
      console.log('  related_entity_type:', n.related_entity_type);
    });
  });

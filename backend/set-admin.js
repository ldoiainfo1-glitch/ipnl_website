// Quick script to set user as admin
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setAdmin() {
  console.log('Listing all users:');
  const { data: allUsers } = await supabase.from('profiles').select('id, email, role, company_name');
  console.table(allUsers);

  const email = 'test123@gmail.com';
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'ADMIN' })
    .eq('email', email)
    .select('id, email, role, company_name');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Updated:', data);
  }
}

setAdmin().then(() => process.exit(0)).catch(console.error);

-- Contact enquiries submitted via the public contact form
create table if not exists contact_enquiries (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  firm         text,
  email        text not null,
  phone        text,
  message      text not null,
  plan_context text,          -- e.g. "Premium — Brokers & Channel Partners (₹60,000/year)"
  created_at   timestamptz not null default now()
);

-- Only admins / service role can read; no public select
alter table contact_enquiries enable row level security;

create policy "service_role only" on contact_enquiries
  using (false);          -- deny all anon/authenticated reads; service-role bypasses RLS

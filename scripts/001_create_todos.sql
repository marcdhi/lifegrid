-- Create todos table
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.todos enable row level security;

-- Create policies for public access (no auth required for demo)
create policy "Allow all to select todos"
  on public.todos for select
  using (true);

create policy "Allow all to insert todos"
  on public.todos for insert
  with check (true);

create policy "Allow all to update todos"
  on public.todos for update
  using (true);

create policy "Allow all to delete todos"
  on public.todos for delete
  using (true);

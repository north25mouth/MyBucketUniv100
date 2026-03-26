-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  nickname text,
  university text,
  avatar_url text,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (is_public = true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create table for bucket list items
create table bucket_list_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  item_index integer not null check (item_index >= 1 and item_index <= 100),
  title text,
  is_completed boolean default false,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, item_index)
);

-- Enable RLS on bucket_list_items
alter table bucket_list_items enable row level security;

create policy "Public items are viewable by everyone depending on profile." on bucket_list_items
  for select using (
    exists (
      select 1 from profiles where profiles.id = bucket_list_items.user_id and profiles.is_public = true
    )
    or auth.uid() = user_id
  );

create policy "Users can insert their own items." on bucket_list_items
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own items." on bucket_list_items
  for update using (auth.uid() = user_id);

create policy "Users can delete their own items." on bucket_list_items
  for delete using (auth.uid() = user_id);

-- Storage bucket for images
insert into storage.buckets (id, name, public) values ('bucket_images', 'bucket_images', true);

create policy "Images are publicly accessible."
  on storage.objects for select using ( bucket_id = 'bucket_images' );

create policy "Users can upload their own images."
  on storage.objects for insert with check ( bucket_id = 'bucket_images' and (auth.uid() = owner or owner is null) );

create policy "Users can update their own images."
  on storage.objects for update using ( bucket_id = 'bucket_images' and auth.uid() = owner );

create policy "Users can delete their own images."
  on storage.objects for delete using ( bucket_id = 'bucket_images' and auth.uid() = owner );

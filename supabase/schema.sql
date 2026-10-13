-- Schéma CLTO Badminton (projet Supabase harmonie-olivet, préfixe clto_)
-- Déjà appliqué via les migrations clto_init et clto_extra_cols ; conservé ici pour référence.

create table public.clto_admins (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz default now());
create or replace function public.clto_is_admin() returns boolean language sql stable security definer set search_path to '' as
$$ select exists (select 1 from public.clto_admins a where a.user_id = (select auth.uid())); $$;

create table public.clto_settings  (key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table public.clto_pages     (slug text primary key, title text not null, subtitle text, hero_image text, content text, data jsonb default '{}'::jsonb, updated_at timestamptz default now());
create table public.clto_posts     (id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, excerpt text, content text, cover text, categories text[] default '{}', date date default current_date, featured boolean default false, published boolean default true, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.clto_events    (id uuid primary key default gen_random_uuid(), title text not null, kind text default 'Événement', date_start date not null, date_end date, time_text text, location text, audience text, price text, description text, image text, link text, cta_label text, published boolean default true, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.clto_gyms      (id uuid primary key default gen_random_uuid(), name text not null, address text, city text, lat double precision, lng double precision, courts int, image text, description text, position int default 0, updated_at timestamptz default now());
create table public.clto_slots     (id uuid primary key default gen_random_uuid(), day int not null check (day between 1 and 7), start_time text not null, end_time text not null, gym text, audience text, label text, kind text, level text, coach text, notes text, is_full boolean default false, position int default 0, updated_at timestamptz default now());
create table public.clto_prices    (id uuid primary key default gen_random_uuid(), category text, label text not null, price text, details text, position int default 0, updated_at timestamptz default now());
create table public.clto_teams     (id uuid primary key default gen_random_uuid(), name text not null, division text, captain text, description text, image text, link text, position int default 0, updated_at timestamptz default now());
create table public.clto_people    (id uuid primary key default gen_random_uuid(), name text not null, role text, grp text default 'Bureau', photo text, bio text, position int default 0, updated_at timestamptz default now());
create table public.clto_partners  (id uuid primary key default gen_random_uuid(), name text not null, kind text default 'Partenaires', logo text, url text, description text, position int default 0, updated_at timestamptz default now());
create table public.clto_gallery   (id uuid primary key default gen_random_uuid(), title text not null, date date, cover text, url_album text, images jsonb default '[]'::jsonb, category text, position int default 0, updated_at timestamptz default now());
create table public.clto_documents (id uuid primary key default gen_random_uuid(), title text not null, category text, url text, description text, position int default 0, updated_at timestamptz default now());
create table public.clto_timeline  (id uuid primary key default gen_random_uuid(), date date, date_label text, title text not null, text text, kind text default 'histoire', position int default 0, updated_at timestamptz default now());
create table public.clto_faq       (id uuid primary key default gen_random_uuid(), category text, question text not null, answer text, position int default 0, updated_at timestamptz default now());
create table public.clto_messages  (id uuid primary key default gen_random_uuid(), name text not null, email text not null, phone text, subject text, message text not null, status text default 'nouveau', created_at timestamptz default now());

-- Règles d'accès (RLS) :
--  * lecture publique de toutes les tables de contenu (posts et events : seulement publiés, sauf pour les admins) ;
--  * ajout / modification / suppression réservés à clto_is_admin() ;
--  * clto_messages : envoi public (status = 'nouveau'), lecture et gestion réservées aux admins ;
--  * bucket de stockage public « clto-media » : écriture, liste et suppression réservées aux admins.

-- Optional persistence for page-aware chunks + embeddings (server / worker ingestion).
-- The Quilora web client currently uses an in-memory vector store by default (`VITE_VECTOR_STORE_PROVIDER=memory`).
-- Enable this table when you run a background worker with `DATABASE_URL` to sync embeddings.

create table if not exists public.ai_document_chunks (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id text not null,
  chunk_id text not null,
  page_number integer not null,
  paragraph_index integer not null default 0,
  source_title text,
  chunk_text text not null,
  token_estimate integer,
  start_char integer,
  end_char integer,
  embedding real[],
  created_at timestamptz not null default now(),
  unique (sandbox_id, document_id, chunk_id)
);

create index if not exists idx_ai_document_chunks_sandbox_doc on public.ai_document_chunks (sandbox_id, document_id);

alter table public.ai_document_chunks enable row level security;

create policy ai_document_chunks_all on public.ai_document_chunks for all using (
  exists (select 1 from public.sandboxes s where s.id = sandbox_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.sandboxes s where s.id = sandbox_id and s.user_id = auth.uid())
);

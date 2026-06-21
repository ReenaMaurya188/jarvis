create extension if not exists vector;

create table messages (
  id bigserial primary key,
  session_id text not null,
  role text not null,           -- 'user' | 'assistant' | 'tool'
  content text not null,
  created_at timestamptz default now()
);

create table memories (
  id bigserial primary key,
  session_id text not null,
  content text not null,
  embedding vector(384),        -- matches all-MiniLM-L6-v2 output size
  created_at timestamptz default now()
);

create index on memories using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Function for similarity search
create or replace function match_memories (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  p_session_id text
)
returns table (
  id bigint,
  content text,
  similarity float
)
language sql stable
as $$
  select
    memories.id,
    memories.content,
    1 - (memories.embedding <=> query_embedding) as similarity
  from memories
  where memories.session_id = p_session_id
    and 1 - (memories.embedding <=> query_embedding) > match_threshold
  order by memories.embedding <=> query_embedding
  limit match_count;
$$;

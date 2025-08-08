
-- Ensure extensions schema exists
create schema if not exists extensions;

-- Enable pgcrypto in extensions schema, providing crypt() and gen_salt()
create extension if not exists pgcrypto with schema extensions;


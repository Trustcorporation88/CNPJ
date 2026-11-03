-- Aberturas recentes da base pública de CNPJ (Receita Federal), para a aba "Novas empresas".
-- Fica num schema fora da API do Supabase: só o servidor do site (cnpj_site, leitura) e o
-- script de sincronização (cnpj_sync, escrita) acessam, com senha própria.

create schema if not exists cnpj;

create table cnpj.novas_empresas (
  cnpj text primary key,
  razao_social text,
  nome_fantasia text,
  matriz boolean not null,
  data_abertura date not null,
  cnae_principal text,
  cnaes_secundarios text[] not null default '{}',
  natureza_juridica text,
  porte text,
  mei boolean not null,
  simples boolean not null,
  capital_social numeric,
  endereco text,
  bairro text,
  cep text,
  municipio text,
  municipio_norm text,
  uf text,
  ddd_1 text,
  telefone_1 text,
  ddd_2 text,
  telefone_2 text,
  email text
);

create index novas_empresas_data_idx on cnpj.novas_empresas (data_abertura);
create index novas_empresas_municipio_idx on cnpj.novas_empresas (municipio_norm, data_abertura);
create index novas_empresas_cnae_idx on cnpj.novas_empresas (cnae_principal text_pattern_ops, data_abertura);

create table cnpj.cnaes (
  codigo text primary key,
  descricao text not null,
  descricao_norm text not null
);

create table cnpj.metadados (
  chave text primary key,
  valor text
);

revoke all on schema cnpj from public, anon, authenticated;
revoke all on all tables in schema cnpj from public, anon, authenticated;

do $$
begin
  if not exists (select from pg_roles where rolname = 'cnpj_site') then
    create role cnpj_site login noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'cnpj_sync') then
    create role cnpj_sync login noinherit;
  end if;
end $$;

alter role cnpj_site set statement_timeout = '20s';

grant usage on schema cnpj to cnpj_site, cnpj_sync;
grant select on all tables in schema cnpj to cnpj_site;
grant select, insert, update, delete, truncate on all tables in schema cnpj to cnpj_sync;

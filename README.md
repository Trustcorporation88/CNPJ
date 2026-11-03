# Central de Consultas Fiscais (CNPJ)

Site em React + Vite com backend Express (`server.js`): consulta de CNPJ, CPF, inscrição estadual, Simples/MEI,
Suframa e busca de empresas recém-abertas.

## Rodando localmente

```sh
npm install
npm run build
node server.js        # http://localhost:3000
```

Variáveis de ambiente: `SINTEGRA_TOKEN`, `CNPJA_TOKEN`, `ACCESS_KEY` (senha do admin), `CLIENT_KEY` (senha do
funcionário) e, para a aba Novas empresas, `SUPABASE_DB_URL`.

## Novas empresas (Receita Federal + Supabase)

A aba **Novas empresas** lista MEIs, microempresas e empresários individuais abertos num período, com filtro por
CNAE, UF e município, e exporta CSV. Os dados vêm dos
[Dados Abertos do CNPJ](https://arquivos.receitafederal.gov.br/index.php/s/gn672Ad4CF8N6TK?dir=/Dados/Cadastros/CNPJ)
da Receita. Eles são montados numa base DuckDB local pelo [radar-cnpj-mcp](https://github.com/wendersoon/radar-cnpj-mcp),
e só as empresas ativas desses três tipos abertas nos últimos meses (24 por padrão) são copiadas para o schema
`cnpj` do Postgres do Supabase, de onde o site lê.

**Atraso dos dados:** a Receita publica um arquivo por mês, com algumas semanas de atraso. Por isso "última semana"
e "último mês" contam a partir da abertura mais recente que existe na base, e não da data de hoje. A aba mostra essa
data.

### Preparar o Supabase (uma vez)

1. Aplique as migrações de `supabase/migrations/` (SQL Editor ou `supabase db push`). Elas criam o schema `cnpj`,
   fora da API REST, e dois papéis sem senha: `cnpj_site` (só leitura) e `cnpj_sync` (carga mensal).
2. Defina as senhas no SQL Editor:

   ```sql
   alter role cnpj_site password '<senha forte 1>';
   alter role cnpj_sync password '<senha forte 2>';
   ```

3. No Railway, crie a variável `SUPABASE_DB_URL` (pooler do Supabase, em *Connect > Session pooler*):

   ```
   postgresql://cnpj_site.<ref-do-projeto>:<senha 1>@aws-0-<regiao>.pooler.supabase.com:5432/postgres
   ```

   O servidor não guarda a base, então não é preciso volume no Railway.

O disco do Supabase precisa comportar a tabela, os índices e o WAL gerado na carga: durante a sincronização a base
antiga e a nova coexistem, então reserve cerca de 3x o tamanho final. Com SP e 24 meses são 2,3 milhões de empresas
e 800 MB (tabela + índices), ou seja, uns 2,5 GB livres na carga; o Brasil inteiro fica em torno de 3 a 4 vezes
isso. Ajuste o disco em *Project Settings > Compute and Disk* antes de sincronizar.

### Atualizar todo mês

Depois que a Receita publicar a pasta nova, num computador com uns 20 GB livres:

```sh
npx radar-cnpj-mcp baixar --ufs SP          # várias UFs: --ufs SP,MG,RJ   |   Brasil inteiro: --todas
SUPABASE_SYNC_URL='postgresql://cnpj_sync.<ref>:<senha 2>@aws-0-<regiao>.pooler.supabase.com:5432/postgres' \
  npm run sincronizar
```

- O `baixar` baixa cerca de 7 GB da Receita (mesmo para uma só UF) e deixa só a base (`radar.duckdb`, cerca de
  2 GB para SP). Cada execução substitui a base, então informe todas as UFs desejadas. Para usar outro caminho,
  defina `RADAR_CNPJ_DB` no `baixar` e no `sincronizar`.
- O `sincronizar` troca o conteúdo das tabelas numa única transação: o site continua mostrando a base anterior até o
  fim da carga. `MESES=12` muda a janela guardada.

Telefone e e-mail de MEIs costumam ser os da própria pessoa. Ao usar os dados para contato, respeite a LGPD.

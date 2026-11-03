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
funcionário) e, para a aba Novas empresas, `RADAR_CNPJ_DB` (opcional).

## Novas empresas (base local da Receita Federal)

A aba **Novas empresas** lista MEIs, microempresas e empresários individuais abertos num período, com filtro por
CNAE, UF e município, e exporta CSV. Os dados vêm dos
[Dados Abertos do CNPJ](https://arquivos.receitafederal.gov.br/index.php/s/gn672Ad4CF8N6TK?dir=/Dados/Cadastros/CNPJ)
da Receita, montados numa base DuckDB local pelo [radar-cnpj-mcp](https://github.com/wendersoon/radar-cnpj-mcp).

**Atraso dos dados:** a Receita publica um arquivo por mês, com algumas semanas de atraso. Por isso "última semana"
e "último mês" contam a partir da abertura mais recente que existe na base, e não da data de hoje. A aba mostra essa
data.

### Gerar ou atualizar a base

```sh
npx radar-cnpj-mcp baixar --ufs SP          # várias UFs: --ufs SP,MG,RJ   |   Brasil inteiro: --todas
```

- Baixa cerca de 7 GB da Receita (mesmo para uma só UF) e precisa de uns 20 GB livres durante o processo.
- Ao final fica só a base (`radar.duckdb`, cerca de 2 GB para SP). Por padrão ela vai para
  `~/.local/share/radar-cnpj-mcp/` (Linux), `~/Library/Application Support/radar-cnpj-mcp/` (macOS) ou
  `%LOCALAPPDATA%\radar-cnpj-mcp\` (Windows). Para outro lugar, defina `RADAR_CNPJ_DB` no `baixar` e no servidor.
- Rode de novo todo mês, depois que a Receita publicar a pasta nova. O servidor percebe a troca do arquivo sozinho,
  sem reiniciar. Cada execução substitui a base, então informe todas as UFs desejadas.

### Base online (Railway + Cloudflare R2)

O proxy da Cloudflare no domínio limita uploads a 100 MB, e a base tem cerca de 2 GB por UF grande. Por isso a base
é gerada fora do servidor, guardada num bucket privado do Cloudflare R2, e o próprio servidor baixa de lá:

1. **R2:** no painel da Cloudflare, crie um bucket (ex.: `cnpj-base`). Em *R2 > Manage API tokens*, crie dois tokens
   restritos a esse bucket: um *Object Read & Write* (para você enviar) e um *Object Read* (para o servidor).
2. **Enviar a base** gerada com o `baixar` (o upload pelo painel do R2 é limitado, use a API S3):

   ```sh
   AWS_ACCESS_KEY_ID=<id do token de escrita> AWS_SECRET_ACCESS_KEY=<segredo> AWS_DEFAULT_REGION=auto \
     aws s3 cp ~/.local/share/radar-cnpj-mcp/radar.duckdb s3://cnpj-base/radar.duckdb \
     --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   ```

3. **Railway:** adicione um volume ao serviço montado em `/data`, com pelo menos o dobro do tamanho da base (o
   download novo convive com o atual até a troca), e as variáveis:

   | Variável | Valor |
   | --- | --- |
   | `RADAR_CNPJ_DB` | `/data/radar.duckdb` |
   | `R2_ACCOUNT_ID` | ID da conta Cloudflare |
   | `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | token *Object Read* |
   | `R2_BUCKET` | `cnpj-base` |
   | `R2_OBJECT` | opcional, padrão `radar.duckdb` |

4. **No site:** entre como admin, abra *Novas empresas* e clique em **Atualizar base agora**. O servidor baixa,
   confere o arquivo e só então substitui a base, sem tirar o site do ar.

Todo mês: rode o `baixar`, envie o arquivo para o R2 e clique em **Atualizar base agora**. Em vez do R2, qualquer
URL HTTPS direta também funciona, em `RADAR_CNPJ_DB_URL`.

Telefone e e-mail de MEIs costumam ser os da própria pessoa. Ao usar os dados para contato, respeite a LGPD.

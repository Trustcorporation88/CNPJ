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

Telefone e e-mail de MEIs costumam ser os da própria pessoa. Ao usar os dados para contato, respeite a LGPD.

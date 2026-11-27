# SISTEMA DE GESTÃO DE ATENDIMENTO AO CLIENTE — Front-end

Interface web do Sistema de Gestão de Atendimento ao Cliente, construída com **HTML5, CSS3 e JavaScript ES6+ (ES Modules)**. Ela consome a API REST Spring Boot do repositório `atendimento-backend-postgres-main`

## Integrantes

- Gustavo Cardoso Rodrigues
- Abel Maximo da Silva

## Objetivo do projeto

Oferecer a clientes, atendentes e administradores uma interface única para o ciclo de vida de um chamado: o cliente se cadastra, abre e acompanha solicitações; a equipe assume, comenta e muda o status de cada chamado até o encerramento; o administrador gerencia cadastros, equipe e indicadores.

## Principais casos de uso

| # | Caso de uso | Perfil | Tela |
|---|---|---|---|
| 1 | Login com redirecionamento por perfil | Todos | `index.html` |
| 2 | Cadastro de cliente | Público | `cadastro.html` |
| 3 | Consultar o próprio perfil | Cliente | `pages/cliente/perfil.html` |
| 4 | Abrir chamado | Cliente | `pages/cliente/novo-chamado.html` |
| 5 | Listar e filtrar os próprios chamados | Cliente | `pages/cliente/chamados.html` |
| 6 | Ver detalhe, comentar e consultar o histórico | Todos | `pages/chamado/detalhe.html?id=…` |
| 7 | Consultar clientes por nome ou CPF | Atendente, Admin | `pages/atendente/clientes.html`, `pages/admin/clientes.html` |
| 8 | Abrir chamado em nome de um cliente | Atendente, Admin | Fila de chamados / Clientes |
| 9 | Assumir chamado | Atendente | Fila, painel e detalhe |
| 10 | Alterar status (resolver, encerrar, cancelar…) | Atendente, Admin | Fila e detalhe |
| 11 | Atribuir atendente a um chamado | Admin | Fila, painel e detalhe |
| 12 | Editar e inativar clientes | Admin | `pages/admin/clientes.html` |
| 13 | Cadastrar e listar atendentes | Admin | `pages/admin/atendentes.html` |
| 14 | Relatório consolidado de chamados | Admin (painel do atendente também consome) | `pages/admin/relatorios.html` |

## Stack utilizada

- HTML5 semântico, CSS3 (custom properties, grid, `:has()`), JavaScript ES6+ com ES Modules
- Fetch API, com um único cliente HTTP (`assets/js/api.js`)
- `sessionStorage` para a sessão (token JWT e dados públicos do usuário)
- Fontes IBM Plex Sans / IBM Plex Mono (Google Fonts, com fallback para fontes do sistema)
- Ícones SVG próprios, no traço do Lucide, gerados por `createElementNS`: sem CDN de ícones e sem `innerHTML`
- Live Server (VS Code) para servir os arquivos

## Como executar

**Pré-requisitos:** back-end em execução em `http://localhost:8080`, com PostgreSQL configurado conforme o README do back-end, e a extensão Live Server instalada no VS Code.

1. Suba o back-end (`atendimento-backend-postgres-main`) conforme o README dele. Para ter um usuário ADMIN, defina `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD` no ambiente (veja `.env.example`). Não versione credenciais reais.
2. No VS Code, abra **a pasta `atendimento-frontend/`** (File › Open Folder).
3. Crie `atendimento-frontend/.vscode/settings.json` com o conteúdo abaixo, para o Live Server abrir em `localhost:5500`, e clique em **Go Live**:
   ```json
   {
       "liveServer.settings.host": "localhost",
       "liveServer.settings.port": 5500
   }
   ```
4. Acesse **http://localhost:5500/index.html**.

> **Importante (CORS):** o back-end aceita apenas a origem `http://localhost:5500` (`CORS_ORIGIN`). Se o navegador abrir `http://127.0.0.1:5500`, as chamadas à API serão bloqueadas pelo navegador e a tela mostrará "Não foi possível conectar ao servidor". Nesse caso, troque `127.0.0.1` por `localhost` na barra de endereço.

A URL da API está definida em um único lugar: `assets/js/config.js` (`API_URL`).

## Arquitetura do projeto

```text
Página HTML  (pages/**.html — marcação estática + <body data-page="...">)
   ↓
JavaScript da página  (assets/js/pages/*.js — guard + render + eventos)
   ↓
ui.js / chamado.js  (componentes: tabela, modal, toast, badges, formulários)
   ↓
api.js  (fetch + JWT no header + tratamento 400/401/403/404/409/500)
   ↓
HTTP + JSON + JWT (Authorization: Bearer …)
   ↓
Spring Boot  →  Service  →  Repository  →  PostgreSQL
```

A página nunca acessa o banco diretamente; todo acesso passa por `api.js`.

**Responsabilidades dos módulos**

| Módulo | Responsabilidade |
|---|---|
| `config.js` | `API_URL`, rotas e geração de URLs relativas à raiz do front |
| `api.js` | Cliente HTTP único; anexa o JWT; converte JSON; padroniza erros (`ApiError`); 401 encerra a sessão |
| `auth.js` | Login, cadastro, leitura da sessão e logout. A senha nunca é armazenada |
| `guards.js` | `requireAuth()`, `requireRole(...)` e `iniciarPagina(mapa)`: o guard roda antes de qualquer render |
| `ui.js` | Construção segura de DOM (`el`), ícones, `toast`, `setLoading`, badges, `formatarData`, `mascararCPF`, modal, `confirmar`, tabela responsiva, layout (sidebar + topbar) |
| `pages/chamado.js` | Detalhe do chamado e componentes de chamado reutilizados (tabela, filtros, assumir, atribuir, status, abrir para cliente) |
| `pages/cliente.js` | Painel, perfil, novo chamado e lista do cliente |
| `pages/atendente.js` | Painel do atendente, fila de chamados (compartilhada com o admin) e consulta de clientes |
| `pages/admin.js` | Painel, clientes (editar/inativar), atendentes e relatório |
| `pages/login.js`, `pages/cadastro.js` | Telas públicas |

Cada arquivo de página registra suas telas com `iniciarPagina({ "<data-page>": { perfis, iniciar } })`. Assim, um módulo pode importar outro (por exemplo, `admin.js` reaproveita a consulta de clientes de `atendente.js`) sem disparar a inicialização das telas do outro.

## Estrutura de diretórios

```text
atendimento-frontend/
├── index.html                  # login
├── cadastro.html               # cadastro público de cliente
├── README.md
├── .vscode/settings.json       # (criar) Live Server em localhost:5500
├── pages/
│   ├── cliente/    dashboard.html · chamados.html · novo-chamado.html · perfil.html
│   ├── atendente/  dashboard.html · chamados.html (fila, também usada pelo ADMIN) · clientes.html
│   ├── admin/      dashboard.html · clientes.html · atendentes.html · relatorios.html
│   └── chamado/    detalhe.html
└── assets/
    ├── css/  global.css · components.css · auth.css · dashboard.css · chamados.css
    └── js/   config.js · api.js · auth.js · guards.js · ui.js
              pages/ login.js · cadastro.js · cliente.js · atendente.js · admin.js · chamado.js
```

## Mapa tela → endpoints consumidos

| Tela | Endpoints |
|---|---|
| Login | `POST /api/auth/login` |
| Cadastro | `POST /api/auth/register` |
| Cliente › Início | `GET /api/chamados` |
| Cliente › Meus chamados | `GET /api/chamados` |
| Cliente › Abrir chamado | `POST /api/chamados` (sem `clienteId`) |
| Cliente › Meu perfil | `GET /api/clientes/me` |
| Detalhe do chamado | `GET /api/chamados/{id}`, `GET /api/chamados/{id}/historico`, `POST /api/chamados/{id}/comentarios`; equipe: `PATCH /api/chamados/{id}/status`, `PATCH /api/chamados/{id}/atendente/{atendenteId}`; admin: `GET /api/atendentes` |
| Atendente › Painel | `GET /api/relatorios/chamados`, `GET /api/chamados`, `PATCH …/atendente/{id}` |
| Fila de chamados (Atendente/Admin) | `GET /api/chamados`, `PATCH …/status`, `PATCH …/atendente/{id}`, `POST /api/chamados` (com `clienteId`), `GET /api/clientes/cpf/{cpf}`; admin: `GET /api/atendentes` |
| Clientes (Atendente/Admin) | `GET /api/clientes`, `GET /api/clientes?nome=`, `GET /api/clientes/cpf/{cpf}`, `GET /api/chamados/cliente/{clienteId}`, `POST /api/chamados`; admin: `PUT /api/clientes/{id}`, `PATCH /api/clientes/{id}/inativar` |
| Admin › Visão geral | `GET /api/relatorios/chamados`, `GET /api/chamados`, `GET /api/clientes`, `GET /api/atendentes` |
| Admin › Atendentes | `GET /api/atendentes`, `POST /api/atendentes` |
| Admin › Relatórios | `GET /api/relatorios/chamados` |

## Perfis e permissões

| Recurso | CLIENTE | ATENDENTE | ADMIN |
|---|:-:|:-:|:-:|
| Abrir chamado próprio | ✓ | | |
| Abrir chamado para cliente (`clienteId`) | | ✓ | ✓ |
| Ver chamados | só os próprios | todos | todos |
| Comentar | nos próprios | ✓ | ✓ |
| Assumir / atribuir atendente | | ✓ (assumir) | ✓ (atribuir qualquer) |
| Alterar status | | ✓ | ✓ |
| Consultar clientes | | ✓ | ✓ |
| Editar / inativar cliente | | | ✓ |
| Cadastrar / listar atendentes | | | ✓ |
| Relatório | | ✓ (contadores do painel) | ✓ |

Os guards do front (`requireRole`) apenas evitam navegação indevida. **Quem decide é a API**: um 403 retornado pelo back-end é exibido como "Você não possui permissão para executar esta operação."

### Decisões tomadas a partir do contrato real da API

- **Prioridades:** `BAIXA`, `MEDIA`, `ALTA`, `CRITICA` (enum do back-end).
- **Protocolo:** exibido como a API gera (`ATD-AAAAMMDD-XXXXXXXX`).
- **CPF:** a API já devolve o CPF mascarado (`***.456.789-**`); `mascararCPF()` é idempotente e garante a máscara mesmo se o formato mudar.
- **Transições de status:** o seletor oferece todos os status diferentes do atual; a API aceita ou rejeita (400) e a mensagem dela aparece no formulário. O front não replica a máquina de estados.
- **"Assumir" pelo atendente:** o `PATCH …/atendente/{atendenteId}` exige o ID da entidade Atendente, mas o login devolve `usuarioId`, e `GET /api/atendentes` é restrito ao ADMIN. Sem alterar o back-end, o front (1) descobre o ID em chamados já atribuídos ao atendente logado ou (2) pede o ID uma vez. O admin vê esse ID na tela Atendentes. O valor fica só no `sessionStorage`, e a resposta da API é conferida: se o chamado foi atribuído a outra pessoa, o front avisa e descarta o ID.

## Checklist de segurança (seção 20 do FRONTEND_GUIDE.md)

- [x] **Senha nunca armazenada pelo front-end:** só trafega no corpo do login/cadastro; `sessionStorage` guarda `token`, `usuarioId`, `nome`, `email`, `perfil`.
- [x] **JWT não incluído em URL:** só no header `Authorization: Bearer` (`api.js`). As URLs carregam apenas o ID do chamado e filtros de visão.
- [x] **Nenhuma página chama o banco diretamente:** todo acesso passa por `api.js` → API REST.
- [x] **Comentários renderizados com `textContent`:** o projeto inteiro não usa `innerHTML`. O helper `el()` cria nós de texto, e até os ícones SVG são montados com `createElementNS`.
- [x] **CPF não exposto além do necessário:** mascarado em listagens, perfil e modais. Na busca, o CPF digitado vai no caminho da requisição à API, como o contrato exige, e nunca na URL da página.
- [x] **Páginas protegidas possuem guard:** `iniciarPagina` → `requireRole(...)` antes de qualquer render. O `<body class="app-body">` fica oculto até o guard liberar.
- [x] **Back-end continua validando todas as permissões:** nenhuma regra de autorização ou de negócio foi movida para o JS.
- [x] **401 encerra a sessão:** `sessionStorage.clear()` + redirecionamento para `index.html?sessao=expirada`, com aviso. No login, um 401 significa credencial inválida e é exibido no formulário.
- [x] **403 não é tratado como erro interno:** mensagem fixa de permissão.
- [x] **Erros 500 não exibem detalhes técnicos:** mensagem genérica; o corpo da resposta é descartado.
- [x] **Nenhuma credencial real é versionada:** o README e o código não contêm senhas; o admin vem de variáveis de ambiente do back-end.

Itens adicionais: `<meta name="referrer" content="no-referrer">` em todas as páginas; `encodeURIComponent` em segmentos de caminho e query string; sessão em `sessionStorage` (expira ao fechar a aba).
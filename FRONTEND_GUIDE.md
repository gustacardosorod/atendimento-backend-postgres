# Guia de Desenvolvimento do Front-end

## Sistema de Gestão de Atendimento ao Cliente

Este documento define o plano para desenvolver o front-end do sistema de atendimento consumindo a API REST já implementada no back-end.

> **Importante:** o front-end deve ser iniciado somente depois que o roteiro de testes integrados da API estiver estável. O contrato da API deve ser tratado como a fonte de verdade.

---

## 1. Stack recomendada

Para manter aderência ao escopo acadêmico e reduzir complexidade, a primeira versão deve utilizar:

- HTML5
- CSS3
- JavaScript ES6+
- Fetch API
- ES Modules
- Live Server no VS Code

Nesta fase, não é necessário utilizar React, Angular ou Vue.

### Endereços locais

Front-end:

```text
http://localhost:5500
```

Back-end:

```text
http://localhost:8080
```

API:

```text
http://localhost:8080/api
```

Swagger:

```text
http://localhost:8080/swagger-ui/index.html
```

---

## 2. Arquitetura proposta

```text
atendimento-frontend/
│
├── index.html
├── cadastro.html
│
├── pages/
│   ├── cliente/
│   │   ├── dashboard.html
│   │   ├── chamados.html
│   │   ├── novo-chamado.html
│   │   └── perfil.html
│   │
│   ├── atendente/
│   │   ├── dashboard.html
│   │   ├── chamados.html
│   │   └── clientes.html
│   │
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── clientes.html
│   │   ├── atendentes.html
│   │   └── relatorios.html
│   │
│   └── chamado/
│       └── detalhe.html
│
├── assets/
│   ├── css/
│   │   ├── global.css
│   │   ├── components.css
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   └── chamados.css
│   │
│   └── js/
│       ├── config.js
│       ├── api.js
│       ├── auth.js
│       ├── guards.js
│       ├── ui.js
│       └── pages/
│           ├── login.js
│           ├── cadastro.js
│           ├── cliente.js
│           ├── atendente.js
│           ├── admin.js
│           └── chamado.js
│
└── README.md
```

---

## 3. Fluxo arquitetural

```text
Página HTML
   ↓
JavaScript da página
   ↓
api.js
   ↓
HTTP + JSON + JWT
   ↓
Spring Boot
   ↓
Service
   ↓
Repository
   ↓
PostgreSQL
```

A página não deve acessar diretamente o banco de dados.

---

## 4. Configuração central da API

Criar:

```text
assets/js/config.js
```

```javascript
export const API_URL = "http://localhost:8080/api";
```

Nenhuma página deve repetir a URL do back-end.

---

## 5. Cliente HTTP centralizado

Criar:

```text
assets/js/api.js
```

Responsabilidades:

- executar GET, POST, PUT e PATCH;
- incluir JWT automaticamente;
- converter JSON;
- tratar respostas HTTP;
- centralizar tratamento de 400, 401, 403, 404 e 500;
- remover a sessão quando o token não for mais válido.

Estrutura conceitual:

```javascript
import { API_URL } from "./config.js";

export async function api(path, options = {}) {
    const token = sessionStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        sessionStorage.clear();
        window.location.href = "/index.html";
        throw new Error("Sessão expirada ou não autorizada.");
    }

    const contentType = response.headers.get("content-type");
    const body = contentType?.includes("application/json")
        ? await response.json()
        : null;

    if (!response.ok) {
        throw body ?? new Error(`Erro HTTP ${response.status}`);
    }

    return body;
}
```

---

## 6. Autenticação

### Endpoint

```text
POST /api/auth/login
```

Payload:

```json
{
  "email": "usuario@email.com",
  "senha": "Senha@123"
}
```

Resposta esperada:

```json
{
  "token": "JWT",
  "tipo": "Bearer",
  "usuarioId": 1,
  "nome": "Nome",
  "email": "usuario@email.com",
  "perfil": "ADMIN"
}
```

Após autenticar, armazenar:

```javascript
sessionStorage.setItem("token", resposta.token);
sessionStorage.setItem("usuarioId", resposta.usuarioId);
sessionStorage.setItem("nome", resposta.nome);
sessionStorage.setItem("email", resposta.email);
sessionStorage.setItem("perfil", resposta.perfil);
```

### Redirecionamento

```text
CLIENTE   → pages/cliente/dashboard.html
ATENDENTE → pages/atendente/dashboard.html
ADMIN     → pages/admin/dashboard.html
```

---

## 7. Guards de acesso

Criar:

```text
assets/js/guards.js
```

Funções recomendadas:

```javascript
export function requireAuth() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "/index.html";
    }
}

export function requireRole(...roles) {
    requireAuth();

    const perfil = sessionStorage.getItem("perfil");

    if (!roles.includes(perfil)) {
        window.location.href = "/index.html";
    }
}
```

Exemplo:

```javascript
requireRole("ADMIN");
```

> O guard melhora a experiência do usuário, mas **não substitui** a autorização do Spring Security.

---

## 8. Cadastro de cliente

### Página

```text
cadastro.html
```

### Endpoint

```text
POST /api/auth/register
```

Campos:

- nome;
- CPF;
- e-mail;
- telefone;
- senha.

Payload:

```json
{
  "nome": "Maria Silva",
  "cpf": "12345678901",
  "email": "maria@email.com",
  "telefone": "27999999999",
  "senha": "Senha@123"
}
```

Após sucesso:

1. mostrar mensagem de cadastro;
2. redirecionar para login.

---

## 9. Área do cliente

### 9.1 Dashboard

Exibir:

- nome do cliente;
- atalhos;
- quantidade de chamados;
- chamados recentes.

### 9.2 Meu perfil

Endpoint:

```text
GET /api/clientes/me
```

### 9.3 Novo chamado

Endpoint:

```text
POST /api/chamados
```

Payload:

```json
{
  "titulo": "Problema no atendimento",
  "descricao": "Descrição detalhada do problema.",
  "prioridade": "MEDIA"
}
```

O front-end **não deve enviar `clienteId` quando o usuário autenticado é CLIENTE**.

### 9.4 Meus chamados

Endpoint:

```text
GET /api/chamados
```

Exibir:

- protocolo;
- título;
- status;
- prioridade;
- data de abertura;
- atendente.

---

## 10. Detalhe do chamado

Página:

```text
pages/chamado/detalhe.html?id=123
```

Endpoint:

```text
GET /api/chamados/{id}
```

Exibir:

- protocolo;
- título;
- descrição;
- status;
- prioridade;
- cliente;
- atendente;
- data de abertura;
- data de encerramento;
- comentários.

---

## 11. Comentários

Endpoint:

```text
POST /api/chamados/{id}/comentarios
```

Payload:

```json
{
  "texto": "Comentário do atendimento."
}
```

### Regra de segurança contra XSS

Nunca utilizar:

```javascript
element.innerHTML = comentario.texto;
```

Utilizar:

```javascript
element.textContent = comentario.texto;
```

Isso evita interpretar conteúdo informado pelo usuário como HTML executável.

---

## 12. Histórico

Endpoint:

```text
GET /api/chamados/{id}/historico
```

Apresentar como timeline:

```text
Chamado aberto
    ↓
Comentário adicionado
    ↓
Atendente atribuído
    ↓
Status alterado
    ↓
Resolvido
    ↓
Encerrado
```

---

## 13. Área do atendente

O atendente poderá:

- consultar clientes;
- consultar chamados;
- abrir chamado em nome de cliente;
- comentar;
- assumir/receber atendimento;
- alterar status;
- consultar histórico;
- consultar relatório, conforme autorização da API.

### Consultar clientes

```text
GET /api/clientes
GET /api/clientes?nome={nome}
GET /api/clientes/cpf/{cpf}
```

### Listar chamados

```text
GET /api/chamados
```

### Abrir chamado para cliente

```text
POST /api/chamados
```

Payload:

```json
{
  "titulo": "Solicitação",
  "descricao": "Descrição",
  "prioridade": "ALTA",
  "clienteId": 10
}
```

### Atribuir atendente

```text
PATCH /api/chamados/{chamadoId}/atendente/{atendenteId}
```

### Alterar status

```text
PATCH /api/chamados/{id}/status
```

Payload:

```json
{
  "status": "EM_ATENDIMENTO"
}
```

---

## 14. Área administrativa

O administrador poderá:

- consultar clientes;
- editar clientes;
- inativar clientes;
- cadastrar atendentes;
- listar atendentes;
- acompanhar todos os chamados;
- atribuir atendentes;
- alterar status;
- consultar relatórios.

### Clientes

```text
GET   /api/clientes
GET   /api/clientes/{id}
GET   /api/clientes/cpf/{cpf}
PUT   /api/clientes/{id}
PATCH /api/clientes/{id}/inativar
```

### Atendentes

```text
POST /api/atendentes
GET  /api/atendentes
GET  /api/atendentes/{id}
```

### Relatório

```text
GET /api/relatorios/chamados
```

---

## 15. Estados dos chamados

Estados atuais:

```text
ABERTO
EM_ATENDIMENTO
AGUARDANDO_CLIENTE
RESOLVIDO
ENCERRADO
CANCELADO
```

O front-end deve apresentar rótulos amigáveis:

```text
ABERTO             → Aberto
EM_ATENDIMENTO     → Em atendimento
AGUARDANDO_CLIENTE → Aguardando cliente
RESOLVIDO          → Resolvido
ENCERRADO          → Encerrado
CANCELADO          → Cancelado
```

A API é responsável por aceitar ou rejeitar a transição de status.

---

## 16. Tratamento de erros

### 400

Erro de validação ou regra de negócio.

Mostrar mensagem próxima ao formulário ou em alerta.

### 401

Usuário não autenticado, token inválido ou sessão não permitida.

Ação:

```javascript
sessionStorage.clear();
window.location.href = "/index.html";
```

### 403

Usuário autenticado, mas sem permissão.

Mostrar:

```text
Você não possui permissão para executar esta operação.
```

### 404

Recurso inexistente.

### 500

Erro interno.

Nunca mostrar stack trace ao usuário.

---

## 17. Componentes visuais recomendados

Criar componentes reutilizáveis para:

- navbar;
- sidebar;
- modal;
- tabelas;
- cards;
- badge de status;
- badge de prioridade;
- loading;
- confirmação;
- mensagem de erro;
- mensagem de sucesso;
- paginação, caso seja adicionada posteriormente.

---

## 18. Organização por perfil

### Cliente

```text
Login
 ↓
Dashboard
 ↓
Meus chamados
 ↓
Novo chamado
 ↓
Detalhes
 ↓
Comentários
 ↓
Histórico
```

### Atendente

```text
Login
 ↓
Dashboard
 ↓
Fila de chamados
 ↓
Cliente
 ↓
Atendimento
 ↓
Comentário / Status
 ↓
Histórico
```

### Administrador

```text
Login
 ↓
Dashboard
 ├── Clientes
 ├── Atendentes
 ├── Chamados
 └── Relatórios
```

---

## 19. Ordem recomendada de implementação

### Fase 1 — Fundação

1. estrutura de diretórios;
2. `config.js`;
3. `api.js`;
4. login;
5. armazenamento de sessão;
6. guards;
7. logout.

### Fase 2 — Cliente

8. cadastro;
9. perfil;
10. novo chamado;
11. listagem de chamados;
12. detalhe;
13. comentário;
14. histórico.

### Fase 3 — Atendente

15. dashboard;
16. consulta de clientes;
17. fila de chamados;
18. abertura em nome de cliente;
19. atribuição;
20. alteração de status.

### Fase 4 — Administrador

21. gestão de clientes;
22. cadastro/listagem de atendentes;
23. acompanhamento de chamados;
24. relatório.

### Fase 5 — Qualidade e segurança

25. validações;
26. loaders;
27. mensagens;
28. tratamento de erro;
29. teste de autorização;
30. teste de XSS;
31. revisão responsiva;
32. validação final com a API.

---

## 20. Checklist de segurança

Antes da entrega:

- [ ] senha nunca armazenada pelo front-end;
- [ ] JWT não incluído em URL;
- [ ] nenhuma página chama banco diretamente;
- [ ] comentários renderizados com `textContent`;
- [ ] CPF não exposto além do necessário;
- [ ] páginas protegidas possuem guard;
- [ ] back-end continua validando todas as permissões;
- [ ] 401 encerra sessão;
- [ ] 403 não é tratado como erro interno;
- [ ] erros 500 não exibem detalhes técnicos;
- [ ] nenhuma credencial real é versionada no Git.

---

## 21. Critério de pronto

O front-end poderá ser considerado funcional quando os três fluxos abaixo estiverem completos.

### CLIENTE

```text
Cadastro
→ Login
→ Abrir chamado
→ Consultar chamado
→ Comentar
→ Consultar histórico
```

### ATENDENTE

```text
Login
→ Consultar cliente
→ Consultar chamado
→ Assumir atendimento
→ Comentar
→ Alterar status
→ Resolver
```

### ADMIN

```text
Login
→ Gerenciar cliente
→ Cadastrar atendente
→ Consultar chamados
→ Atribuir atendente
→ Consultar relatório
```

---

## 22. Regra para evolução futura

Não duplicar regras de negócio importantes no JavaScript.

Exemplos de regras que devem permanecer no back-end:

- autorização por perfil;
- vínculo do cliente ao chamado;
- transições válidas de status;
- geração de protocolo;
- bloqueio de ações em chamados encerrados;
- validação de duplicidade;
- inativação;
- segurança de credenciais.

O front-end apenas apresenta essas regras e melhora a experiência de uso.


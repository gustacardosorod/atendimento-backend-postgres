# Sistema de Gestão de Atendimento ao Cliente — Back-end

API REST desenvolvida em **Java 21 + Spring Boot + PostgreSQL** para cadastro e acompanhamento de solicitações de atendimento.

## Stack

- Java 21
- Spring Boot 3
- Spring Web
- Spring Data JPA / Hibernate
- PostgreSQL
- Flyway
- Spring Security + JWT
- Bean Validation
- Swagger/OpenAPI
- Maven
- JUnit 5
- Mockito
- MockMvc
- JaCoCo
- Docker / Docker Compose

## Arquitetura

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
PostgreSQL
```

O projeto também possui DTOs, tratamento global de exceções, autenticação JWT e autorização por perfil.

## Perfis

```text
ADMIN
ATENDENTE
CLIENTE
```

## Requisitos locais

- Java 21
- Maven 3.9+
- Docker Desktop

## Banco de dados

O PostgreSQL do projeto roda via Docker.

Configuração adotada no ambiente local:

```text
Host: 127.0.0.1
Porta externa: 5433
Porta do container: 5432
Banco: atendimento_db
Usuário: postgres
```

Se o seu `docker-compose.yml` ainda estiver utilizando `5432:5432`, ajuste para:

```yaml
ports:
  - "5433:5432"
```

## Subir o PostgreSQL

```powershell
docker compose up -d
```

Validar:

```powershell
docker compose ps
```

## Variáveis para desenvolvimento local

```powershell
$env:DB_URL="jdbc:postgresql://127.0.0.1:5433/atendimento_db"
$env:DB_USER="postgres"
$env:DB_PASSWORD="postgres"

$env:JWT_SECRET="SUBSTITUA_POR_UMA_CHAVE_LOCAL_SEGURA"

$env:BOOTSTRAP_ADMIN_NAME="Administrador"
$env:BOOTSTRAP_ADMIN_EMAIL="admin@atendimento.local"
$env:BOOTSTRAP_ADMIN_PASSWORD="Admin@123456"
```

> Não versione senhas, tokens ou chaves reais.

## Executar testes

```powershell
mvn clean test
```

Relatório JaCoCo:

```text
target/site/jacoco/index.html
```

## Executar a aplicação

```powershell
mvn spring-boot:run
```

Swagger:

```text
http://localhost:8080/swagger-ui/index.html
```

OpenAPI:

```text
http://localhost:8080/v3/api-docs
```

## Endpoints principais

### Autenticação

```text
POST /api/auth/register
POST /api/auth/login
```

### Clientes

```text
GET   /api/clientes/me
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

### Chamados

```text
POST  /api/chamados
GET   /api/chamados
GET   /api/chamados/{id}
GET   /api/chamados/protocolo/{protocolo}
GET   /api/chamados/cliente/{clienteId}
GET   /api/chamados/cliente/cpf/{cpf}
PATCH /api/chamados/{id}/status
PATCH /api/chamados/{chamadoId}/atendente/{atendenteId}
POST  /api/chamados/{id}/comentarios
GET   /api/chamados/{id}/historico
```

### Relatórios

```text
GET /api/relatorios/chamados
```

## Teste integrado

O projeto pode utilizar o script:

```text
testar-api-completa.ps1
```

Exemplo:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\testar-api-completa.ps1
```

## Documentação

- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md)
- [`docs/FRONTEND_GUIDE.md`](docs/FRONTEND_GUIDE.md)

## Desenvolvimento futuro do front-end

A implementação do front-end deve consumir exclusivamente a API REST e seguir o contrato documentado em:

```text
docs/FRONTEND_GUIDE.md
```

A proposta inicial utiliza HTML5, CSS3 e JavaScript ES6 Modules para manter o projeto simples e aderente ao escopo acadêmico.

## Observação acadêmica

O plano original da disciplina cita MySQL entre os requisitos mínimos. Esta implementação foi adaptada para PostgreSQL por decisão do projeto.

# Arquitetura

```text
HTTP/JSON -> Controller -> Service -> Repository -> PostgreSQL
```

- `controller`: endpoints REST.
- `service`: regras de negócio e transações.
- `repository`: persistência Spring Data JPA.
- `entity`: modelo relacional.
- `dto`: contratos da API sem expor entidades diretamente.
- `security`: JWT, BCrypt, roles e usuário autenticado.
- `exception`: respostas de erro controladas.

## Regras relevantes
- Perfis: ADMIN, ATENDENTE e CLIENTE.
- CPF é mascarado nas respostas de cliente.
- Cliente só acessa os próprios chamados.
- Senhas são armazenadas com BCrypt.
- SQL manual concatenado não é utilizado.
- CORS e segredos são configurados externamente.
- Transições de status são validadas no Service.

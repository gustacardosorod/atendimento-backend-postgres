CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha VARCHAR(100) NOT NULL,
    perfil VARCHAR(20) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_usuario_email UNIQUE (email),
    CONSTRAINT ck_usuario_perfil CHECK (perfil IN ('ADMIN', 'ATENDENTE', 'CLIENTE'))
);
CREATE TABLE clientes (
    id BIGSERIAL PRIMARY KEY,
    cpf VARCHAR(11) NOT NULL,
    telefone VARCHAR(20),
    usuario_id BIGINT NOT NULL,
    CONSTRAINT uk_cliente_cpf UNIQUE (cpf),
    CONSTRAINT uk_cliente_usuario UNIQUE (usuario_id),
    CONSTRAINT fk_cliente_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE atendentes (
    id BIGSERIAL PRIMARY KEY,
    matricula VARCHAR(30) NOT NULL,
    usuario_id BIGINT NOT NULL,
    CONSTRAINT uk_atendente_matricula UNIQUE (matricula),
    CONSTRAINT uk_atendente_usuario UNIQUE (usuario_id),
    CONSTRAINT fk_atendente_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE chamados (
    id BIGSERIAL PRIMARY KEY,
    protocolo VARCHAR(40) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    prioridade VARCHAR(20) NOT NULL,
    cliente_id BIGINT NOT NULL,
    atendente_id BIGINT,
    data_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_encerramento TIMESTAMP,
    CONSTRAINT uk_chamado_protocolo UNIQUE (protocolo),
    CONSTRAINT fk_chamado_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT fk_chamado_atendente FOREIGN KEY (atendente_id) REFERENCES atendentes(id),
    CONSTRAINT ck_chamado_status CHECK (status IN ('ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE', 'RESOLVIDO', 'ENCERRADO', 'CANCELADO')),
    CONSTRAINT ck_chamado_prioridade CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA'))
);
CREATE INDEX idx_chamado_status ON chamados(status);
CREATE INDEX idx_chamado_cliente ON chamados(cliente_id);
CREATE INDEX idx_chamado_atendente ON chamados(atendente_id);
CREATE INDEX idx_chamado_data_abertura ON chamados(data_abertura);
CREATE TABLE comentarios (
    id BIGSERIAL PRIMARY KEY,
    chamado_id BIGINT NOT NULL,
    autor_id BIGINT NOT NULL,
    texto TEXT NOT NULL,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comentario_chamado FOREIGN KEY (chamado_id) REFERENCES chamados(id),
    CONSTRAINT fk_comentario_autor FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);
CREATE INDEX idx_comentario_chamado ON comentarios(chamado_id);
CREATE TABLE historico_chamados (
    id BIGSERIAL PRIMARY KEY,
    chamado_id BIGINT NOT NULL,
    usuario_id BIGINT,
    acao VARCHAR(50) NOT NULL,
    descricao VARCHAR(500) NOT NULL,
    data_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historico_chamado FOREIGN KEY (chamado_id) REFERENCES chamados(id),
    CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE INDEX idx_historico_chamado ON historico_chamados(chamado_id);
CREATE INDEX idx_historico_data ON historico_chamados(data_evento);

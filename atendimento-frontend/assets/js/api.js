/**
 * api.js — cliente HTTP único do front-end.
 *
 * Responsabilidades:
 *  - executar GET, POST, PUT e PATCH contra a API_URL;
 *  - anexar o JWT no header Authorization (nunca na URL);
 *  - converter JSON de/para a API;
 *  - traduzir 400/401/403/404/409/500 em ApiError com mensagem segura;
 *  - encerrar a sessão quando o token deixa de ser válido (401).
 */
import { API_URL, urlApp, ROTAS } from "./config.js";

export const MENSAGEM_403 = "Você não possui permissão para executar esta operação.";

const MENSAGENS_PADRAO = Object.freeze({
    0: "Não foi possível conectar ao servidor. Verifique se a API está em execução em localhost:8080.",
    400: "Existem dados inválidos na requisição.",
    401: "Sua sessão expirou. Entre novamente.",
    403: MENSAGEM_403,
    404: "Registro não encontrado.",
    409: "Operação não permitida devido a uma restrição de dados.",
    500: "Erro interno do servidor. Tente novamente em instantes."
});

/** Erro padronizado da aplicação. `campos` traz os erros de validação por campo (400). */
export class ApiError extends Error {
    constructor(status, mensagem, campos = null) {
        super(mensagem);
        this.name = "ApiError";
        this.status = status;
        this.campos = campos;
    }
}

/**
 * Executa uma requisição à API.
 * @param {string} path    caminho a partir de /api (ex.: "/chamados")
 * @param {object} opcoes  { method, body, publico } — `publico` para /auth/* (não envia token
 *                         e não trata 401 como sessão expirada, e sim como credencial inválida)
 */
export async function api(path, { method = "GET", body, publico = false } = {}) {
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const token = sessionStorage.getItem("token");
    if (token && !publico) headers.Authorization = `Bearer ${token}`;

    let resposta;
    try {
        resposta = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
    } catch {
        // Falha de rede ou bloqueio de CORS: o navegador não expõe detalhes.
        throw new ApiError(0, MENSAGENS_PADRAO[0]);
    }

    const corpo = await lerCorpo(resposta);
    if (resposta.ok) return corpo;
    throw criarErro(resposta.status, corpo, publico);
}

async function lerCorpo(resposta) {
    if (resposta.status === 204) return null;
    const tipo = resposta.headers.get("content-type") || "";
    if (!tipo.includes("application/json")) return null;
    try {
        return await resposta.json();
    } catch {
        return null;
    }
}

function criarErro(status, corpo, publico) {
    if (status === 401 && !publico) {
        // Token ausente, inválido ou expirado: limpa a sessão e volta ao login.
        sessionStorage.clear();
        window.location.replace(`${urlApp(ROTAS.login)}?sessao=expirada`);
        return new ApiError(401, MENSAGENS_PADRAO[401]);
    }
    if (status === 401) {
        return new ApiError(401, corpo?.mensagem || "E-mail ou senha inválidos.");
    }
    if (status === 403) {
        // 403 não é erro interno: é falta de permissão para o perfil logado.
        return new ApiError(403, MENSAGEM_403);
    }
    if (status >= 500) {
        // Nunca repassa detalhes técnicos do servidor.
        return new ApiError(status, MENSAGENS_PADRAO[500]);
    }
    const mensagem = corpo?.mensagem || MENSAGENS_PADRAO[status]
        || `Não foi possível concluir a operação (HTTP ${status}).`;
    return new ApiError(status, mensagem, corpo?.campos ?? null);
}

/** Atalhos por método HTTP. */
export const http = {
    get: (path) => api(path),
    post: (path, body) => api(path, { method: "POST", body }),
    put: (path, body) => api(path, { method: "PUT", body }),
    patch: (path, body) => api(path, { method: "PATCH", body })
};

/** Codifica um segmento de caminho (CPF, protocolo etc.). */
export const seg = (valor) => encodeURIComponent(String(valor));

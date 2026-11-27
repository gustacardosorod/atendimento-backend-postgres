/**
 * auth.js — login, cadastro, sessão e logout.
 * A sessão fica em sessionStorage (some ao fechar a aba). A senha NUNCA é armazenada.
 */
import { api } from "./api.js";
import { urlApp, ROTAS } from "./config.js";

const CHAVES_SESSAO = ["token", "usuarioId", "nome", "email", "perfil"];

export async function login(email, senha) {
    const resposta = await api("/auth/login", {
        method: "POST",
        body: { email, senha },
        publico: true
    });
    salvarSessao(resposta);
    return resposta;
}

/** Cadastro público de cliente (POST /api/auth/register). */
export function cadastrarCliente(dados) {
    return api("/auth/register", { method: "POST", body: dados, publico: true });
}

function salvarSessao(resposta) {
    sessionStorage.clear();
    CHAVES_SESSAO.forEach((chave) => {
        if (resposta[chave] != null) sessionStorage.setItem(chave, String(resposta[chave]));
    });
}

export function getSessao() {
    return {
        token: sessionStorage.getItem("token"),
        usuarioId: Number(sessionStorage.getItem("usuarioId")) || null,
        nome: sessionStorage.getItem("nome") || "",
        email: sessionStorage.getItem("email") || "",
        perfil: sessionStorage.getItem("perfil") || ""
    };
}

export function estaAutenticado() {
    return Boolean(sessionStorage.getItem("token"));
}

/** URL do painel inicial de cada perfil. */
export function rotaInicial(perfil) {
    return urlApp(ROTAS[perfil] ?? ROTAS.login);
}

/** Limpa toda a sessão e volta ao login. */
export function logout() {
    sessionStorage.clear();
    window.location.replace(urlApp(ROTAS.login));
}

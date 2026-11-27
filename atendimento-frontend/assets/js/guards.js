/**
 * guards.js — proteção de páginas no navegador.
 * Melhora a experiência do usuário, mas NÃO substitui a autorização
 * do Spring Security: toda chamada continua sendo validada pela API.
 */
import { urlApp, ROTAS } from "./config.js";

export function requireAuth() {
    if (!sessionStorage.getItem("token")) {
        window.location.replace(urlApp(ROTAS.login));
        return false;
    }
    return true;
}

export function requireRole(...roles) {
    if (!requireAuth()) return false;
    const perfil = sessionStorage.getItem("perfil");
    if (!roles.includes(perfil)) {
        // O login redireciona o usuário autenticado ao painel do próprio perfil.
        window.location.replace(urlApp(ROTAS.login));
        return false;
    }
    return true;
}

/**
 * Inicializa a página atual a partir de um mapa { "data-page": { perfis, iniciar } }.
 * O atributo <body data-page="..."> identifica a página; o guard roda antes de qualquer render.
 */
export function iniciarPagina(mapa) {
    const pagina = document.body.dataset.page;
    const definicao = mapa[pagina];
    if (!definicao) return;
    if (!requireRole(...definicao.perfis)) return;
    definicao.iniciar();
}

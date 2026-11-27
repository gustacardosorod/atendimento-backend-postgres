/**
 * config.js — configuração central do front-end.
 * A URL da API é definida SOMENTE aqui; nenhuma página deve repeti-la.
 */

export const API_URL = "http://localhost:8080/api";

/**
 * Raiz do front-end, calculada a partir da localização deste arquivo
 * (assets/js/config.js → ../../). Assim os redirecionamentos funcionam
 * mesmo que o Live Server seja aberto em uma pasta acima de atendimento-frontend/.
 */
const APP_BASE = new URL("../../", import.meta.url);

/** Rotas de navegação usadas por auth/guards/layout. */
export const ROTAS = Object.freeze({
    login: "index.html",
    cadastro: "cadastro.html",
    CLIENTE: "pages/cliente/dashboard.html",
    ATENDENTE: "pages/atendente/dashboard.html",
    ADMIN: "pages/admin/dashboard.html",
    detalheChamado: "pages/chamado/detalhe.html"
});

/** Converte um caminho relativo à raiz do front-end em URL absoluta. */
export function urlApp(caminho) {
    return new URL(caminho, APP_BASE).href;
}

/** URL do detalhe de um chamado (o ID vai na query string; o JWT nunca). */
export function urlChamado(id) {
    const url = new URL(ROTAS.detalheChamado, APP_BASE);
    url.searchParams.set("id", String(id));
    return url.href;
}

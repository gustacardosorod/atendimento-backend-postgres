/**
 * atendente.js — área do ATENDENTE (e telas compartilhadas com o ADMIN).
 *  - atendente-dashboard   GET /api/relatorios/chamados + GET /api/chamados
 *  - fila-chamados         GET /api/chamados, PATCH .../atendente/{id}, PATCH .../status,
 *                          POST /api/chamados (com clienteId)   [ATENDENTE e ADMIN]
 *  - atendente-clientes    GET /api/clientes?nome=, GET /api/clientes/cpf/{cpf},
 *                          GET /api/chamados/cliente/{id}
 */
import { http, seg } from "../api.js";
import { getSessao } from "../auth.js";
import { iniciarPagina } from "../guards.js";
import {
    el, STATUS, montarLayout, preencherSaudacao, indicador, contarPor, parametro, criarTabela, celulaDupla,
    mascararCPF, formatarTelefone, formatarData, somenteDigitos, renderCarregando, renderErro, renderVazio,
    limparErrosCampos, mostrarErrosCampos, setLoading
} from "../ui.js";
import {
    tabelaChamados, prepararFiltros, filtrarChamados, ordenarPorUrgencia, STATUS_FINALIZADOS, botaoLinha,
    assumirChamado, modalAlterarStatus, modalAtribuirAtendente, modalNovoChamadoEquipe, modalChamadosDoCliente,
    getMeuAtendenteId, descobrirMeuAtendenteId, modalInformarAtendenteId
} from "./chamado.js";

/** O chamado está com o atendente logado? (pelo ID salvo ou pelo nome devolvido pela API) */
function souResponsavel(chamado) {
    if (chamado.atendenteId == null) return false;
    const meuId = getMeuAtendenteId();
    return meuId ? chamado.atendenteId === meuId : chamado.atendente === getSessao().nome;
}

/* ====================================================================== *
 * Painel do atendente
 * ====================================================================== */
function iniciarDashboard() {
    montarLayout({ ativo: "dashboard", trilha: ["Painel"] });
    preencherSaudacao();
    document.getElementById("btn-atualizar").addEventListener("click", carregarDashboard);
    carregarDashboard();
}

async function carregarDashboard() {
    const indicadores = document.getElementById("indicadores");
    const areaSem = document.getElementById("sem-atendente");
    const areaMeus = document.getElementById("meus");
    renderCarregando(areaSem, 4);
    renderCarregando(areaMeus, 4);

    const [relatorio, lista] = await Promise.allSettled([http.get("/relatorios/chamados"), http.get("/chamados")]);

    if (lista.status === "rejected") {
        renderErro(areaSem, lista.reason, carregarDashboard);
        renderErro(areaMeus, lista.reason, carregarDashboard);
        return;
    }
    const chamados = lista.value;
    descobrirMeuAtendenteId(chamados);

    // Contadores vêm do relatório da API; se ele falhar, usa a contagem da lista.
    const porStatus = relatorio.status === "fulfilled" ? relatorio.value.porStatus : contarPor(chamados, "status");
    indicadores.replaceChildren(...Object.entries(STATUS).map(([valor, rotulo]) => indicador({
        rotulo, valor: porStatus[valor] ?? 0, marcador: valor.toLowerCase(),
        href: `chamados.html?status=${valor}`
    })));

    const ativos = chamados.filter((c) => !STATUS_FINALIZADOS.includes(c.status));
    const semAtendente = ordenarPorUrgencia(ativos.filter((c) => c.atendenteId == null));
    const meus = ordenarPorUrgencia(ativos.filter(souResponsavel));

    const listar = (area, itens, vazio, opcoes) => {
        area.removeAttribute("aria-busy");
        if (!itens.length) renderVazio(area, vazio);
        else area.replaceChildren(tabelaChamados(itens.slice(0, 6), opcoes));
    };

    listar(areaSem, semAtendente, { titulo: "Fila em dia", texto: "Não há chamados ativos sem atendente." }, {
        mostrarCliente: true, mostrarAtendente: false, mostrarStatus: false,
        acoes: (c) => botaoLinha("Assumir", "atribuir", () => assumirChamado(c), carregarDashboard)
    });
    listar(areaMeus, meus, { titulo: "Nenhum chamado com você", texto: "Assuma um chamado da fila para começar." }, {
        mostrarCliente: true, mostrarAtendente: false
    });

    renderIdentificacao();
}

function renderIdentificacao() {
    const area = document.getElementById("identificacao");
    const id = getMeuAtendenteId();
    const botao = el("button", { type: "button", class: "btn btn-fantasma btn-sm" }, id ? "Alterar" : "Informar ID");
    botao.addEventListener("click", async () => {
        if (await modalInformarAtendenteId()) carregarDashboard();
    });
    area.replaceChildren(
        el("span", {}, id
            ? ["Seu ID de atendente: ", el("strong", { class: "mono", text: String(id) })]
            : "ID de atendente ainda não identificado nesta sessão."),
        botao);
}

/* ====================================================================== *
 * Fila de chamados (ATENDENTE e ADMIN)
 * ====================================================================== */
function iniciarFila() {
    const { perfil } = getSessao();
    const ehAdmin = perfil === "ADMIN";
    montarLayout({ ativo: "chamados", trilha: [ehAdmin ? "Chamados" : "Fila de chamados"] });

    const form = document.getElementById("filtros");
    const lista = document.getElementById("lista");
    const resumo = document.getElementById("resumo");
    const areaVisoes = document.getElementById("visoes");

    const VISOES = {
        "todos": { rotulo: "Todos", filtro: () => true },
        "sem-atendente": { rotulo: "Sem atendente", filtro: (c) => c.atendenteId == null && !STATUS_FINALIZADOS.includes(c.status) },
        ...(ehAdmin ? {} : { "meus": { rotulo: "Meus", filtro: souResponsavel } })
    };
    let visao = VISOES[parametro("visao")] ? parametro("visao") : "todos";
    let chamados = [];

    const substituir = (atualizado) => {
        chamados = chamados.map((c) => (c.id === atualizado.id ? atualizado : c));
        render();
    };

    const acoes = (c) => el("div", { class: "acoes-linha" },
        ehAdmin
            ? botaoLinha("Atribuir", "atribuir", () => modalAtribuirAtendente(c), substituir)
            : (souResponsavel(c) ? null : botaoLinha("Assumir", "atribuir", () => assumirChamado(c), substituir)),
        botaoLinha("Status", "status", () => modalAlterarStatus(c), substituir));

    const renderVisoes = () => {
        areaVisoes.replaceChildren(...Object.entries(VISOES).map(([chave, def]) => {
            const botao = el("button", { type: "button", "aria-pressed": String(chave === visao) },
                def.rotulo, el("span", { class: "qtd", text: String(chamados.filter(def.filtro).length) }));
            botao.addEventListener("click", () => {
                visao = chave;
                const url = new URL(window.location.href);
                url.searchParams.set("visao", chave);
                window.history.replaceState(null, "", url);
                render();
            });
            return botao;
        }));
    };

    function render() {
        renderVisoes();
        const daVisao = chamados.filter(VISOES[visao].filtro);
        const filtrados = filtrarChamados(daVisao, form);
        resumo.textContent = `${filtrados.length} de ${chamados.length} chamado(s)`;
        lista.removeAttribute("aria-busy");
        if (!filtrados.length) {
            renderVazio(lista, { titulo: "Nenhum chamado encontrado", texto: "Altere a visão ou os filtros para ver outros chamados." });
            return;
        }
        lista.replaceChildren(tabelaChamados(filtrados, { mostrarCliente: true, acoes }));
    }

    prepararFiltros(form, render);
    const statusInicial = parametro("status");
    if (statusInicial && STATUS[statusInicial]) form.status.value = statusInicial;

    const carregar = async () => {
        renderCarregando(lista, 8);
        resumo.textContent = "Carregando…";
        try {
            chamados = await http.get("/chamados");
            if (!ehAdmin) descobrirMeuAtendenteId(chamados);
            render();
        } catch (erro) {
            resumo.textContent = "";
            renderErro(lista, erro, carregar);
        }
    };

    document.getElementById("btn-atualizar").addEventListener("click", carregar);
    document.getElementById("btn-novo").addEventListener("click", async () => {
        const criado = await modalNovoChamadoEquipe();
        if (criado) {
            chamados = [criado, ...chamados];
            render();
        }
    });
    carregar();
}

/* ====================================================================== *
 * Consulta de clientes (reutilizada pelo ADMIN com ações extras)
 * ====================================================================== */

/**
 * @param {{ acoesExtras?: (cliente, ctx: { atualizar(c) }) => Node[] }} opcoes
 */
export function iniciarConsultaClientes({ acoesExtras } = {}) {
    const form = document.getElementById("form-busca");
    const termo = document.getElementById("termo");
    const rotulo = document.getElementById("rotulo-termo");
    const lista = document.getElementById("lista");
    const resumo = document.getElementById("resumo");
    let modo = "nome";
    let clientes = [];

    const definirModo = (novo) => {
        modo = novo;
        document.querySelectorAll("#modos button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === modo)));
        rotulo.textContent = modo === "cpf" ? "CPF do cliente" : "Nome do cliente";
        termo.placeholder = modo === "cpf" ? "000.000.000-00" : "Parte do nome";
        termo.inputMode = modo === "cpf" ? "numeric" : "text";
        termo.classList.toggle("mono", modo === "cpf");
        termo.value = "";
        limparErrosCampos(form);
        termo.focus();
    };
    document.querySelectorAll("#modos button").forEach((b) => b.addEventListener("click", () => definirModo(b.dataset.modo)));

    // Máscara de CPF somente no modo CPF.
    termo.addEventListener("input", () => {
        if (modo !== "cpf") return;
        const d = somenteDigitos(termo.value).slice(0, 11);
        termo.value = d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    });

    const atualizar = (cliente) => {
        clientes = clientes.map((c) => (c.id === cliente.id ? cliente : c));
        render();
    };

    const colunas = [
        { titulo: "Cliente", render: (c) => celulaDupla(c.nome, c.email) },
        { titulo: "CPF", classe: "col-estreita", render: (c) => el("span", { class: "mono", text: mascararCPF(c.cpf) }) },
        { titulo: "Telefone", classe: "col-estreita", render: (c) => el("span", { class: "mono", text: formatarTelefone(c.telefone) }) },
        { titulo: "Situação", render: (c) => el("span", { class: `badge ${c.ativo ? "badge-ativo" : "badge-inativo"}`, text: c.ativo ? "Ativo" : "Inativo" }) },
        { titulo: "Cadastro", classe: "col-estreita", render: (c) => el("span", { class: "mono", text: formatarData(c.dataCriacao, { hora: false }) }) },
        {
            titulo: "", classe: "col-acoes",
            render: (c) => {
                const verChamados = el("button", { type: "button", class: "btn btn-fantasma btn-sm", onClick: () => modalChamadosDoCliente(c) }, "Chamados");
                const abrir = el("button", { type: "button", class: "btn btn-secundario btn-sm", onClick: () => modalNovoChamadoEquipe(c) }, "Abrir chamado");
                return el("div", { class: "acoes-linha" }, verChamados, abrir, ...(acoesExtras?.(c, { atualizar }) ?? []));
            }
        }
    ];

    function render() {
        lista.removeAttribute("aria-busy");
        resumo.textContent = `${clientes.length} cliente(s) encontrado(s)`;
        if (!clientes.length) {
            renderVazio(lista, { titulo: "Nenhum cliente encontrado", texto: "Confira o termo pesquisado ou limpe a busca para listar todos." });
            return;
        }
        lista.replaceChildren(criarTabela({ colunas, itens: clientes, legenda: "Clientes" }));
    }

    async function buscar() {
        limparErrosCampos(form);
        const valor = termo.value.trim();
        let requisicao;
        if (modo === "cpf") {
            const cpf = somenteDigitos(valor);
            if (cpf.length !== 11) {
                mostrarErrosCampos(form, { termo: "Informe os 11 números do CPF." });
                return;
            }
            requisicao = http.get(`/clientes/cpf/${seg(cpf)}`).then((c) => [c]).catch((erro) => {
                if (erro.status === 404) return [];
                throw erro;
            });
        } else {
            requisicao = http.get(valor ? `/clientes?nome=${encodeURIComponent(valor)}` : "/clientes");
        }

        const botao = form.querySelector("button[type=submit]");
        setLoading(botao, true, "Buscando…");
        renderCarregando(lista, 6);
        resumo.textContent = "Buscando…";
        try {
            clientes = await requisicao;
            render();
        } catch (erro) {
            resumo.textContent = "";
            renderErro(lista, erro, buscar);
        } finally {
            setLoading(botao, false);
        }
    }

    form.addEventListener("submit", (e) => { e.preventDefault(); buscar(); });
    document.getElementById("btn-limpar").addEventListener("click", () => { definirModo("nome"); buscar(); });
    buscar();
}

function iniciarClientes() {
    montarLayout({ ativo: "clientes", trilha: ["Clientes"] });
    iniciarConsultaClientes();
}

iniciarPagina({
    "atendente-dashboard": { perfis: ["ATENDENTE"], iniciar: iniciarDashboard },
    "fila-chamados": { perfis: ["ATENDENTE", "ADMIN"], iniciar: iniciarFila },
    "atendente-clientes": { perfis: ["ATENDENTE"], iniciar: iniciarClientes }
});

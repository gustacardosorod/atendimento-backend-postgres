/**
 * chamado.js — domínio "chamado" no front-end.
 *
 * 1) Página pages/chamado/detalhe.html (data-page="detalhe-chamado"):
 *    GET /api/chamados/{id}, GET /api/chamados/{id}/historico, POST /api/chamados/{id}/comentarios
 * 2) Componentes reutilizados pelas áreas do cliente, do atendente e do admin:
 *    tabela de chamados, filtros, abrir chamado em nome de cliente, assumir,
 *    atribuir atendente e alterar status.
 *
 * Nenhuma regra de negócio é decidida aqui: transições de status, vínculo do cliente
 * e bloqueio de chamados encerrados são validados pela API; o front exibe o resultado.
 */
import { http, seg } from "../api.js";
import { getSessao } from "../auth.js";
import { urlApp, urlChamado } from "../config.js";
import { iniciarPagina } from "../guards.js";
import {
    el, icone, STATUS, PRIORIDADES, PERFIS, formatarData, tempoRelativo, mascararCPF, somenteDigitos,
    aplicarMascara, renderBadgeStatus, renderBadgePrioridade, criarTabela, celulaDupla, toast, toastErro,
    setLoading, renderCarregando, renderErro, renderVazio, abrirModal, campo, campoPrioridade,
    limparErrosCampos, mostrarErrosCampos, tratarErroFormulario, ligarContador, montarLayout,
    parametro, iniciais, humanizarEnums
} from "../ui.js";

/* ====================================================================== *
 * Componentes compartilhados
 * ====================================================================== */

/** Tabela padrão de chamados. `acoes(chamado)` devolve os botões da linha. */
export function tabelaChamados(chamados, { mostrarCliente = false, mostrarAtendente = true, mostrarStatus = true, acoes } = {}) {
    const colunas = [
        {
            titulo: "Protocolo", classe: "col-estreita",
            render: (c) => el("a", { class: "link-protocolo", href: urlChamado(c.id) }, c.protocolo)
        },
        {
            titulo: mostrarCliente ? "Título / cliente" : "Título",
            render: (c) => celulaDupla(
                el("span", { class: "celula-principal texto-titulo-chamado", title: c.titulo, text: c.titulo }),
                mostrarCliente ? c.cliente : null)
        },
        mostrarStatus ? { titulo: "Status", render: (c) => renderBadgeStatus(c.status) } : null,
        { titulo: "Prioridade", render: (c) => renderBadgePrioridade(c.prioridade) }
    ].filter(Boolean);
    if (mostrarAtendente) {
        colunas.push({
            titulo: "Atendente",
            render: (c) => c.atendente
                ? el("span", { text: c.atendente })
                : el("span", { class: "sem-atendente", text: "Não atribuído" })
        });
    }
    colunas.push({
        titulo: "Abertura", classe: "col-estreita",
        render: (c) => celulaDupla(formatarData(c.dataAbertura), tempoRelativo(c.dataAbertura))
    });
    if (acoes) colunas.push({ titulo: "", classe: "col-acoes", render: acoes });
    return criarTabela({ colunas, itens: chamados, legenda: "Lista de chamados" });
}

/** Preenche os selects de status/prioridade de uma barra de filtros e escuta mudanças. */
export function prepararFiltros(form, aoMudar) {
    const preencher = (select, mapa, rotuloTodos) => {
        select.replaceChildren(el("option", { value: "" }, rotuloTodos),
            ...Object.entries(mapa).map(([v, t]) => el("option", { value: v }, t)));
    };
    if (form.status) preencher(form.status, STATUS, "Todos os status");
    if (form.prioridade) preencher(form.prioridade, PRIORIDADES, "Todas as prioridades");

    let espera;
    form.addEventListener("input", () => {
        window.clearTimeout(espera);
        espera = window.setTimeout(aoMudar, 150);
    });
    form.addEventListener("submit", (e) => e.preventDefault());
    form.addEventListener("reset", () => window.setTimeout(aoMudar, 0));
}

/** Filtro local (apresentação) sobre a lista já autorizada pela API. */
export function filtrarChamados(chamados, form) {
    const busca = (form.busca?.value || "").trim().toLowerCase();
    const status = form.status?.value || "";
    const prioridade = form.prioridade?.value || "";
    return chamados.filter((c) =>
        (!status || c.status === status) &&
        (!prioridade || c.prioridade === prioridade) &&
        (!busca || [c.protocolo, c.titulo, c.cliente, c.atendente]
            .some((v) => String(v ?? "").toLowerCase().includes(busca))));
}

/** Ordenação de exibição: prioridade mais alta primeiro; em empate, o mais antigo. */
const PESO_PRIORIDADE = { CRITICA: 4, ALTA: 3, MEDIA: 2, BAIXA: 1 };
export function ordenarPorUrgencia(chamados) {
    return [...chamados].sort((a, b) =>
        (PESO_PRIORIDADE[b.prioridade] ?? 0) - (PESO_PRIORIDADE[a.prioridade] ?? 0)
        || String(a.dataAbertura).localeCompare(String(b.dataAbertura)));
}

/** Status que já não aparecem nas listas de trabalho (apenas filtro de exibição). */
export const STATUS_FINALIZADOS = ["ENCERRADO", "CANCELADO"];

/** Botão de ação em linha de tabela: loading, erro em toast e callback com o resultado. */
export function botaoLinha(texto, nomeIcone, executar, aoConcluir) {
    const botao = el("button", { type: "button", class: "btn btn-secundario btn-sm" }, icone(nomeIcone, { tamanho: 14 }), texto);
    botao.addEventListener("click", async () => {
        setLoading(botao, true, "…");
        try {
            const resultado = await executar();
            if (resultado) aoConcluir?.(resultado);
        } catch (erro) {
            toastErro(erro);
        } finally {
            if (botao.isConnected) setLoading(botao, false);
        }
    });
    return botao;
}

export function validarChamado({ titulo, descricao }) {
    const erros = {};
    if (titulo.length < 5 || titulo.length > 150) erros.titulo = "O título deve ter entre 5 e 150 caracteres.";
    if (descricao.length < 10 || descricao.length > 5000) erros.descricao = "A descrição deve ter entre 10 e 5000 caracteres.";
    return erros;
}

function botoesModal(textoConfirmar, formId) {
    const cancelar = el("button", { type: "button", class: "btn btn-secundario" }, "Cancelar");
    const confirmar = el("button", { type: "submit", class: "btn btn-primario", form: formId }, textoConfirmar);
    return { cancelar, confirmar };
}

const novoId = (prefixo) => `${prefixo}-${Math.random().toString(36).slice(2, 7)}`;

/* ---------- Alterar status (PATCH /chamados/{id}/status) ---------- */
export function modalAlterarStatus(chamado) {
    return new Promise((resolve) => {
        let resultado = null;
        const formId = novoId("form-status");
        const form = el("form", { id: formId, class: "form", novalidate: true },
            el("div", { class: "acao-atual" }, "Status atual: ", renderBadgeStatus(chamado.status)),
            campo({
                label: "Novo status", name: "status", required: true,
                opcoes: Object.entries(STATUS).filter(([valor]) => valor !== chamado.status),
                hint: "A API valida se a transição a partir do status atual é permitida."
            }));
        const { cancelar, confirmar } = botoesModal("Alterar status", formId);
        const { fechar } = abrirModal({
            titulo: "Alterar status", descricao: `Chamado ${chamado.protocolo}`, largura: "sm",
            corpo: form, rodape: [cancelar, confirmar], aoFechar: () => resolve(resultado)
        });
        cancelar.addEventListener("click", fechar);
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            limparErrosCampos(form);
            setLoading(confirmar, true, "Salvando…");
            try {
                resultado = await http.patch(`/chamados/${seg(chamado.id)}/status`, { status: form.status.value });
                toast(`Status de ${resultado.protocolo} alterado para "${STATUS[resultado.status]}".`, "sucesso");
                fechar();
            } catch (erro) {
                tratarErroFormulario(form, erro);
                setLoading(confirmar, false);
            }
        });
    });
}

/* ---------- Assumir chamado (ATENDENTE) ----------
 * O PATCH de atribuição exige o ID de ATENDENTE (não o usuarioId do login), e
 * GET /api/atendentes é restrito ao ADMIN. Sem alterar o back-end, o front:
 *  1) tenta descobrir o ID em chamados já atribuídos ao atendente logado;
 *  2) se não achar, pede o ID uma vez (visível ao admin em Equipe › Atendentes);
 *  3) guarda apenas em sessionStorage e confere a resposta da API.
 */
const CHAVE_ATENDENTE = "atendenteId";

export function getMeuAtendenteId() {
    return Number(sessionStorage.getItem(CHAVE_ATENDENTE)) || null;
}

export function definirMeuAtendenteId(id) {
    if (id) sessionStorage.setItem(CHAVE_ATENDENTE, String(id));
    else sessionStorage.removeItem(CHAVE_ATENDENTE);
}

export function descobrirMeuAtendenteId(chamados) {
    if (getMeuAtendenteId()) return getMeuAtendenteId();
    const { nome } = getSessao();
    const ids = new Set(chamados.filter((c) => c.atendenteId != null && c.atendente === nome).map((c) => c.atendenteId));
    if (ids.size === 1) definirMeuAtendenteId([...ids][0]);
    return getMeuAtendenteId();
}

export function modalInformarAtendenteId() {
    return new Promise((resolve) => {
        let resultado = null;
        const formId = novoId("form-atendente-id");
        const form = el("form", { id: formId, class: "form", novalidate: true },
            el("div", { class: "alerta alerta-info" }, icone("info", { tamanho: 18 }),
                el("p", { text: "Para assumir chamados é preciso o seu ID de atendente. Ele aparece para o administrador em Equipe › Atendentes e fica salvo somente nesta sessão." })),
            campo({ label: "ID de atendente", name: "atendenteId", type: "number", required: true, attrs: { min: 1, inputmode: "numeric" }, valor: getMeuAtendenteId() ?? "" }));
        const { cancelar, confirmar } = botoesModal("Salvar", formId);
        const { fechar } = abrirModal({
            titulo: "Identificação do atendente", largura: "sm",
            corpo: form, rodape: [cancelar, confirmar], aoFechar: () => resolve(resultado)
        });
        cancelar.addEventListener("click", fechar);
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            limparErrosCampos(form);
            const id = Number(form.atendenteId.value);
            if (!Number.isInteger(id) || id < 1) {
                mostrarErrosCampos(form, { atendenteId: "Informe um número inteiro positivo." });
                return;
            }
            definirMeuAtendenteId(id);
            resultado = id;
            fechar();
        });
        form.atendenteId.focus();
    });
}

export async function assumirChamado(chamado) {
    const id = getMeuAtendenteId() ?? await modalInformarAtendenteId();
    if (!id) return null;
    const atualizado = await http.patch(`/chamados/${seg(chamado.id)}/atendente/${seg(id)}`);
    if (atualizado.atendente !== getSessao().nome) {
        // O ID informado pertence a outra pessoa: avisa e descarta o ID salvo.
        definirMeuAtendenteId(null);
        toast(`O ID ${id} pertence a "${atualizado.atendente}", e o chamado foi atribuído a essa pessoa. Confira seu ID com o administrador.`, "aviso", 10000);
    } else {
        toast(`Você assumiu o chamado ${atualizado.protocolo}.`, "sucesso");
    }
    return atualizado;
}

/* ---------- Atribuir atendente (ADMIN: GET /api/atendentes + PATCH) ---------- */
let cacheAtendentes = null;

export function modalAtribuirAtendente(chamado) {
    return new Promise((resolve) => {
        let resultado = null;
        const formId = novoId("form-atribuir");
        const area = el("div", {});
        const form = el("form", { id: formId, class: "form", novalidate: true }, area);
        const { cancelar, confirmar } = botoesModal("Atribuir", formId);
        confirmar.disabled = true;
        const { fechar } = abrirModal({
            titulo: "Atribuir atendente", descricao: `Chamado ${chamado.protocolo}`, largura: "sm",
            corpo: form, rodape: [cancelar, confirmar], aoFechar: () => resolve(resultado)
        });
        cancelar.addEventListener("click", fechar);

        const carregar = async () => {
            renderCarregando(area, 2);
            try {
                cacheAtendentes ??= await http.get("/atendentes");
                if (!cacheAtendentes.length) {
                    renderVazio(area, { titulo: "Nenhum atendente cadastrado", texto: "Cadastre um atendente em Equipe › Atendentes." });
                    return;
                }
                area.removeAttribute("aria-busy");
                area.replaceChildren(campo({
                    label: "Atendente", name: "atendenteId", required: true, valor: chamado.atendenteId ?? "",
                    opcoes: cacheAtendentes.map((a) => [a.id, `${a.nome} · mat. ${a.matricula}${a.ativo ? "" : " (inativo)"}`]),
                    hint: chamado.atendente ? `Responsável atual: ${chamado.atendente}` : "O chamado ainda não tem responsável."
                }));
                confirmar.disabled = false;
            } catch (erro) {
                renderErro(area, erro, carregar);
            }
        };
        carregar();

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            limparErrosCampos(form);
            setLoading(confirmar, true, "Atribuindo…");
            try {
                resultado = await http.patch(`/chamados/${seg(chamado.id)}/atendente/${seg(form.atendenteId.value)}`);
                toast(`Chamado ${resultado.protocolo} atribuído a ${resultado.atendente}.`, "sucesso");
                fechar();
            } catch (erro) {
                tratarErroFormulario(form, erro);
                setLoading(confirmar, false);
            }
        });
    });
}

/* ---------- Abrir chamado em nome de cliente (equipe: POST com clienteId) ---------- */
function resumoCliente(cliente) {
    return el("dl", { class: "resumo-cliente" },
        el("dt", {}, "Cliente"), el("dd", {}, cliente.nome),
        el("dt", {}, "CPF"), el("dd", { class: "mono" }, mascararCPF(cliente.cpf)),
        el("dt", {}, "E-mail"), el("dd", {}, cliente.email),
        el("dt", {}, "Situação"), el("dd", {}, cliente.ativo ? "Ativo" : "Inativo"));
}

export function modalNovoChamadoEquipe(clienteInicial = null) {
    return new Promise((resolve) => {
        let resultado = null;
        let cliente = clienteInicial;
        const formId = novoId("form-novo-chamado");

        const areaCliente = el("div", { class: "campo" });
        const descricao = campo({ label: "Descrição", name: "descricao", required: true, multilinha: true, attrs: { maxlength: 5000, rows: 5 } });
        const contador = el("span", { class: "contador-caracteres" });
        descricao.append(el("div", { class: "campo-rodape" }, el("span", { class: "campo-hint", text: "Mínimo de 10 caracteres." }), contador));

        const form = el("form", { id: formId, class: "form", novalidate: true },
            areaCliente,
            campo({ label: "Título", name: "titulo", required: true, attrs: { maxlength: 150 }, hint: "Resumo do problema em uma linha." }),
            descricao,
            campoPrioridade("MEDIA"));
        ligarContador(form.descricao, contador);

        const { cancelar, confirmar } = botoesModal("Abrir chamado", formId);
        const { fechar } = abrirModal({
            titulo: "Abrir chamado para cliente", largura: "lg",
            descricao: "O chamado será vinculado ao cliente selecionado.",
            corpo: form, rodape: [cancelar, confirmar], aoFechar: () => resolve(resultado)
        });
        cancelar.addEventListener("click", fechar);

        const mostrarCliente = () => {
            const trocar = clienteInicial ? null : el("button", {
                type: "button", class: "btn btn-fantasma btn-sm",
                onClick: () => { cliente = null; montarBusca(); }
            }, "Trocar cliente");
            areaCliente.replaceChildren(el("span", { class: "campo-label", text: "Cliente" }), resumoCliente(cliente), trocar);
        };

        const montarBusca = () => {
            const inputCpf = el("input", { class: "input mono", name: "cpfBusca", id: `${formId}-cpf`, inputmode: "numeric", placeholder: "000.000.000-00", autocomplete: "off" });
            aplicarMascara(inputCpf, "cpf");
            const botao = el("button", { type: "button", class: "btn btn-secundario" }, icone("busca"), "Localizar");
            const localizar = async () => {
                limparErrosCampos(form);
                const cpf = somenteDigitos(inputCpf.value);
                if (cpf.length !== 11) {
                    mostrarErrosCampos(form, { cpfBusca: "Informe os 11 números do CPF." });
                    return;
                }
                setLoading(botao, true, "Buscando…");
                try {
                    cliente = await http.get(`/clientes/cpf/${seg(cpf)}`);
                    mostrarCliente();
                    form.titulo.focus();
                } catch (erro) {
                    setLoading(botao, false);
                    mostrarErrosCampos(form, { cpfBusca: erro.status === 404 ? "Nenhum cliente com este CPF." : erro.message });
                }
            };
            botao.addEventListener("click", localizar);
            inputCpf.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); localizar(); } });
            areaCliente.replaceChildren(
                el("label", { class: "campo-label", for: inputCpf.id }, "CPF do cliente", el("span", { class: "obrigatorio", "aria-hidden": "true", text: " *" })),
                el("div", { class: "acao-linha" }, inputCpf, botao),
                el("p", { class: "campo-hint", text: "Localize o cliente pelo CPF. Para buscar por nome, use a tela Clientes." }));
            inputCpf.focus();
        };

        if (cliente) mostrarCliente(); else montarBusca();

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            limparErrosCampos(form);
            if (!cliente) {
                mostrarErrosCampos(form, { cpfBusca: "Localize o cliente antes de abrir o chamado." });
                return;
            }
            const dados = {
                titulo: form.titulo.value.trim(),
                descricao: form.descricao.value.trim(),
                prioridade: form.prioridade.value,
                clienteId: cliente.id
            };
            if (mostrarErrosCampos(form, validarChamado(dados))) return;
            setLoading(confirmar, true, "Abrindo…");
            try {
                resultado = await http.post("/chamados", dados);
                toast(`Chamado ${resultado.protocolo} aberto para ${resultado.cliente}.`, "sucesso");
                fechar();
            } catch (erro) {
                tratarErroFormulario(form, erro);
                setLoading(confirmar, false);
            }
        });
    });
}

/* ---------- Chamados de um cliente (GET /chamados/cliente/{id}) ---------- */
export function modalChamadosDoCliente(cliente) {
    const area = el("div", {});
    abrirModal({
        titulo: `Chamados de ${cliente.nome}`, descricao: `CPF ${mascararCPF(cliente.cpf)}`, largura: "lg",
        corpo: area
    });
    area.parentElement.classList.add("sem-padding");
    const carregar = async () => {
        renderCarregando(area, 3);
        try {
            const lista = await http.get(`/chamados/cliente/${seg(cliente.id)}`);
            area.removeAttribute("aria-busy");
            if (!lista.length) renderVazio(area, { titulo: "Nenhum chamado", texto: "Este cliente ainda não abriu chamados." });
            else area.replaceChildren(tabelaChamados(lista));
        } catch (erro) {
            renderErro(area, erro, carregar);
        }
    };
    carregar();
}

/* ====================================================================== *
 * Página: detalhe do chamado
 * ====================================================================== */
const ACOES_HISTORICO = {
    CHAMADO_ABERTO: { rotulo: "Chamado aberto", icone: "chamados" },
    ATENDENTE_ATRIBUIDO: { rotulo: "Atendente atribuído", icone: "atribuir" },
    STATUS_ALTERADO: { rotulo: "Status alterado", icone: "status" },
    COMENTARIO_ADICIONADO: { rotulo: "Comentário adicionado", icone: "mensagem" }
};

const estado = { chamado: null };

function iniciarDetalhe() {
    const { perfil } = getSessao();
    const ehCliente = perfil === "CLIENTE";
    montarLayout({ ativo: "chamados", trilha: [ehCliente ? "Meus chamados" : "Chamados", "Detalhe"] });

    const voltar = document.getElementById("link-voltar");
    voltar.href = urlApp(ehCliente ? "pages/cliente/chamados.html" : "pages/atendente/chamados.html");
    voltar.append(ehCliente ? "Meus chamados" : "Fila de chamados");

    document.getElementById("form-comentario").addEventListener("submit", enviarComentario);
    ligarContador(document.getElementById("texto"), document.getElementById("cont-texto"));

    carregarDetalhe();
}

async function carregarDetalhe() {
    const id = parametro("id");
    const conteudo = document.getElementById("detalhe-conteudo");
    const estadoArea = document.getElementById("detalhe-estado");

    if (!/^\d+$/.test(id ?? "")) {
        conteudo.hidden = true;
        renderErro(estadoArea, { message: "Nenhum chamado foi informado no endereço da página." });
        return;
    }

    conteudo.hidden = true;
    estadoArea.hidden = false;
    renderCarregando(estadoArea, 6);
    try {
        const [chamado, historico] = await Promise.all([
            http.get(`/chamados/${seg(id)}`),
            http.get(`/chamados/${seg(id)}/historico`)
        ]);
        estado.chamado = chamado;
        if (getSessao().perfil === "ATENDENTE") descobrirMeuAtendenteId([chamado]);
        estadoArea.replaceChildren();
        estadoArea.removeAttribute("aria-busy");
        estadoArea.hidden = true;
        conteudo.hidden = false;
        renderTudo();
        renderHistorico(historico);
    } catch (erro) {
        renderErro(estadoArea, erro.status === 404 ? { message: "Chamado não encontrado." } : erro, carregarDetalhe);
    }
}

function renderTudo() {
    const c = estado.chamado;
    document.title = `${c.protocolo} · Central de Atendimento`;
    renderCabecalho(c);
    document.getElementById("descricao").textContent = c.descricao;
    renderDados(c);
    renderComentarios(c.comentarios ?? []);
    renderAcoesEquipe(c);
}

function renderCabecalho(c) {
    document.getElementById("cabecalho").replaceChildren(
        el("div", {},
            el("div", { class: "detalhe-protocolo" },
                el("span", { class: "mono", text: c.protocolo }),
                renderBadgeStatus(c.status),
                renderBadgePrioridade(c.prioridade)),
            el("h1", { class: "detalhe-titulo", text: c.titulo }),
            el("p", { class: "detalhe-sub", text: `Aberto por ${c.cliente} em ${formatarData(c.dataAbertura)} (${tempoRelativo(c.dataAbertura)})` })));
}

function renderDados(c) {
    const linhas = [
        ["Protocolo", el("span", { class: "mono", text: c.protocolo })],
        ["Status", renderBadgeStatus(c.status)],
        ["Prioridade", renderBadgePrioridade(c.prioridade)],
        ["Cliente", c.cliente],
        ["Atendente", c.atendente ? c.atendente : el("span", { class: "sem-atendente", text: "Não atribuído" })],
        ["Abertura", el("span", { class: "mono", text: formatarData(c.dataAbertura) })],
        ["Encerramento", el("span", { class: "mono", text: formatarData(c.dataEncerramento) })]
    ];
    document.getElementById("dados").replaceChildren(...linhas.flatMap(([rotulo, valor]) => [
        el("dt", {}, rotulo), el("dd", {}, valor)
    ]));
}

function renderComentarios(comentarios) {
    const lista = document.getElementById("comentarios");
    const { nome } = getSessao();
    document.getElementById("qtd-comentarios").textContent = String(comentarios.length);

    if (!comentarios.length) {
        lista.replaceChildren(el("li", { class: "thread-vazia", text: "Nenhum comentário ainda. Use o campo abaixo para registrar uma informação." }));
        return;
    }
    // XSS: autor e texto vão para o DOM exclusivamente como texto (el → textContent).
    lista.replaceChildren(...comentarios.map((cm) => el("li", { class: `comentario${cm.perfilAutor !== "CLIENTE" ? " equipe" : ""}` },
        el("span", { class: "avatar", "aria-hidden": "true", text: iniciais(cm.autor) }),
        el("div", {},
            el("div", { class: "comentario-meta" },
                el("span", { class: "comentario-autor", text: cm.autor === nome ? `${cm.autor} (você)` : cm.autor }),
                el("span", { class: "comentario-perfil", text: PERFIS[cm.perfilAutor] ?? cm.perfilAutor }),
                el("time", { class: "comentario-data", datetime: cm.dataCriacao, text: formatarData(cm.dataCriacao) })),
            el("p", { class: "comentario-texto", text: cm.texto })))));
}

function renderHistorico(eventos) {
    const lista = document.getElementById("historico");
    if (!eventos.length) {
        lista.replaceChildren(el("li", { class: "evento-descricao", text: "Sem eventos registrados." }));
        return;
    }
    lista.replaceChildren(...eventos.map((ev) => {
        const def = ACOES_HISTORICO[ev.acao] ?? { rotulo: String(ev.acao).replaceAll("_", " ").toLowerCase(), icone: "historico" };
        return el("li", { class: `evento evento-${String(ev.acao).toLowerCase()}` },
            el("span", { class: "evento-marcador" }, icone(def.icone, { tamanho: 13 })),
            el("div", {},
                el("p", { class: "evento-acao", text: def.rotulo }),
                el("p", { class: "evento-descricao", text: humanizarEnums(ev.descricao) }),
                el("p", { class: "evento-meta" }, `${ev.usuario} · `, el("time", { class: "mono", datetime: ev.dataEvento, text: formatarData(ev.dataEvento) }))));
    }));
}

/** Painel de ações exibido apenas para ATENDENTE e ADMIN (a API também valida). */
function renderAcoesEquipe(c) {
    const { perfil, nome } = getSessao();
    const painel = document.getElementById("painel-acoes");
    if (perfil === "CLIENTE") { painel.hidden = true; return; }
    painel.hidden = false;

    const souResponsavel = c.atendente != null && c.atendente === nome;
    const blocoResponsavel = el("div", { class: "acao-bloco" },
        el("p", { class: "acao-atual" }, "Responsável: ",
            el("strong", { text: c.atendente ? (souResponsavel ? `${c.atendente} (você)` : c.atendente) : "não atribuído" })));

    if (perfil === "ATENDENTE" && !souResponsavel) {
        blocoResponsavel.append(botaoAcao("Assumir atendimento", "atribuir", "btn-acento", () => assumirChamado(c)));
    }
    if (perfil === "ADMIN") {
        blocoResponsavel.append(botaoAcao(c.atendente ? "Reatribuir atendente" : "Atribuir atendente", "atribuir", "btn-secundario", () => modalAtribuirAtendente(c)));
    }

    const blocoStatus = el("div", { class: "acao-bloco" },
        el("p", { class: "acao-atual" }, "Status atual: ", renderBadgeStatus(c.status)),
        botaoAcao("Alterar status", "status", "btn-secundario", () => modalAlterarStatus(c)));

    document.getElementById("acoes").replaceChildren(el("div", { class: "acoes-equipe" }, blocoResponsavel, blocoStatus));
}

/** Botão que executa uma ação e, se houve alteração, recarrega o chamado e o histórico. */
function botaoAcao(texto, nomeIcone, variante, executar) {
    const botao = el("button", { type: "button", class: `btn ${variante} btn-bloco` }, icone(nomeIcone), texto);
    botao.addEventListener("click", async () => {
        setLoading(botao, true, "Processando…");
        try {
            const atualizado = await executar();
            if (atualizado) await recarregarAposAcao(atualizado);
        } catch (erro) {
            toastErro(erro);
        } finally {
            if (botao.isConnected) setLoading(botao, false);
        }
    });
    return botao;
}

async function recarregarAposAcao(atualizado) {
    estado.chamado = atualizado;
    renderTudo();
    try {
        renderHistorico(await http.get(`/chamados/${seg(atualizado.id)}/historico`));
    } catch (erro) {
        toastErro(erro);
    }
}

async function enviarComentario(evento) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const botao = form.querySelector("button[type=submit]");
    limparErrosCampos(form);

    const texto = form.texto.value.trim();
    if (!texto) {
        mostrarErrosCampos(form, { texto: "Escreva o comentário antes de enviar." });
        return;
    }

    setLoading(botao, true, "Enviando…");
    try {
        const comentario = await http.post(`/chamados/${seg(estado.chamado.id)}/comentarios`, { texto });
        estado.chamado.comentarios = [...(estado.chamado.comentarios ?? []), comentario];
        renderComentarios(estado.chamado.comentarios);
        form.reset();
        form.texto.dispatchEvent(new Event("input"));
        toast("Comentário registrado.", "sucesso");
        renderHistorico(await http.get(`/chamados/${seg(estado.chamado.id)}/historico`));
    } catch (erro) {
        tratarErroFormulario(form, erro);
    } finally {
        setLoading(botao, false);
    }
}

iniciarPagina({
    "detalhe-chamado": { perfis: ["CLIENTE", "ATENDENTE", "ADMIN"], iniciar: iniciarDetalhe }
});

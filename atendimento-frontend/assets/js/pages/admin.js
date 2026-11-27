/**
 * admin.js — área do ADMIN.
 *  - admin-dashboard   GET /api/relatorios/chamados, /api/chamados, /api/clientes, /api/atendentes
 *  - admin-clientes    GET /api/clientes, PUT /api/clientes/{id}, PATCH /api/clientes/{id}/inativar
 *  - admin-atendentes  POST /api/atendentes, GET /api/atendentes
 *  - admin-relatorios  GET /api/relatorios/chamados
 * O acompanhamento de chamados usa a fila compartilhada (pages/atendente/chamados.html).
 */
import { http, seg } from "../api.js";
import { iniciarPagina } from "../guards.js";
import {
    el, STATUS, PRIORIDADES, montarLayout, indicador, criarTabela, celulaDupla, campo, abrirModal, confirmar,
    toast, toastErro, setLoading, renderCarregando, renderErro, renderVazio, limparErrosCampos,
    mostrarErrosCampos, tratarErroFormulario, aplicarMascara, somenteDigitos, formatarTelefone, icone
} from "../ui.js";
import { iniciarConsultaClientes } from "./atendente.js";
import { tabelaChamados, ordenarPorUrgencia, STATUS_FINALIZADOS, botaoLinha, modalAtribuirAtendente } from "./chamado.js";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ativos = (lista) => {
    const n = lista.filter((x) => x.ativo).length;
    return n === 1 ? "1 ativo" : `${n} ativos`;
};
const formatoPercentual = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function distribuicao(mapa, rotulos, total) {
    return el("div", { class: "distribuicao" }, ...Object.entries(rotulos).map(([chave, rotulo]) => {
        const qtd = mapa?.[chave] ?? 0;
        const pct = total ? (qtd / total) * 100 : 0;
        return el("div", { class: "distribuicao-item" },
            el("span", { class: "distribuicao-rotulo" }, el("span", { class: `marcador m-${chave.toLowerCase()}` }), rotulo),
            el("div", { class: "barra", role: "img", "aria-label": `${rotulo}: ${formatoPercentual.format(pct)}%` },
                el("div", { class: `barra-preenchida m-${chave.toLowerCase()}`, style: `width:${pct.toFixed(2)}%` })),
            el("span", { class: "distribuicao-valor" }, String(qtd), el("small", { text: `${formatoPercentual.format(pct)}%` })));
    }));
}

/* ====================================================================== *
 * Painel do administrador
 * ====================================================================== */
function iniciarDashboard() {
    montarLayout({ ativo: "dashboard", trilha: ["Visão geral"] });
    const hoje = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date());
    document.getElementById("data-hoje").textContent = hoje;
    document.getElementById("btn-atualizar").addEventListener("click", carregarDashboard);
    carregarDashboard();
}

async function carregarDashboard() {
    const indicadores = document.getElementById("indicadores");
    const areaDistribuicao = document.getElementById("distribuicao");
    const areaUrgentes = document.getElementById("urgentes");
    const areaRecentes = document.getElementById("recentes");
    [areaDistribuicao, areaUrgentes, areaRecentes].forEach((a) => renderCarregando(a, 4));

    const [rel, cham, cli, atd] = await Promise.allSettled([
        http.get("/relatorios/chamados"), http.get("/chamados"), http.get("/clientes"), http.get("/atendentes")
    ]);
    const valor = (r) => (r.status === "fulfilled" ? r.value : null);
    const relatorio = valor(rel);
    const chamados = valor(cham);
    const clientes = valor(cli);
    const atendentes = valor(atd);
    const s = relatorio?.porStatus ?? {};
    const traco = "—";

    indicadores.replaceChildren(
        indicador({ rotulo: "Chamados", valor: relatorio?.total ?? traco, detalhe: "Total registrado", href: "relatorios.html" }),
        indicador({ rotulo: "Abertos", valor: relatorio ? s.ABERTO ?? 0 : traco, detalhe: "Aguardando triagem", marcador: "aberto", href: "../atendente/chamados.html?status=ABERTO" }),
        indicador({ rotulo: "Em andamento", valor: relatorio ? (s.EM_ATENDIMENTO ?? 0) + (s.AGUARDANDO_CLIENTE ?? 0) : traco, detalhe: "Em atendimento ou aguardando", marcador: "em_atendimento" }),
        indicador({ rotulo: "Críticos", valor: relatorio?.porPrioridade?.CRITICA ?? traco, detalhe: "Prioridade crítica (todos)", marcador: "critica", classe: relatorio?.porPrioridade?.CRITICA ? "destaque" : "" }),
        indicador({ rotulo: "Clientes", valor: clientes?.length ?? traco, detalhe: clientes ? ativos(clientes) : "", href: "clientes.html" }),
        indicador({ rotulo: "Atendentes", valor: atendentes?.length ?? traco, detalhe: atendentes ? ativos(atendentes) : "", href: "atendentes.html" }));

    if (relatorio) {
        areaDistribuicao.removeAttribute("aria-busy");
        areaDistribuicao.replaceChildren(distribuicao(s, STATUS, relatorio.total));
    } else {
        renderErro(areaDistribuicao, rel.reason, carregarDashboard);
    }

    if (!chamados) {
        renderErro(areaUrgentes, cham.reason, carregarDashboard);
        renderErro(areaRecentes, cham.reason, carregarDashboard);
        return;
    }

    const urgentes = ordenarPorUrgencia(chamados.filter((c) =>
        c.atendenteId == null && ["ALTA", "CRITICA"].includes(c.prioridade) && !STATUS_FINALIZADOS.includes(c.status)));
    areaUrgentes.removeAttribute("aria-busy");
    if (!urgentes.length) {
        renderVazio(areaUrgentes, { titulo: "Nada pendente", texto: "Todos os chamados de prioridade alta ou crítica têm responsável." });
    } else {
        areaUrgentes.replaceChildren(tabelaChamados(urgentes.slice(0, 6), {
            mostrarCliente: true, mostrarAtendente: false, mostrarStatus: false,
            acoes: (c) => botaoLinha("Atribuir", "atribuir", () => modalAtribuirAtendente(c), carregarDashboard)
        }));
    }

    areaRecentes.removeAttribute("aria-busy");
    if (!chamados.length) renderVazio(areaRecentes, { titulo: "Nenhum chamado registrado" });
    else areaRecentes.replaceChildren(tabelaChamados(chamados.slice(0, 8), { mostrarCliente: true }));
}

/* ====================================================================== *
 * Clientes: consulta + editar (PUT) + inativar (PATCH)
 * ====================================================================== */
function iniciarClientes() {
    montarLayout({ ativo: "clientes", trilha: ["Clientes"] });
    iniciarConsultaClientes({
        acoesExtras: (cliente, { atualizar }) => [
            el("button", {
                type: "button", class: "btn-icone", "aria-label": `Editar ${cliente.nome}`, title: "Editar",
                onClick: async () => { const r = await modalEditarCliente(cliente); if (r) atualizar(r); }
            }, icone("editar")),
            cliente.ativo ? el("button", {
                type: "button", class: "btn-icone", "aria-label": `Inativar ${cliente.nome}`, title: "Inativar",
                onClick: () => inativarCliente(cliente, atualizar)
            }, icone("bloquear")) : null
        ]
    });
}

function modalEditarCliente(cliente) {
    return new Promise((resolve) => {
        let resultado = null;
        const formId = `form-editar-${cliente.id}`;
        const telefone = campo({ label: "Telefone", name: "telefone", type: "tel", valor: formatarTelefone(cliente.telefone).replace("—", ""), attrs: { inputmode: "numeric", class: "input mono" }, hint: "Opcional. DDD + número." });
        const form = el("form", { id: formId, class: "form", novalidate: true },
            campo({ label: "Nome completo", name: "nome", required: true, valor: cliente.nome, attrs: { maxlength: 120 } }),
            campo({ label: "E-mail", name: "email", type: "email", required: true, valor: cliente.email }),
            telefone,
            el("p", { class: "campo-hint", text: "O CPF não pode ser alterado." }));
        aplicarMascara(form.telefone, "telefone");

        const cancelar = el("button", { type: "button", class: "btn btn-secundario" }, "Cancelar");
        const salvar = el("button", { type: "submit", class: "btn btn-primario", form: formId }, "Salvar alterações");
        const { fechar } = abrirModal({
            titulo: "Editar cliente", descricao: `Código ${cliente.id}`, corpo: form,
            rodape: [cancelar, salvar], aoFechar: () => resolve(resultado)
        });
        cancelar.addEventListener("click", fechar);

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            limparErrosCampos(form);
            const dados = {
                nome: form.nome.value.trim(),
                email: form.email.value.trim(),
                telefone: somenteDigitos(form.telefone.value)
            };
            const erros = {};
            if (dados.nome.length < 3) erros.nome = "O nome deve ter ao menos 3 caracteres.";
            if (!EMAIL_VALIDO.test(dados.email)) erros.email = "Informe um e-mail válido.";
            if (dados.telefone && !/^\d{10,11}$/.test(dados.telefone)) erros.telefone = "O telefone deve possuir 10 ou 11 números.";
            if (mostrarErrosCampos(form, erros)) return;

            setLoading(salvar, true, "Salvando…");
            try {
                resultado = await http.put(`/clientes/${seg(cliente.id)}`, dados);
                toast(`Cadastro de ${resultado.nome} atualizado.`, "sucesso");
                fechar();
            } catch (erro) {
                tratarErroFormulario(form, erro);
                setLoading(salvar, false);
            }
        });
    });
}

async function inativarCliente(cliente, atualizar) {
    const ok = await confirmar({
        titulo: "Inativar cliente",
        mensagem: `${cliente.nome} não poderá mais entrar no sistema. Os chamados já registrados continuam disponíveis para consulta. Deseja continuar?`,
        textoConfirmar: "Inativar", perigo: true
    });
    if (!ok) return;
    try {
        await http.patch(`/clientes/${seg(cliente.id)}/inativar`);
        toast(`${cliente.nome} foi inativado.`, "sucesso");
        atualizar({ ...cliente, ativo: false });
    } catch (erro) {
        toastErro(erro);
    }
}

/* ====================================================================== *
 * Atendentes: cadastrar (POST) + listar (GET)
 * ====================================================================== */
function iniciarAtendentes() {
    montarLayout({ ativo: "atendentes", trilha: ["Equipe", "Atendentes"] });
    const form = document.getElementById("form-atendente");
    const lista = document.getElementById("lista");
    const qtd = document.getElementById("qtd");
    let atendentes = [];

    const render = () => {
        qtd.textContent = String(atendentes.length);
        lista.removeAttribute("aria-busy");
        if (!atendentes.length) {
            renderVazio(lista, { titulo: "Nenhum atendente cadastrado", texto: "Use o formulário ao lado para cadastrar o primeiro." });
            return;
        }
        lista.replaceChildren(criarTabela({
            legenda: "Atendentes",
            itens: atendentes,
            colunas: [
                { titulo: "ID", classe: "col-estreita", render: (a) => el("span", { class: "mono", text: String(a.id) }) },
                { titulo: "Atendente", render: (a) => celulaDupla(a.nome, a.email) },
                { titulo: "Matrícula", classe: "col-estreita", render: (a) => el("span", { class: "mono", text: a.matricula }) },
                { titulo: "Situação", render: (a) => el("span", { class: `badge ${a.ativo ? "badge-ativo" : "badge-inativo"}`, text: a.ativo ? "Ativo" : "Inativo" }) }
            ]
        }));
    };

    const carregar = async () => {
        renderCarregando(lista, 4);
        try {
            atendentes = await http.get("/atendentes");
            render();
        } catch (erro) {
            renderErro(lista, erro, carregar);
        }
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        limparErrosCampos(form);
        const dados = {
            nome: form.nome.value.trim(),
            email: form.email.value.trim(),
            matricula: form.matricula.value.trim(),
            senha: form.senha.value
        };
        const erros = {};
        if (dados.nome.length < 3) erros.nome = "O nome deve ter ao menos 3 caracteres.";
        if (!EMAIL_VALIDO.test(dados.email)) erros.email = "Informe um e-mail válido.";
        if (!dados.matricula) erros.matricula = "Informe a matrícula.";
        if (dados.senha.length < 8 || dados.senha.length > 72) erros.senha = "A senha deve ter entre 8 e 72 caracteres.";
        if (mostrarErrosCampos(form, erros)) return;

        const botao = document.getElementById("btn-cadastrar");
        setLoading(botao, true, "Cadastrando…");
        try {
            const novo = await http.post("/atendentes", dados);
            atendentes = [...atendentes, novo];
            render();
            form.reset();
            toast(`${novo.nome} cadastrado. ID de atendente: ${novo.id}.`, "sucesso", 8000);
            form.nome.focus();
        } catch (erro) {
            tratarErroFormulario(form, erro);
        } finally {
            setLoading(botao, false);
        }
    });

    document.getElementById("btn-atualizar").addEventListener("click", carregar);
    carregar();
}

/* ====================================================================== *
 * Relatório (GET /api/relatorios/chamados)
 * ====================================================================== */
function iniciarRelatorios() {
    montarLayout({ ativo: "relatorios", trilha: ["Relatórios"] });
    document.getElementById("btn-atualizar").addEventListener("click", carregarRelatorio);
    document.getElementById("btn-imprimir").addEventListener("click", () => window.print());
    carregarRelatorio();
}

function tabelaRelatorio(mapa, rotulos, total, titulo) {
    const linhas = Object.entries(rotulos).map(([chave, rotulo]) => ({ chave, rotulo, qtd: mapa?.[chave] ?? 0 }));
    const wrap = criarTabela({
        legenda: titulo,
        itens: linhas,
        colunas: [
            { titulo, render: (l) => el("span", { class: "distribuicao-rotulo" }, el("span", { class: `marcador m-${l.chave.toLowerCase()}` }), l.rotulo) },
            { titulo: "Qtd.", classe: "col-num", render: (l) => el("span", { class: "mono", text: String(l.qtd) }) },
            { titulo: "%", classe: "col-num", render: (l) => el("span", { class: "mono", text: `${formatoPercentual.format(total ? (l.qtd / total) * 100 : 0)}%` }) }
        ]
    });
    wrap.querySelector("table").append(el("tfoot", {}, el("tr", {},
        el("td", { "data-label": "" }, "Total"),
        el("td", { class: "col-num mono", "data-label": "Qtd." }, String(total)),
        el("td", { class: "col-num mono", "data-label": "%" }, total ? "100,0%" : "0,0%"))));
    return el("div", {}, distribuicao(mapa, rotulos, total), wrap);
}

async function carregarRelatorio() {
    const meta = document.getElementById("meta");
    const indicadores = document.getElementById("indicadores");
    const areaStatus = document.getElementById("por-status");
    const areaPrioridade = document.getElementById("por-prioridade");
    renderCarregando(areaStatus, 6);
    renderCarregando(areaPrioridade, 4);
    meta.textContent = "Consultando…";

    try {
        const r = await http.get("/relatorios/chamados");
        const s = r.porStatus ?? {};
        const agora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
        meta.replaceChildren(
            el("span", {}, "Gerado em ", el("span", { class: "mono", text: agora })),
            el("span", { text: "Base: todos os chamados registrados" }));

        indicadores.replaceChildren(
            indicador({ rotulo: "Total de chamados", valor: r.total }),
            indicador({ rotulo: "Em andamento", valor: (s.ABERTO ?? 0) + (s.EM_ATENDIMENTO ?? 0) + (s.AGUARDANDO_CLIENTE ?? 0), detalhe: "Aberto, em atendimento ou aguardando", marcador: "em_atendimento" }),
            indicador({ rotulo: "Concluídos", valor: (s.RESOLVIDO ?? 0) + (s.ENCERRADO ?? 0), detalhe: "Resolvidos ou encerrados", marcador: "resolvido" }),
            indicador({ rotulo: "Cancelados", valor: s.CANCELADO ?? 0, marcador: "cancelado" }));

        areaStatus.removeAttribute("aria-busy");
        areaPrioridade.removeAttribute("aria-busy");
        areaStatus.replaceChildren(tabelaRelatorio(s, STATUS, r.total, "Status"));
        areaPrioridade.replaceChildren(tabelaRelatorio(r.porPrioridade, PRIORIDADES, r.total, "Prioridade"));
    } catch (erro) {
        meta.textContent = "";
        indicadores.replaceChildren();
        renderErro(areaStatus, erro, carregarRelatorio);
        areaPrioridade.replaceChildren();
    }
}

iniciarPagina({
    "admin-dashboard": { perfis: ["ADMIN"], iniciar: iniciarDashboard },
    "admin-clientes": { perfis: ["ADMIN"], iniciar: iniciarClientes },
    "admin-atendentes": { perfis: ["ADMIN"], iniciar: iniciarAtendentes },
    "admin-relatorios": { perfis: ["ADMIN"], iniciar: iniciarRelatorios }
});

/**
 * cliente.js — área do CLIENTE.
 *  - cliente-dashboard     GET /api/chamados (nome, contadores, recentes)
 *  - cliente-chamados      GET /api/chamados (listagem + filtros locais)
 *  - cliente-novo-chamado  POST /api/chamados (sem clienteId: a API vincula ao usuário logado)
 *  - cliente-perfil        GET /api/clientes/me
 */
import { http } from "../api.js";
import { urlChamado } from "../config.js";
import { iniciarPagina } from "../guards.js";
import {
    el, montarLayout, contarPor, preencherSaudacao, indicador, formatarData, formatarTelefone, mascararCPF,
    renderCarregando, renderErro, renderVazio, setLoading, toast, campoPrioridade, ligarContador,
    limparErrosCampos, mostrarErrosCampos, tratarErroFormulario
} from "../ui.js";
import { tabelaChamados, prepararFiltros, filtrarChamados, validarChamado } from "./chamado.js";

/* ---------------- Dashboard ---------------- */
function iniciarDashboard() {
    montarLayout({ ativo: "dashboard", trilha: ["Início"] });
    preencherSaudacao();
    carregarDashboard();
}

async function carregarDashboard() {
    const indicadores = document.getElementById("indicadores");
    const recentes = document.getElementById("recentes");
    renderCarregando(recentes, 5);

    try {
        const chamados = await http.get("/chamados");
        const porStatus = contarPor(chamados, "status");
        const emAndamento = (porStatus.ABERTO ?? 0) + (porStatus.EM_ATENDIMENTO ?? 0);
        const aguardando = porStatus.AGUARDANDO_CLIENTE ?? 0;

        indicadores.replaceChildren(
            indicador({ rotulo: "Em andamento", valor: emAndamento, detalhe: "Abertos ou em atendimento", marcador: "em_atendimento" }),
            indicador({ rotulo: "Aguardando você", valor: aguardando, detalhe: aguardando ? "Responda nos comentários" : "Nenhuma pendência", classe: aguardando ? "atencao" : "", marcador: "aguardando_cliente" }),
            indicador({ rotulo: "Resolvidos", valor: (porStatus.RESOLVIDO ?? 0) + (porStatus.ENCERRADO ?? 0), detalhe: "Resolvidos ou encerrados", marcador: "resolvido" }),
            indicador({ rotulo: "Total", valor: chamados.length, detalhe: "Desde o cadastro", href: "chamados.html" }));

        if (!chamados.length) {
            renderVazio(recentes, {
                titulo: "Você ainda não abriu chamados",
                texto: "Quando precisar de ajuda, abra um chamado e acompanhe o andamento por aqui.",
                acao: el("a", { class: "btn btn-primario btn-sm", href: "novo-chamado.html" }, "Abrir primeiro chamado")
            });
            return;
        }
        recentes.removeAttribute("aria-busy");
        recentes.replaceChildren(tabelaChamados(chamados.slice(0, 5), { mostrarAtendente: false }));
    } catch (erro) {
        indicadores.replaceChildren();
        renderErro(recentes, erro, carregarDashboard);
    }
}

/* ---------------- Meus chamados ---------------- */
async function iniciarChamados() {
    montarLayout({ ativo: "chamados", trilha: ["Meus chamados"] });

    const form = document.getElementById("filtros");
    const lista = document.getElementById("lista");
    const resumo = document.getElementById("resumo");
    let chamados = [];

    const render = () => {
        const filtrados = filtrarChamados(chamados, form);
        resumo.textContent = `${filtrados.length} de ${chamados.length} chamado(s)`;
        if (!filtrados.length) {
            renderVazio(lista, chamados.length
                ? { titulo: "Nenhum chamado com esses filtros", texto: "Ajuste a busca ou limpe os filtros." }
                : { titulo: "Nenhum chamado aberto", texto: "Use o botão “Abrir chamado” para registrar sua primeira solicitação." });
            return;
        }
        lista.replaceChildren(tabelaChamados(filtrados));
    };
    prepararFiltros(form, render);

    const carregar = async () => {
        renderCarregando(lista, 6);
        resumo.textContent = "Carregando…";
        try {
            chamados = await http.get("/chamados");
            lista.removeAttribute("aria-busy");
            render();
        } catch (erro) {
            resumo.textContent = "";
            renderErro(lista, erro, carregar);
        }
    };
    carregar();
}

/* ---------------- Novo chamado ---------------- */
function iniciarNovoChamado() {
    montarLayout({ ativo: "novo-chamado", trilha: ["Abrir chamado"] });

    const form = document.getElementById("form-chamado");
    document.getElementById("area-prioridade").replaceWith(campoPrioridade("MEDIA"));
    ligarContador(form.titulo, document.getElementById("cont-titulo"));
    ligarContador(form.descricao, document.getElementById("cont-descricao"));

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        limparErrosCampos(form);

        // CLIENTE não envia clienteId: a API associa o chamado ao usuário autenticado.
        const dados = {
            titulo: form.titulo.value.trim(),
            descricao: form.descricao.value.trim(),
            prioridade: form.prioridade.value
        };
        if (mostrarErrosCampos(form, validarChamado(dados))) return;

        const botao = document.getElementById("btn-enviar");
        setLoading(botao, true, "Enviando…");
        try {
            const criado = await http.post("/chamados", dados);
            toast(`Chamado aberto. Protocolo ${criado.protocolo}.`, "sucesso");
            window.setTimeout(() => window.location.assign(urlChamado(criado.id)), 700);
        } catch (erro) {
            tratarErroFormulario(form, erro);
            setLoading(botao, false);
        }
    });
    form.titulo.focus();
}

/* ---------------- Perfil ---------------- */
function iniciarPerfil() {
    montarLayout({ ativo: "perfil", trilha: ["Meu perfil"] });
    carregarPerfil();
}

async function carregarPerfil() {
    const area = document.getElementById("perfil");
    renderCarregando(area, 5);
    try {
        const c = await http.get("/clientes/me");
        document.getElementById("situacao").replaceChildren(
            el("span", { class: `badge ${c.ativo ? "badge-ativo" : "badge-inativo"}`, text: c.ativo ? "Cadastro ativo" : "Cadastro inativo" }));
        const linhas = [
            ["Nome", c.nome],
            ["E-mail", c.email],
            ["CPF", el("span", { class: "mono", text: mascararCPF(c.cpf) })],
            ["Telefone", el("span", { class: "mono", text: formatarTelefone(c.telefone) })],
            ["Cliente desde", el("span", { class: "mono", text: formatarData(c.dataCriacao, { hora: false }) })],
            ["Código do cliente", el("span", { class: "mono", text: String(c.id) })]
        ];
        area.removeAttribute("aria-busy");
        area.replaceChildren(el("dl", { class: "dl-dados" },
            ...linhas.flatMap(([rotulo, valor]) => [el("dt", {}, rotulo), el("dd", {}, valor)])));
    } catch (erro) {
        renderErro(area, erro, carregarPerfil);
    }
}

iniciarPagina({
    "cliente-dashboard": { perfis: ["CLIENTE"], iniciar: iniciarDashboard },
    "cliente-chamados": { perfis: ["CLIENTE"], iniciar: iniciarChamados },
    "cliente-novo-chamado": { perfis: ["CLIENTE"], iniciar: iniciarNovoChamado },
    "cliente-perfil": { perfis: ["CLIENTE"], iniciar: iniciarPerfil }
});

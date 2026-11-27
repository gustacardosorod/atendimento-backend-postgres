/**
 * ui.js — componentes e helpers de interface reutilizáveis.
 *
 * REGRA DE SEGURANÇA (XSS): todo dado vindo da API ou do usuário entra no DOM
 * por textContent / nós de texto. Este módulo NÃO usa innerHTML em nenhum ponto;
 * até os ícones SVG são montados com createElementNS.
 */
import { urlApp } from "./config.js";
import { getSessao, logout } from "./auth.js";
import { API_URL } from "./config.js";

/* ------------------------------------------------------------------ *
 * Rótulos amigáveis (apresentação apenas — as regras ficam na API)
 * ------------------------------------------------------------------ */
export const STATUS = Object.freeze({
    ABERTO: "Aberto",
    EM_ATENDIMENTO: "Em atendimento",
    AGUARDANDO_CLIENTE: "Aguardando cliente",
    RESOLVIDO: "Resolvido",
    ENCERRADO: "Encerrado",
    CANCELADO: "Cancelado"
});

export const PRIORIDADES = Object.freeze({
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    CRITICA: "Crítica"
});

export const PERFIS = Object.freeze({
    CLIENTE: "Cliente",
    ATENDENTE: "Atendente",
    ADMIN: "Administrador"
});

/* ------------------------------------------------------------------ *
 * Construção segura de DOM
 * ------------------------------------------------------------------ */

/**
 * Cria um elemento. Strings em `filhos` viram nós de texto (nunca HTML).
 * props: class, text, dataset, on<Evento>, demais atributos.
 */
export function el(tag, props = {}, ...filhos) {
    const node = document.createElement(tag);
    for (const [chave, valor] of Object.entries(props)) {
        if (valor == null || valor === false) continue;
        if (chave === "class") node.className = valor;
        else if (chave === "text") node.textContent = valor;
        else if (chave === "dataset") Object.assign(node.dataset, valor);
        else if (chave.startsWith("on") && typeof valor === "function") {
            node.addEventListener(chave.slice(2).toLowerCase(), valor);
        } else if (valor === true) node.setAttribute(chave, "");
        else node.setAttribute(chave, String(valor));
    }
    for (const filho of filhos.flat()) {
        if (filho == null || filho === false) continue;
        node.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
    }
    return node;
}

/* Ícones no traço do Lucide (24x24, stroke). Definição declarativa → createElementNS. */
const ICONES = {
    painel: [["rect", { x: 3, y: 3, width: 7, height: 9, rx: 1 }], ["rect", { x: 14, y: 3, width: 7, height: 5, rx: 1 }], ["rect", { x: 14, y: 12, width: 7, height: 9, rx: 1 }], ["rect", { x: 3, y: 16, width: 7, height: 5, rx: 1 }]],
    chamados: [["path", { d: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" }], ["path", { d: "M14 5v2M14 11v2M14 17v2" }]],
    mais: [["path", { d: "M12 5v14M5 12h14" }]],
    usuario: [["circle", { cx: 12, cy: 8, r: 4 }], ["path", { d: "M4 21a8 8 0 0 1 16 0" }]],
    usuarios: [["circle", { cx: 9, cy: 8, r: 4 }], ["path", { d: "M2 21a7 7 0 0 1 14 0" }], ["path", { d: "M16 4.1a4 4 0 0 1 0 7.8" }], ["path", { d: "M18 14.5a6 6 0 0 1 4 6.5" }]],
    equipe: [["path", { d: "M4 14v-2a8 8 0 0 1 16 0v2" }], ["rect", { x: 2, y: 14, width: 5, height: 6, rx: 1 }], ["rect", { x: 17, y: 14, width: 5, height: 6, rx: 1 }]],
    relatorio: [["path", { d: "M3 3v18h18" }], ["path", { d: "M8 17v-5M13 17V8M18 17v-9" }]],
    sair: [["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }], ["path", { d: "m16 17 5-5-5-5" }], ["path", { d: "M21 12H9" }]],
    menu: [["path", { d: "M4 6h16M4 12h16M4 18h16" }]],
    busca: [["circle", { cx: 11, cy: 11, r: 7 }], ["path", { d: "m21 21-4.3-4.3" }]],
    fechar: [["path", { d: "M18 6 6 18M6 6l12 12" }]],
    voltar: [["path", { d: "M19 12H5M12 19l-7-7 7-7" }]],
    mensagem: [["path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }]],
    relogio: [["circle", { cx: 12, cy: 12, r: 9 }], ["path", { d: "M12 7v5l3 2" }]],
    alerta: [["path", { d: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" }], ["path", { d: "M12 9v4M12 17h.01" }]],
    check: [["path", { d: "M20 6 9 17l-5-5" }]],
    editar: [["path", { d: "M12 20h9" }], ["path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" }]],
    bloquear: [["circle", { cx: 12, cy: 12, r: 9 }], ["path", { d: "m5.7 5.7 12.6 12.6" }]],
    atribuir: [["circle", { cx: 9, cy: 8, r: 4 }], ["path", { d: "M2 21a7 7 0 0 1 14 0" }], ["path", { d: "m16 11 2 2 4-4" }]],
    seta: [["path", { d: "m9 18 6-6-6-6" }]],
    atualizar: [["path", { d: "M21 12a9 9 0 1 1-2.6-6.4L21 8" }], ["path", { d: "M21 3v5h-5" }]],
    imprimir: [["path", { d: "M6 9V3h12v6" }], ["rect", { x: 6, y: 14, width: 12, height: 7 }], ["path", { d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }]],
    historico: [["path", { d: "M3 12a9 9 0 1 0 2.6-6.4L3 8" }], ["path", { d: "M3 3v5h5" }], ["path", { d: "M12 7v5l3 2" }]],
    info: [["circle", { cx: 12, cy: 12, r: 9 }], ["path", { d: "M12 16v-4M12 8h.01" }]],
    status: [["path", { d: "M22 12h-4l-3 9L9 3l-3 9H2" }]],
    olho: [["path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" }], ["circle", { cx: 12, cy: 12, r: 3 }]],
    olhoFechado: [["path", { d: "M3 3l18 18" }], ["path", { d: "M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.6 3.4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" }], ["path", { d: "M9.9 9.9a3 3 0 0 0 4.2 4.2" }]],
    fila: [["path", { d: "M3 6h13M3 12h18M3 18h9" }]]
};

const SVG_NS = "http://www.w3.org/2000/svg";

export function icone(nome, { tamanho = 16, classe = "" } = {}) {
    const svg = document.createElementNS(SVG_NS, "svg");
    const attrs = {
        viewBox: "0 0 24 24", width: tamanho, height: tamanho, fill: "none",
        stroke: "currentColor", "stroke-width": 1.75, "stroke-linecap": "round",
        "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false",
        class: `icone ${classe}`.trim()
    };
    Object.entries(attrs).forEach(([k, v]) => svg.setAttribute(k, String(v)));
    (ICONES[nome] || []).forEach(([tag, props]) => {
        const parte = document.createElementNS(SVG_NS, tag);
        Object.entries(props).forEach(([k, v]) => parte.setAttribute(k, String(v)));
        svg.append(parte);
    });
    return svg;
}

/** Substitui <span data-icone="nome"> do HTML estático pelo SVG correspondente. */
export function hidratarIcones(raiz = document) {
    raiz.querySelectorAll("[data-icone]").forEach((alvo) => {
        alvo.replaceWith(icone(alvo.dataset.icone, { tamanho: Number(alvo.dataset.tamanho) || 16 }));
    });
}

/* ------------------------------------------------------------------ *
 * Formatação
 * ------------------------------------------------------------------ */

/** Lê LocalDateTime da API ("2026-11-26T19:50:12" ou [2026,11,26,19,50]) sem conversão de fuso. */
function partesData(valor) {
    if (!valor) return null;
    if (Array.isArray(valor)) {
        const [a, m, d, h = 0, mi = 0] = valor;
        return { a, m, d, h, mi };
    }
    const r = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
    if (!r) return null;
    return { a: +r[1], m: +r[2], d: +r[3], h: +(r[4] ?? 0), mi: +(r[5] ?? 0) };
}

const dois = (n) => String(n).padStart(2, "0");

/** dd/mm/aaaa hh:mm (ou só a data com { hora: false }). */
export function formatarData(valor, { hora = true } = {}) {
    const p = partesData(valor);
    if (!p) return "—";
    const data = `${dois(p.d)}/${dois(p.m)}/${p.a}`;
    return hora ? `${data} ${dois(p.h)}:${dois(p.mi)}` : data;
}

/** "há 3 h", "há 2 dias" — usado como complemento da data absoluta. */
export function tempoRelativo(valor) {
    const p = partesData(valor);
    if (!p) return "";
    const data = new Date(p.a, p.m - 1, p.d, p.h, p.mi);
    const min = Math.round((Date.now() - data.getTime()) / 60000);
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `há ${h} h`;
    const dias = Math.round(h / 24);
    return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
}

/** Máscara de CPF para listagens. Idempotente: a API já devolve o CPF mascarado. */
export function mascararCPF(cpf) {
    if (!cpf) return "—";
    const texto = String(cpf);
    if (texto.includes("*")) return texto;
    const d = texto.replace(/\D/g, "");
    return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : "***.***.***-**";
}

export function formatarTelefone(tel) {
    const d = String(tel ?? "").replace(/\D/g, "");
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return d ? d : "—";
}

export const somenteDigitos = (v) => String(v ?? "").replace(/\D/g, "");

/** Aplica máscara visual enquanto digita (o envio usa somenteDigitos). */
export function aplicarMascara(input, tipo) {
    const formatar = {
        cpf: (d) => d.slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"),
        telefone: (d) => {
            d = d.slice(0, 11);
            if (d.length <= 2) return d.length ? `(${d}` : "";
            if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
            if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
            return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
        }
    }[tipo];
    input.addEventListener("input", () => {
        input.value = formatar(somenteDigitos(input.value));
    });
}

export const primeiroNome = (nome) => String(nome || "").trim().split(/\s+/)[0] || "";

export function iniciais(nome) {
    const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return "?";
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
    return (partes[0][0] + ultima).toUpperCase();
}

/** Troca nomes de enum por rótulos em textos do histórico ("ABERTO para EM_ATENDIMENTO"). */
export function humanizarEnums(texto) {
    return String(texto ?? "").replace(/\b(EM_ATENDIMENTO|AGUARDANDO_CLIENTE|ABERTO|RESOLVIDO|ENCERRADO|CANCELADO)\b/g,
        (m) => `"${STATUS[m]}"`);
}

/* ------------------------------------------------------------------ *
 * Badges
 * ------------------------------------------------------------------ */
export function renderBadgeStatus(status) {
    return el("span", { class: `badge badge-status s-${String(status).toLowerCase()}` },
        el("span", { class: "badge-ponto", "aria-hidden": "true" }), STATUS[status] ?? String(status));
}

export function renderBadgePrioridade(prioridade) {
    return el("span", { class: `badge badge-prioridade p-${String(prioridade).toLowerCase()}`, title: "Prioridade" },
        PRIORIDADES[prioridade] ?? String(prioridade));
}

/* ------------------------------------------------------------------ *
 * Feedback: toast, loading, estados
 * ------------------------------------------------------------------ */
function regiaoToasts() {
    let regiao = document.getElementById("toasts");
    if (!regiao) {
        regiao = el("div", { id: "toasts", class: "toast-regiao", "aria-live": "polite" });
        document.body.append(regiao);
    }
    return regiao;
}

/** tipo: "sucesso" | "erro" | "aviso" | "info" */
export function toast(mensagem, tipo = "info", duracao = 5000) {
    const nomesIcone = { sucesso: "check", erro: "alerta", aviso: "alerta", info: "info" };
    const item = el("div", { class: `toast toast-${tipo}`, role: tipo === "erro" ? "alert" : "status" },
        icone(nomesIcone[tipo] ?? "info", { tamanho: 18 }),
        el("p", { class: "toast-texto", text: mensagem }),
        el("button", { type: "button", class: "toast-fechar", "aria-label": "Fechar aviso", onClick: () => item.remove() },
            icone("fechar", { tamanho: 14 })));
    regiaoToasts().append(item);
    window.setTimeout(() => item.remove(), duracao);
}

/** Mostra a mensagem de um erro da API (ApiError) como toast. */
export function toastErro(erro) {
    toast(erro?.message || "Não foi possível concluir a operação.", "erro", 7000);
}

/**
 * Estado de carregamento em botão (desabilita + spinner) ou em container (aria-busy).
 */
export function setLoading(alvo, ativo, texto = "Aguarde…") {
    if (!alvo) return;
    if (alvo.tagName === "BUTTON") {
        if (ativo) {
            alvo._conteudo = [...alvo.childNodes];
            alvo.disabled = true;
            alvo.setAttribute("aria-busy", "true");
            alvo.replaceChildren(el("span", { class: "spinner", "aria-hidden": "true" }), texto);
        } else {
            alvo.disabled = false;
            alvo.removeAttribute("aria-busy");
            if (alvo._conteudo) alvo.replaceChildren(...alvo._conteudo);
        }
        return;
    }
    alvo.setAttribute("aria-busy", String(ativo));
    alvo.classList.toggle("carregando", ativo);
}

/** Linhas "esqueleto" enquanto a lista carrega. */
export function renderCarregando(container, linhas = 4) {
    container.setAttribute("aria-busy", "true");
    container.replaceChildren(el("div", { class: "esqueleto", role: "status" },
        el("span", { class: "sr-only", text: "Carregando…" }),
        ...Array.from({ length: linhas }, (_, i) => el("div", { class: "esqueleto-linha", style: `width:${92 - (i % 3) * 14}%` }))));
}

export function renderVazio(container, { titulo, texto, acao } = {}) {
    container.removeAttribute("aria-busy");
    container.replaceChildren(el("div", { class: "estado estado-vazio" },
        el("p", { class: "estado-titulo", text: titulo || "Nada por aqui" }),
        texto ? el("p", { class: "estado-texto", text: texto }) : null,
        acao ?? null));
}

export function renderErro(container, erro, aoTentarNovamente) {
    container.removeAttribute("aria-busy");
    container.replaceChildren(el("div", { class: "estado estado-erro", role: "alert" },
        icone("alerta", { tamanho: 20 }),
        el("p", { class: "estado-titulo", text: erro?.status === 403 ? "Acesso negado" : "Não foi possível carregar" }),
        el("p", { class: "estado-texto", text: erro?.message || "Erro inesperado." }),
        aoTentarNovamente ? el("button", { type: "button", class: "btn btn-secundario btn-sm", onClick: aoTentarNovamente },
            icone("atualizar"), "Tentar novamente") : null));
}

/* ------------------------------------------------------------------ *
 * Formulários
 * ------------------------------------------------------------------ */

/** Cria um campo padrão: label acima, hint e erro abaixo. */
export function campo({ label, name, type = "text", hint, required = false, valor = "", attrs = {}, multilinha = false, opcoes }) {
    const id = `f-${name}-${Math.random().toString(36).slice(2, 7)}`;
    let controle;
    if (opcoes) {
        controle = el("select", { id, name, class: "input", required, ...attrs },
            ...opcoes.map(([v, t]) => el("option", { value: v, selected: String(v) === String(valor) }, t)));
    } else if (multilinha) {
        controle = el("textarea", { id, name, class: "input", required, ...attrs });
        controle.value = valor ?? "";
    } else {
        controle = el("input", { id, name, type, class: "input", required, ...attrs });
        controle.value = valor ?? "";
    }
    return el("div", { class: "campo" },
        el("label", { for: id, class: "campo-label" }, label, required ? el("span", { class: "obrigatorio", "aria-hidden": "true", text: " *" }) : null),
        controle,
        hint ? el("p", { class: "campo-hint", id: `${id}-hint`, text: hint }) : null);
}

/** Grupo de rádio para prioridade (reutilizado em novo chamado e modal da equipe). */
export function campoPrioridade(valorPadrao = "MEDIA") {
    const descricoes = {
        BAIXA: "Dúvida ou ajuste sem impacto",
        MEDIA: "Impacto parcial no uso",
        ALTA: "Impede uma tarefa importante",
        CRITICA: "Serviço indisponível"
    };
    return el("fieldset", { class: "campo campo-prioridade" },
        el("legend", { class: "campo-label" }, "Prioridade", el("span", { class: "obrigatorio", "aria-hidden": "true", text: " *" })),
        el("div", { class: "opcoes-prioridade" },
            ...Object.entries(PRIORIDADES).map(([valor, rotulo]) => el("label", { class: `opcao-prioridade p-${valor.toLowerCase()}` },
                el("input", { type: "radio", name: "prioridade", value: valor, checked: valor === valorPadrao }),
                el("span", { class: "opcao-titulo", text: rotulo }),
                el("span", { class: "opcao-desc", text: descricoes[valor] })))));
}

export function limparErrosCampos(form) {
    form.querySelectorAll(".campo-erro").forEach((n) => n.remove());
    form.querySelectorAll("[aria-invalid]").forEach((n) => n.removeAttribute("aria-invalid"));
    form.querySelector(".alerta-form")?.remove();
}

/**
 * Exibe erros por campo ({ nome: "mensagem" }) junto ao respectivo input.
 * Retorna true se havia algum erro. Foca o primeiro campo inválido.
 */
export function mostrarErrosCampos(form, campos) {
    const entradas = Object.entries(campos || {}).filter(([, msg]) => msg);
    let primeiro = null;
    for (const [nome, msg] of entradas) {
        const controle = form.elements[nome];
        const alvo = controle instanceof RadioNodeList ? controle[0] : controle;
        if (!alvo) continue;
        const bloco = alvo.closest(".campo");
        const erroId = `${alvo.id || nome}-erro`;
        bloco?.querySelector(".campo-erro")?.remove();
        bloco?.append(el("p", { class: "campo-erro", id: erroId, text: msg }));
        alvo.setAttribute("aria-invalid", "true");
        alvo.setAttribute("aria-describedby", erroId);
        primeiro ??= alvo;
    }
    primeiro?.focus();
    return entradas.length > 0;
}

/** Alerta no topo do formulário (erro de regra de negócio, credencial etc.). */
export function alertaFormulario(form, mensagem, tipo = "erro") {
    form.querySelector(".alerta-form")?.remove();
    const alerta = el("div", { class: `alerta alerta-${tipo} alerta-form`, role: "alert", tabindex: "-1" },
        icone(tipo === "erro" ? "alerta" : "info", { tamanho: 18 }), el("p", { text: mensagem }));
    form.prepend(alerta);
    alerta.focus();
}

/** Trata um erro de submit: campos (400 de validação) ou alerta geral. */
export function tratarErroFormulario(form, erro) {
    if (erro?.campos && mostrarErrosCampos(form, erro.campos)) {
        alertaFormulario(form, erro.message);
        form.querySelector("[aria-invalid]")?.focus();
        return;
    }
    alertaFormulario(form, erro?.message || "Não foi possível concluir a operação.");
}

/** Contador de caracteres ligado a um textarea/input com maxlength. */
export function ligarContador(input, saida) {
    const max = Number(input.getAttribute("maxlength"));
    const atualizar = () => {
        saida.textContent = `${input.value.length}/${max}`;
        saida.classList.toggle("perto-limite", input.value.length > max * 0.9);
    };
    input.addEventListener("input", atualizar);
    atualizar();
}

/* ------------------------------------------------------------------ *
 * Modal (<dialog> nativo: foco preso, Esc fecha) e confirmação
 * ------------------------------------------------------------------ */
export function abrirModal({ titulo, descricao, corpo, rodape, largura = "md", aoFechar }) {
    const tituloId = `m-${Math.random().toString(36).slice(2, 7)}`;
    const dialog = el("dialog", { class: `modal modal-${largura}`, "aria-labelledby": tituloId },
        el("header", { class: "modal-cabecalho" },
            el("div", {},
                el("h2", { id: tituloId, class: "modal-titulo", text: titulo }),
                descricao ? el("p", { class: "modal-descricao", text: descricao }) : null),
            el("button", { type: "button", class: "btn-icone", "aria-label": "Fechar", onClick: () => fechar() }, icone("fechar", { tamanho: 18 }))),
        el("div", { class: "modal-corpo" }, corpo),
        rodape ? el("footer", { class: "modal-rodape" }, rodape) : null);

    function fechar() {
        if (!dialog.isConnected) return;
        dialog.close();
        dialog.remove();
        aoFechar?.();
    }
    dialog.addEventListener("cancel", (e) => { e.preventDefault(); fechar(); });
    document.body.append(dialog);
    dialog.showModal();
    return { dialog, fechar };
}

/** Confirmação assíncrona. Resolve true/false. */
export function confirmar({ titulo, mensagem, textoConfirmar = "Confirmar", perigo = false }) {
    return new Promise((resolve) => {
        let resposta = false;
        const btnOk = el("button", { type: "button", class: `btn ${perigo ? "btn-perigo" : "btn-primario"}` }, textoConfirmar);
        const btnCancelar = el("button", { type: "button", class: "btn btn-secundario" }, "Cancelar");
        const { fechar } = abrirModal({
            titulo, largura: "sm",
            corpo: el("p", { class: "texto-confirmacao", text: mensagem }),
            rodape: [btnCancelar, btnOk],
            aoFechar: () => resolve(resposta)
        });
        btnCancelar.addEventListener("click", fechar);
        btnOk.addEventListener("click", () => { resposta = true; fechar(); });
        btnCancelar.focus();
    });
}

/* ------------------------------------------------------------------ *
 * Tabela responsiva (vira cards abaixo de 768px via data-label)
 * ------------------------------------------------------------------ */
/**
 * colunas: [{ titulo, render(item) → Node|string, classe }]
 */
export function criarTabela({ colunas, itens, legenda, classe = "" }) {
    const tabela = el("table", { class: `tabela ${classe}`.trim() },
        legenda ? el("caption", { class: "sr-only", text: legenda }) : null,
        el("thead", {}, el("tr", {}, ...colunas.map((c) => el("th", { scope: "col", class: c.classe }, c.titulo)))),
        el("tbody", {}, ...itens.map((item) => el("tr", {},
            ...colunas.map((c) => el("td", { class: c.classe, "data-label": c.titulo }, c.render(item)))))));
    return el("div", { class: "tabela-wrap" }, tabela);
}

/** Texto principal + texto secundário em uma célula. */
export function celulaDupla(principal, secundario) {
    return el("div", { class: "celula-dupla" },
        principal instanceof Node ? principal : el("span", { class: "celula-principal", text: principal }),
        secundario ? el("span", { class: "celula-secundaria", text: secundario }) : null);
}

export function textoMono(texto) {
    return el("span", { class: "mono", text: texto ?? "—" });
}

/* ------------------------------------------------------------------ *
 * Layout: sidebar por perfil + topbar
 * ------------------------------------------------------------------ */
const NAVEGACAO = {
    CLIENTE: [
        { secao: "Atendimento", itens: [
            { id: "dashboard", texto: "Início", icone: "painel", href: "pages/cliente/dashboard.html" },
            { id: "chamados", texto: "Meus chamados", icone: "chamados", href: "pages/cliente/chamados.html" },
            { id: "novo-chamado", texto: "Abrir chamado", icone: "mais", href: "pages/cliente/novo-chamado.html" }
        ] },
        { secao: "Conta", itens: [
            { id: "perfil", texto: "Meu perfil", icone: "usuario", href: "pages/cliente/perfil.html" }
        ] }
    ],
    ATENDENTE: [
        { secao: "Atendimento", itens: [
            { id: "dashboard", texto: "Painel", icone: "painel", href: "pages/atendente/dashboard.html" },
            { id: "chamados", texto: "Fila de chamados", icone: "fila", href: "pages/atendente/chamados.html" },
            { id: "clientes", texto: "Clientes", icone: "usuarios", href: "pages/atendente/clientes.html" }
        ] }
    ],
    ADMIN: [
        { secao: "Visão geral", itens: [
            { id: "dashboard", texto: "Painel", icone: "painel", href: "pages/admin/dashboard.html" },
            { id: "relatorios", texto: "Relatórios", icone: "relatorio", href: "pages/admin/relatorios.html" }
        ] },
        { secao: "Operação", itens: [
            { id: "chamados", texto: "Chamados", icone: "chamados", href: "pages/atendente/chamados.html" },
            { id: "clientes", texto: "Clientes", icone: "usuarios", href: "pages/admin/clientes.html" }
        ] },
        { secao: "Equipe", itens: [
            { id: "atendentes", texto: "Atendentes", icone: "equipe", href: "pages/admin/atendentes.html" }
        ] }
    ]
};

/**
 * Monta sidebar e topbar da página protegida e libera a exibição do <body>.
 * @param {{ ativo: string, trilha: string[] }} opcoes
 */
export function montarLayout({ ativo, trilha = [] }) {
    const sessao = getSessao();
    const sidebar = document.getElementById("sidebar");
    const topbar = document.getElementById("topbar");
    const hostApi = new URL(API_URL).host;

    const nav = el("nav", { class: "sidebar-nav", "aria-label": "Navegação principal" },
        ...(NAVEGACAO[sessao.perfil] ?? []).map((grupo) => el("div", { class: "nav-grupo" },
            el("p", { class: "nav-secao", text: grupo.secao }),
            el("ul", { class: "nav-lista" }, ...grupo.itens.map((item) => el("li", {},
                el("a", {
                    class: `nav-link${item.id === ativo ? " ativo" : ""}`,
                    href: urlApp(item.href),
                    "aria-current": item.id === ativo ? "page" : null
                }, icone(item.icone, { tamanho: 18 }), item.texto)))))));

    // Logo por perfil: administrador, atendente (headset) e cliente (sem headset).
    const LOGOS = { ADMIN: "logo-admin.png", ATENDENTE: "logo-atendimento.png", CLIENTE: "logo-cliente.png" };
    const logo = (tamanho) => el("img", {
        class: "marca-logo", src: urlApp(`assets/img/${LOGOS[sessao.perfil] ?? "logo-atendimento.png"}`),
        alt: "", width: tamanho, height: tamanho
    });

    const btnFechar = el("button", { type: "button", class: "btn-icone sidebar-fechar", "aria-label": "Fechar menu" },
        icone("fechar", { tamanho: 18 }));

    sidebar.replaceChildren(
        el("div", { class: "sidebar-marca" },
            logo(40),
            el("div", {},
                el("p", { class: "marca-nome", text: "Central de Atendimento" }),
                el("p", { class: "marca-sub", text: `Área do ${PERFIS[sessao.perfil]?.toLowerCase() ?? "usuário"}` })),
            btnFechar),
        nav,
        el("div", { class: "sidebar-rodape" },
            el("span", { class: "ponto-online", "aria-hidden": "true" }),
            el("span", { class: "mono", text: `API ${hostApi}` })));

    /* Menu em gaveta: abre SOMENTE ao clicar no botão; clicar fora (overlay),
       no X ou pressionar Esc fecha, e o conteúdo volta a ocupar a tela toda. */
    const overlay = el("div", { class: "sidebar-overlay", "aria-hidden": "true" });
    const btnMenu = el("button", { type: "button", class: "btn-icone btn-menu", "aria-label": "Abrir menu", "aria-expanded": "false", "aria-controls": "sidebar" },
        icone("menu", { tamanho: 20 }));
    const menuAberto = () => sidebar.classList.contains("aberta");
    const alternarMenu = (abrir, { teclado = false } = {}) => {
        if (abrir === menuAberto()) return;
        sidebar.classList.toggle("aberta", abrir);
        overlay.classList.toggle("visivel", abrir);
        btnMenu.setAttribute("aria-expanded", String(abrir));
        btnMenu.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
        // Foco só acompanha quando o menu foi aberto pelo teclado (evita anel de foco no clique).
        if (abrir && teclado) (sidebar.querySelector(".nav-link.ativo") ?? sidebar.querySelector(".nav-link"))?.focus({ preventScroll: true });
        if (!abrir && teclado) btnMenu.focus({ preventScroll: true });
    };
    btnMenu.addEventListener("click", (e) => alternarMenu(!menuAberto(), { teclado: e.detail === 0 }));
    btnFechar.addEventListener("click", (e) => alternarMenu(false, { teclado: e.detail === 0 }));
    overlay.addEventListener("click", () => alternarMenu(false));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menuAberto() && !document.querySelector("dialog[open]")) alternarMenu(false, { teclado: true });
    });

    const migalhas = el("ol", { class: "trilha", "aria-label": "Você está em" },
        ...[PERFIS[sessao.perfil], ...trilha].filter(Boolean).map((t, i, arr) => el("li", { "aria-current": i === arr.length - 1 ? "page" : null }, t)));

    const inicio = { CLIENTE: "pages/cliente/dashboard.html", ATENDENTE: "pages/atendente/dashboard.html", ADMIN: "pages/admin/dashboard.html" }[sessao.perfil];
    const marcaTopo = el("a", { class: "topbar-marca", href: urlApp(inicio ?? "index.html"), "aria-label": "Central de Atendimento: ir para o início" },
        logo(30), el("span", { text: "Central de Atendimento" }));

    topbar.replaceChildren(
        btnMenu,
        marcaTopo,
        migalhas,
        el("div", { class: "topbar-usuario" },
            el("span", { class: "avatar", "aria-hidden": "true", text: iniciais(sessao.nome) }),
            el("div", { class: "usuario-info" },
                el("p", { class: "usuario-nome", text: sessao.nome }),
                el("p", { class: "usuario-perfil", text: `${PERFIS[sessao.perfil] ?? ""} · ${sessao.email}` })),
            el("button", { type: "button", class: "btn btn-fantasma btn-sm", onClick: logout }, icone("sair"), "Sair")));

    document.body.append(overlay);
    window.addEventListener("scroll", () => topbar.classList.toggle("rolado", window.scrollY > 4), { passive: true });
    ligarTransicaoDePagina();
    hidratarIcones();
    document.body.classList.add("pronto");
}

/**
 * Transição entre páginas: ao clicar num link interno, o conteúdo sai em 140 ms
 * antes da navegação; a página seguinte entra com a animação do CSS (.pronto).
 * Respeita prefers-reduced-motion, Ctrl/Shift+clique e links para outra aba.
 */
function ligarTransicaoDePagina() {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.addEventListener("pageshow", () => document.body.classList.remove("saindo"));
    if (reduzir) return;
    document.addEventListener("click", (e) => {
        const link = e.target.closest("a[href]");
        if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (link.target && link.target !== "_self") return;
        const destino = new URL(link.href, window.location.href);
        if (destino.origin !== window.location.origin) return;
        if (destino.pathname === window.location.pathname && destino.hash) return;
        e.preventDefault();
        document.body.classList.add("saindo");
        window.setTimeout(() => window.location.assign(destino.href), 140);
    });
}

/** Cabeçalho comum: data de hoje por extenso e saudação com o primeiro nome. */
export function preencherSaudacao() {
    const hoje = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date());
    const data = document.getElementById("data-hoje");
    if (data) data.textContent = hoje;
    const saudacao = document.getElementById("saudacao");
    const hora = new Date().getHours();
    const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
    if (saudacao) saudacao.textContent = `${periodo}, ${primeiroNome(getSessao().nome)}`;
}

/** Indicador numérico (link opcional). */
export function indicador({ rotulo, valor, detalhe, href, classe = "", marcador }) {
    return el(href ? "a" : "div", { class: `indicador ${classe}`.trim(), href },
        el("span", { class: "indicador-rotulo" }, marcador ? el("span", { class: `marcador m-${marcador}` }) : null, rotulo),
        el("span", { class: "indicador-valor", text: String(valor) }),
        detalhe ? el("span", { class: "indicador-detalhe", text: detalhe }) : null);
}

/** Lê um parâmetro da query string. */
export function parametro(nome) {
    return new URLSearchParams(window.location.search).get(nome);
}

/** Conta itens por uma chave: contarPor(chamados, "status") → { ABERTO: 3, ... } */
export function contarPor(itens, chave) {
    return itens.reduce((acc, item) => {
        acc[item[chave]] = (acc[item[chave]] ?? 0) + 1;
        return acc;
    }, {});
}

/**
 * login.js — autenticação (POST /api/auth/login) e redirecionamento por perfil.
 */
import { login, estaAutenticado, getSessao, rotaInicial } from "../auth.js";
import { el, icone, hidratarIcones, setLoading, mostrarErrosCampos, limparErrosCampos, alertaFormulario, parametro } from "../ui.js";

const CHAVE_FLASH = "flashCadastro";

// Usuário já autenticado não precisa ver o login.
if (estaAutenticado()) {
    window.location.replace(rotaInicial(getSessao().perfil));
} else {
    iniciar();
}

function iniciar() {
    hidratarIcones();
    mostrarAvisos();

    const form = document.getElementById("form-login");
    form.addEventListener("submit", enviar);
    ligarAlternarSenha();
}

/** Avisos vindos de redirecionamento: sessão expirada ou cadastro concluído. */
function mostrarAvisos() {
    const area = document.getElementById("aviso-login");
    const emailCadastrado = sessionStorage.getItem(CHAVE_FLASH);

    if (emailCadastrado) {
        sessionStorage.removeItem(CHAVE_FLASH);
        document.getElementById("email").value = emailCadastrado;
        document.getElementById("senha").focus();
        area.append(aviso("sucesso", "Cadastro realizado. Entre com sua senha para continuar."));
    } else if (parametro("sessao") === "expirada") {
        area.append(aviso("aviso", "Sua sessão expirou ou não é mais válida. Entre novamente."));
    }
}

function aviso(tipo, texto) {
    return el("div", { class: `alerta alerta-${tipo}`, role: "status", style: "margin-bottom:16px" },
        icone(tipo === "sucesso" ? "check" : "alerta", { tamanho: 18 }), el("p", { text: texto }));
}

function validar(email, senha) {
    const erros = {};
    if (!email) erros.email = "Informe o e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = "Informe um e-mail válido.";
    if (!senha) erros.senha = "Informe a senha.";
    return erros;
}

async function enviar(evento) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const botao = document.getElementById("btn-entrar");
    limparErrosCampos(form);

    const email = form.email.value.trim();
    const senha = form.senha.value;
    if (mostrarErrosCampos(form, validar(email, senha))) return;

    setLoading(botao, true, "Entrando…");
    try {
        const sessao = await login(email, senha);
        window.location.replace(rotaInicial(sessao.perfil));
    } catch (erro) {
        form.senha.value = "";
        alertaFormulario(form, erro.message);
        setLoading(botao, false);
    }
}

function ligarAlternarSenha() {
    const botao = document.getElementById("alternar-senha");
    const input = document.getElementById("senha");
    botao.addEventListener("click", () => {
        const mostrar = input.type === "password";
        input.type = mostrar ? "text" : "password";
        botao.setAttribute("aria-pressed", String(mostrar));
        botao.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
        botao.replaceChildren(icone(mostrar ? "olhoFechado" : "olho"));
    });
}

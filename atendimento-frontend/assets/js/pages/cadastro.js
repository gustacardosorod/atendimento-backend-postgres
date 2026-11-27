/**
 * cadastro.js — cadastro público de cliente (POST /api/auth/register).
 * As validações abaixo apenas espelham o formato exigido pela API (Bean Validation)
 * para dar retorno imediato; a API continua validando tudo (inclusive duplicidade).
 */
import { cadastrarCliente } from "../auth.js";
import { urlApp, ROTAS } from "../config.js";
import {
    hidratarIcones, aplicarMascara, somenteDigitos, setLoading, toast,
    limparErrosCampos, mostrarErrosCampos, tratarErroFormulario
} from "../ui.js";

const CHAVE_FLASH = "flashCadastro";

hidratarIcones();
const form = document.getElementById("form-cadastro");
aplicarMascara(form.cpf, "cpf");
aplicarMascara(form.telefone, "telefone");
form.addEventListener("submit", enviar);

function lerFormulario() {
    return {
        nome: form.nome.value.trim(),
        cpf: somenteDigitos(form.cpf.value),
        email: form.email.value.trim(),
        telefone: somenteDigitos(form.telefone.value) || null,
        senha: form.senha.value
    };
}

function validar(dados) {
    const erros = {};
    if (dados.nome.length < 3) erros.nome = "Informe o nome completo (mínimo de 3 caracteres).";
    if (dados.cpf.length !== 11) erros.cpf = "O CPF deve possuir 11 números.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) erros.email = "Informe um e-mail válido.";
    if (dados.telefone && !/^\d{10,11}$/.test(dados.telefone)) erros.telefone = "O telefone deve possuir 10 ou 11 números.";
    if (dados.senha.length < 8 || dados.senha.length > 72) erros.senha = "A senha deve possuir entre 8 e 72 caracteres.";
    if (form.confirmacao.value !== dados.senha) erros.confirmacao = "As senhas não conferem.";
    return erros;
}

async function enviar(evento) {
    evento.preventDefault();
    limparErrosCampos(form);

    const dados = lerFormulario();
    if (mostrarErrosCampos(form, validar(dados))) return;

    const botao = document.getElementById("btn-cadastrar");
    setLoading(botao, true, "Criando conta…");
    try {
        await cadastrarCliente(dados);
        // Apenas o e-mail é repassado ao login (nunca a senha) para pré-preencher o campo.
        sessionStorage.setItem(CHAVE_FLASH, dados.email);
        form.reset();
        toast("Conta criada com sucesso. Redirecionando para o login…", "sucesso");
        window.setTimeout(() => window.location.assign(urlApp(ROTAS.login)), 1200);
    } catch (erro) {
        tratarErroFormulario(form, erro);
        setLoading(botao, false);
    }
}

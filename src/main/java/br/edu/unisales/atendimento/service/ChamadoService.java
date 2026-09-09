package br.edu.unisales.atendimento.service;

import br.edu.unisales.atendimento.dto.chamado.*;
import br.edu.unisales.atendimento.entity.*;
import br.edu.unisales.atendimento.enums.PerfilUsuario;
import br.edu.unisales.atendimento.enums.StatusChamado;
import br.edu.unisales.atendimento.exception.BusinessException;
import br.edu.unisales.atendimento.exception.ResourceNotFoundException;
import br.edu.unisales.atendimento.repository.*;
import br.edu.unisales.atendimento.security.CurrentUserService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ChamadoService {

    private final ChamadoRepository chamados;
    private final ClienteRepository clientes;
    private final AtendenteRepository atendentes;
    private final ComentarioRepository comentarios;
    private final HistoricoChamadoRepository historicos;
    private final CurrentUserService currentUser;

    public ChamadoService(ChamadoRepository chamados,
                          ClienteRepository clientes,
                          AtendenteRepository atendentes,
                          ComentarioRepository comentarios,
                          HistoricoChamadoRepository historicos,
                          CurrentUserService currentUser) {
        this.chamados = chamados;
        this.clientes = clientes;
        this.atendentes = atendentes;
        this.comentarios = comentarios;
        this.historicos = historicos;
        this.currentUser = currentUser;
    }

    @Transactional
    public ChamadoResponse abrir(ChamadoCreateRequest request) {
        Usuario usuario = currentUser.getUsuarioAtual();
        Cliente cliente = resolverCliente(request.clienteId(), usuario);

        Chamado chamado = new Chamado();
        chamado.setTitulo(request.titulo().trim());
        chamado.setDescricao(request.descricao().trim());
        chamado.setPrioridade(request.prioridade());
        chamado.setStatus(StatusChamado.ABERTO);
        chamado.setCliente(cliente);
        chamado.setProtocolo(gerarProtocolo());
        chamados.save(chamado);

        registrar(chamado, usuario, "CHAMADO_ABERTO",
                "Chamado aberto com protocolo " + chamado.getProtocolo());

        return dto(chamado);
    }

    public List<ChamadoResponse> listar() {
        Usuario usuario = currentUser.getUsuarioAtual();
        List<Chamado> lista = usuario.getPerfil() == PerfilUsuario.CLIENTE
                ? chamados.findByClienteUsuarioEmailIgnoreCaseOrderByDataAberturaDesc(usuario.getEmail())
                : chamados.findAllByOrderByDataAberturaDesc();
        return lista.stream().map(this::dto).toList();
    }

    public ChamadoResponse buscarPorId(Long id) {
        Chamado chamado = entidade(id);
        validarAcesso(chamado);
        return dto(chamado);
    }

    public ChamadoResponse buscarPorProtocolo(String protocolo) {
        Chamado chamado = chamados.findByProtocolo(protocolo)
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado."));
        validarAcesso(chamado);
        return dto(chamado);
    }

    public List<ChamadoResponse> buscarPorCliente(Long clienteId) {
        Usuario usuario = currentUser.getUsuarioAtual();
        if (usuario.getPerfil() == PerfilUsuario.CLIENTE) {
            Cliente cliente = clientes.findByUsuarioEmailIgnoreCase(usuario.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado."));
            if (!cliente.getId().equals(clienteId)) {
                throw new AccessDeniedException("Cliente não pode consultar chamados de outro cliente.");
            }
        }
        return chamados.findByClienteIdOrderByDataAberturaDesc(clienteId).stream().map(this::dto).toList();
    }

    public List<ChamadoResponse> buscarPorCpf(String cpf) {
        validarEquipe(currentUser.getUsuarioAtual());
        return chamados.findByClienteCpfOrderByDataAberturaDesc(cpf.replaceAll("\\D", ""))
                .stream().map(this::dto).toList();
    }

    @Transactional
    public ChamadoResponse atribuirAtendente(Long chamadoId, Long atendenteId) {
        Usuario usuario = currentUser.getUsuarioAtual();
        validarEquipe(usuario);
        Chamado chamado = entidade(chamadoId);
        validarEditavel(chamado);
        Atendente atendente = atendentes.findById(atendenteId)
                .orElseThrow(() -> new ResourceNotFoundException("Atendente não encontrado."));
        chamado.setAtendente(atendente);
        if (chamado.getStatus() == StatusChamado.ABERTO) chamado.setStatus(StatusChamado.EM_ATENDIMENTO);
        registrar(chamado, usuario, "ATENDENTE_ATRIBUIDO",
                "Chamado atribuído ao atendente " + atendente.getUsuario().getNome());
        return dto(chamado);
    }

    @Transactional
    public ChamadoResponse alterarStatus(Long chamadoId, StatusChamadoRequest request) {
        Usuario usuario = currentUser.getUsuarioAtual();
        validarEquipe(usuario);
        Chamado chamado = entidade(chamadoId);
        StatusChamado anterior = chamado.getStatus();
        StatusChamado novo = request.status();
        validarTransicao(anterior, novo);
        chamado.setStatus(novo);
        chamado.setDataEncerramento(
                novo == StatusChamado.ENCERRADO || novo == StatusChamado.CANCELADO
                        ? LocalDateTime.now() : null
        );
        registrar(chamado, usuario, "STATUS_ALTERADO",
                "Status alterado de " + anterior + " para " + novo);
        return dto(chamado);
    }

    @Transactional
    public ComentarioResponse adicionarComentario(Long chamadoId, ComentarioCreateRequest request) {
        Usuario usuario = currentUser.getUsuarioAtual();
        Chamado chamado = entidade(chamadoId);
        validarAcesso(chamado);
        validarEditavel(chamado);
        Comentario comentario = new Comentario();
        comentario.setChamado(chamado);
        comentario.setAutor(usuario);
        comentario.setTexto(request.texto().trim());
        comentarios.save(comentario);
        registrar(chamado, usuario, "COMENTARIO_ADICIONADO", "Novo comentário adicionado.");
        return comentarioDto(comentario);
    }

    public List<HistoricoResponse> historico(Long chamadoId) {
        Chamado chamado = entidade(chamadoId);
        validarAcesso(chamado);
        return historicos.findByChamadoIdOrderByDataEventoAsc(chamadoId).stream()
                .map(h -> new HistoricoResponse(
                        h.getId(), h.getAcao(), h.getDescricao(),
                        h.getUsuario() == null ? "SISTEMA" : h.getUsuario().getNome(),
                        h.getDataEvento()))
                .toList();
    }

    private Cliente resolverCliente(Long clienteId, Usuario usuario) {
        if (usuario.getPerfil() == PerfilUsuario.CLIENTE) {
            return clientes.findByUsuarioEmailIgnoreCase(usuario.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente vinculado ao usuário não encontrado."));
        }
        if (clienteId == null) throw new BusinessException("clienteId é obrigatório para equipe interna.");
        return clientes.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado."));
    }

    private Chamado entidade(Long id) {
        return chamados.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado."));
    }

    private void validarEquipe(Usuario usuario) {
        if (usuario.getPerfil() == PerfilUsuario.CLIENTE) {
            throw new AccessDeniedException("Operação disponível apenas para atendentes ou administradores.");
        }
    }

    private void validarAcesso(Chamado chamado) {
        Usuario usuario = currentUser.getUsuarioAtual();
        if (usuario.getPerfil() != PerfilUsuario.CLIENTE) return;
        if (!chamado.getCliente().getUsuario().getId().equals(usuario.getId())) {
            throw new AccessDeniedException("Usuário não possui acesso a este chamado.");
        }
    }

    private void validarEditavel(Chamado chamado) {
        if (chamado.getStatus() == StatusChamado.ENCERRADO || chamado.getStatus() == StatusChamado.CANCELADO) {
            throw new BusinessException("Chamados encerrados ou cancelados não podem ser alterados.");
        }
    }

    private void validarTransicao(StatusChamado atual, StatusChamado novo) {
        if (atual == novo) throw new BusinessException("O chamado já está com o status informado.");
        Map<StatusChamado, Set<StatusChamado>> permitidas = Map.of(
                StatusChamado.ABERTO, Set.of(StatusChamado.EM_ATENDIMENTO, StatusChamado.CANCELADO),
                StatusChamado.EM_ATENDIMENTO, Set.of(StatusChamado.AGUARDANDO_CLIENTE, StatusChamado.RESOLVIDO, StatusChamado.CANCELADO),
                StatusChamado.AGUARDANDO_CLIENTE, Set.of(StatusChamado.EM_ATENDIMENTO, StatusChamado.CANCELADO),
                StatusChamado.RESOLVIDO, Set.of(StatusChamado.ENCERRADO, StatusChamado.EM_ATENDIMENTO),
                StatusChamado.ENCERRADO, Set.of(),
                StatusChamado.CANCELADO, Set.of()
        );
        if (!permitidas.getOrDefault(atual, Set.of()).contains(novo)) {
            throw new BusinessException("Transição de status não permitida: " + atual + " -> " + novo);
        }
    }

    private void registrar(Chamado chamado, Usuario usuario, String acao, String descricao) {
        HistoricoChamado historico = new HistoricoChamado();
        historico.setChamado(chamado);
        historico.setUsuario(usuario);
        historico.setAcao(acao);
        historico.setDescricao(descricao);
        historicos.save(historico);
    }

    private String gerarProtocolo() {
        return "ATD-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private ChamadoResponse dto(Chamado chamado) {
        List<ComentarioResponse> listaComentarios = comentarios
                .findByChamadoIdOrderByDataCriacaoAsc(chamado.getId())
                .stream().map(this::comentarioDto).toList();
        Long atendenteId = chamado.getAtendente() == null ? null : chamado.getAtendente().getId();
        String atendenteNome = chamado.getAtendente() == null ? null : chamado.getAtendente().getUsuario().getNome();
        return new ChamadoResponse(
                chamado.getId(), chamado.getProtocolo(), chamado.getTitulo(), chamado.getDescricao(),
                chamado.getStatus(), chamado.getPrioridade(), chamado.getCliente().getId(),
                chamado.getCliente().getUsuario().getNome(), atendenteId, atendenteNome,
                chamado.getDataAbertura(), chamado.getDataEncerramento(), listaComentarios);
    }

    private ComentarioResponse comentarioDto(Comentario comentario) {
        return new ComentarioResponse(
                comentario.getId(), comentario.getAutor().getNome(), comentario.getAutor().getPerfil().name(),
                comentario.getTexto(), comentario.getDataCriacao());
    }
}

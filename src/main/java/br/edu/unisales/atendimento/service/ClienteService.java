package br.edu.unisales.atendimento.service;

import br.edu.unisales.atendimento.dto.cliente.*;
import br.edu.unisales.atendimento.entity.*;
import br.edu.unisales.atendimento.enums.PerfilUsuario;
import br.edu.unisales.atendimento.exception.*;
import br.edu.unisales.atendimento.repository.*;
import br.edu.unisales.atendimento.security.CurrentUserService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ClienteService {
    private final ClienteRepository clientes;
    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final CurrentUserService current;

    public ClienteService(ClienteRepository clientes, UsuarioRepository usuarios, PasswordEncoder encoder,
            CurrentUserService current) {
        this.clientes = clientes;
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.current = current;
    }

    @Transactional
    public ClienteResponse cadastrar(ClienteCreateRequest r) {
        String email = r.email().trim().toLowerCase();
        String cpf = numeros(r.cpf());
        if (usuarios.existsByEmailIgnoreCase(email))
            throw new BusinessException("Já existe um usuário cadastrado com este e-mail.");
        if (clientes.existsByCpf(cpf))
            throw new BusinessException("Já existe um cliente cadastrado com este CPF.");
        Usuario u = new Usuario();
        u.setNome(r.nome().trim());
        u.setEmail(email);
        u.setSenha(encoder.encode(r.senha()));
        u.setPerfil(PerfilUsuario.CLIENTE);
        u.setAtivo(true);
        usuarios.save(u);
        Cliente c = new Cliente();
        c.setCpf(cpf);
        c.setTelefone(telefone(r.telefone()));
        c.setUsuario(u);
        clientes.save(c);
        return dto(c);
    }

    public ClienteResponse buscarMeuPerfil() {
        Usuario u = current.getUsuarioAtual();
        if (u.getPerfil() != PerfilUsuario.CLIENTE)
            throw new AccessDeniedException("Usuário autenticado não possui perfil de cliente.");
        return dto(clientes.findByUsuarioEmailIgnoreCase(u.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado.")));
    }

    public ClienteResponse buscarPorId(Long id) {
        return dto(entidade(id));
    }

    public ClienteResponse buscarPorCpf(String cpf) {
        return dto(clientes.findByCpf(numeros(cpf))
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado.")));
    }

    public List<ClienteResponse> listar(String nome) {
        List<Cliente> l = (nome == null || nome.isBlank()) ? clientes.findAll()
                : clientes.findByUsuarioNomeContainingIgnoreCaseOrderByUsuarioNomeAsc(nome);
        return l.stream().map(this::dto).toList();
    }

    @Transactional
    public ClienteResponse atualizar(Long id, ClienteUpdateRequest r) {
        Cliente c = entidade(id);
        Usuario u = c.getUsuario();
        String e = r.email().trim().toLowerCase();
        if (!u.getEmail().equalsIgnoreCase(e) && usuarios.existsByEmailIgnoreCase(e))
            throw new BusinessException("Já existe outro usuário cadastrado com este e-mail.");
        u.setNome(r.nome().trim());
        u.setEmail(e);
        c.setTelefone(telefone(r.telefone()));
        return dto(c);
    }

    @Transactional
    public void inativar(Long id) {
        entidade(id).getUsuario().setAtivo(false);
    }

    public Cliente entidade(Long id) {
        return clientes.findById(id).orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado."));
    }

    private ClienteResponse dto(Cliente c) {
        Usuario u = c.getUsuario();
        return new ClienteResponse(c.getId(), u.getId(), u.getNome(), mascarar(c.getCpf()), u.getEmail(),
                c.getTelefone(), u.getAtivo(), u.getDataCriacao());
    }

    private String numeros(String v) {
        return v.replaceAll("\\D", "");
    }

    private String telefone(String v) {
        return v == null || v.isBlank() ? null : numeros(v);
    }

    private String mascarar(String cpf) {
        return cpf == null || cpf.length() != 11 ? cpf
                : "***." + cpf.substring(3, 6) + "." + cpf.substring(6, 9) + "-**";
    }
}

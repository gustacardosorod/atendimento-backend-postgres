package br.edu.unisales.atendimento.service;
import br.edu.unisales.atendimento.dto.atendente.*; import br.edu.unisales.atendimento.entity.*; import br.edu.unisales.atendimento.enums.PerfilUsuario; import br.edu.unisales.atendimento.exception.*; import br.edu.unisales.atendimento.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import java.util.*;
@Service @Transactional(readOnly=true)
public class AtendenteService{
 private final AtendenteRepository atendentes; private final UsuarioRepository usuarios; private final PasswordEncoder encoder;
 public AtendenteService(AtendenteRepository a,UsuarioRepository u,PasswordEncoder e){atendentes=a;usuarios=u;encoder=e;}
 @Transactional public AtendenteResponse cadastrar(AtendenteCreateRequest r){String email=r.email().trim().toLowerCase(),mat=r.matricula().trim();if(usuarios.existsByEmailIgnoreCase(email))throw new BusinessException("Já existe usuário com este e-mail.");if(atendentes.existsByMatricula(mat))throw new BusinessException("Já existe atendente com esta matrícula.");Usuario u=new Usuario();u.setNome(r.nome().trim());u.setEmail(email);u.setSenha(encoder.encode(r.senha()));u.setPerfil(PerfilUsuario.ATENDENTE);u.setAtivo(true);usuarios.save(u);Atendente a=new Atendente();a.setMatricula(mat);a.setUsuario(u);atendentes.save(a);return dto(a);}
 public List<AtendenteResponse> listar(){return atendentes.findAll().stream().map(this::dto).toList();} public AtendenteResponse buscar(Long id){return dto(entidade(id));} public Atendente entidade(Long id){return atendentes.findById(id).orElseThrow(()->new ResourceNotFoundException("Atendente não encontrado."));}
 private AtendenteResponse dto(Atendente a){Usuario u=a.getUsuario();return new AtendenteResponse(a.getId(),u.getId(),u.getNome(),u.getEmail(),a.getMatricula(),u.getAtivo());}
}

package br.edu.unisales.atendimento.security;
import br.edu.unisales.atendimento.entity.Usuario; import br.edu.unisales.atendimento.exception.ResourceNotFoundException; import br.edu.unisales.atendimento.repository.UsuarioRepository;
import org.springframework.security.core.Authentication; import org.springframework.security.core.context.SecurityContextHolder; import org.springframework.stereotype.Service;
@Service
public class CurrentUserService{
 private final UsuarioRepository repo; public CurrentUserService(UsuarioRepository repo){this.repo=repo;}
 public Usuario getUsuarioAtual(){Authentication a=SecurityContextHolder.getContext().getAuthentication();if(a==null||!a.isAuthenticated()||"anonymousUser".equals(a.getPrincipal()))throw new ResourceNotFoundException("Usuário autenticado não encontrado.");return repo.findByEmailIgnoreCase(a.getName()).orElseThrow(()->new ResourceNotFoundException("Usuário autenticado não encontrado."));}
}

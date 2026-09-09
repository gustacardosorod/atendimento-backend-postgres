package br.edu.unisales.atendimento.security;
import br.edu.unisales.atendimento.entity.Usuario;
import br.edu.unisales.atendimento.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
@Service
public class CustomUserDetailsService implements UserDetailsService{
 private final UsuarioRepository repo; public CustomUserDetailsService(UsuarioRepository repo){this.repo=repo;}
 @Override public UserDetails loadUserByUsername(String username)throws UsernameNotFoundException{Usuario u=repo.findByEmailIgnoreCase(username).orElseThrow(()->new UsernameNotFoundException("Usuário não encontrado."));return User.withUsername(u.getEmail()).password(u.getSenha()).authorities("ROLE_"+u.getPerfil().name()).disabled(!Boolean.TRUE.equals(u.getAtivo())).build();}
}

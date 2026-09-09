package br.edu.unisales.atendimento.service;
import br.edu.unisales.atendimento.dto.auth.*; import br.edu.unisales.atendimento.entity.Usuario; import br.edu.unisales.atendimento.exception.ResourceNotFoundException; import br.edu.unisales.atendimento.repository.UsuarioRepository; import br.edu.unisales.atendimento.security.JwtService;
import org.springframework.security.authentication.*; import org.springframework.security.core.userdetails.*; import org.springframework.stereotype.Service;
@Service
public class AuthService{
 private final AuthenticationManager am; private final UsuarioRepository repo; private final UserDetailsService uds; private final JwtService jwt;
 public AuthService(AuthenticationManager am,UsuarioRepository repo,UserDetailsService uds,JwtService jwt){this.am=am;this.repo=repo;this.uds=uds;this.jwt=jwt;}
 public AuthResponse login(LoginRequest r){String e=r.email().trim().toLowerCase();am.authenticate(new UsernamePasswordAuthenticationToken(e,r.senha()));Usuario u=repo.findByEmailIgnoreCase(e).orElseThrow(()->new ResourceNotFoundException("Usuário não encontrado."));UserDetails d=uds.loadUserByUsername(e);return new AuthResponse(jwt.gerarToken(d),"Bearer",u.getId(),u.getNome(),u.getEmail(),u.getPerfil());}
}

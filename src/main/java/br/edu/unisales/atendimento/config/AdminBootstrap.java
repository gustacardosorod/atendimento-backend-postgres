package br.edu.unisales.atendimento.config;
import br.edu.unisales.atendimento.entity.Usuario; import br.edu.unisales.atendimento.enums.PerfilUsuario; import br.edu.unisales.atendimento.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value; import org.springframework.boot.CommandLineRunner; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.stereotype.Component; import org.springframework.util.StringUtils;
@Component
public class AdminBootstrap implements CommandLineRunner{
 private final UsuarioRepository repo; private final PasswordEncoder enc; @Value("${app.bootstrap-admin.name:}") private String name; @Value("${app.bootstrap-admin.email:}") private String email; @Value("${app.bootstrap-admin.password:}") private String password;
 public AdminBootstrap(UsuarioRepository repo,PasswordEncoder enc){this.repo=repo;this.enc=enc;}
 @Override public void run(String...args){if(!StringUtils.hasText(name)||!StringUtils.hasText(email)||!StringUtils.hasText(password))return;String e=email.trim().toLowerCase();if(repo.existsByEmailIgnoreCase(e))return;Usuario u=new Usuario();u.setNome(name.trim());u.setEmail(e);u.setSenha(enc.encode(password));u.setPerfil(PerfilUsuario.ADMIN);u.setAtivo(true);repo.save(u);}
}

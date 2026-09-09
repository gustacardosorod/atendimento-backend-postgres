package br.edu.unisales.atendimento.repository;
import br.edu.unisales.atendimento.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UsuarioRepository extends JpaRepository<Usuario,Long>{ Optional<Usuario> findByEmailIgnoreCase(String email); boolean existsByEmailIgnoreCase(String email); }

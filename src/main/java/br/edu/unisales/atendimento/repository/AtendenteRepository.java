package br.edu.unisales.atendimento.repository;
import br.edu.unisales.atendimento.entity.Atendente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AtendenteRepository extends JpaRepository<Atendente,Long>{ Optional<Atendente> findByMatricula(String matricula); Optional<Atendente> findByUsuarioEmailIgnoreCase(String email); boolean existsByMatricula(String matricula); }

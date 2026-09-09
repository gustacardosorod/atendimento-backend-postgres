package br.edu.unisales.atendimento.repository;
import br.edu.unisales.atendimento.entity.Comentario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ComentarioRepository extends JpaRepository<Comentario,Long>{ List<Comentario> findByChamadoIdOrderByDataCriacaoAsc(Long chamadoId); }

package br.edu.unisales.atendimento.repository;
import br.edu.unisales.atendimento.entity.HistoricoChamado;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface HistoricoChamadoRepository extends JpaRepository<HistoricoChamado,Long>{ List<HistoricoChamado> findByChamadoIdOrderByDataEventoAsc(Long chamadoId); }

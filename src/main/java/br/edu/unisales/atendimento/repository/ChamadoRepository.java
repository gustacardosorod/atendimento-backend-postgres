package br.edu.unisales.atendimento.repository;
import br.edu.unisales.atendimento.entity.Chamado;
import br.edu.unisales.atendimento.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ChamadoRepository extends JpaRepository<Chamado,Long>{ Optional<Chamado> findByProtocolo(String protocolo); List<Chamado> findAllByOrderByDataAberturaDesc(); List<Chamado> findByClienteIdOrderByDataAberturaDesc(Long clienteId); List<Chamado> findByClienteCpfOrderByDataAberturaDesc(String cpf); List<Chamado> findByClienteUsuarioEmailIgnoreCaseOrderByDataAberturaDesc(String email); long countByStatus(StatusChamado status); long countByPrioridade(PrioridadeChamado prioridade); }

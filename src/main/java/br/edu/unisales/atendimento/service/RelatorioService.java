package br.edu.unisales.atendimento.service;
import br.edu.unisales.atendimento.dto.relatorio.RelatorioChamadosResponse; import br.edu.unisales.atendimento.enums.*; import br.edu.unisales.atendimento.repository.ChamadoRepository; import org.springframework.stereotype.Service; import java.util.*;
@Service
public class RelatorioService{
 private final ChamadoRepository repo; public RelatorioService(ChamadoRepository repo){this.repo=repo;}
 public RelatorioChamadosResponse resumo(){Map<StatusChamado,Long>s=new EnumMap<>(StatusChamado.class);for(StatusChamado x:StatusChamado.values())s.put(x,repo.countByStatus(x));Map<PrioridadeChamado,Long>p=new EnumMap<>(PrioridadeChamado.class);for(PrioridadeChamado x:PrioridadeChamado.values())p.put(x,repo.countByPrioridade(x));return new RelatorioChamadosResponse(repo.count(),s,p);}
}

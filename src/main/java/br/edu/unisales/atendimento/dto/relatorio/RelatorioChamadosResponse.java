package br.edu.unisales.atendimento.dto.relatorio;
import br.edu.unisales.atendimento.enums.*; import java.util.Map;
public record RelatorioChamadosResponse(long total,Map<StatusChamado,Long> porStatus,Map<PrioridadeChamado,Long> porPrioridade){}

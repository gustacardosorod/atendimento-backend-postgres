package br.edu.unisales.atendimento.dto.chamado;
import br.edu.unisales.atendimento.enums.*;
import java.time.LocalDateTime; import java.util.List;
public record ChamadoResponse(Long id,String protocolo,String titulo,String descricao,StatusChamado status,PrioridadeChamado prioridade,Long clienteId,String cliente,Long atendenteId,String atendente,LocalDateTime dataAbertura,LocalDateTime dataEncerramento,List<ComentarioResponse> comentarios){}

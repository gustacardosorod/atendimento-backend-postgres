package br.edu.unisales.atendimento.dto.chamado;
import br.edu.unisales.atendimento.enums.PrioridadeChamado;
import jakarta.validation.constraints.*;
public record ChamadoCreateRequest(@NotBlank @Size(min=5,max=150) String titulo,@NotBlank @Size(min=10,max=5000) String descricao,@NotNull PrioridadeChamado prioridade,Long clienteId){}

package br.edu.unisales.atendimento.dto.chamado;
import br.edu.unisales.atendimento.enums.StatusChamado;
import jakarta.validation.constraints.NotNull;
public record StatusChamadoRequest(@NotNull StatusChamado status){}

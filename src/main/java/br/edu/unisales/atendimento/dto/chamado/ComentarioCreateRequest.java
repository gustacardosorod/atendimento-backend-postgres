package br.edu.unisales.atendimento.dto.chamado;
import jakarta.validation.constraints.*;
public record ComentarioCreateRequest(@NotBlank @Size(max=2000) String texto){}

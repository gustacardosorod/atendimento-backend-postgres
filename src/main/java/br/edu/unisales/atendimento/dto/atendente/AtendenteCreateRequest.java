package br.edu.unisales.atendimento.dto.atendente;
import jakarta.validation.constraints.*;
public record AtendenteCreateRequest(@NotBlank @Size(min=3,max=120) String nome,@NotBlank @Email String email,@NotBlank @Size(max=30) String matricula,@NotBlank @Size(min=8,max=72) String senha){}

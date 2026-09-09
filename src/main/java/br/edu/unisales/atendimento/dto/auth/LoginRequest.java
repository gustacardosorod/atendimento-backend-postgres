package br.edu.unisales.atendimento.dto.auth;
import jakarta.validation.constraints.*;
public record LoginRequest(@NotBlank @Email String email,@NotBlank String senha){}

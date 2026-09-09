package br.edu.unisales.atendimento.dto.cliente;
import jakarta.validation.constraints.*;
public record ClienteUpdateRequest(@NotBlank @Size(min=3,max=120) String nome,@NotBlank @Email String email,@Pattern(regexp="^$|\\d{10,11}$") String telefone){}

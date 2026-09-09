package br.edu.unisales.atendimento.dto.cliente;
import java.time.LocalDateTime;
public record ClienteResponse(Long id,Long usuarioId,String nome,String cpf,String email,String telefone,Boolean ativo,LocalDateTime dataCriacao){}

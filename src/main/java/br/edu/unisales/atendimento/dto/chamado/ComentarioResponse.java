package br.edu.unisales.atendimento.dto.chamado;
import java.time.LocalDateTime;
public record ComentarioResponse(Long id,String autor,String perfilAutor,String texto,LocalDateTime dataCriacao){}

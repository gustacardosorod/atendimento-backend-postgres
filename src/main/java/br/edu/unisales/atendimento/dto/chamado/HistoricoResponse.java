package br.edu.unisales.atendimento.dto.chamado;
import java.time.LocalDateTime;
public record HistoricoResponse(Long id,String acao,String descricao,String usuario,LocalDateTime dataEvento){}

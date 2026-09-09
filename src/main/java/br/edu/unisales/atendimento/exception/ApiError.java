package br.edu.unisales.atendimento.exception;
import java.time.LocalDateTime; import java.util.Map;
public record ApiError(LocalDateTime timestamp,int status,String erro,String mensagem,String path,Map<String,String> campos){}

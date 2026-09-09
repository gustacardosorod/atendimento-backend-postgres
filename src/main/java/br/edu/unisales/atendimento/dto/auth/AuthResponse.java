package br.edu.unisales.atendimento.dto.auth;
import br.edu.unisales.atendimento.enums.PerfilUsuario;
public record AuthResponse(String token,String tipo,Long usuarioId,String nome,String email,PerfilUsuario perfil){}

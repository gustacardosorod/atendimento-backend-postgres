package br.edu.unisales.atendimento.security;
import io.jsonwebtoken.*; import io.jsonwebtoken.io.Decoders; import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value; import org.springframework.security.core.userdetails.UserDetails; import org.springframework.stereotype.Service;
import javax.crypto.SecretKey; import java.util.Date;
@Service
public class JwtService{
 @Value("${app.jwt.secret}") private String secret; @Value("${app.jwt.expiration}") private long expiration;
 public String gerarToken(UserDetails u){Date a=new Date(),e=new Date(a.getTime()+expiration);return Jwts.builder().subject(u.getUsername()).issuedAt(a).expiration(e).signWith(getKey()).compact();}
 public String extrairUsername(String token){return claims(token).getSubject();}
 public boolean tokenValido(String token,UserDetails u){return extrairUsername(token).equals(u.getUsername())&&!claims(token).getExpiration().before(new Date());}
 private Claims claims(String t){return Jwts.parser().verifyWith(getKey()).build().parseSignedClaims(t).getPayload();}
 private SecretKey getKey(){return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));}
}

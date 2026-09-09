package br.edu.unisales.atendimento.security;
import jakarta.servlet.*; import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken; import org.springframework.security.core.context.SecurityContextHolder; import org.springframework.security.core.userdetails.UserDetails; import org.springframework.security.web.authentication.WebAuthenticationDetailsSource; import org.springframework.stereotype.Component; import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter{
 private final JwtService jwt; private final CustomUserDetailsService uds; public JwtAuthenticationFilter(JwtService jwt,CustomUserDetailsService uds){this.jwt=jwt;this.uds=uds;}
 @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{String h=req.getHeader("Authorization");if(h==null||!h.startsWith("Bearer ")){chain.doFilter(req,res);return;}String token=h.substring(7);String email;try{email=jwt.extrairUsername(token);}catch(Exception e){chain.doFilter(req,res);return;}if(email!=null&&SecurityContextHolder.getContext().getAuthentication()==null){UserDetails u=uds.loadUserByUsername(email);if(jwt.tokenValido(token,u)){UsernamePasswordAuthenticationToken a=new UsernamePasswordAuthenticationToken(u,null,u.getAuthorities());a.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));SecurityContextHolder.getContext().setAuthentication(a);}}chain.doFilter(req,res);}
}

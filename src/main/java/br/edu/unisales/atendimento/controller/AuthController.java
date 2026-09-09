package br.edu.unisales.atendimento.controller;
import br.edu.unisales.atendimento.dto.auth.*; import br.edu.unisales.atendimento.dto.cliente.*; import br.edu.unisales.atendimento.service.*; import jakarta.validation.Valid; import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/auth")
public class AuthController{
 private final AuthService auth; private final ClienteService clientes; public AuthController(AuthService auth,ClienteService clientes){this.auth=auth;this.clientes=clientes;}
 @PostMapping("/login") public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest r){return ResponseEntity.ok(auth.login(r));}
 @PostMapping("/register") public ResponseEntity<ClienteResponse> register(@Valid @RequestBody ClienteCreateRequest r){return ResponseEntity.status(HttpStatus.CREATED).body(clientes.cadastrar(r));}
}

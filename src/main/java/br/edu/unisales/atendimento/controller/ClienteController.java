package br.edu.unisales.atendimento.controller;
import br.edu.unisales.atendimento.dto.cliente.*; import br.edu.unisales.atendimento.service.ClienteService; import jakarta.validation.Valid; import org.springframework.http.ResponseEntity; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/clientes")
public class ClienteController{
 private final ClienteService service; public ClienteController(ClienteService service){this.service=service;}
 @GetMapping("/me") @PreAuthorize("hasRole('CLIENTE')") public ResponseEntity<ClienteResponse> me(){return ResponseEntity.ok(service.buscarMeuPerfil());}
 @GetMapping @PreAuthorize("hasAnyRole('ADMIN','ATENDENTE')") public ResponseEntity<List<ClienteResponse>> listar(@RequestParam(required=false)String nome){return ResponseEntity.ok(service.listar(nome));}
 @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','ATENDENTE')") public ResponseEntity<ClienteResponse> buscar(@PathVariable Long id){return ResponseEntity.ok(service.buscarPorId(id));}
 @GetMapping("/cpf/{cpf}") @PreAuthorize("hasAnyRole('ADMIN','ATENDENTE')") public ResponseEntity<ClienteResponse> cpf(@PathVariable String cpf){return ResponseEntity.ok(service.buscarPorCpf(cpf));}
 @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") public ResponseEntity<ClienteResponse> atualizar(@PathVariable Long id,@Valid @RequestBody ClienteUpdateRequest r){return ResponseEntity.ok(service.atualizar(id,r));}
 @PatchMapping("/{id}/inativar") @PreAuthorize("hasRole('ADMIN')") public ResponseEntity<Void> inativar(@PathVariable Long id){service.inativar(id);return ResponseEntity.noContent().build();}
}

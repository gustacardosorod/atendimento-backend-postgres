package br.edu.unisales.atendimento.controller;
import br.edu.unisales.atendimento.dto.atendente.*; import br.edu.unisales.atendimento.service.AtendenteService; import jakarta.validation.Valid; import org.springframework.http.*; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/atendentes") @PreAuthorize("hasRole('ADMIN')")
public class AtendenteController{
 private final AtendenteService service; public AtendenteController(AtendenteService service){this.service=service;}
 @PostMapping public ResponseEntity<AtendenteResponse> cadastrar(@Valid @RequestBody AtendenteCreateRequest r){return ResponseEntity.status(HttpStatus.CREATED).body(service.cadastrar(r));}
 @GetMapping public ResponseEntity<List<AtendenteResponse>> listar(){return ResponseEntity.ok(service.listar());}
 @GetMapping("/{id}") public ResponseEntity<AtendenteResponse> buscar(@PathVariable Long id){return ResponseEntity.ok(service.buscar(id));}
}

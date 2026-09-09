package br.edu.unisales.atendimento.controller;
import br.edu.unisales.atendimento.dto.chamado.*; import br.edu.unisales.atendimento.service.ChamadoService; import jakarta.validation.Valid; import org.springframework.http.*; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/chamados")
public class ChamadoController{
 private final ChamadoService service; public ChamadoController(ChamadoService service){this.service=service;}
 @PostMapping public ResponseEntity<ChamadoResponse> abrir(@Valid @RequestBody ChamadoCreateRequest r){return ResponseEntity.status(HttpStatus.CREATED).body(service.abrir(r));}
 @GetMapping public ResponseEntity<List<ChamadoResponse>> listar(){return ResponseEntity.ok(service.listar());}
 @GetMapping("/{id}") public ResponseEntity<ChamadoResponse> buscar(@PathVariable Long id){return ResponseEntity.ok(service.buscarPorId(id));}
 @GetMapping("/protocolo/{protocolo}") public ResponseEntity<ChamadoResponse> protocolo(@PathVariable String protocolo){return ResponseEntity.ok(service.buscarPorProtocolo(protocolo));}
 @GetMapping("/cliente/{clienteId}") public ResponseEntity<List<ChamadoResponse>> cliente(@PathVariable Long clienteId){return ResponseEntity.ok(service.buscarPorCliente(clienteId));}
 @GetMapping("/cliente/cpf/{cpf}") @PreAuthorize("hasAnyRole('ADMIN','ATENDENTE')") public ResponseEntity<List<ChamadoResponse>> cpf(@PathVariable String cpf){return ResponseEntity.ok(service.buscarPorCpf(cpf));}
 @PatchMapping("/{id}/status") @PreAuthorize("hasAnyRole('ADMIN','ATENDENTE')") public ResponseEntity<ChamadoResponse> status(@PathVariable Long id,@Valid @RequestBody StatusChamadoRequest r){return ResponseEntity.ok(service.alterarStatus(id,r));}
 @PatchMapping("/{chamadoId}/atendente/{atendenteId}") @PreAuthorize("hasAnyRole('ADMIN','ATENDENTE')") public ResponseEntity<ChamadoResponse> atribuir(@PathVariable Long chamadoId,@PathVariable Long atendenteId){return ResponseEntity.ok(service.atribuirAtendente(chamadoId,atendenteId));}
 @PostMapping("/{id}/comentarios") public ResponseEntity<ComentarioResponse> comentario(@PathVariable Long id,@Valid @RequestBody ComentarioCreateRequest r){return ResponseEntity.status(HttpStatus.CREATED).body(service.adicionarComentario(id,r));}
 @GetMapping("/{id}/historico") public ResponseEntity<List<HistoricoResponse>> historico(@PathVariable Long id){return ResponseEntity.ok(service.historico(id));}
}

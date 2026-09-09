package br.edu.unisales.atendimento.controller;
import br.edu.unisales.atendimento.dto.relatorio.RelatorioChamadosResponse; import br.edu.unisales.atendimento.service.RelatorioService; import org.springframework.http.ResponseEntity; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/relatorios") @PreAuthorize("hasAnyRole('ADMIN','ATENDENTE')")
public class RelatorioController{private final RelatorioService service;public RelatorioController(RelatorioService service){this.service=service;}@GetMapping("/chamados") public ResponseEntity<RelatorioChamadosResponse> chamados(){return ResponseEntity.ok(service.resumo());}}

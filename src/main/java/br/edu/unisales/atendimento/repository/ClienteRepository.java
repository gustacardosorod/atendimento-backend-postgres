package br.edu.unisales.atendimento.repository;
import br.edu.unisales.atendimento.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ClienteRepository extends JpaRepository<Cliente,Long>{ Optional<Cliente> findByCpf(String cpf); Optional<Cliente> findByUsuarioEmailIgnoreCase(String email); boolean existsByCpf(String cpf); List<Cliente> findByUsuarioNomeContainingIgnoreCaseOrderByUsuarioNomeAsc(String nome); }

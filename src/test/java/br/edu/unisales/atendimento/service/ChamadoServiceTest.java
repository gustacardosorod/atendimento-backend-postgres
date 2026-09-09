package br.edu.unisales.atendimento.service;

import br.edu.unisales.atendimento.dto.chamado.*;
import br.edu.unisales.atendimento.entity.*;
import br.edu.unisales.atendimento.enums.*;
import br.edu.unisales.atendimento.exception.BusinessException;
import br.edu.unisales.atendimento.repository.*;
import br.edu.unisales.atendimento.security.CurrentUserService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChamadoServiceTest {
    @Mock ChamadoRepository chamados;
    @Mock ClienteRepository clientes;
    @Mock AtendenteRepository atendentes;
    @Mock ComentarioRepository comentarios;
    @Mock HistoricoChamadoRepository historicos;
    @Mock CurrentUserService current;
    ChamadoService service;

    @BeforeEach void setup(){service=new ChamadoService(chamados,clientes,atendentes,comentarios,historicos,current);}

    @Test void clienteAbreChamadoParaSiMesmo(){
        Usuario u=usuarioCliente(); Cliente c=cliente(u);
        when(current.getUsuarioAtual()).thenReturn(u);
        when(clientes.findByUsuarioEmailIgnoreCase(u.getEmail())).thenReturn(Optional.of(c));
        when(chamados.save(any(Chamado.class))).thenAnswer(i->i.getArgument(0));
        when(comentarios.findByChamadoIdOrderByDataCriacaoAsc(any())).thenReturn(List.of());
        ChamadoResponse res=service.abrir(new ChamadoCreateRequest("Problema no acesso","Não consigo acessar a plataforma desde ontem.",PrioridadeChamado.MEDIA,999L));
        assertEquals(StatusChamado.ABERTO,res.status());
        assertTrue(res.protocolo().startsWith("ATD-"));
        assertEquals("Maria Silva",res.cliente());
        verify(historicos).save(any(HistoricoChamado.class));
    }

    @Test void bloqueiaTransicaoAbertoParaEncerrado(){
        Usuario atendente=new Usuario();atendente.setNome("Atendente");atendente.setEmail("atendente@email.com");atendente.setPerfil(PerfilUsuario.ATENDENTE);atendente.setAtivo(true);
        Chamado ch=new Chamado();ch.setProtocolo("ATD-1");ch.setTitulo("Teste chamado");ch.setDescricao("Descrição suficiente para teste.");ch.setStatus(StatusChamado.ABERTO);ch.setPrioridade(PrioridadeChamado.MEDIA);ch.setCliente(cliente(usuarioCliente()));
        when(current.getUsuarioAtual()).thenReturn(atendente);
        when(chamados.findById(1L)).thenReturn(Optional.of(ch));
        BusinessException ex=assertThrows(BusinessException.class,()->service.alterarStatus(1L,new StatusChamadoRequest(StatusChamado.ENCERRADO)));
        assertTrue(ex.getMessage().contains("Transição de status não permitida"));
        verify(historicos,never()).save(any());
    }

    private Usuario usuarioCliente(){Usuario u=new Usuario();u.setNome("Maria Silva");u.setEmail("maria@email.com");u.setPerfil(PerfilUsuario.CLIENTE);u.setAtivo(true);return u;}
    private Cliente cliente(Usuario u){Cliente c=new Cliente();c.setCpf("12345678900");c.setTelefone("27999999999");c.setUsuario(u);return c;}
}

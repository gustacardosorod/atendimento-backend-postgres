package br.edu.unisales.atendimento.service;

import br.edu.unisales.atendimento.dto.cliente.*;
import br.edu.unisales.atendimento.entity.*;
import br.edu.unisales.atendimento.exception.BusinessException;
import br.edu.unisales.atendimento.repository.*;
import br.edu.unisales.atendimento.security.CurrentUserService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {
    @Mock ClienteRepository clientes;
    @Mock UsuarioRepository usuarios;
    @Mock PasswordEncoder encoder;
    @Mock CurrentUserService current;
    ClienteService service;

    @BeforeEach void setup(){ service=new ClienteService(clientes,usuarios,encoder,current); }

    @Test void deveCadastrarClienteQuandoDadosValidos(){
        ClienteCreateRequest req=new ClienteCreateRequest("Maria Silva","12345678900","maria@email.com","27999999999","Senha@123");
        when(usuarios.existsByEmailIgnoreCase("maria@email.com")).thenReturn(false);
        when(clientes.existsByCpf("12345678900")).thenReturn(false);
        when(encoder.encode("Senha@123")).thenReturn("HASH");
        when(usuarios.save(any(Usuario.class))).thenAnswer(i->i.getArgument(0));
        when(clientes.save(any(Cliente.class))).thenAnswer(i->i.getArgument(0));

        ClienteResponse res=service.cadastrar(req);
        assertEquals("Maria Silva",res.nome());
        assertEquals("***.456.789-**",res.cpf());
        assertEquals("maria@email.com",res.email());
        verify(usuarios).save(argThat(u->"HASH".equals(u.getSenha())));
        verify(clientes).save(any(Cliente.class));
    }

    @Test void naoDeveCadastrarEmailDuplicado(){
        ClienteCreateRequest req=new ClienteCreateRequest("Maria Silva","12345678900","maria@email.com","27999999999","Senha@123");
        when(usuarios.existsByEmailIgnoreCase("maria@email.com")).thenReturn(true);
        BusinessException ex=assertThrows(BusinessException.class,()->service.cadastrar(req));
        assertEquals("Já existe um usuário cadastrado com este e-mail.",ex.getMessage());
        verify(clientes,never()).save(any());
    }
}

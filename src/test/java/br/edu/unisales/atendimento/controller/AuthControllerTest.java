package br.edu.unisales.atendimento.controller;

import br.edu.unisales.atendimento.dto.auth.AuthResponse;
import br.edu.unisales.atendimento.dto.cliente.ClienteResponse;
import br.edu.unisales.atendimento.enums.PerfilUsuario;
import br.edu.unisales.atendimento.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.time.LocalDateTime;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest {
    MockMvc mvc; AuthService auth; ClienteService clientes;
    @BeforeEach void setup(){auth=mock(AuthService.class);clientes=mock(ClienteService.class);mvc=MockMvcBuilders.standaloneSetup(new AuthController(auth,clientes)).build();}

    @Test void login() throws Exception{
        when(auth.login(any())).thenReturn(new AuthResponse("token-jwt","Bearer",1L,"Maria","maria@email.com",PerfilUsuario.CLIENTE));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"maria@email.com\",\"senha\":\"Senha@123\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.token").value("token-jwt")).andExpect(jsonPath("$.perfil").value("CLIENTE"));
    }

    @Test void register() throws Exception{
        when(clientes.cadastrar(any())).thenReturn(new ClienteResponse(1L,10L,"Maria Silva","***.456.789-**","maria@email.com","27999999999",true, LocalDateTime.of(2026,8,23,10,0)));
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"Maria Silva\",\"cpf\":\"12345678900\",\"email\":\"maria@email.com\",\"telefone\":\"27999999999\",\"senha\":\"Senha@123\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.nome").value("Maria Silva")).andExpect(jsonPath("$.cpf").value("***.456.789-**"));
    }
}

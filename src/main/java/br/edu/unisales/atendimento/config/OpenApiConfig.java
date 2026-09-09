package br.edu.unisales.atendimento.config;
import io.swagger.v3.oas.models.*; import io.swagger.v3.oas.models.info.Info; import io.swagger.v3.oas.models.security.*; import org.springframework.context.annotation.*;
@Configuration
public class OpenApiConfig{
 @Bean OpenAPI api(){String n="bearerAuth";return new OpenAPI().info(new Info().title("Sistema de Atendimento ao Cliente API").version("1.0.0").description("API REST do Sistema de Gestão de Atendimento ao Cliente")).addSecurityItem(new SecurityRequirement().addList(n)).components(new Components().addSecuritySchemes(n,new SecurityScheme().name(n).type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));}
}

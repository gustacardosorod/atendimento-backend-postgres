package br.edu.unisales.atendimento.entity;
import br.edu.unisales.atendimento.enums.PerfilUsuario;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name="usuarios", uniqueConstraints=@UniqueConstraint(name="uk_usuario_email", columnNames="email"))
public class Usuario {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=120) private String nome;
    @Column(nullable=false,length=150) private String email;
    @Column(nullable=false,length=100) private String senha;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private PerfilUsuario perfil;
    @Column(nullable=false) private Boolean ativo=true;
    @Column(name="data_criacao",nullable=false,updatable=false) private LocalDateTime dataCriacao;
    @PrePersist public void prePersist(){ if(ativo==null) ativo=true; if(dataCriacao==null) dataCriacao=LocalDateTime.now(); }
    public Long getId(){return id;} public String getNome(){return nome;} public String getEmail(){return email;} public String getSenha(){return senha;}
    public PerfilUsuario getPerfil(){return perfil;} public Boolean getAtivo(){return ativo;} public LocalDateTime getDataCriacao(){return dataCriacao;}
    public void setNome(String v){nome=v;} public void setEmail(String v){email=v;} public void setSenha(String v){senha=v;} public void setPerfil(PerfilUsuario v){perfil=v;} public void setAtivo(Boolean v){ativo=v;}
}

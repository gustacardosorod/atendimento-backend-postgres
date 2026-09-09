package br.edu.unisales.atendimento.entity;
import jakarta.persistence.*;
@Entity
@Table(name="clientes",uniqueConstraints={@UniqueConstraint(name="uk_cliente_cpf",columnNames="cpf"),@UniqueConstraint(name="uk_cliente_usuario",columnNames="usuario_id")})
public class Cliente {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=11) private String cpf;
    @Column(length=20) private String telefone;
    @OneToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="usuario_id",nullable=false,foreignKey=@ForeignKey(name="fk_cliente_usuario")) private Usuario usuario;
    public Long getId(){return id;} public String getCpf(){return cpf;} public String getTelefone(){return telefone;} public Usuario getUsuario(){return usuario;}
    public void setCpf(String v){cpf=v;} public void setTelefone(String v){telefone=v;} public void setUsuario(Usuario v){usuario=v;}
}

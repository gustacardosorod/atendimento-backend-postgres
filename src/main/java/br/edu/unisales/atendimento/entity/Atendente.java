package br.edu.unisales.atendimento.entity;
import jakarta.persistence.*;
@Entity
@Table(name="atendentes",uniqueConstraints={@UniqueConstraint(name="uk_atendente_matricula",columnNames="matricula"),@UniqueConstraint(name="uk_atendente_usuario",columnNames="usuario_id")})
public class Atendente {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=30) private String matricula;
    @OneToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="usuario_id",nullable=false,foreignKey=@ForeignKey(name="fk_atendente_usuario")) private Usuario usuario;
    public Long getId(){return id;} public String getMatricula(){return matricula;} public Usuario getUsuario(){return usuario;}
    public void setMatricula(String v){matricula=v;} public void setUsuario(Usuario v){usuario=v;}
}

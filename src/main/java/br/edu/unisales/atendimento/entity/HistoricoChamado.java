package br.edu.unisales.atendimento.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name="historico_chamados",indexes={@Index(name="idx_historico_chamado",columnList="chamado_id"),@Index(name="idx_historico_data",columnList="data_evento")})
public class HistoricoChamado {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="chamado_id",nullable=false,foreignKey=@ForeignKey(name="fk_historico_chamado")) private Chamado chamado;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="usuario_id",foreignKey=@ForeignKey(name="fk_historico_usuario")) private Usuario usuario;
    @Column(nullable=false,length=50) private String acao;
    @Column(nullable=false,length=500) private String descricao;
    @Column(name="data_evento",nullable=false,updatable=false) private LocalDateTime dataEvento;
    @PrePersist public void prePersist(){if(dataEvento==null)dataEvento=LocalDateTime.now();}
    public Long getId(){return id;} public Chamado getChamado(){return chamado;} public Usuario getUsuario(){return usuario;} public String getAcao(){return acao;} public String getDescricao(){return descricao;} public LocalDateTime getDataEvento(){return dataEvento;}
    public void setChamado(Chamado v){chamado=v;} public void setUsuario(Usuario v){usuario=v;} public void setAcao(String v){acao=v;} public void setDescricao(String v){descricao=v;}
}

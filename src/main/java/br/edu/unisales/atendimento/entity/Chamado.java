package br.edu.unisales.atendimento.entity;
import br.edu.unisales.atendimento.enums.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name="chamados",indexes={@Index(name="idx_chamado_status",columnList="status"),@Index(name="idx_chamado_cliente",columnList="cliente_id"),@Index(name="idx_chamado_atendente",columnList="atendente_id"),@Index(name="idx_chamado_data_abertura",columnList="data_abertura")},uniqueConstraints=@UniqueConstraint(name="uk_chamado_protocolo",columnNames="protocolo"))
public class Chamado {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=40) private String protocolo;
    @Column(nullable=false,length=150) private String titulo;
    @Column(nullable=false,columnDefinition="TEXT") private String descricao;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=30) private StatusChamado status;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private PrioridadeChamado prioridade;
    @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="cliente_id",nullable=false,foreignKey=@ForeignKey(name="fk_chamado_cliente")) private Cliente cliente;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="atendente_id",foreignKey=@ForeignKey(name="fk_chamado_atendente")) private Atendente atendente;
    @Column(name="data_abertura",nullable=false,updatable=false) private LocalDateTime dataAbertura;
    @Column(name="data_encerramento") private LocalDateTime dataEncerramento;
    @PrePersist public void prePersist(){ if(dataAbertura==null)dataAbertura=LocalDateTime.now(); if(status==null)status=StatusChamado.ABERTO; if(prioridade==null)prioridade=PrioridadeChamado.MEDIA; }
    public Long getId(){return id;} public String getProtocolo(){return protocolo;} public String getTitulo(){return titulo;} public String getDescricao(){return descricao;} public StatusChamado getStatus(){return status;} public PrioridadeChamado getPrioridade(){return prioridade;} public Cliente getCliente(){return cliente;} public Atendente getAtendente(){return atendente;} public LocalDateTime getDataAbertura(){return dataAbertura;} public LocalDateTime getDataEncerramento(){return dataEncerramento;}
    public void setProtocolo(String v){protocolo=v;} public void setTitulo(String v){titulo=v;} public void setDescricao(String v){descricao=v;} public void setStatus(StatusChamado v){status=v;} public void setPrioridade(PrioridadeChamado v){prioridade=v;} public void setCliente(Cliente v){cliente=v;} public void setAtendente(Atendente v){atendente=v;} public void setDataEncerramento(LocalDateTime v){dataEncerramento=v;}
}

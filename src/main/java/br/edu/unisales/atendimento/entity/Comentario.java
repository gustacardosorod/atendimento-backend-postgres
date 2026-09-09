package br.edu.unisales.atendimento.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name="comentarios",indexes=@Index(name="idx_comentario_chamado",columnList="chamado_id"))
public class Comentario {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="chamado_id",nullable=false,foreignKey=@ForeignKey(name="fk_comentario_chamado")) private Chamado chamado;
    @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="autor_id",nullable=false,foreignKey=@ForeignKey(name="fk_comentario_autor")) private Usuario autor;
    @Column(nullable=false,columnDefinition="TEXT") private String texto;
    @Column(name="data_criacao",nullable=false,updatable=false) private LocalDateTime dataCriacao;
    @PrePersist public void prePersist(){if(dataCriacao==null)dataCriacao=LocalDateTime.now();}
    public Long getId(){return id;} public Chamado getChamado(){return chamado;} public Usuario getAutor(){return autor;} public String getTexto(){return texto;} public LocalDateTime getDataCriacao(){return dataCriacao;}
    public void setChamado(Chamado v){chamado=v;} public void setAutor(Usuario v){autor=v;} public void setTexto(String v){texto=v;}
}

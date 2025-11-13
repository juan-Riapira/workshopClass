package co.edu.uptc.GestionEstudiantes.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "code") // la columna en la BD se llama "code"
    private Long id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "average", nullable = false)
    private Double average;
}

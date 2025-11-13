package co.edu.uptc.GestionEstudiantes.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import co.edu.uptc.GestionEstudiantes.model.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {
    

    
} 
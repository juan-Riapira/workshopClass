package co.edu.uptc.GestionEstudiantes.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import co.edu.uptc.GestionEstudiantes.model.Student;
import co.edu.uptc.GestionEstudiantes.repository.StudentRepository;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    @Autowired
    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public Student createStudent(Student student) {
        // No asignar id: la BD lo generará
        student.setId(null);
        return studentRepository.save(student);
    }

    public List<Student> getAll() {
        return studentRepository.findAll();
    }

    public Student update(Long id, Student student) {
        Student s = studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found: " + id));
        s.setName(student.getName());
        s.setAverage(student.getAverage());
        // no cambiamos el id
        return studentRepository.save(s);
    }

    public void deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new IllegalArgumentException("Student not found: " + id);
        }
        studentRepository.deleteById(id);
    }

    public Student findById(Long id){
        return studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found: " + id));
    }
}

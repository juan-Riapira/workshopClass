package co.edu.uptc.GestionEstudiantes.controller;

import java.net.URI;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import co.edu.uptc.GestionEstudiantes.model.Student;
import co.edu.uptc.GestionEstudiantes.service.StudentService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/estudiantes")
public class StudentController {

    private final StudentService studentService;

    @Autowired
    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Student> saveStudent(@Valid @RequestBody Student student) {
        Student created = studentService.createStudent(student);
        Long id = created.getId();
        return ResponseEntity.created(URI.create("/api/estudiantes/" + id)).body(created);
    }

    // LIST ALL
    @GetMapping
    public ResponseEntity<List<Student>> list() {
        return ResponseEntity.ok(studentService.getAll());
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Student> get(@PathVariable Long id) {
        Student s = studentService.findById(id);
        return ResponseEntity.ok(s);
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Student> update(@PathVariable Long id, @Valid @RequestBody Student estudiante) {
        Student updated = studentService.update(id, estudiante);
        return ResponseEntity.ok(updated);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}

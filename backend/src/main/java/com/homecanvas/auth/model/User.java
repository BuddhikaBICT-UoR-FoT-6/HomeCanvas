package com.homecanvas.auth.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.homecanvas.iot.model.Device;
import java.time.LocalDateTime;
import java.util.List;


// User entity representing a user in the system 
@Entity
@Table(name = "users") // Maps to the "users" table in the database
@Data // Lombok annotation to generate getters, setters, toString, equals,
//  and hashCode methods
@NoArgsConstructor
@AllArgsConstructor
public class User {
    // this class represents a user in the system
    @Id // Marks this field as the primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-generates the ID value
    private Integer id;
    
    // The username field is unique and cannot be null
    @Column(nullable = false, unique = true)
    private String username;

    // named "password_hash" in the database, cannot be null 
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    // The role field indicates the user's role (e.g., "USER", "ADMIN") and cannot be null
    @Column(nullable = false)
    private String role;

    // The createdAt field stores the timestamp when the user was created, defaults to the current time
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // One-to-many relationship with Device, where one user can have many devices. 
    // The "mappedBy" attribute indicates that the "owner" field in the Device class
    // is the owner of the relationship. CascadeType.ALL means that any operation 
    // (persist, merge, remove, refresh, detach) performed on the User entity will
    //  be cascaded to the associated Device entities.
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Device> devices;
}

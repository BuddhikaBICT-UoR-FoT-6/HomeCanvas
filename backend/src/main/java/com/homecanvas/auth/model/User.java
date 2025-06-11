package com.homecanvas.auth.model;

import jakarta.persistence.*; 
import java.time.LocalDateTime;
import java.util.List;
import com.homecanvas.iot.model.Device;
import com.homecanvas.iot.model.Rule;

// User entity representing a user in the system 
@Entity
@Table(name = "users") // Maps to the "users" table in the database
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

    // One-to-many relationship with Device: a user can have multiple devices
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Device> devices;

    // One-to-many relationship with Rule: a user can have multiple rules
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Rule> rules;

    // Default constructor required by JPA 
    public User() {}

    // Getters and Setters 
    public Integer getId() { return id; } 
    public void setId(Integer id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<Device> getDevices() { return devices; }
    public void setDevices(List<Device> devices) { this.devices = devices; }

    public List<Rule> getRules() { return rules; }
    public void setRules(List<Rule> rules) { this.rules = rules; }

}

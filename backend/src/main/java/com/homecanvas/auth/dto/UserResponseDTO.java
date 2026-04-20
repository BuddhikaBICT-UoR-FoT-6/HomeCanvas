package com.homecanvas.auth.dto;

import java.time.LocalDateTime;

// used to send user information back to the client after successful registration or login.
public class UserResponseDTO {
    private Integer id;
    private String username;
    private String role;
    private LocalDateTime createdAt;
    private String token;

    public UserResponseDTO() {}

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}

package com.homecanvas.auth.dto;

// This DTO is used to capture the user registration data from the client. It includes fields 
// for username, password, confirm password, and role. The confirmPassword field is used to 
// ensure that the user has entered their desired password correctly by having them enter it 
// twice. The role field allows for assigning a specific role to the user during registration, 
// which can be used for authorization purposes later on. This DTO will be used in the registration 
// endpoint of the authentication controller to create new user accounts.
public class UserRegistrationDTO {
    private String username;
    private String password;
    private String confirmPassword;
    private String role;

    public UserRegistrationDTO() {}

    // Getters and Setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}

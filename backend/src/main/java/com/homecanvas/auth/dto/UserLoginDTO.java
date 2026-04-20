package com.homecanvas.auth.dto;

// used to capture the login credentials sent from the client during the authentication process. 
// It contains two fields: username and password, along with their respective getters and setters. 
// This class is typically used in the authentication controller to receive and process login 
// requests from users trying to access the system.
public class UserLoginDTO {
    private String username;
    private String password;

    public UserLoginDTO() {}

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

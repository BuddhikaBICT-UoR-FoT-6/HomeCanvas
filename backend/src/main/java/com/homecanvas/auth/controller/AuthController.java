package com.homecanvas.auth.controller;

// dto for user registration, login, and response 
import com.homecanvas.auth.dto.UserLoginDTO;
import com.homecanvas.auth.dto.UserRegistrationDTO;
import com.homecanvas.auth.dto.UserResponseDTO;
// service for user-related operations 
import com.homecanvas.auth.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity; // for building HTTP responses
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController // REST controller for authentication-related endpoints 
@RequestMapping("/api/auth") // Base path for all auth-related endpoints
@CrossOrigin(origins = "http://localhost:5173") // Allow CORS requests from the frontend running on localhost:5173
public class AuthController {
    // this class handles authentication-related HTTP requests such as registration and login 

    @Autowired
    private UserService userService;

    @PostMapping("/register") 
    public ResponseEntity<?> register(@RequestBody UserRegistrationDTO registrationDTO){
        // Handle user registration request and return appropriate response 
        try {
            UserResponseDTO user = userService.register(registrationDTO); // Call the service to register the 
            // user and get the response DTO 
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User registered successfully");
            response.put("data", user);
            return ResponseEntity.status(HttpStatus.CREATED).body(response); // Return a 201 Created response with
            // the user data in the body
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse); // Return a 400 Bad Request 
            // response with the error message in the body
        }
    }

    // Handle user login request and return appropriate response if the login is successful, return
    // a 200 OK response with the user data in the body; if the login fails, return a 401 Unauthorized
    // response with the error message in the body
    @PostMapping("/login") 
    public ResponseEntity<?> login(@RequestBody UserLoginDTO loginDTO){
        try {
            UserResponseDTO user = userService.login(loginDTO);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("data", user);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }   

    // Handle request to get user information by ID if the user is found, return a 200 OK response 
    // with the user data in the body; if the user is not found, return a 404 Not Found response with 
    // the error message in the body
    @GetMapping("/user/{id}")
    public ResponseEntity<?> getUser(@PathVariable Integer id){
        try {
            UserResponseDTO user = userService.getUserById(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", user);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    // Health check endpoint to verify that the backend is running and responsive returns a 200 OK 
    // response with a message indicating that the HomeCanvas Backend is running 
    @GetMapping("/health")
    public ResponseEntity<?> health(){
        Map<String, Object> response = new HashMap<>();
        response.put("status", "HomeCanvas Backend is running!");
        return ResponseEntity.ok(response);
    }
}

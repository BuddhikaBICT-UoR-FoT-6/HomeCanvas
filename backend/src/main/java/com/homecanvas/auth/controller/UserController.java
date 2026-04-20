package com.homecanvas.auth.controller;

import com.homecanvas.auth.dto.UserResponseDTO;
import com.homecanvas.auth.model.User;
import com.homecanvas.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            List<UserResponseDTO> responseDTOs = users.stream().map(this::convertToResponseDTO).collect(Collectors.toList());
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", responseDTOs);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        try {
            if (!userRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "User not found"));
            }
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "User not found"));
            }
            String newRole = payload.get("role");
            if (newRole != null && !newRole.trim().isEmpty()) {
                user.setRole(newRole.toUpperCase());
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("success", true, "message", "User role updated successfully", "data", convertToResponseDTO(user)));
            }
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Role is required"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    private UserResponseDTO convertToResponseDTO(User user) {
        UserResponseDTO responseDTO = new UserResponseDTO();
        responseDTO.setId(user.getId());
        responseDTO.setUsername(user.getUsername());
        responseDTO.setRole(user.getRole());
        responseDTO.setCreatedAt(user.getCreatedAt());
        return responseDTO;
    }
}

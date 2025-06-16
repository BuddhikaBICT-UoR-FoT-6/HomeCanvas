package com.homecanvas.auth.repository;

import com.homecanvas.auth.model.User; // import the User class from the model package
import org.springframework.data.jpa.repository.JpaRepository; // import JpaRepository for database operations
import java.util.Optional;

// UserRepository interface for performing CRUD operations on User entities 
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username); // Method to find a user by their username, returns an Optional<User> 
    // to handle the case where the user may not exist 
    boolean existsByUsername(String username); // Method to check if a user with the given username exists
}

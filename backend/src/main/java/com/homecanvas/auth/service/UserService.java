package com.homecanvas.auth.service;

// dto files are used to transfer data between layers of the application 
import com.homecanvas.auth.dto.UserLoginDTO;
import com.homecanvas.auth.dto.UserRegistrationDTO;
import com.homecanvas.auth.dto.UserResponseDTO;
import com.homecanvas.auth.exception.BadRequestException;
import com.homecanvas.auth.model.User;
import com.homecanvas.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired; // used for dependency injection
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service; // marks this class as a service component in the Spring context 
import java.util.Optional;

// Service class that contains business logic related to user management 
@Service
public class UserService {

    // Injecting the UserRepository to interact with the database and BCryptPasswordEncoder
    // for password hashing
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    // Method to register a new user takes a UserRegistrationDTO as input and returns a 
    // UserResponseDTO as output 
    public UserResponseDTO register(UserRegistrationDTO registrationDTO) {
        if (!registrationDTO.getPassword().equals(registrationDTO.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        if (userRepository.existsByUsername(registrationDTO.getUsername())) {
            throw new BadRequestException("Username is already in use");
        }

        // Create a new User entity and set its properties based on the registration DTO 
        User user = new User();
        user.setUsername(registrationDTO.getUsername());
        user.setPasswordHash(bCryptPasswordEncoder.encode(registrationDTO.getPassword()));
        user.setRole(registrationDTO.getRole() != null ? registrationDTO.getRole() : "USER");

        // Save the user to the database and convert the saved user to a UserResponseDTO before returning it 
        User savedUser = userRepository.save(user); 
        return convertToResponseDTO(savedUser);
    }

    // Method to authenticate a user takes a UserLoginDTO as input and returns a UserResponseDTO 
    // if the login is successful
    public UserResponseDTO login(UserLoginDTO loginDTO) {
        // Find the user by username using the UserRepository and check if the user exists and 
        // if the password matches
        Optional<User> optionalUser = userRepository.findByUsername(loginDTO.getUsername());

        // If the user does not exist or the password does not match, throw a BadRequestException 
        // with an appropriate message
        if (optionalUser.isEmpty()
                || !bCryptPasswordEncoder.matches(loginDTO.getPassword(), optionalUser.get().getPasswordHash())) {
            throw new BadRequestException("Invalid username or password");
        }

        return convertToResponseDTO(optionalUser.get());
    }

    // Method to retrieve a user by their ID takes an Integer userId as input and returns 
    // a UserResponseDTO if the user is found, otherwise throws a BadRequestException with a "User not found" message
    public UserResponseDTO getUserById(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        return convertToResponseDTO(user);
    }

    // Helper method to convert a User entity to a UserResponseDTO this method is used to 
    // create a UserResponseDTO from a User entity by copying the relevant properties 
    // (id, username, role, createdAt) from the User entity to the UserResponseDTO and 
    // then returning the UserResponseDTO
    private UserResponseDTO convertToResponseDTO(User user) {
        UserResponseDTO responseDTO = new UserResponseDTO();
        responseDTO.setId(user.getId());
        responseDTO.setUsername(user.getUsername());
        responseDTO.setRole(user.getRole());
        responseDTO.setCreatedAt(user.getCreatedAt());
        return responseDTO;
    }
}

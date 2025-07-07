package com.homecanvas.auth;

import org.springframework.boot.SpringApplication; // SpringApplication is a class 
// that provides a convenient way to bootstrap a Spring application from a main method. 
// It starts the embedded server and initializes the Spring context.
import org.springframework.boot.autoconfigure.SpringBootApplication; // @SpringBootApplication is 
// a convenience annotation that adds all of the following: @Configuration, @EnableAutoConfiguration, 
// and @ComponentScan.
import org.springframework.context.annotation.Bean; // @Bean is an annotation that 
// indicates that a method produces a bean to be managed by the Spring container. A bean is an object 
// that is instantiated, assembled, and otherwise managed by a Spring IoC container. 
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // BCryptPasswordEncoder is a
// class that provides a method to hash passwords using the BCrypt algorithm, which is
// a strong hashing function designed for password hashing.

// HomeCanvasAuthApplication is the entry point of the Spring Boot application. 
// It also defines a bean for BCryptPasswordEncoder, which is used for password
// hashing in the authentication process.
@SpringBootApplication
public class HomeCanvasAuthApplication {
    public static void main(String[] args) {
        // The main method is the entry point of the application. It calls 
        // SpringApplication.run() to launch the application. The run() 
        // method takes the class to be run and the command-line arguments as 
        // parameters.
        SpringApplication.run(HomeCanvasAuthApplication.class, args);
    }

    // This method is annotated with @Bean, which means that it will be managed by
    // the Spring container. When the application starts, Spring will call this 
    // method and register the returned BCryptPasswordEncoder instance as a bean 
    // in the application context. This allows other parts of the application to 
    // inject and use the BCryptPasswordEncoder for password hashing.
    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

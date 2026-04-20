package com.homecanvas.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Arrays;

// @Configuration indicates that this class is a configuration class that may contain bean definitions.
// @EnableWebSecurity enables Spring Security's web security support and provides the Spring MVC integration.
// The SecurityConfig class defines the security configuration for the application, including CORS settings and
// HTTP security rules. The filterChain method configures the security filter chain, while the corsConfigurationSource
// method defines the CORS configuration.
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    // Defines the security filter chain for the application. It configures CORS, disables CSRF protection, sets the session 
    // management to stateless, and defines authorization rules for HTTP requests. In this configuration, all requests to 
    // "/api/auth/**" are permitted without authentication, while all other requests are also permitted (this should be adjusted for production use).
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/devices/**").authenticated()
                .requestMatchers("/api/users/**").authenticated()
                .requestMatchers("/api/analytics/**").authenticated()
                .requestMatchers("/**").permitAll()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    // Defines the CORS configuration source for the application. It specifies the allowed origins, methods, headers, 
    // and other CORS properties. The allowed origins include local development servers on ports 5173, 5174, and 3000, 
    // as well as their 127.0.0.1 equivalents. The allowed methods include GET, POST, PUT, DELETE, OPTIONS, and PATCH. 
    // The allowed headers include all headers (*). Credentials are allowed, and the max age is set to 3600 seconds 
    // (1 hour). This configuration allows the frontend applications 
    // running on the specified origins to make cross-origin requests to the backend API.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:3000"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

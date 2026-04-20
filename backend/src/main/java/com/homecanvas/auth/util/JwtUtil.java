package com.homecanvas.auth.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    // Ideally, this should be in application.properties and loaded via @Value
    // Using a strong 256-bit key for HMAC-SHA256
    private static final String SECRET_KEY_STRING = "4qhq8LrEBfYcaRHxhdb9zURb2G8j7ZKV+MkwA0eOow0=";
    private final SecretKey secretKey;

    // Token validity: 24 hours
    private static final long JWT_TOKEN_VALIDITY = 24 * 60 * 60 * 1000;

    public JwtUtil() {
        // Initialize the SecretKey once
        byte[] decodedKey = java.util.Base64.getDecoder().decode(SECRET_KEY_STRING);
        this.secretKey = Keys.hmacShaKeyFor(decodedKey);
    }

    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    public String generateToken(String username, Integer userId, String role) {
        return Jwts.builder()
                .claim("userId", userId)
                .claim("role", role)
                .subject(username)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY))
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

    public Boolean validateToken(String token, String username) {
        final String extractedUsername = getUsernameFromToken(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }
    
    public Boolean validateToken(String token) {
        return !isTokenExpired(token);
    }
}

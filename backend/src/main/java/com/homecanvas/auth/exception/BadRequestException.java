package com.homecanvas.auth.exception;

/**
 * Exception thrown when a request is invalid or cannot be processed
 */
public class BadRequestException extends RuntimeException {
    
    public BadRequestException(String message) {
        super(message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}

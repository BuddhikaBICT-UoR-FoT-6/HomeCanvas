package com.homecanvas.auth.exception;

// Custom exception class that extends RuntimeException. This exception is thrown when 
// a requested resource is not found in the application. 
public class ResourceNotFoundException extends RuntimeException {
    // Constructor that accepts a message parameter, which is passed to the superclass
    // constructor. This message can be used to provide more details about the error 
    // when the exception is thrown.
    public ResourceNotFoundException(String message) {
        super(message);
    }

    // Constructor that accepts both a message and a cause. This allows
    // for chaining exceptions, where one exception can be caused by another. The message
    // provides details about the error, and the cause can be used to track the original
    // exception that led to this error.
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
    
}

package com.homecanvas.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// used to transfer basic user information, such as the user's ID and username, between different layers of 
// the application. It is a simplified representation of the User entity, containing only the essential fields 
// needed for certain operations, such as displaying user information in the dashboard or including user details 
// in device ownership data. The use of Lombok annotations helps to reduce boilerplate code by automatically 
// generating getters, setters, constructors, and other common methods.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserBasicDTO {

    private Integer id;
    private String username;
}

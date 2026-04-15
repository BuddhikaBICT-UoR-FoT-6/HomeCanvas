package com.homecanvas.iot.model;

import jakarta.persistence.*; // entity mapping is mapped to database tables
import lombok.AllArgsConstructor; // generates a constructor with 1 parameter
// for each field in the class whch is not initialized with a default value
import lombok.Data; // generates getters, setters, toString, equals, and hashCode methods
import lombok.NoArgsConstructor; // generates a no-argument constructor
import com.homecanvas.auth.model.User;
import java.time.LocalDateTime;

@Entity
@Table(name = "devices")
@Data
@NoArgsConstructor // generates a no-argument constructor which does not take any 
// parameters and initializes the object with default values
@AllArgsConstructor // generates a constructor with 1 parameter for each field in 
// the class which is not initialized with a default value
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // auto-generates the ID value using
    // the database's identity column feature
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY) // many devices can belong to one user, and the user data
    // is loaded lazily. Owner can be null for auto-registered devices until claimed by a user.
    @JoinColumn(name = "owner_id", nullable = true) // foreign key column "owner_id" in the "devices"
    // table, CAN be null to allow auto-register devices before user claims them 
    private User owner;

    @Column(unique = true, nullable = false, length = 17)
    private String macAddress;

    @Column(nullable = false)
    private String name;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Constructor without id and lastSeen, as these are auto-generated and managed by the system
    public Device(User owner, String macAddress, String name) {
        this.owner = owner;
        this.macAddress = macAddress;
        this.name = name;
    }

}

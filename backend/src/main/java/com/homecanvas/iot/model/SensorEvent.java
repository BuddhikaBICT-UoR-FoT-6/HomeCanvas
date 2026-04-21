package com.homecanvas.iot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_events")
@Data // Lombok annotation to generate getters, setters, toString, equals, and 
// hashCode methods
@NoArgsConstructor
@AllArgsConstructor
public class SensorEvent {
    // this class represents a sensor event in the system 

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false) // Many-to-one 
    // relationship with Device, a sensor event belongs to one device
    @JoinColumn(name = "device_id", nullable = false) // Foreign key column in the "sensor_events" table
    private Device device;

    @Column(nullable = false)
    private LocalDateTime timestamp; // Timestamp of the sensor event

    @Column(name = "light_level")
    private Integer lightLevel; // Light level reading, can be null if not applicable 

    @Column(name = "noise_level")
    private Integer noiseLevel; // Noise level reading, can be null if not applicable

    @Column(name = "motion_detected")
    private Boolean motionDetected; // Motion detected status, can be null if not applicable

    @Column(name = "vent_angle")
    private Integer ventAngle; // Servo angle (0, 45, or 90)

    @Column(name = "created_at")
    private LocalDateTime createdAt; // Timestamp when the sensor event was created

    // Constructor for creating a SensorEvent with required fields 
    public SensorEvent(Device device, LocalDateTime timestamp) {
        this.device = device; 
        this.timestamp = timestamp;
    }
}

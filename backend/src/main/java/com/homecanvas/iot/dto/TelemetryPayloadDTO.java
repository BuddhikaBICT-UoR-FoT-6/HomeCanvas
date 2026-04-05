package com.homecanvas.iot.dto;

import jakarta.validation.constraints.NotNull; // added for timestamp validation 
import jakarta.validation.constraints.NotBlank; // added for macAddress validation
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data // Lombok annotation to generate getters, setters, toString, equals, and hashCode methods
@NoArgsConstructor // Lombok annotation to generate a no-argument constructor
@AllArgsConstructor // Lombok annotation to generate an all-arguments constructor
public class TelemetryPayloadDTO {
    // This DTO represents the telemetry data sent from the device, including sensor readings and a timestamp.

    // The MAC address of the device sending the telemetry data, used to identify the device in the system.
    @NotBlank(message = "MAC address is required")
    private String macAddress;

    // The timestamp of when the telemetry data was recorded on the device. This is important for time-series analysis and correlating events.
    @NotNull(message = "Timestamp is required")
    private LocalDateTime timestamp = LocalDateTime.now(); // Default to now if not provided

    private Integer lightLevel;      // 0-1023 from LDR sensor
    private Integer noiseLevel;      // 0-1023 from sound sensor
    private Boolean motionDetected;  // true/false from PIR motion sensor
}

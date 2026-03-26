package com.homecanvas.iot.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryPayloadDTO {

    @NotBlank(message = "MAC address is required")
    private String macAddress;

    @NotNull(message = "Timestamp is required")
    private LocalDateTime timestamp;

    private Integer lightLevel;      // 0-1023 from LDR sensor
    private Integer noiseLevel;      // 0-1023 from sound sensor
    private Boolean motionDetected;  // true/false from PIR motion sensor
}

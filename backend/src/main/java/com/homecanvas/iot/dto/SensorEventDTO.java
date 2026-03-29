package com.homecanvas.iot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class SensorEventDTO {
    private Long id;
    private LocalDateTime timestamp;
    private Integer lightLevel;
    private Integer noiseLevel;
    private Boolean motionDetected;

}

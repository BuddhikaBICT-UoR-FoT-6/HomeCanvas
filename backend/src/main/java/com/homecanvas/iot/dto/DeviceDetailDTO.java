package com.homecanvas.iot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.homecanvas.auth.dto.UserBasicDTO;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceDetailDTO {

    private Integer id;
    private String macAddress;
    private String name;
    private UserBasicDTO owner; // null if device not yet claimed by user
    private LocalDateTime createdAt;
    private LocalDateTime lastSeen;
    private String onlineStatus; // "ONLINE", "OFFLINE", "UNKNOWN"
    private SensorEventDTO lastTelemetry; // latest sensor reading (null if no readings yet)
}
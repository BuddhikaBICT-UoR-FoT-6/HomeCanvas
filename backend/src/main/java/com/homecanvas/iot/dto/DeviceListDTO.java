package com.homecanvas.iot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceListDTO {
    private Long id;
    private String macAddress;
    private String name;
    private LocalDateTime lastSeen;
    private String onlineStatus;

}

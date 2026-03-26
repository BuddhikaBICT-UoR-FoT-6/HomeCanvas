package com.homecanvas.iot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceCommandDTO {

    private Boolean fanOn;           // true = activate relay for HVAC fan
    private Boolean ledOn;           // true = activate GPIO for LED
    private String lcdMessage;       // text to display on 16x2 LCD (optional)

    // Constructor for common case: just fan and led
    public DeviceCommandDTO(Boolean fanOn, Boolean ledOn) {
        this.fanOn = fanOn;
        this.ledOn = ledOn;
        this.lcdMessage = null;
    }
}

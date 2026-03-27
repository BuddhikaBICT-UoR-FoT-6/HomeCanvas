package com.homecanvas.iot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data // Lombok annotation to generate getters, setters, toString, equals, and hashCode methods
@NoArgsConstructor
@AllArgsConstructor
public class DeviceCommandDTO {
    // This DTO represents a command sent to a device, such as turning on the fan or LED, or 
    // displaying a message on the LCD.

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

package com.homecanvas.iot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data // Lombok annotation to generate getters, setters, toString, equals, and hashCode methods
@NoArgsConstructor
@AllArgsConstructor
public class DeviceCommandDTO {
    // This DTO represents a command sent to a device, such as turning on the fan or LED,
    // moving the servo to an angle, or displaying a value on the 4-digit display.

    private Boolean fanOn;           // true = rotate servo to 90°, false = 0°
    private Boolean ledOn;           // true = activate GPIO for LED
    private String lcdMessage;       // 4-char string for 7-segment / LCD display (optional)
    private Integer servoAngle;      // explicit servo angle override (0-180 degrees, optional)
    private Boolean resetFanAuto;    // true = clear manual override for fan
    private Boolean resetLedAuto;    // true = clear manual override for led

    // Constructor for common case: just fan and led
    public DeviceCommandDTO(Boolean fanOn, Boolean ledOn) {
        this.fanOn = fanOn;
        this.ledOn = ledOn;
        this.lcdMessage = null;
        this.servoAngle = null;
    }

    // Constructor for telemetry response with lcd message
    public DeviceCommandDTO(Boolean fanOn, Boolean ledOn, String lcdMessage) {
        this.fanOn = fanOn;
        this.ledOn = ledOn;
        this.lcdMessage = lcdMessage;
        this.servoAngle = null;
    }
}

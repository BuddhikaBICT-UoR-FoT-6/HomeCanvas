package com.homecanvas.iot.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Data Transfer Object for commands sent to ESP32.
 * 
 * Schema:
 * {
 *   "servoAngle": 90,        // Servo position: 0-90 degrees
 *   "ledState": true,        // LED state: on/off
 *   "confidence": 100,       // Occupancy confidence: 0-100 (or 999 for lockdown)
 *   "lockdown": false        // Security alert: triggers emergency protocols
 * }
 */
public class OccupancyCommandDTO {
    
    @JsonProperty("servoAngle")
    private Integer servoAngle;
    
    @JsonProperty("ledState")
    private Boolean ledState;
    
    @JsonProperty("confidence")
    private Integer confidence;
    
    @JsonProperty("lockdown")
    private Boolean lockdown;

    // Constructors
    public OccupancyCommandDTO() {
        this.servoAngle = 0;
        this.ledState = false;
        this.confidence = 0;
        this.lockdown = false;
    }

    public OccupancyCommandDTO(Integer servoAngle, Boolean ledState, Integer confidence, Boolean lockdown) {
        this.servoAngle = servoAngle;
        this.ledState = ledState;
        this.confidence = confidence;
        this.lockdown = lockdown;
    }

    // Getters & Setters
    public Integer getServoAngle() {
        return servoAngle;
    }

    public void setServoAngle(Integer servoAngle) {
        this.servoAngle = servoAngle != null ? Math.max(0, Math.min(90, servoAngle)) : 0;
    }

    public Boolean getLedState() {
        return ledState;
    }

    public void setLedState(Boolean ledState) {
        this.ledState = ledState != null ? ledState : false;
    }

    public Integer getConfidence() {
        return confidence;
    }

    public void setConfidence(Integer confidence) {
        this.confidence = confidence != null ? confidence : 0;
    }

    public Boolean getLockdown() {
        return lockdown;
    }

    public void setLockdown(Boolean lockdown) {
        this.lockdown = lockdown != null ? lockdown : false;
    }

    @Override
    public String toString() {
        return "OccupancyCommandDTO{" +
                "servoAngle=" + servoAngle +
                ", ledState=" + ledState +
                ", confidence=" + confidence +
                ", lockdown=" + lockdown +
                '}';
    }
}

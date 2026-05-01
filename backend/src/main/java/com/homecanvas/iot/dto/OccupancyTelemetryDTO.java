package com.homecanvas.iot.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Data Transfer Object for telemetry received from ESP32.
 * 
 * Schema:
 * {
 *   "pir": true,           // Motion detected (boolean)
 *   "sound": 1800,         // Sound level (0-4095)
 *   "light": 300,          // Light level (0-4095)
 *   "timestamp": "2026-04-28T14:30:00"  // ISO 8601 timestamp
 * }
 */
@Getter
@Setter
@ToString
@Builder
public class OccupancyTelemetryDTO {
    
    @JsonProperty("pir")
    private Boolean pir;
    
    @JsonProperty("sound")
    private Integer sound;
    
    @JsonProperty("light")
    private Integer light;
    
    @JsonProperty("timestamp")
    private String timestamp;
    
    // Legacy fields (for backward compatibility)
    private String macAddress;

    // Getters & Setters
    public Boolean getPir() {
        return pir;
    }

    public void setPir(Boolean pir) {
        this.pir = pir;
    }

    public Integer getSound() {
        return sound;
    }

    public void setSound(Integer sound) {
        this.sound = sound;
    }

    public Integer getLight() {
        return light;
    }

    public void setLight(Integer light) {
        this.light = light;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getMacAddress() {
        return macAddress;
    }

    public void setMacAddress(String macAddress) {
        this.macAddress = macAddress;
    }

    /**
     * Parse timestamp string to LocalDateTime.
     * Handles ISO 8601 format: 2026-04-28T14:30:00
     */
    public LocalDateTime getParsedTimestamp() {
        if (timestamp == null || timestamp.isEmpty()) {
            return LocalDateTime.now();
        }
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            return LocalDateTime.parse(timestamp, formatter);
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }

    @Override
    public String toString() {
        return "OccupancyTelemetryDTO{" +
                "pir=" + pir +
                ", sound=" + sound +
                ", light=" + light +
                ", timestamp='" + timestamp + '\'' +
                ", macAddress='" + macAddress + '\'' +
                '}';
    }
}

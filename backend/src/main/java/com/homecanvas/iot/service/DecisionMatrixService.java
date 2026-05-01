package com.homecanvas.iot.service;

import com.homecanvas.iot.dto.OccupancyCommandDTO;
import org.springframework.stereotype.Service;

/**
 * Decision Matrix Service - Action Determination Engine
 * 
 * Converts confidence scores and sensor data into actionable commands.
 * All physical actuation decisions are made here.
 * 
 * Decision Matrix:
 * ┌──────────────────┬─────────────┬──────────┬──────────┐
 * │ Confidence Score │ Servo Angle │ LED On   │ Lockdown │
 * ├──────────────────┼─────────────┼──────────┼──────────┤
 * │ 0 (Empty)        │ 0°          │ false    │ false    │
 * │ 40 (Tentative)   │ 45°         │ false    │ false    │
 * │ 60-100 (Occupied)│ 90°         │ see LDR  │ false    │
 * │ 999 (Lockdown)   │ 0°          │ true     │ true     │
 * └──────────────────┴─────────────┴──────────┴──────────┘
 * 
 * Lighting Logic:
 * - If room is OCCUPIED (score >= 60) AND light is DARK (< 150): LED = ON
 * - Otherwise: LED = OFF
 * - Exception: LOCKDOWN overrides with LED = ON for visibility
 */
@Service
public class DecisionMatrixService {
    
    // Constants
    private static final int LIGHT_DARK_THRESHOLD = 150;  // Light level threshold for darkness
    
    // Confidence levels
    private static final int CONFIDENCE_EMPTY = 0;
    private static final int CONFIDENCE_TENTATIVE = 40;
    private static final int CONFIDENCE_OCCUPIED = 60;
    private static final int CONFIDENCE_LOCKDOWN = 999;
    
    // Servo positions
    private static final int SERVO_CLOSED = 0;
    private static final int SERVO_TENTATIVE = 45;
    private static final int SERVO_OPEN = 90;

    /**
     * Make decision based on confidence score and light level.
     * 
     * @param confidence Occupancy confidence (0-100 or 999)
     * @param lightLevel Ambient light level (0-4095)
     * @return Command to execute on ESP32
     */
    public OccupancyCommandDTO makeDecision(int confidence, Integer lightLevel) {
        if (lightLevel == null) lightLevel = 0;
        
        // Safety bounds
        lightLevel = Math.max(0, Math.min(4095, lightLevel));
        
        OccupancyCommandDTO command = new OccupancyCommandDTO();
        command.setConfidence(confidence);

        // ==================== LOCKDOWN (Emergency) ====================
        if (confidence == CONFIDENCE_LOCKDOWN) {
            logDecision("LOCKDOWN", confidence);
            command.setServoAngle(SERVO_CLOSED);      // Close immediately
            command.setLedState(true);                // Blink for alert visibility
            command.setLockdown(true);                // Trigger emergency protocols
            return command;
        }

        // ==================== EMPTY ROOM ====================
        if (confidence == CONFIDENCE_EMPTY) {
            logDecision("EMPTY", confidence);
            command.setServoAngle(SERVO_CLOSED);
            command.setLedState(false);
            command.setLockdown(false);
            return command;
        }

        // ==================== TENTATIVE (Noise only, no motion) ====================
        if (confidence == CONFIDENCE_TENTATIVE) {
            logDecision("TENTATIVE (Noise detected, no motion)", confidence);
            command.setServoAngle(SERVO_TENTATIVE);   // Half-open (45°)
            command.setLedState(false);               // No lighting automation
            command.setLockdown(false);
            return command;
        }

        // ==================== OCCUPIED (Motion detected) ====================
        if (confidence >= CONFIDENCE_OCCUPIED) {
            logDecision("OCCUPIED", confidence);
            command.setServoAngle(SERVO_OPEN);        // Fully open (90°)
            
            // Lighting: ON if dark AND occupied, else OFF
            boolean isDark = lightLevel < LIGHT_DARK_THRESHOLD;
            boolean ledOn = isDark;
            command.setLedState(ledOn);
            
            logLighting(isDark, lightLevel, ledOn);
            command.setLockdown(false);
            return command;
        }

        // Default (should not reach)
        logDecision("DEFAULT", confidence);
        return new OccupancyCommandDTO();
    }

    /**
     * Determine if LED should be on based on occupancy and light level.
     * 
     * @param occupied True if room is occupied
     * @param lightLevel Ambient light (0-4095)
     * @return True if LED should be on
     */
    public boolean shouldLedBeOn(boolean occupied, int lightLevel) {
        if (!occupied) return false;  // Never light empty room
        
        boolean isDark = lightLevel < LIGHT_DARK_THRESHOLD;
        return isDark;  // Light only if dark
    }

    /**
     * Determine servo position based on occupancy.
     * 
     * @param confidence Occupancy confidence
     * @return Servo angle (0 = closed, 45 = tentative, 90 = open)
     */
    public int getServoAngle(int confidence) {
        if (confidence == CONFIDENCE_LOCKDOWN) return SERVO_CLOSED;
        if (confidence == CONFIDENCE_EMPTY) return SERVO_CLOSED;
        if (confidence == CONFIDENCE_TENTATIVE) return SERVO_TENTATIVE;
        if (confidence >= CONFIDENCE_OCCUPIED) return SERVO_OPEN;
        return SERVO_CLOSED;
    }

    // ========== Logging & Diagnostics ==========

    private void logDecision(String state, int confidence) {
        System.out.println("[DECISION] State: " + state + " | Confidence: " + confidence);
    }

    private void logLighting(boolean isDark, int lightLevel, boolean ledOn) {
        String darkness = isDark ? "DARK" : "BRIGHT";
        String ledState = ledOn ? "ON" : "OFF";
        System.out.println("[LIGHTING] Light=" + lightLevel + 
                          " (" + darkness + ") → LED=" + ledState);
    }

    /**
     * Get human-readable description of decision.
     * 
     * @param command The decision command
     * @return Description string
     */
    public String describeDecision(OccupancyCommandDTO command) {
        StringBuilder sb = new StringBuilder();
        sb.append("[COMMAND] ");
        sb.append("Servo=").append(command.getServoAngle()).append("° ");
        sb.append("LED=").append(command.getLedState() ? "ON" : "OFF").append(" ");
        sb.append("Confidence=").append(command.getConfidence());
        
        if (command.getLockdown()) {
            sb.append(" [LOCKDOWN ACTIVE]");
        }
        
        return sb.toString();
    }
}

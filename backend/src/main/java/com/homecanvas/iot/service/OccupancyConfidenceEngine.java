package com.homecanvas.iot.service;

import com.homecanvas.iot.dto.OccupancyTelemetryDTO;
import org.springframework.stereotype.Service;

/**
 * Occupancy Confidence Engine - Weighted Scoring System
 * 
 * Calculates a confidence score (0-100) based on sensor inputs.
 * This is the core intelligence of the smart home system.
 * 
 * Scoring Algorithm:
 * - PIR motion detected: +60 points
 * - Sound level > 1500: +40 points
 * - Total: 0, 40, 60, or 100 points
 * 
 * Special Case (Anomaly Detection):
 * - Sound > 3000: LOCKDOWN state (confidence = 999)
 */
@Service
public class OccupancyConfidenceEngine {
    
    // Thresholds (must match ESP32 firmware)
    private static final int SOUND_NOISE_THRESHOLD = 1500;    // Counts toward occupancy
    private static final int SOUND_GLASS_THRESHOLD = 3000;    // Emergency lockdown trigger
    
    // Scoring weights
    private static final int SCORE_MOTION = 60;               // PIR detection points
    private static final int SCORE_SOUND = 40;                // Sound level points
    private static final int SCORE_LOCKDOWN = 999;            // Special lockdown indicator

    /**
     * Calculate occupancy confidence score from sensor telemetry.
     * 
     * @param telemetry Sensor data from ESP32
     * @return Confidence score: 0 (empty), 40 (tentative), 60 (occupied), 100 (occupied+noise), 999 (lockdown)
     */
    public int calculateConfidence(OccupancyTelemetryDTO telemetry) {
        if (telemetry == null) {
            return 0;
        }
        
        return calculateConfidence(
            telemetry.getPir(),
            telemetry.getSound()
        );
    }

    /**
     * Calculate occupancy confidence from raw sensor values.
     * 
     * @param pir True if motion detected
     * @param sound Sound level (0-4095 typical range)
     * @return Confidence score
     */
    public int calculateConfidence(Boolean pir, Integer sound) {
        // Null safety
        if (pir == null) pir = false;
        if (sound == null) sound = 0;
        
        // SECURITY CHECK: Glass break anomaly detection
        if (sound > SOUND_GLASS_THRESHOLD) {
            logAnomaly("GLASS BREAK", sound);
            return SCORE_LOCKDOWN;  // 999 - Special lockdown state
        }
        
        // Standard scoring
        int confidence = 0;
        
        // Motion detection: +60 points
        if (pir) {
            confidence += SCORE_MOTION;
            logScore("PIR motion detected", SCORE_MOTION);
        }
        
        // Noise detection: +40 points
        if (sound > SOUND_NOISE_THRESHOLD) {
            confidence += SCORE_SOUND;
            logScore("Sound level > 1500", SCORE_SOUND);
        }
        
        logResult(confidence, pir, sound);
        return confidence;
    }

    /**
     * Determine occupancy state from confidence score.
     * 
     * @param confidence Confidence score (0-100 or 999)
     * @return Human-readable occupancy state
     */
    public String getOccupancyState(int confidence) {
        switch (confidence) {
            case 0:
                return "EMPTY";
            case 40:
                return "TENTATIVE (Noise only)";
            case 60:
            case 100:
                return "OCCUPIED";
            case 999:
                return "LOCKDOWN (Emergency)";
            default:
                return "UNKNOWN";
        }
    }

    /**
     * Check if room is occupied.
     * 
     * @param confidence Confidence score
     * @return True if confidence >= 60
     */
    public boolean isOccupied(int confidence) {
        return confidence >= 60 && confidence != 999;
    }

    /**
     * Check if security lockdown is active.
     * 
     * @param confidence Confidence score
     * @return True if confidence == 999
     */
    public boolean isLockdownActive(int confidence) {
        return confidence == 999;
    }

    // ========== Logging Helpers ==========

    private void logScore(String reason, int points) {
        System.out.println("[CONFIDENCE] + " + points + " pts: " + reason);
    }

    private void logResult(int confidence, Boolean pir, Integer sound) {
        System.out.println("[CONFIDENCE] Final Score: " + confidence + 
                          " | PIR=" + pir + 
                          " | Sound=" + sound);
    }

    private void logAnomaly(String type, Integer sound) {
        System.out.println("[SECURITY] ANOMALY DETECTED: " + type + 
                          " (Sound=" + sound + ") -> LOCKDOWN");
    }
}

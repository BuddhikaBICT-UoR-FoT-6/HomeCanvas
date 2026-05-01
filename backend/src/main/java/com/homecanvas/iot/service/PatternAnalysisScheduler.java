package com.homecanvas.iot.service;

import com.homecanvas.iot.model.Device;
import com.homecanvas.iot.model.OccupancyPattern;
import com.homecanvas.iot.model.SensorEvent;
import com.homecanvas.iot.repository.DeviceRepository;
import com.homecanvas.iot.repository.OccupancyPatternRepository;
import com.homecanvas.iot.repository.SensorEventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Pattern Analysis Scheduler
 * 
 * Runs daily (2 AM) to analyze 7-day historical sensor data
 * Uses Gemini AI to generate occupancy predictions
 * Stores results in occupancy_patterns table for dashboard display
 */
@Service
@EnableScheduling
@Slf4j
public class PatternAnalysisScheduler {

    @Autowired
    private SensorEventRepository sensorEventRepository;

    @Autowired
    private OccupancyPatternRepository patternRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private GeminiAIService geminiService;

    /**
     * Daily pattern analysis: 2 AM every day
     * Analyzes: Last 7 days of sensor data
     * Output: OccupancyPattern entity with AI predictions
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void analyzeOccupancyPatterns() {
        log.info("╔════════════════════════════════════════════════════════════╗");
        log.info("║     Starting Daily Occupancy Pattern Analysis              ║");
        log.info("║     Time window: Last 7 days of sensor data               ║");
        log.info("╚════════════════════════════════════════════════════════════╝");

        try {
            // Get all active devices
            List<Device> devices = deviceRepository.findAll();
            LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

            for (Device device : devices) {
                log.info("[SCHEDULER] Analyzing patterns for device: {}", device.getMacAddress());

                // Fetch sensor events for this device
                List<SensorEvent> historicalData = sensorEventRepository
                    .findByDeviceAndTimestampAfter(device, sevenDaysAgo);

                if (historicalData.isEmpty()) {
                    log.warn("[SCHEDULER] No sensor data for device: {}", device.getMacAddress());
                    continue;
                }

                try {
                    // Get AI prediction
                    String prediction = geminiService.predictOccupancyPattern(historicalData);

                    // Calculate occupancy metrics
                    long occupiedCount = historicalData.stream()
                        .filter(SensorEvent::getMotionDetected)
                        .count();
                    double occupancyPercentage = (double) occupiedCount / historicalData.size() * 100;
                    double confidenceScore = Math.min(1.0, occupancyPercentage / 100.0);

                    // Save pattern to database
                    OccupancyPattern pattern = OccupancyPattern.builder()
                        .device(device)
                        .dateGenerated(LocalDateTime.now())
                        .pattern(prediction)
                        .summary(extractSummary(prediction))
                        .occupancyPercentage(occupancyPercentage)
                        .confidenceScore(confidenceScore)
                        .build();

                    patternRepository.save(pattern);

                    log.info("[SCHEDULER] ✓ Pattern saved for {}: Occupancy: {:.1f}%, Confidence: {:.2f}",
                        device.getMacAddress(),
                        occupancyPercentage,
                        confidenceScore);

                } catch (Exception e) {
                    log.error("[SCHEDULER] Failed to analyze device {}: {}",
                        device.getMacAddress(), e.getMessage());
                }
            }

            log.info("[SCHEDULER] Daily pattern analysis completed");

        } catch (Exception e) {
            log.error("[SCHEDULER] Critical error in pattern analysis: {}", e.getMessage(), e);
        }
    }

    /**
     * Extract first 1-2 sentences for quick summary
     */
    private String extractSummary(String pattern) {
        if (pattern == null || pattern.isEmpty()) {
            return "No summary available";
        }

        // Get first sentence(s) up to 150 chars
        String[] sentences = pattern.split("[.!?]");
        if (sentences.length == 0) return pattern;

        String summary = sentences[0].trim();
        if (sentences.length > 1 && summary.length() < 100) {
            summary += ". " + sentences[1].trim();
        }

        return summary.length() > 150 ? summary.substring(0, 147) + "..." : summary;
    }

    /**
     * Manual trigger for testing (call from REST endpoint)
     */
    public void triggerManualAnalysis(String deviceMacAddress) {
        log.info("[SCHEDULER] Manual analysis triggered for device: {}", deviceMacAddress);

        Device device = deviceRepository.findByMacAddress(deviceMacAddress).orElse(null);
        if (device == null) {
            log.warn("[SCHEDULER] Device not found: {}", deviceMacAddress);
            return;
        }

        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<SensorEvent> historicalData = sensorEventRepository
            .findByDeviceAndTimestampAfter(device, sevenDaysAgo);

        if (historicalData.isEmpty()) {
            log.warn("[SCHEDULER] No data available for analysis");
            return;
        }

        try {
            String prediction = geminiService.predictOccupancyPattern(historicalData);
            
            long occupiedCount = historicalData.stream()
                .filter(SensorEvent::getMotionDetected)
                .count();
            double occupancyPercentage = (double) occupiedCount / historicalData.size() * 100;

            OccupancyPattern pattern = OccupancyPattern.builder()
                .device(device)
                .dateGenerated(LocalDateTime.now())
                .pattern(prediction)
                .summary(extractSummary(prediction))
                .occupancyPercentage(occupancyPercentage)
                .confidenceScore(Math.min(1.0, occupancyPercentage / 100.0))
                .build();

            patternRepository.save(pattern);
            log.info("[SCHEDULER] ✓ Manual analysis completed");

        } catch (Exception e) {
            log.error("[SCHEDULER] Manual analysis failed: {}", e.getMessage(), e);
        }
    }
}

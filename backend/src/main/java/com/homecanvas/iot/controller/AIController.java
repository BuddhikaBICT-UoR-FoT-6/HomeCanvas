package com.homecanvas.iot.controller;

import com.homecanvas.iot.model.Device;
import com.homecanvas.iot.model.OccupancyPattern;
import com.homecanvas.iot.repository.DeviceRepository;
import com.homecanvas.iot.repository.OccupancyPatternRepository;
import com.homecanvas.iot.service.GeminiAIService;
import com.homecanvas.iot.service.PatternAnalysisScheduler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * AI & Analytics Controller
 * 
 * Endpoints for:
 * - Getting occupancy predictions
 * - Viewing AI insights
 * - Triggering manual analysis
 * - Monitoring Gemini API status
 */
@RestController
@RequestMapping("/api/iot/ai")
@Slf4j
public class AIController {

    @Autowired
    private GeminiAIService geminiService;

    @Autowired
    private OccupancyPatternRepository patternRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private PatternAnalysisScheduler patternScheduler;

    /**
     * GET /api/iot/ai/insights
     * 
     * Get latest AI insights for all devices
     * Used by Analytics dashboard
     */
    @GetMapping("/insights")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getInsights() {
        try {
            List<Device> devices = deviceRepository.findAll();
            List<Map<String, Object>> deviceInsights = new ArrayList<>();

            for (Device device : devices) {
                Optional<OccupancyPattern> latestPattern = 
                    patternRepository.findFirstByDeviceOrderByDateGeneratedDesc(device);

                if (latestPattern.isPresent()) {
                    OccupancyPattern pattern = latestPattern.get();
                    deviceInsights.add(Map.of(
                        "deviceId", device.getId(),
                        "macAddress", device.getMacAddress(),
                        "prediction", pattern.getPattern(),
                        "summary", pattern.getSummary(),
                        "occupancyPercentage", pattern.getOccupancyPercentage(),
                        "confidence", pattern.getConfidenceScore(),
                        "generatedAt", pattern.getDateGenerated().toString()
                    ));
                }
            }

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "deviceCount", devices.size(),
                "insights", deviceInsights,
                "aiServiceAvailable", geminiService.isServiceAvailable(),
                "timestamp", LocalDateTime.now().toString()
            ));

        } catch (Exception e) {
            log.error("[AI_CONTROLLER] Error fetching insights: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * GET /api/iot/ai/pattern/{deviceId}
     * 
     * Get occupancy pattern for specific device
     */
    @GetMapping("/pattern/{deviceId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getDevicePattern(@PathVariable Long deviceId) {
        try {
            Device device = deviceRepository.findById(deviceId).orElse(null);
            if (device == null) {
                return ResponseEntity.notFound().build();
            }

            Optional<OccupancyPattern> pattern = 
                patternRepository.findFirstByDeviceOrderByDateGeneratedDesc(device);

            if (pattern.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "status", "no_data",
                    "message", "No pattern data available yet. System will generate first analysis at 2 AM."
                ));
            }

            OccupancyPattern p = pattern.get();
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "deviceId", deviceId,
                "pattern", p.getPattern(),
                "summary", p.getSummary(),
                "occupancyPercentage", p.getOccupancyPercentage(),
                "confidence", p.getConfidenceScore(),
                "generatedAt", p.getDateGenerated().toString()
            ));

        } catch (Exception e) {
            log.error("[AI_CONTROLLER] Error fetching device pattern: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * GET /api/iot/ai/history/{deviceId}
     * 
     * Get pattern history for a device (last 30 days)
     */
    @GetMapping("/history/{deviceId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getPatternHistory(
        @PathVariable Long deviceId,
        @RequestParam(defaultValue = "30") int days
    ) {
        try {
            Device device = deviceRepository.findById(deviceId).orElse(null);
            if (device == null) {
                return ResponseEntity.notFound().build();
            }

            LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
            List<OccupancyPattern> patterns = patternRepository
                .findByDeviceAndDateGeneratedAfter(device, cutoff);

            List<Map<String, Object>> history = new ArrayList<>();
            for (OccupancyPattern p : patterns) {
                history.add(Map.of(
                    "date", p.getDateGenerated().toString(),
                    "summary", p.getSummary(),
                    "occupancy", p.getOccupancyPercentage(),
                    "confidence", p.getConfidenceScore()
                ));
            }

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "deviceId", deviceId,
                "days", days,
                "recordCount", history.size(),
                "history", history
            ));

        } catch (Exception e) {
            log.error("[AI_CONTROLLER] Error fetching pattern history: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * POST /api/iot/ai/analyze/{deviceId}
     * 
     * Manually trigger analysis for a device
     * Admin only - used for testing
     */
    @PostMapping("/analyze/{deviceId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> manualAnalysis(@PathVariable Long deviceId) {
        try {
            Device device = deviceRepository.findById(deviceId).orElse(null);
            if (device == null) {
                return ResponseEntity.notFound().build();
            }

            log.info("[AI_CONTROLLER] Manual analysis triggered for device: {}", device.getMacAddress());
            patternScheduler.triggerManualAnalysis(device.getMacAddress());

            // Fetch the newly created pattern
            Optional<OccupancyPattern> pattern = 
                patternRepository.findFirstByDeviceOrderByDateGeneratedDesc(device);

            if (pattern.isPresent()) {
                OccupancyPattern p = pattern.get();
                return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Analysis completed",
                    "pattern", p.getPattern(),
                    "occupancy", p.getOccupancyPercentage(),
                    "confidence", p.getConfidenceScore()
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "status", "pending",
                    "message", "Analysis in progress"
                ));
            }

        } catch (Exception e) {
            log.error("[AI_CONTROLLER] Manual analysis error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * GET /api/iot/ai/status
     * 
     * Check Gemini API status and rate limits
     */
    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getAIStatus() {
        try {
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "geminiAvailable", geminiService.isServiceAvailable(),
                "rateLimit", geminiService.getRateLimitStatus(),
                "timestamp", LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * GET /api/iot/ai/health
     * 
     * Health check for AI service
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "timestamp", System.currentTimeMillis()
        ));
    }
}

package com.homecanvas.iot.controller;

import com.homecanvas.iot.service.DataSimulatorService;
import com.homecanvas.iot.service.MqttTelemetrySubscriber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Simulation Controller (DEBUG MODE)
 * 
 * Secret endpoints for controlling the data simulator
 * Generates realistic sensor data without ESP32 hardware
 * 
 * Activation:
 *   java -Ddebug.mode=true -jar backend.jar
 *   OR: export DEBUG_MODE=true
 * 
 * Endpoints:
 *   POST /api/simulation/start    - Start data generation
 *   POST /api/simulation/stop     - Stop data generation
 *   GET  /api/simulation/status   - Check simulator status
 */
@RestController
@RequestMapping("/api/simulation")
@Slf4j
public class SimulationController {

    @Autowired
    private DataSimulatorService simulatorService;

    @Autowired
    private MqttTelemetrySubscriber telemetrySubscriber;

    @Value("${debug.mode:false}")
    private boolean debugModeEnabled;

    @Value("${debug.simulator.enabled:false}")
    private boolean simulatorEnabled;

    /**
     * POST /api/simulation/start
     * 
     * Start the data simulator
     * Generates realistic sensor telemetry data
     * Data is processed through the same pipeline as real ESP32
     */
    @PostMapping("/start")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> startSimulation() {
        if (!debugModeEnabled && !simulatorEnabled) {
            return ResponseEntity.status(403).body(Map.of(
                "status", "error",
                "message", "Debug mode not enabled. Start with: java -Ddebug.mode=true -jar backend.jar"
            ));
        }

        if (simulatorService.isRunning()) {
            return ResponseEntity.ok(Map.of(
                "status", "already_running",
                "message", "Simulator is already generating data"
            ));
        }

        try {
            simulatorService.startSimulation();
            
            // Register simulator to feed data into MQTT pipeline
            simulatorService.registerCallback(telemetrySubscriber::processSimulatedTelemetry);

            log.info("[SIMULATION] ✓ Simulator started - generating realistic sensor data");

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Data simulator started",
                "features", Map.of(
                    "motion_simulation", "Realistic PIR patterns by hour",
                    "sound_simulation", "500-3500 Hz with glass break events (3000+ Hz)",
                    "light_simulation", "Follows natural day/night cycle",
                    "data_interval", "1 second per telemetry event"
                ),
                "startedAt", LocalDateTime.now().toString()
            ));

        } catch (Exception e) {
            log.error("[SIMULATION] Failed to start simulator: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * POST /api/simulation/stop
     * 
     * Stop the data simulator
     */
    @PostMapping("/stop")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> stopSimulation() {
        if (!simulatorService.isRunning()) {
            return ResponseEntity.ok(Map.of(
                "status", "not_running",
                "message", "Simulator is not currently active"
            ));
        }

        try {
            simulatorService.stopSimulation();
            log.info("[SIMULATION] ✓ Simulator stopped");

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Data simulator stopped",
                "stoppedAt", LocalDateTime.now().toString()
            ));

        } catch (Exception e) {
            log.error("[SIMULATION] Failed to stop simulator: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * GET /api/simulation/status
     * 
     * Check simulator status and configuration
     */
    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "debugModeEnabled", debugModeEnabled,
            "simulatorEnabled", simulatorEnabled,
            "isRunning", simulatorService.isRunning(),
            "configuration", Map.of(
                "interval_ms", "1000",
                "pir_probability", "Varies by hour (6-21%)",
                "sound_range", "500-3500 Hz",
                "light_range", "100-4000 (10-bit ADC)",
                "glass_break_probability", "~1 per 20 minutes"
            ),
            "features", Map.of(
                "motion_clustering", "Consecutive motion events (1-5 in a row)",
                "temporal_awareness", "Different patterns for morning/afternoon/night",
                "noise_simulation", "Smooth transitions, realistic variance",
                "anomaly_injection", "Automatic glass break simulation"
            ),
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * GET /api/simulation/info
     * 
     * Information about debug mode (Publicly accessible for demo)
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getInfo() {
        return ResponseEntity.ok(Map.of(
            "debugMode", "Secret Data Simulator",
            "purpose", "Development and testing without ESP32 hardware",
            "activation", "java -Ddebug.mode=true -jar backend.jar",
            "or", "export DEBUG_MODE=true",
            "endpoints", Map.of(
                "start", "POST /api/simulation/start",
                "stop", "POST /api/simulation/stop",
                "status", "GET /api/simulation/status",
                "info", "GET /api/simulation/info"
            ),
            "features", new String[]{
                "Generates realistic sensor data patterns",
                "Motion detection by time of day (sleep/active hours)",
                "Sound level variations with glass break anomalies",
                "Light levels following natural day/night cycle",
                "Processes through same MQTT pipeline as real hardware",
                "Enables testing without ES P32 hardware"
            },
            "warning", "For development use only. Do not use in production."
        ));
    }
}

package com.homecanvas.iot.service;

import com.homecanvas.iot.dto.OccupancyTelemetryDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import com.homecanvas.auth.repository.UserRepository;
import com.homecanvas.auth.model.User;
import com.homecanvas.iot.model.Device;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import jakarta.annotation.PostConstruct;

/**
 * SECRET DEBUG MODE: Data Simulator Service
 * 
 * Generates realistic sensor data when ESP32 hardware is not available
 * Useful for development, testing, and CI/CD pipelines
 * 
 * Features:
 * 1. Realistic sensor patterns throughout the day
 * 2. Periodic motion detection events
 * 3. Sound level variations (including glass break simulation)
 * 4. Light level based on time of day
 * 5. Configurable via application.properties
 * 
 * Activation:
 *   java -Ddebug.mode=true -jar backend.jar
 *   export DEBUG_MODE=true
 */
@Service
@Slf4j
public class DataSimulatorService {

    @Value("${debug.simulator.enabled:false}")
    private boolean simulatorEnabled;

    @Value("${debug.simulator.interval:1000}")
    private long simulationInterval;

    @Value("${debug.simulator.pir.probability:0.6}")
    private double pirProbability;

    @Value("${debug.simulator.sound.min:500}")
    private int soundMin;

    @Value("${debug.simulator.sound.max:3500}")
    private int soundMax;

    @Value("${debug.simulator.light.min:100}")
    private int lightMin;

    @Value("${debug.simulator.light.max:4000}")
    private int lightMax;

    private final Random random = new Random();
    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
    private final AtomicBoolean isSimulating = new AtomicBoolean(false);
    private final List<SimulationCallback> callbacks = Collections.synchronizedList(new ArrayList<>());

    @Autowired
    private UserRepository userRepository;

    @Autowired
    @Lazy
    private IotService iotService;

    @PostConstruct
    public void init() {
        // Automatically start simulation loop on startup
        // It will only generate data if GUEST users exist
        startSimulation();
    }

    // Simulation state tracking
    private int lastSoundLevel = 1000;
    private int motionEventCounter = 0;
    private LocalDateTime lastGlassBreakEvent = LocalDateTime.now().minusHours(1);

    public interface SimulationCallback {
        void onSimulatedData(OccupancyTelemetryDTO telemetry);
    }

    /**
     * Start the simulator - generates fake sensor data continuously
     */
    public void startSimulation() {
        if (isSimulating.getAndSet(true)) {
            log.warn("[SIMULATOR] Already running");
            return;
        }

        log.info("╔════════════════════════════════════════════════════════════╗");
        log.info("║     🔧 SECRET DEBUG MODE ACTIVATED - DATA SIMULATOR        ║");
        log.info("║  Generating realistic sensor data without ESP32 hardware   ║");
        log.info("╚════════════════════════════════════════════════════════════╝");
        log.info("[SIMULATOR] Starting data generation at {} ms interval", simulationInterval);

        executor.scheduleAtFixedRate(
            this::generateNextTelemetry,
            0,
            simulationInterval,
            TimeUnit.MILLISECONDS
        );
    }

    /**
     * Stop the simulator
     */
    public void stopSimulation() {
        if (!isSimulating.getAndSet(false)) {
            log.warn("[SIMULATOR] Not running");
            return;
        }

        log.info("[SIMULATOR] Stopping data generation");
        executor.shutdown();
    }

    /**
     * Register callback to receive simulated data
     */
    public void registerCallback(SimulationCallback callback) {
        callbacks.add(callback);
        log.debug("[SIMULATOR] Callback registered, total: {}", callbacks.size());
    }

    /**
     * Remove callback
     */
    public void unregisterCallback(SimulationCallback callback) {
        callbacks.remove(callback);
    }

    /**
     * Check if simulator is running
     */
    public boolean isRunning() {
        return isSimulating.get();
    }

    /**
     * Get current simulation status
     */
    public String getStatus() {
        return String.format(
            "{\"enabled\": %b, \"running\": %b, \"interval\": %d, \"callbacks\": %d}",
            simulatorEnabled,
            isSimulating.get(),
            simulationInterval,
            callbacks.size()
        );
    }

    // ==================== INTERNAL GENERATION LOGIC ====================

    /**
     * Generate next realistic sensor data point
     */
    private void generateNextTelemetry() {
        try {
            LocalDateTime now = LocalDateTime.now();
            
            // Find all guest users
            List<User> guests = userRepository.findByRole("GUEST");
            if (guests.isEmpty()) {
                return;
            }

            for (User guest : guests) {
                if (guest.getDevices() == null) continue;
                
                for (Device device : guest.getDevices()) {
                    // Determine realistic sensor values for this specific device
                    boolean motionDetected = simulateMotionDetection(now);
                    int soundLevel = simulateSoundLevel(now, motionDetected);
                    int lightLevel = simulateLightLevel(now);

                    OccupancyTelemetryDTO telemetry = OccupancyTelemetryDTO.builder()
                        .macAddress(device.getMacAddress())
                        .pir(motionDetected)
                        .sound(soundLevel)
                        .light(lightLevel)
                        .timestamp(now.toString())
                        .build();

                    // Process through the standard IoT pipeline (persists to DB)
                    iotService.processTelemetry(telemetry);
                    
                    // Notify any active observers (like the debug log)
                    for (SimulationCallback callback : callbacks) {
                        try {
                            callback.onSimulatedData(telemetry);
                        } catch (Exception e) {
                            // ignore callback errors
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.error("[SIMULATOR] Generation error: {}", e.getMessage());
        }
    }

    /**
     * Simulate realistic motion detection based on time of day
     * Morning/Evening: Higher probability
     * Night: Lower probability
     * Midday: Varies
     */
    private boolean simulateMotionDetection(LocalDateTime now) {
        int hour = now.getHour();
        double adjustedProbability = pirProbability;

        // Adjust probability based on hour
        if (hour >= 6 && hour < 9) {
            adjustedProbability = 0.85;  // Morning busy
        } else if (hour >= 9 && hour < 12) {
            adjustedProbability = 0.40;  // Morning lessActive
        } else if (hour >= 12 && hour < 14) {
            adjustedProbability = 0.50;  // Lunch time
        } else if (hour >= 14 && hour < 17) {
            adjustedProbability = 0.30;  // Afternoon quiet
        } else if (hour >= 17 && hour < 21) {
            adjustedProbability = 0.75;  // Evening active
        } else if (hour >= 21 || hour < 6) {
            adjustedProbability = 0.10;  // Night sleep time
        }

        // Sometimes generate motion event clusters (someone moving around)
        if (motionEventCounter > 0) {
            motionEventCounter--;
            return true;
        } else if (random.nextDouble() < adjustedProbability) {
            motionEventCounter = random.nextInt(5);  // 1-5 consecutive motion events
            return true;
        }

        return false;
    }

    /**
     * Simulate realistic sound levels
     * Range: 500-3500 (with spikes for glass break)
     */
    private int simulateSoundLevel(LocalDateTime now, boolean motionDetected) {
        // If motion detected, increase noise probability
        if (motionDetected && random.nextInt(10) < 3) {
            lastSoundLevel = Math.min(soundMax, lastSoundLevel + random.nextInt(500));
        }

        // Periodically simulate glass break (every 10 minutes, ~1 in 1000 chance per second)
        if (random.nextInt(1000) < 1 && 
            LocalDateTime.now().minusMinutes(1).isAfter(lastGlassBreakEvent)) {
            lastGlassBreakEvent = now;
            log.warn("[SIMULATOR] 🚨 SIMULATING GLASS BREAK EVENT");
            lastSoundLevel = 3000 + random.nextInt(500); // Trigger immediate spike
            return lastSoundLevel;
        }

        // Smooth transitions (sound doesn't jump drastically)
        int delta = random.nextInt(200) - 100;  // -100 to +100
        int smoothedSound = lastSoundLevel + delta;
        lastSoundLevel = Math.max(soundMin, Math.min(soundMax, smoothedSound));

        return lastSoundLevel;
    }

    /**
     * Simulate realistic light levels based on time of day
     * Morning: Increasing
     * Midday: High
     * Evening: Decreasing
     * Night: Very low
     */
    private int simulateLightLevel(LocalDateTime now) {
        int hour = now.getHour();
        int lightLevel;

        // Base light level by hour
        if (hour >= 6 && hour < 8) {
            // Sunrise
            lightLevel = 500 + (hour - 6) * 200 + random.nextInt(300);
        } else if (hour >= 8 && hour < 12) {
            // Morning bright
            lightLevel = 3500 + random.nextInt(500);
        } else if (hour >= 12 && hour < 17) {
            // Afternoon bright
            lightLevel = 3800 + random.nextInt(400);
        } else if (hour >= 17 && hour < 19) {
            // Sunset (decreasing)
            lightLevel = 2000 - (hour - 17) * 500 + random.nextInt(400);
        } else if (hour >= 19 && hour < 21) {
            // Evening
            lightLevel = 800 + random.nextInt(400);
        } else {
            // Night (very dark)
            lightLevel = 50 + random.nextInt(150);
        }

        // Add randomness (clouds, light reflections)
        lightLevel += random.nextInt(200) - 100;
        lightLevel = Math.max(lightMin, Math.min(lightMax, lightLevel));

        return lightLevel;
    }
}

package com.homecanvas.iot.controller;

import com.homecanvas.iot.dto.AIPredictionDTOs.*;
import com.homecanvas.iot.service.GeminiAIService;
import com.homecanvas.iot.service.DeviceService;
import com.homecanvas.iot.dto.DeviceDetailDTO;
import com.homecanvas.auth.model.User;
import com.homecanvas.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private GeminiAIService geminiAIService;

    @Autowired
    private DeviceService deviceService;

    @Autowired
    private UserRepository userRepository;

    private Optional<User> resolveAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof User) return Optional.of((User) principal);
        if (principal instanceof String) {
            String username = (String) principal;
            if (!"anonymousUser".equalsIgnoreCase(username)) return userRepository.findByUsername(username);
        }
        return Optional.empty();
    }

    @GetMapping("/predict-action/{deviceId}")
    public ActionPredictionResponse getActionPrediction(@PathVariable Long deviceId) {
        Optional<User> user = resolveAuthenticatedUser();
        DeviceDetailDTO device = deviceService.getDeviceDetail(deviceId, user.orElse(null));
        
        if (device != null && device.getLastTelemetry() != null) {
            var last = device.getLastTelemetry();
            return geminiAIService.predictCurrentAction(
                last.getLightLevel(),
                last.getNoiseLevel(),
                last.getMotionDetected()
            );
        }
        return new ActionPredictionResponse("Device Offline", 0);
    }

    @GetMapping("/analyze-alarm/{deviceId}")
    public RCAResponse getAlarmRCA(@PathVariable Long deviceId) {
        Optional<User> user = resolveAuthenticatedUser();
        DeviceDetailDTO device = deviceService.getDeviceDetail(deviceId, user.orElse(null));
        
        if (device != null && device.getLastTelemetry() != null) {
            // In a real scenario, we'd fetch actual pre/post history. 
            // For the demo, we'll simulate the RCA data based on current state.
            var last = device.getLastTelemetry();
            return geminiAIService.analyzeAlarmRCA(
                last.getNoiseLevel(),
                false, // pre-motion
                last.getMotionDetected(), // post-motion
                500, // pre-sound
                last.getNoiseLevel() // post-sound
            );
        }
        return new RCAResponse("No recent alarm detected", false);
    }
}

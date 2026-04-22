package com.homecanvas.iot.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication; // Authentication is an interface that represents the token
// for an authentication request or for an authenticated principal once the request has been processed by the 
// AuthenticationManager.authenticate(Authentication) method. It contains information about the authenticated user, 
// such as their username, password, and authorities (roles/permissions). In this controller, we use it to extract 
// the authenticated user's details from the security context.
import org.springframework.security.core.context.SecurityContextHolder; // SecurityContextHolder is a class that 
// provides access to the security context, which holds the details of the currently authenticated user. It allows
// us to retrieve the Authentication object, which contains the user's information. In this controller, we use it 
// to get the authenticated user's details for authorization checks and to ensure that users can only access their 
// own devices and data.
import com.homecanvas.iot.dto.*;
import com.homecanvas.iot.service.DeviceService;
import com.homecanvas.auth.model.User;
import com.homecanvas.auth.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.Collections;

// This controller handles HTTP requests related to device management, including listing devices, 
// getting device details, fetching telemetry history, and retrieving action audit trails. It uses the DeviceService to perform business logic and interacts with the data layer. For simplicity, it currently uses a mock user for authentication purposes, which should be replaced with actual authentication in a production environment.
@RestController
@RequestMapping("/api/devices") // Base path for all endpoints in this controller 
public class DeviceController {
    @Autowired
    private DeviceService deviceService;

    @Autowired
    private UserRepository userRepository;

    // Helper: Resolve authenticated user from security context.
    // Returns empty when request is anonymous or user cannot be resolved.
    private Optional<User> resolveAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return Optional.empty();
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof User) {
            return Optional.of((User) principal);
        }

        if (principal instanceof String) {
            String username = (String) principal;
            if (!"anonymousUser".equalsIgnoreCase(username)) {
                return userRepository.findByUsername(username);
            }
        }

        return Optional.empty();
    }

    // Get a list of devices owned by the user. This endpoint returns basic information about each 
    // device for display on the device listing page. The method currently uses a mock user to simulate
    // authentication, which should be replaced with actual user authentication in a real application.
    @GetMapping
    public List<DeviceListDTO> getDevices() {
        try {
            Optional<User> userOptional = resolveAuthenticatedUser();
            User user = userOptional.orElse(null);
            return deviceService.getDevicesByUser(user);
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }

    // Get detailed info of a specific device, including last telemetry data for the dashboard view. 
    // The device ID is passed as a path variable, and the method checks if the device belongs to the mock 
    // user before returning the details. If the device does not exist or does not belong to the user, it 
    // returns null.
    @GetMapping("/{id}")
    public DeviceDetailDTO getDeviceDetail(@PathVariable Long id) {
        Optional<User> userOptional = resolveAuthenticatedUser();
        User user = userOptional.orElse(null);
        return deviceService.getDeviceDetail(id, user);

    }

    // Get paginated telemetry history for a specific device. The device ID is passed as a path variable, 
    // and pagination parameters (page number and size) are accepted as request parameters with default values. 
    // Get the authenticated user and return a PagedTelemetryDTO containing the telemetry data for the specified
    // device. The method currently uses a mock user for authentication, which should be replaced with actual 
    // authentication in a production environment.
    @GetMapping("/{id}/telemetry")
    public PagedTelemetryDTO getTelemetryHistory(
        @PathVariable Long id,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Optional<User> userOptional = resolveAuthenticatedUser();
        User user = userOptional.orElse(null);
        Pageable pageable = PageRequest.of(page, size);
        return deviceService.getTelemetryHistory(id, user, pageable);
    }


    // Get paginated action audit trail for a specific device. The device ID is passed as a path variable,
    // and pagination parameters (page number and size) are accepted as request parameters with default values.
    // The method uses authenticated user to ensure that the device belongs to the user before returning the 
    // action audit data. It returns a PagedActionAuditDTO containing the action logs for the specified device. 
    @GetMapping("/{id}/actions")
    public PagedActionAuditDTO getActionAudit(
        @PathVariable Long id,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Optional<User> userOptional = resolveAuthenticatedUser();
        User user = userOptional.orElse(null);
        Pageable pageable = PageRequest.of(page, size);
        return deviceService.getActionAudit(id, user, pageable);
    }

    // Send a control command to a specific device. The device ID is passed as a path variable,
    // and the command parameters (fanOn, ledOn, displayText, servoAngle) are passed in the request body
    // as a DeviceCommandDTO. This endpoint stores the command for the device to retrieve on its next 
    // telemetry poll, or returns it immediately if appropriate.
    @PostMapping("/{id}/command")
    public DeviceCommandDTO sendCommand(
        @PathVariable Long id,
        @RequestBody DeviceCommandDTO command
    ) {
        Optional<User> userOptional = resolveAuthenticatedUser();
        User user = userOptional.orElse(null);
        return deviceService.sendCommand(id, user, command);
    }

    // Update a device's name.
    @PutMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> updateDevice(
        @PathVariable Long id,
        @RequestBody java.util.Map<String, String> payload
    ) {
        Optional<User> userOptional = resolveAuthenticatedUser();
        User user = userOptional.orElse(null);
        
        // Use deviceService to get device
        com.homecanvas.iot.dto.DeviceDetailDTO device = deviceService.getDeviceDetail(id, user);
        if (device == null) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                .body(java.util.Map.of("success", false, "message", "Device not found or not owned by user"));
        }
        
        String newName = payload.get("name");
        if (newName != null && !newName.trim().isEmpty()) {
            deviceService.updateDeviceName(id, newName);
            return org.springframework.http.ResponseEntity.ok(java.util.Map.of("success", true, "message", "Device updated successfully"));
        }
        return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", "Name is required"));
    }

    // Delete a device.
    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> deleteDevice(@PathVariable Long id) {
        Optional<User> userOptional = resolveAuthenticatedUser();
        User user = userOptional.orElse(null);

        com.homecanvas.iot.dto.DeviceDetailDTO device = deviceService.getDeviceDetail(id, user);
        if (device == null) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                .body(java.util.Map.of("success", false, "message", "Device not found or not owned by user"));
        }

        deviceService.deleteDevice(id);
        return org.springframework.http.ResponseEntity.ok(java.util.Map.of("success", true, "message", "Device deleted successfully"));
    }
}

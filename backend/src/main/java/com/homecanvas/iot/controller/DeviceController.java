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
import java.util.List;

// This controller handles HTTP requests related to device management, including listing devices, 
// getting device details, fetching telemetry history, and retrieving action audit trails. It uses the DeviceService to perform business logic and interacts with the data layer. For simplicity, it currently uses a mock user for authentication purposes, which should be replaced with actual authentication in a production environment.
@RestController
@RequestMapping("/api/devices") // Base path for all endpoints in this controller 
public class DeviceController {
    @Autowired
    private DeviceService deviceService;

    // Helper: Extract authenticated user from JWT token
    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        return (User) auth.getPrincipal();
    }

    // Get a list of devices owned by the user. This endpoint returns basic information about each 
    // device for display on the device listing page. The method currently uses a mock user to simulate
    // authentication, which should be replaced with actual user authentication in a real application.
    @GetMapping
    public List<DeviceListDTO> getDevices() {
        User user = getAuthenticatedUser();
        return deviceService.getDevicesByUser(user);
    }

    // Get detailed info of a specific device, including last telemetry data for the dashboard view. 
    // The device ID is passed as a path variable, and the method checks if the device belongs to the mock 
    // user before returning the details. If the device does not exist or does not belong to the user, it 
    // returns null.
    @GetMapping("/{id}")
    public DeviceDetailDTO getDeviceDetail(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        return deviceService.getDeviceDetail(id.intValue(), user);

    }

    // Get paginated telemetry history for a specific device. The device ID is passed as a path variable, 
    // and pagination parameters (page number and size) are accepted as request parameters with default values. 
    // Get the authenticated user and return a PagedTelemetryDTO containing the telemetry data for the specified
    // device. The method currently uses a mock user for authentication, which should be replaced with actual 
    // authentication in a production environment.
    @GetMapping("/{id}/telemetry")
    public PagedTelemetryDTO getTelemetryHistory(
        @PathVariable Integer id,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        User user = getAuthenticatedUser();
        Pageable pageable = PageRequest.of(page, size);
        return deviceService.getTelemetryHistory(id, user, pageable);
    }


    // Get paginated action audit trail for a specific device. The device ID is passed as a path variable,
    // and pagination parameters (page number and size) are accepted as request parameters with default values.
    // The method uses authenticated user to ensure that the device belongs to the user before returning the 
    // action audit data. It returns a PagedActionAuditDTO containing the action logs for the specified device. 
    @GetMapping("/{id}/actions")
    public PagedActionAuditDTO getActionAudit(
        @PathVariable Integer id,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        User user = getAuthenticatedUser();
        Pageable pageable = PageRequest.of(page, size);
        return deviceService.getActionAudit(id, user, pageable);
    }


    
}

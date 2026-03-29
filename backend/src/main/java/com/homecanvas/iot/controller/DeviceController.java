package com.homecanvas.iot.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import com.homecanvas.iot.dto.*;
import com.homecanvas.iot.service.DeviceService;
import com.homecanvas.auth.model.User;
import java.util.List;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

// This controller handles HTTP requests related to device management, including listing devices, 
// getting device details, fetching telemetry history, and retrieving action audit trails. It uses the DeviceService to perform business logic and interacts with the data layer. For simplicity, it currently uses a mock user for authentication purposes, which should be replaced with actual authentication in a production environment.
@RestController
@RequestMapping("/api/devices") // Base path for all endpoints in this controller 
public class DeviceController {
    @Autowired
    private DeviceService deviceService;

    // Get a list of devices owned by the user. This endpoint returns basic information about each 
    // device for display on the device listing page. The method currently uses a mock user to simulate
    // authentication, which should be replaced with actual user authentication in a real application.
    @GetMapping
    public List<DeviceListDTO> getDevices(){
        User mockUser = new User();
        mockUser.setId(1);
        mockUser.setUsername("test-user");

        return deviceService.getDevicesByUser(mockUser);
    }

    // Get detailed info of a specific device, including last telemetry data for the dashboard view. 
    // The device ID is passed as a path variable, and the method checks if the device belongs to the mock 
    // user before returning the details. If the device does not exist or does not belong to the user, it 
    // returns null.
    @GetMapping("/{id}")
    public DeviceDetailDTO getDeviceDetail(@PathVariable Long id) {
        User mockUser = new User();
        mockUser.setId(1);
        mockUser.setUsername("test-user");

        return deviceService.getDeviceDetail(id.intValue(), mockUser);

    }

    // Get paginated telemetry history for a specific device. The device ID is passed as a path variable, 
    // and pagination parameters (page number and size) are accepted as request parameters with default values. 
    // The method uses a mock user for authentication and returns a PagedTelemetryDTO containing the telemetry 
    // data for the specified device.
    @GetMapping("/{id}/telemetry")
    public PagedTelemetryDTO getTelemetryHistory(
        @PathVariable Integer id,
        @RequestParam(defaultValue = "0") Integer page,
        @RequestParam(defaultValue = "20") Integer size
    ){
        User mockUser = new User();
        mockUser.setId(1);
        mockUser.setUsername("test-user");

        Pageable pageable = PageRequest.of(page, size);
        return deviceService.getTelemetryHistory(id, mockUser, pageable);

    }

    // Get paginated action audit trail for a specific device. The device ID is passed as a path variable,
    // and pagination parameters (page number and size) are accepted as request parameters with default values.
    // The method uses a mock user for authentication and returns a PagedActionAuditDTO containing the action
    // log data for the specified device.
    @GetMapping("/{id}/actions")
    public PagedActionAuditDTO getActionAuditTrail(
        @PathVariable Integer id,
        @RequestParam(defaultValue = "0") Integer page,
        @RequestParam(defaultValue = "20") Integer size
    ){
        User mockUser = new User();
        mockUser.setId(1);
        mockUser.setUsername("test-user");

        Pageable pageable = PageRequest.of(page, size);
        return deviceService.getActionAudit(id, mockUser, pageable);
    }


    
}

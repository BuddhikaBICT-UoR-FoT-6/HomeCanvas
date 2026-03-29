package com.homecanvas.iot.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*; // for REST controller annotations 
import jakarta.validation.Valid; // for validating incoming request bodies against DTO constraints
import com.homecanvas.iot.dto.TelemetryPayloadDTO;
import com.homecanvas.iot.dto.DeviceCommandDTO;
import com.homecanvas.iot.service.IotService;

@RestController
@RequestMapping("/api/iot") // Base path for all endpoints in this controller
public class IotController {
    // This controller handles incoming HTTP requests related to IoT device interactions, 
    // such as receiving telemetry data and sending commands back to the devices. It delegates
    // the business logic to the IotService.

    @Autowired
    private IotService iotService;

    /**
     * Receive telemetry data from ESP32 device and return device commands
     * 
     * POST /api/iot/telemetry
     * 
     * Request body: TelemetryPayloadDTO containing sensor readings
     * Response body: DeviceCommandDTO with commands to send back to device
     */
    @PostMapping("/telemetry")
    public DeviceCommandDTO processTelemetry(@Valid @RequestBody TelemetryPayloadDTO payload) {
        return iotService.processTelemetry(payload);
    }
}

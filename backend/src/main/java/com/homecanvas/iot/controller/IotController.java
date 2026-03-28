package com.homecanvas.iot.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import com.homecanvas.iot.dto.TelemetryPayloadDTO;
import com.homecanvas.iot.dto.DeviceCommandDTO;
import com.homecanvas.iot.service.IotService;

@RestController
@RequestMapping("/api/iot")
public class IotController {

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

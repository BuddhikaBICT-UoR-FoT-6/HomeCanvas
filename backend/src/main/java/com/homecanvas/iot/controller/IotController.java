package com.homecanvas.iot.controller;
// Force re-index

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
    private IotService iotService; // Standardized service for IoT operations

    /**
     * Receive telemetry data from ESP32 and return automation-rule commands.
     * POST /api/iot/telemetry
     */
    @PostMapping("/telemetry")
    public DeviceCommandDTO processTelemetry(@Valid @RequestBody TelemetryPayloadDTO payload) {
        return iotService.processTelemetry(payload);
    }

    /**
     * ESP32 polls this endpoint to check for pending dashboard commands.
     * GET /api/iot/command?mac=AA:BB:CC:DD:EE:FF
     *
     * Returns only the dashboard-set fields (fanOn, ledOn, lcdMessage, servoAngle).
     * Clears them immediately after returning so they fire exactly once.
     * Returns an empty DeviceCommandDTO (all nulls) when no command is pending.
     */
    @GetMapping("/command")
    public DeviceCommandDTO getPendingCommand(@RequestParam String mac) {
        return iotService.getPendingCommand(mac);
    }
}

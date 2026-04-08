package com.homecanvas.iot.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.homecanvas.iot.dto.TelemetryPayloadDTO;
import com.homecanvas.iot.dto.DeviceCommandDTO;
import com.homecanvas.iot.model.Device;
import com.homecanvas.iot.model.SensorEvent;
import com.homecanvas.iot.model.ActionLog;
import com.homecanvas.iot.repository.DeviceRepository;
import com.homecanvas.iot.repository.SensorEventRepository;
import com.homecanvas.iot.repository.ActionLogRepository;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class IotService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private SensorEventRepository sensorEventRepository;

    @Autowired
    private ActionLogRepository actionLogRepository;

    public DeviceCommandDTO processTelemetry(TelemetryPayloadDTO payload) {
        Device device = deviceRepository.findByMacAddress(payload.getMacAddress())
            .orElseGet(() -> {
                Device newDevice = new Device();
                newDevice.setMacAddress(payload.getMacAddress());
                newDevice.setName("Device-" + payload.getMacAddress().substring(12));
                newDevice.setCreatedAt(LocalDateTime.now());
                return deviceRepository.save(newDevice);
            });

        device.setLastSeen(LocalDateTime.now());
        deviceRepository.save(device);

        SensorEvent sensorEvent = new SensorEvent();
        sensorEvent.setDevice(device);
        // Use payload timestamp if provided, otherwise server time
        sensorEvent.setTimestamp(payload.getTimestamp() != null ? payload.getTimestamp() : LocalDateTime.now());
        sensorEvent.setLightLevel(payload.getLightLevel());
        sensorEvent.setNoiseLevel(payload.getNoiseLevel());
        sensorEvent.setMotionDetected(payload.getMotionDetected());
        sensorEvent.setCreatedAt(LocalDateTime.now());
        sensorEventRepository.save(sensorEvent);

        Device freshDevice = deviceRepository.findById(device.getId()).orElse(device);
        
        // --- LOGIC: MANUAL OVERRIDE (STICKY) ---
        // If a field is not null in freshDevice, it means a Dashboard Toggle is active.
        // Automation rules are blocked until the toggle is removed (set back to null).
        
        Boolean fanOn = freshDevice.getLastCommandFanOn();
        Boolean ledOn = freshDevice.getLastCommandLedOn();
        String lcdMessage = freshDevice.getLastCommandLcdMessage();
        Integer servoAngle = freshDevice.getLastCommandServoAngle();

        boolean isLowLight = (payload.getLightLevel() != null && payload.getLightLevel() < 2000);

        // 1. Fan Automation (only if no manual command)
        if (fanOn == null) {
            fanOn = (payload.getMotionDetected() != null && payload.getMotionDetected());
        }

        // 2. LED Automation (only if no manual command)
        if (ledOn == null) {
            ledOn = isLowLight;
        }

        // 3. Display Automation (only if no manual command)
        if (lcdMessage == null && payload.getNoiseLevel() != null && payload.getNoiseLevel() > 700) {
            lcdMessage = "ALRT";
        }

        // Cleanup fire-once message (the message itself is temporary)
        if (freshDevice.getLastCommandLcdMessage() != null) {
            freshDevice.setLastCommandLcdMessage(null);
            deviceRepository.save(freshDevice);
        }

        DeviceCommandDTO response = new DeviceCommandDTO(fanOn, ledOn, lcdMessage);
        response.setServoAngle(servoAngle);
        
        return response;
    }

    public DeviceCommandDTO getPendingCommand(String macAddress) {
        Device device = deviceRepository.findByMacAddress(macAddress).orElse(null);
        if (device == null) return new DeviceCommandDTO();

        DeviceCommandDTO cmd = new DeviceCommandDTO();
        cmd.setFanOn(device.getLastCommandFanOn());
        cmd.setLedOn(device.getLastCommandLedOn());
        cmd.setLcdMessage(device.getLastCommandLcdMessage());
        cmd.setServoAngle(device.getLastCommandServoAngle());

        if (device.getLastCommandLcdMessage() != null) {
            device.setLastCommandLcdMessage(null);
            deviceRepository.save(device);
        }

        return cmd;
    }
}

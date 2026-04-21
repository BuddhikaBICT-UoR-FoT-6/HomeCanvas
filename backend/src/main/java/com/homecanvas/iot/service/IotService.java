package com.homecanvas.iot.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.homecanvas.iot.dto.TelemetryPayloadDTO;
import com.homecanvas.iot.dto.DeviceCommandDTO;
import com.homecanvas.iot.model.Device;
import com.homecanvas.iot.model.SensorEvent;
import com.homecanvas.iot.repository.DeviceRepository;
import com.homecanvas.iot.repository.SensorEventRepository;
import java.time.LocalDateTime;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.support.MessageBuilder;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@Transactional
public class IotService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private SensorEventRepository sensorEventRepository;

    @Autowired
    private com.homecanvas.iot.repository.ActionLogRepository actionLogRepository;

    @Autowired
    private MessageChannel mqttOutboundChannel;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String COMMAND_TOPIC_PREFIX = "homecanvas/commands/";

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
        sensorEvent.setTimestamp(payload.getParsedTimestamp());
        sensorEvent.setLightLevel(payload.getLightLevel());
        sensorEvent.setNoiseLevel(payload.getNoiseLevel());
        sensorEvent.setMotionDetected(payload.getMotionDetected());
        sensorEvent.setVentAngle(payload.getVentAngle());
        sensorEvent.setCreatedAt(LocalDateTime.now());
        sensorEventRepository.save(sensorEvent);

        Long deviceId = device.getId();
        if (deviceId == null) return new DeviceCommandDTO(); // Should not happen after save
        Device freshDevice = deviceRepository.findById(deviceId).orElse(device);
        
        // --- LOGIC: MANUAL OVERRIDE (STICKY) ---
        // We only send these if they are NOT NULL (manually set in DB).
        // Automation is handled LOCALLY by the ESP32 to prevent conflicts.
        
        Boolean fanOn = freshDevice.getLastCommandFanOn();
        Boolean ledOn = freshDevice.getLastCommandLedOn();
        String lcdMessage = freshDevice.getLastCommandLcdMessage();
        Integer servoAngle = freshDevice.getLastCommandServoAngle();

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

    public void publishCommand(String macAddress, DeviceCommandDTO command) {
        try {
            String topic = COMMAND_TOPIC_PREFIX + macAddress;
            String json = objectMapper.writeValueAsString(command);
            
            if (json == null) return;
            
            mqttOutboundChannel.send(MessageBuilder.withPayload(json)
                    .setHeader("mqtt_topic", topic)
                    .build());
            
            System.out.println("[MQTT] Published command to " + topic);
        } catch (Exception e) {
            System.err.println("[MQTT] Error publishing command: " + e.getMessage());
        }
    }
}

package com.homecanvas.iot.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.homecanvas.iot.dto.OccupancyTelemetryDTO;
import com.homecanvas.iot.dto.OccupancyCommandDTO;
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

/**
 * IoT Service - Database & MQTT Orchestration
 * 
 * Responsibilities:
 * 1. Persist telemetry to database
 * 2. Manage device state
 * 3. Publish commands back to ESP32 via MQTT
 * 
 * Integrates with occupancy engines for decision making.
 */
@Service
@Transactional
public class IotService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private SensorEventRepository sensorEventRepository;

    @Autowired(required = false)
    private com.homecanvas.iot.repository.ActionLogRepository actionLogRepository;

    @Autowired
    private MessageChannel mqttOutboundChannel;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String COMMAND_TOPIC = "home/action/commands";

    /**
     * Process telemetry from ESP32 and persist to database.
     * 
     * @param telemetry Occupancy telemetry from ESP32
     */
    public void processTelemetry(OccupancyTelemetryDTO telemetry) {
        if (telemetry.getMacAddress() == null) {
            System.err.println("[ERROR] Cannot process telemetry without MAC address");
            return;
        }

        // Find or create device
        Device device = deviceRepository.findByMacAddress(telemetry.getMacAddress())
            .orElseGet(() -> {
                Device newDevice = new Device();
                newDevice.setMacAddress(telemetry.getMacAddress());
                newDevice.setName("Device-" + telemetry.getMacAddress().substring(12));
                newDevice.setCreatedAt(LocalDateTime.now());
                System.out.println("[DEVICE] New device registered: " + newDevice.getName());
                return deviceRepository.save(newDevice);
            });

        // Update last seen timestamp
        device.setLastSeen(LocalDateTime.now());
        deviceRepository.save(device);

        // Save sensor event
        SensorEvent sensorEvent = new SensorEvent();
        sensorEvent.setDevice(device);
        sensorEvent.setTimestamp(telemetry.getParsedTimestamp());
        sensorEvent.setMotionDetected(telemetry.getPir());
        sensorEvent.setNoiseLevel(telemetry.getSound());
        sensorEvent.setLightLevel(telemetry.getLight());
        sensorEvent.setCreatedAt(LocalDateTime.now());
        sensorEventRepository.save(sensorEvent);
        
        System.out.println("[PERSISTENCE] Telemetry saved for device: " + device.getName());
    }

    /**
     * Legacy method for backward compatibility.
     */
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
        sensorEvent.setTimestamp(payload.getParsedTimestamp());
        sensorEvent.setLightLevel(payload.getLightLevel());
        sensorEvent.setNoiseLevel(payload.getNoiseLevel());
        sensorEvent.setMotionDetected(payload.getMotionDetected());
        sensorEvent.setVentAngle(payload.getVentAngle());
        sensorEvent.setCreatedAt(LocalDateTime.now());
        sensorEventRepository.save(sensorEvent);

        Long deviceId = device.getId();
        if (deviceId == null) return new DeviceCommandDTO();
        
        Device freshDevice = deviceRepository.findById(deviceId).orElse(device);
        
        Boolean fanOn = freshDevice.getLastCommandFanOn();
        Boolean ledOn = freshDevice.getLastCommandLedOn();
        String lcdMessage = freshDevice.getLastCommandLcdMessage();
        Integer servoAngle = freshDevice.getLastCommandServoAngle();

        if (freshDevice.getLastCommandLcdMessage() != null) {
            freshDevice.setLastCommandLcdMessage(null);
            deviceRepository.save(freshDevice);
        }

        DeviceCommandDTO response = new DeviceCommandDTO(fanOn, ledOn, lcdMessage);
        response.setServoAngle(servoAngle);
        
        return response;
    }

    /**
     * Publish occupancy command to ESP32 via MQTT.
     * 
     * @param command Decision from occupancy engine
     */
    public void publishCommand(String macAddress, OccupancyCommandDTO command) {
        try {
            String json = objectMapper.writeValueAsString(command);
            
            if (json == null) {
                System.err.println("[ERROR] Could not serialize command");
                return;
            }
            
            System.out.println("[MQTT] Publishing command: " + json);
            
            mqttOutboundChannel.send(MessageBuilder.withPayload(json)
                    .setHeader("mqtt_topic", COMMAND_TOPIC)
                    .build());
            
            System.out.println("[MQTT] Command published to " + COMMAND_TOPIC);
        } catch (Exception e) {
            System.err.println("[ERROR] Publishing command: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Legacy method for backward compatibility.
     */
    public void publishCommand(String macAddress, DeviceCommandDTO command) {
        try {
            String topic = "homecanvas/commands/" + macAddress;
            String json = objectMapper.writeValueAsString(command);
            
            if (json == null) return;
            
            mqttOutboundChannel.send(MessageBuilder.withPayload(json)
                    .setHeader("mqtt_topic", topic)
                    .build());
            
            System.out.println("[MQTT] Published legacy command to " + topic);
        } catch (Exception e) {
            System.err.println("[MQTT] Error publishing command: " + e.getMessage());
        }
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


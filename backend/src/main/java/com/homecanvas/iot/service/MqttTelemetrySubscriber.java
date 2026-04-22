package com.homecanvas.iot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homecanvas.iot.dto.DeviceCommandDTO;
import com.homecanvas.iot.dto.TelemetryPayloadDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessagingException;
import org.springframework.stereotype.Component;

@Component
public class MqttTelemetrySubscriber {

    @Autowired
    private IotService iotService;

    @Autowired
    private ObjectMapper objectMapper;

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<?> message) throws MessagingException {
        System.out.println(">>>>>>>>>> [MQTT] NEW MESSAGE ARRIVED! <<<<<<<<<<");
        String topic = (String) message.getHeaders().get("mqtt_receivedTopic");
        Object rawPayload = message.getPayload();
        String payload;

        if (rawPayload instanceof byte[]) {
            payload = new String((byte[]) rawPayload);
        } else {
            payload = rawPayload.toString();
        }

        System.out.println("[MQTT DEBUG] Received on topic " + topic + ": " + payload);

        try {
            // Convert JSON payload to DTO
            TelemetryPayloadDTO telemetry = objectMapper.readValue(payload, TelemetryPayloadDTO.class);
            
            // Extract MAC address from topic if not in payload
            if (telemetry.getMacAddress() == null && topic != null) {
                String[] parts = topic.split("/");
                if (parts.length >= 3) {
                    telemetry.setMacAddress(parts[2]);
                }
            }

            if (telemetry.getMacAddress() != null) {
                // Process via existing service logic
                DeviceCommandDTO responseCommand = iotService.processTelemetry(telemetry);
                
                // IMPORTANT: Send the resulting command back to the device via MQTT
                // This ensures automation rules (Fan/LED) work via MQTT
                iotService.publishCommand(telemetry.getMacAddress(), responseCommand);
            }
            
        } catch (Exception e) {
            System.err.println("Error processing MQTT telemetry: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

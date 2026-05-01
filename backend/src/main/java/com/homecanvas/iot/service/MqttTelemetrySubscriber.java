package com.homecanvas.iot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homecanvas.iot.dto.OccupancyCommandDTO;
import com.homecanvas.iot.dto.OccupancyTelemetryDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessagingException;
import org.springframework.stereotype.Component;

/**
 * MQTT Telemetry Subscriber - Main Orchestration Service
 * 
 * Workflow:
 * 1. Receive telemetry from ESP32 via MQTT (home/sensors/telemetry)
 * 2. Parse JSON payload into OccupancyTelemetryDTO
 * 3. Pass to OccupancyConfidenceEngine → Calculate confidence score
 * 4. Pass to DecisionMatrixService → Determine actions
 * 5. Serialize decision into OccupancyCommandDTO
 * 6. Publish command back to ESP32 via MQTT (home/action/commands)
 * 
 * Result: ESP32 executes the decision (servo, LED, display, alerts)
 */
@Component
public class MqttTelemetrySubscriber {

    @Autowired
    private IotService iotService;

    @Autowired
    private OccupancyConfidenceEngine confidenceEngine;

    @Autowired
    private DecisionMatrixService decisionMatrix;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Entry point for incoming MQTT telemetry messages.
     * Subscribed to: home/sensors/telemetry
     */
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<?> message) throws MessagingException {
        System.out.println("\n>>>>>>>>>> [MQTT] NEW TELEMETRY RECEIVED <<<<<<<<<<");
        
        String topic = (String) message.getHeaders().get("mqtt_receivedTopic");
        Object rawPayload = message.getPayload();
        String payload;

        // Convert payload to string
        if (rawPayload instanceof byte[]) {
            payload = new String((byte[]) rawPayload);
        } else {
            payload = rawPayload.toString();
        }

        System.out.println("[MQTT] Topic: " + topic);
        System.out.println("[MQTT] Payload: " + payload);

        try {
            // ========== STEP 1: Parse Telemetry ==========
            OccupancyTelemetryDTO telemetry = objectMapper.readValue(payload, OccupancyTelemetryDTO.class);
            
            // Extract MAC address from topic if not in payload
            if (telemetry.getMacAddress() == null && topic != null) {
                String[] parts = topic.split("/");
                if (parts.length >= 3) {
                    telemetry.setMacAddress(parts[2]);
                }
            }

            if (telemetry.getMacAddress() == null) {
                System.err.println("[ERROR] No MAC address found in payload or topic!");
                return;
            }

            System.out.println("[TELEMETRY] " + telemetry);

            // ========== STEP 2: Save to Database ==========
            // Keep existing IotService for database persistence
            iotService.processTelemetry(telemetry);
            System.out.println("[DATABASE] Telemetry saved");

            // ========== STEP 3: Calculate Confidence Score ==========
            int confidence = confidenceEngine.calculateConfidence(telemetry);
            String occupancyState = confidenceEngine.getOccupancyState(confidence);
            System.out.println("[OCCUPANCY] " + occupancyState + 
                              " (Score: " + confidence + ")");

            // ========== STEP 4: Determine Action ==========
            OccupancyCommandDTO decision = decisionMatrix.makeDecision(confidence, telemetry.getLight());
            System.out.println(decisionMatrix.describeDecision(decision));

            // ========== STEP 5: Publish Command Back to ESP32 ==========
            iotService.publishCommand(telemetry.getMacAddress(), decision);
            
            System.out.println(">>>>>>>>>> [CYCLE COMPLETE] <<<<<<<<<<\n");
            
        } catch (Exception e) {
            System.err.println("[ERROR] Processing MQTT telemetry:");
            e.printStackTrace();
        }
    }

    /**
     * Process simulated telemetry data (DEBUG MODE)
     * Called by DataSimulatorService when simulator is active
     * 
     * Allows testing without ESP32 hardware connected
     */
    public void processSimulatedTelemetry(OccupancyTelemetryDTO telemetry) {
        System.out.println("\n>>>>>>>>>> [SIMULATOR] TELEMETRY (Debug Mode) <<<<<<<<<<");
        System.out.println("[TELEMETRY] " + telemetry);

        try {
            // Use default MAC for simulator
            if (telemetry.getMacAddress() == null) {
                telemetry.setMacAddress("00:11:22:33:44:55");  // Simulator MAC
            }

            // ========== STEP 2: Save to Database ==========
            iotService.processTelemetry(telemetry);
            System.out.println("[DATABASE] Simulated telemetry saved");

            // ========== STEP 3: Calculate Confidence Score ==========
            int confidence = confidenceEngine.calculateConfidence(telemetry);
            String occupancyState = confidenceEngine.getOccupancyState(confidence);
            System.out.println("[OCCUPANCY] " + occupancyState + 
                              " (Score: " + confidence + ")");

            // ========== STEP 4: Determine Action ==========
            OccupancyCommandDTO decision = decisionMatrix.makeDecision(confidence, telemetry.getLight());
            System.out.println(decisionMatrix.describeDecision(decision));

            // ========== STEP 5: Publish Command ==========
            iotService.publishCommand(telemetry.getMacAddress(), decision);
            
            System.out.println(">>>>>>>>>> [SIMULATOR CYCLE COMPLETE] <<<<<<<<<<\n");

        } catch (Exception e) {
            System.err.println("[ERROR] Processing simulated telemetry:");
            e.printStackTrace();
        }
    }
}


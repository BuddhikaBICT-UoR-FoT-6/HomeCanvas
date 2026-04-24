package com.homecanvas.iot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.homecanvas.iot.dto.TelemetryPayloadDTO;

public class TestJackson {
    public static void main(String[] args) {
        try {
            String json = "{\"macAddress\":\"20:E7:C8:68:86:38\",\"timestamp\":\"2026-04-23T16:17:58\",\"lightLevel\":571,\"noiseLevel\":262,\"motionDetected\":false}";
            ObjectMapper mapper = new ObjectMapper();
            // mapper.registerModule(new JavaTimeModule()); // Let's see if it works without registering explicitly, simulating default ObjectMapper
            TelemetryPayloadDTO dto = mapper.readValue(json, TelemetryPayloadDTO.class);
            System.out.println("Parsed successfully: " + dto.getTimestamp());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

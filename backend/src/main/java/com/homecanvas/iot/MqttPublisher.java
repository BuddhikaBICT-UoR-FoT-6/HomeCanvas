package com.homecanvas.iot;

import org.eclipse.paho.client.mqttv3.*;

public class MqttPublisher {
    public static void main(String[] args) {
        try {
            MqttClient client = new MqttClient("tcp://localhost:1883", "DebugPublisher");
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            client.connect(options);
            System.out.println("Connected to Mosquitto. Publishing...");
            
            String payload = "{\"macAddress\":\"20:E7:C8:68:86:38\",\"timestamp\":\"2026-04-23T16:17:58\",\"lightLevel\":571,\"noiseLevel\":262,\"motionDetected\":false}";
            
            MqttMessage message = new MqttMessage(payload.getBytes());
            message.setQos(1);
            client.publish("homecanvas/telemetry/20:E7:C8:68:86:38", message);
            
            System.out.println("Published!");
            client.disconnect();
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

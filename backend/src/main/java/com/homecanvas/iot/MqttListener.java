package com.homecanvas.iot;

import org.eclipse.paho.client.mqttv3.*;

public class MqttListener {
    public static void main(String[] args) {
        try {
            MqttClient client = new MqttClient("tcp://localhost:1883", "DebugListener");
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            client.connect(options);
            System.out.println("Connected to Mosquitto...");
            
            client.subscribe("homecanvas/telemetry/#", (topic, msg) -> {
                System.out.println("Received: " + topic + " -> " + new String(msg.getPayload()));
            });
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

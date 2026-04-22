package com.homecanvas.iot.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;

@Service
public class UdpDiscoveryService {

    private static final int DISCOVERY_PORT = 8888;
    private static final String DISCOVERY_REQUEST = "DISCOVER_HOMECANVAS_MQTT";
    private static final String DISCOVERY_RESPONSE = "HOMECANVAS_ACK";
    
    private DatagramSocket socket;
    private boolean running;

    @PostConstruct
    public void start() {
        running = true;
        new Thread(() -> {
            try {
                socket = new DatagramSocket(DISCOVERY_PORT);
                System.out.println("[UDP Discovery] Listening for ESP32 on port " + DISCOVERY_PORT);
                byte[] receiveBuffer = new byte[256];

                while (running) {
                    DatagramPacket receivePacket = new DatagramPacket(receiveBuffer, receiveBuffer.length);
                    socket.receive(receivePacket);
                    
                    String request = new String(receivePacket.getData(), 0, receivePacket.getLength()).trim();
                    if (DISCOVERY_REQUEST.equals(request)) {
                        InetAddress clientAddress = receivePacket.getAddress();
                        int clientPort = receivePacket.getPort();
                        
                        System.out.println("[UDP Discovery] Received discovery request from " + clientAddress.getHostAddress());
                        
                        byte[] sendData = DISCOVERY_RESPONSE.getBytes();
                        DatagramPacket sendPacket = new DatagramPacket(sendData, sendData.length, clientAddress, clientPort);
                        socket.send(sendPacket);
                        
                        System.out.println("[UDP Discovery] Sent ACK to " + clientAddress.getHostAddress());
                    }
                }
            } catch (Exception e) {
                if (running) {
                    System.err.println("[UDP Discovery] Error: " + e.getMessage());
                }
            }
        }).start();
    }

    @PreDestroy
    public void stop() {
        running = false;
        if (socket != null && !socket.isClosed()) {
            socket.close();
        }
    }
}

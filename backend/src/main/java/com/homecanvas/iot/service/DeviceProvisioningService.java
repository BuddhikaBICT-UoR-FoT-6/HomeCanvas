package com.homecanvas.iot.service;

import com.homecanvas.auth.model.User;
import com.homecanvas.iot.model.Device;
import com.homecanvas.iot.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class DeviceProvisioningService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Transactional
    public void provisionVirtualHome(User user) {
        // Provision standard virtual devices for a complete smart home experience
        createVirtualDevice(user, "Living Room Ceiling Fan", "VIRT-LR-" + generateShortId());
        createVirtualDevice(user, "Master Bedroom Smart Light", "VIRT-MB-" + generateShortId());
        createVirtualDevice(user, "Kitchen Exhaust Fan", "VIRT-KT-" + generateShortId());
        createVirtualDevice(user, "Garage Security Light", "VIRT-SG-" + generateShortId());
    }

    private void createVirtualDevice(User user, String name, String mac) {
        Device device = new Device();
        device.setOwner(user);
        device.setName(name);
        device.setMacAddress(mac);
        device.setCreatedAt(LocalDateTime.now());
        device.setLastSeen(LocalDateTime.now());
        deviceRepository.save(device);
    }

    private String generateShortId() {
        return UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }
}

package com.homecanvas.iot.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // for managing database transactions 
import com.homecanvas.iot.dto.TelemetryPayloadDTO;
import com.homecanvas.iot.dto.DeviceCommandDTO;
import com.homecanvas.iot.model.Device;
import com.homecanvas.iot.model.SensorEvent;
import com.homecanvas.iot.model.ActionLog;
import com.homecanvas.iot.repository.DeviceRepository;
import com.homecanvas.iot.repository.SensorEventRepository;
import com.homecanvas.iot.repository.ActionLogRepository;
// import com.homecanvas.auth.model.User;
import java.time.LocalDateTime;
// import java.util.Optional;

@Service // Marks this class as a Spring service component, making it eligible for component scanning and dependency injection 
@Transactional // Ensures that methods in this class are executed within a database transaction, providing atomicity and consistency for database operations 
public class IotService {
    // This service class contains the business logic for handling IoT device interactions, including processing telemetry data,
    // executing device commands, and logging actions. 

    @Autowired
    private DeviceRepository deviceRepository; // Repository for accessing device data from the database

    @Autowired
    private SensorEventRepository sensorEventRepository; // Repository for accessing sensor event data from the database

    @Autowired
    private ActionLogRepository actionLogRepository; // Repository for accessing action log data from the database

    // This method processes incoming telemetry data from a device, updates the device's last seen
    // timestamp, saves the sensor event, and determines if any actions need to be taken based on 
    // the sensor readings. It returns a DeviceCommandDTO with the commands to be sent back to 
    // the device.
    public DeviceCommandDTO processTelemetry(TelemetryPayloadDTO payload){

        // step 01 - find the device by MAC address, or create a new device if it doesn't exist 
        Device device = deviceRepository.findByMacAddress(payload.getMacAddress())
            .orElseGet(() ->{
                // orElseGet method is used to provide a supplier that creates a new device if
                // one is not found with the given MAC address.
                Device newDevice = new Device();
                newDevice.setMacAddress(payload.getMacAddress());
                newDevice.setName("Device -" + payload.getMacAddress().substring(12)); 
                newDevice.setCreatedAt(LocalDateTime.now());
                return deviceRepository.save(newDevice);
            });
        
        // step 02 - update device's last seen timestamp and save the sensor event 
        device.setLastSeen(LocalDateTime.now());
        deviceRepository.save(device);
        
        // step 03 - initialte and save sensor event
        SensorEvent sensorEvent = new SensorEvent();
        sensorEvent.setDevice(device);
        sensorEvent.setTimestamp(payload.getTimestamp());
        sensorEvent.setLightLevel(payload.getLightLevel());
        sensorEvent.setNoiseLevel(payload.getNoiseLevel());
        sensorEvent.setMotionDetected(payload.getMotionDetected());
        sensorEvent.setCreatedAt(LocalDateTime.now());
        sensorEventRepository.save(sensorEvent);
        
        // step 04 - initialize response flags
        Boolean fanOn = false;
        Boolean ledOn = false;
        String lcdMessage = null;
        
        // Rule 1: Motion detection -> activate fan
        if(payload.getMotionDetected() != null && payload.getMotionDetected()){
            fanOn = true;
            ActionLog motionLog = new ActionLog(device, "FAN_ON");
            actionLogRepository.save(motionLog);
        }

        // Rule 2: High noise (>700) -> security alert
        if(payload.getNoiseLevel() != null && payload.getNoiseLevel() > 700){
            lcdMessage = "There is someone near the house";
            ActionLog alertLog = new ActionLog(device, "ALERT_LOG");
            actionLogRepository.save(alertLog);
            ActionLog lcdLog = new ActionLog(device, "LCD_ALERT");
            actionLogRepository.save(lcdLog);
        }

        // Rule 3: Low light (<300) -> activate LED
        if(payload.getLightLevel() != null && payload.getLightLevel() < 300){
            ledOn = true;
            ActionLog ledLog = new ActionLog(device, "LED_ON");
            actionLogRepository.save(ledLog);
        }

        // Step 5: Build and return command response
        return new DeviceCommandDTO(fanOn, ledOn, lcdMessage);
    }
}
    

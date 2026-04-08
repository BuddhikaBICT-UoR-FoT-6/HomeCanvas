package com.homecanvas.iot.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.homecanvas.iot.dto.*;
import com.homecanvas.iot.model.Device;
import com.homecanvas.iot.model.SensorEvent;
import com.homecanvas.iot.model.ActionLog;
import com.homecanvas.iot.repository.DeviceRepository;
import com.homecanvas.iot.repository.SensorEventRepository;
import com.homecanvas.iot.repository.ActionLogRepository;
import com.homecanvas.auth.model.User;
import com.homecanvas.auth.dto.UserBasicDTO;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional // Ensure that all database operations in this service are wrapped 
// in a transaction for data integrity
public class DeviceService {
    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private SensorEventRepository sensorEventRepository;

    @Autowired
    private ActionLogRepository actionLogRepository;

    // Get all devices owned by the user, with basic info for listing page 
    public List<DeviceListDTO> getDevicesByUser(User user){
        List<Device> devices;
        if (user == null) {
            devices = deviceRepository.findByOwnerIsNull();
        } else {
            devices = deviceRepository.findByOwnerOrOwnerIsNull(user);
        }
        // Convert the list of Device entities to a list of DeviceListDTOs 
        // for the API response using Java Streams to map each Device to a 
        // DeviceListDTO and collect the results into a List.
        return devices.stream()
            .map(this::convertToDeviceListDTO) // convert each Device to a DeviceListDTO 
            .collect(Collectors.toList());

    }

    // Get detailed info of a specific device, including last telemetry data for the dashboard
    public DeviceDetailDTO getDeviceDetail(Long deviceId, User user){
        // First, we need to find the device by its ID and ensure it belongs to the user.
        Device device;
        if (user == null) {
            device = deviceRepository.findByIdAndOwnerIsNull(Long.valueOf(deviceId)).orElse(null);
        } else {
            device = deviceRepository.findByIdAndOwnerOrOwnerIsNull(Long.valueOf(deviceId), user)
                .orElse(null);
        }

        // If the device does not exist or does not belong to the user, return null.
        if(device == null){
            return null; 
        }

        // Fetch the latest telemetry data for the device using pagination to get only the most recent entry.
        Page<SensorEvent> latestPage = sensorEventRepository.findByDeviceOrderByTimestampDesc(device, Pageable.ofSize(1));

        SensorEventDTO lastTelemetry = null;

        // If there is at least one telemetry entry, convert it to a SensorEventDTO. 
        if(!latestPage.isEmpty()){
            SensorEvent latest = latestPage.getContent().get(0);
            lastTelemetry = convertToSensorEventDTO(latest);
        }

        return convertToDeviceDetailDTO(device, lastTelemetry);
    }

    // Get paginated telemetry history for a device, with access control to ensure the user owns the device.
    public PagedTelemetryDTO getTelemetryHistory(Long deviceId, User user, Pageable pageable){
        Device device;
        if (user == null) {
            device = deviceRepository.findByIdAndOwnerIsNull(Long.valueOf(deviceId)).orElse(null);
        } else {
            device = deviceRepository.findByIdAndOwnerOrOwnerIsNull(Long.valueOf(deviceId), user)
                .orElse(null); // If the device does not exist or does not belong to the user, return null or throw an exception.
        }
        
        if(device == null){
            return null;
        }   

        // Fetch the telemetry data for the device, ordered by timestamp in descending order (newest first).
        Page<SensorEvent> page = sensorEventRepository.findByDeviceOrderByTimestampDesc(device, pageable);

        // Convert the Page of SensorEvent entities to a list of SensorEventDTOs. 
        List<SensorEventDTO> content = page.getContent().stream()
            .map(this::convertToSensorEventDTO)
            .collect(Collectors.toList());

        // Create a PagedTelemetryDTO to hold the paginated results. 
        PagedTelemetryDTO result = new PagedTelemetryDTO();
        result.setContent(content);
        result.setPageNumber(page.getNumber());
        result.setPageSize(page.getSize());
        result.setTotalElements(page.getTotalElements());
        result.setTotalPages(page.getTotalPages());
        result.setLast(page.isLast());

        return result;
    }

    // Get paginated action audit log for a device, ensuring the user owns the device.
    public PagedActionAuditDTO getActionAudit(Long deviceId, User user, Pageable pageable){
        Device device;
        if (user == null) {
            device = deviceRepository.findByIdAndOwnerIsNull(Long.valueOf(deviceId)).orElse(null);
        } else {
            device = deviceRepository.findByIdAndOwnerOrOwnerIsNull(Long.valueOf(deviceId), user)
                .orElse(null); // If the device does not exist or does not belong to the user, 
                // return null or throw an exception. 
        }
        
        if(device == null){
            return new PagedActionAuditDTO(); // return empty result or throw exception
        }

        // Fetch the action log entries for the device, ordered by triggered_at in descending order (newest first).
        Page<ActionLog> page = actionLogRepository.findByDeviceOrderByTriggeredAtDesc(device, pageable);

        // Convert the Page of ActionLog entities to a list of ActionLogDTOs. 
        List<ActionLogDTO> content = page.getContent().stream()
            .map(this::convertToActionLogDTO)
            .collect(Collectors.toList());

        // Create a PagedActionAuditDTO to hold the paginated results.
        PagedActionAuditDTO result = new PagedActionAuditDTO();
        result.setContent(content);
        result.setPageNumber(page.getNumber());
        result.setPageSize(page.getSize());
        result.setTotalElements(page.getTotalElements());
        result.setTotalPages(page.getTotalPages());
        result.setLast(page.isLast());

        return result;
    }

    // Helper methods to convert entities to DTOs for API responses. These methods take the entity
    // objects and extract the relevant fields to create the corresponding DTOs that will be sent 
    // in the API responses.

    // Convert a Device entity to a DeviceListDTO for the device listing page.
    private DeviceListDTO convertToDeviceListDTO(Device device){
        
        String onlineStatus = determineOnlineStatus(device.getLastSeen());// Determine if 
        // the device is online based on the last seen timestamp.

        // Create and return a new DeviceListDTO with the device's information.
        return new DeviceListDTO(
            device.getId(),
            device.getMacAddress(),
            device.getName(),
            device.getLastSeen(),
            onlineStatus
        );
    }

    // Convert a Device entity to a DeviceDetailDTO for the device detail page.
    private DeviceDetailDTO convertToDeviceDetailDTO(Device device, SensorEventDTO lastTelemetry){
        String onlineStatus = determineOnlineStatus(device.getLastSeen());

        UserBasicDTO owner = null;
        if(device.getOwner() != null){
            owner = new UserBasicDTO(
                device.getOwner().getId(),
                device.getOwner().getUsername()
            );
        }

        return new DeviceDetailDTO(
            device.getId(),
            device.getMacAddress(),
            device.getName(),
            owner, 
            device.getCreatedAt(),
            device.getLastSeen(),
            onlineStatus,
            lastTelemetry,
            device.getLastCommandFanOn(),
            device.getLastCommandLedOn(),
            device.getLastCommandLcdMessage(),
            device.getLastCommandServoAngle()
        );

    }

    // Convert a SensorEvent entity to a SensorEventDTO for the telemetry data in the API response.
    private SensorEventDTO convertToSensorEventDTO(SensorEvent event){
        return new SensorEventDTO(
            event.getId(),
            event.getTimestamp(),
            event.getLightLevel(),
            event.getNoiseLevel(),
            event.getMotionDetected()
        );
    }

    // Convert an ActionLog entity to an ActionLogDTO for the action audit log in the API response.
    private ActionLogDTO convertToActionLogDTO(ActionLog log) {
        return new ActionLogDTO(
            log.getId(),
            log.getActionType(),
            log.getTriggeredAt()
        );
    }

    // Determine the online status of a device based on its last seen timestamp. 
    // If the last seen time is within the last 5 minutes, we consider the device to 
    // be "Online". If it is older than 5 minutes, we consider it "Offline". If there
    // is no last seen timestamp, we return "Unknown".
    private String determineOnlineStatus(LocalDateTime lastSeen){
        if(lastSeen == null){
            return "Unknown";
        }

        LocalDateTime now = LocalDateTime.now();
        if(lastSeen.isAfter(now.minusMinutes(5))){
            return "Online";
        } else {
            return "Offline";
        }
    }

    // Send a control command to a specific device. The command contains desired state for
    // fanOn, ledOn, displayText, and servoAngle. This method stores the command for the 
    // device to retrieve on its next telemetry poll.
    public DeviceCommandDTO sendCommand(Long deviceId, User user, DeviceCommandDTO command) {
        Device device;
        if (user == null) {
            device = deviceRepository.findByIdAndOwnerIsNull(Long.valueOf(deviceId)).orElse(null);
        } else {
            device = deviceRepository.findByIdAndOwnerOrOwnerIsNull(Long.valueOf(deviceId), user)
                .orElse(null);
        }
        
        if(device == null){
            return new DeviceCommandDTO(); // Return empty command if device not found/unauthorized
        }

        // Store the command state on the device entity for later retrieval during telemetry processing.
        // The device will fetch these on its next telemetry poll and apply the commands.
        if (command.getFanOn() != null) {
            device.setLastCommandFanOn(command.getFanOn());
            device.setLastCommandAt(LocalDateTime.now());
        }
        if (command.getResetFanAuto() != null && command.getResetFanAuto()) {
            device.setLastCommandFanOn(null);
            device.setLastCommandAt(LocalDateTime.now());
        }

        if (command.getLedOn() != null) {
            device.setLastCommandLedOn(command.getLedOn());
            device.setLastCommandAt(LocalDateTime.now());
        }
        if (command.getResetLedAuto() != null && command.getResetLedAuto()) {
            device.setLastCommandLedOn(null);
            device.setLastCommandAt(LocalDateTime.now());
        }

        if (command.getLcdMessage() != null) {
            device.setLastCommandLcdMessage(command.getLcdMessage());
            device.setLastCommandAt(LocalDateTime.now());
        }
        if (command.getServoAngle() != null) {
            device.setLastCommandServoAngle(command.getServoAngle());
            device.setLastCommandAt(LocalDateTime.now());
        }
        
        deviceRepository.save(device);

        // Return the same command confirming receipt
        return command;
    }

}

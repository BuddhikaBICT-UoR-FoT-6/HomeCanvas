package com.homecanvas.iot.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.homecanvas.iot.model.SensorEvent;
import com.homecanvas.iot.model.Device;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SensorEventRepository extends JpaRepository<SensorEvent, Long>{
    // Get all sensor events for a device (with pagination)
    Page<SensorEvent> findByDeviceOrderByTimestampDesc(Device device, Pageable pageable);

    // Get sensor readings within a time range for a device
    List<SensorEvent> findByDeviceAndTimestampBetween(
        Device device,
        LocalDateTime startTime,
        LocalDateTime endTime
    );

    // Get only motion detection events from a device
    List<SensorEvent> findByDeviceAndMotionDetectedTrue(Device device);

    // Get only light readings below threshold (for darkness detection)
    List<SensorEvent> findByDeviceAndLightLevelLessThan(Device device, Integer threshold);

    // Get only noise events above threshold (for intruder detection)
    List<SensorEvent> findByDeviceAndNoiseLevelGreaterThan(Device device, Integer threshold);
    
} 
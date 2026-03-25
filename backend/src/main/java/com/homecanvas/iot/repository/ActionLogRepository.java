package com.homecanvas.iot.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.homecanvas.iot.model.ActionLog;
import com.homecanvas.iot.model.Device;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActionLogRepository extends JpaRepository<ActionLog, Long>{
    // Get all actions from a specific device (with pagination)
    Page<ActionLog> findByDeviceOrderByTriggeredAtDesc(Device device, Pageable pageable);

    // Get actions of a specific type from a device
    List<ActionLog> findByDeviceAndActionType(Device device, String actionType);

    // Get actions triggered within a time range (for analytics)
    List<ActionLog> findByTriggeredAtBetween(LocalDateTime startTime, LocalDateTime endTime);

    // Get recent actions from a device (audit trail)
    // findByTriggeredAtBetween(14:00, 15:00)
    // Analytics: "System activity between 14:00-15:00"
    List<ActionLog> findByDeviceOrderByTriggeredAtDescLimit(Device device, int limit);
    
}
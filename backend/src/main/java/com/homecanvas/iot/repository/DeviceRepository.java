package com.homecanvas.iot.repository;

import org.springframework.data.jpa.repository.JpaRepository; 
import org.springframework.stereotype.Repository;
import com.homecanvas.iot.model.Device;
import com.homecanvas.auth.model.User;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Long>{
    // Find device by MAC address (used during telemetry ingestion)
    // findByMacAddress("AA:BB:CC:E1:F1")
    // ESP32 sends telemetry, backend finds which device it is
    Optional<Device> findByMacAddress(String macAddress);

    // Find all devices owned by a user (dashboard listing)
    // findByOwner(user)
    // Dashboard: "Show me all my smart home nodes"
    List<Device> findByOwner(User owner);

    // Include unclaimed auto-registered devices so dashboard can discover them.
    List<Device> findByOwnerOrOwnerIsNull(User owner);

    // Read unclaimed devices when no user context is available.
    List<Device> findByOwnerIsNull();

    // Find device by ID and verify ownership (authorization check)
    Optional<Device> findByIdAndOwner(Long id, User owner);

    // Find device by ID and verify ownership OR if it's unclaimed (for auto-registration)
    Optional<Device> findByIdAndOwnerOrOwnerIsNull(Long id, User owner);

    // Find device by ID and verify it's unclaimed (for auto-registration)
    Optional<Device> findByIdAndOwnerIsNull(Long id);

}

package com.homecanvas.iot.repository;

import com.homecanvas.iot.model.Device;
import com.homecanvas.iot.model.OccupancyPattern;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OccupancyPatternRepository extends JpaRepository<OccupancyPattern, Long> {

    /**
     * Find latest pattern for a device
     */
    Optional<OccupancyPattern> findFirstByDeviceOrderByDateGeneratedDesc(Device device);

    /**
     * Find patterns generated after a specific date
     */
    List<OccupancyPattern> findByDeviceAndDateGeneratedAfter(Device device, LocalDateTime date);

    /**
     * Find all patterns for a device
     */
    List<OccupancyPattern> findByDeviceOrderByDateGeneratedDesc(Device device);

    /**
     * Find high-confidence predictions (for dashboard)
     */
    @Query("SELECT op FROM OccupancyPattern op WHERE op.device = :device " +
           "AND op.confidenceScore > :threshold ORDER BY op.dateGenerated DESC")
    List<OccupancyPattern> findHighConfidencePatterns(
        @Param("device") Device device,
        @Param("threshold") Double threshold
    );
}

package com.homecanvas.iot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Stores AI-generated occupancy patterns
 * Generated daily by PatternAnalysisScheduler
 */
@Entity
@Table(name = "occupancy_patterns")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OccupancyPattern {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    private Device device;

    private LocalDateTime dateGenerated;

    @Column(columnDefinition = "TEXT")
    private String pattern;  // AI-generated prediction text

    @Column(columnDefinition = "TEXT")
    private String summary;  // Brief summary (1-2 sentences)

    private Double occupancyPercentage;  // 0.0 - 100.0

    private Double confidenceScore;  // 0.0 - 1.0

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

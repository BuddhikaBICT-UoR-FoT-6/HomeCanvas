package com.homecanvas.iot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "action_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class ActionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(name = "action_type", nullable = false)
    private String actionType;

    @Column(name = "triggered_at")
    private LocalDateTime triggeredAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // constructor
    public ActionLog(Device device, String actionType){
        this.device = device;
        this.actionType = actionType;
        this.triggeredAt = LocalDateTime.now();
    }
    
}

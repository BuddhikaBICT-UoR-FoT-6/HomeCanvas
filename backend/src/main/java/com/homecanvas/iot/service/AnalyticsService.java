package com.homecanvas.iot.service;

import com.homecanvas.iot.repository.DeviceRepository;
import com.homecanvas.iot.repository.SensorEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AnalyticsService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private SensorEventRepository sensorEventRepository;

    @Autowired
    private com.homecanvas.iot.repository.ActionLogRepository actionLogRepository;

    public Map<String, Object> getSummaryAnalytics(String range) {
        Map<String, Object> stats = new HashMap<>();

        long totalDevices = deviceRepository.count();
        
        // Active devices (seen in the last 15 minutes)
        LocalDateTime fifteenMinsAgo = LocalDateTime.now().minusMinutes(15);
        long activeDevices = deviceRepository.findAll().stream()
                .filter(d -> d.getLastSeen() != null && d.getLastSeen().isAfter(fifteenMinsAgo))
                .count();

        // Time Range Logic
        LocalDateTime startTime;
        int intervals;
        String intervalType; // "minute" or "hour"

        switch (range) {
            case "5m":
                startTime = LocalDateTime.now().minusMinutes(5);
                intervals = 5;
                intervalType = "minute";
                break;
            case "1h":
                startTime = LocalDateTime.now().minusHours(1);
                intervals = 60;
                intervalType = "minute";
                break;
            case "24h":
            default:
                startTime = LocalDateTime.now().minusHours(24);
                intervals = 24;
                intervalType = "hour";
                break;
        }

        var recentEvents = sensorEventRepository.findAll().stream()
                .filter(e -> e.getTimestamp().isAfter(startTime))
                .toList();

        // 1. Light Intensity Trend
        Map<Integer, Double> lightTrend = new HashMap<>();
        Map<Integer, Integer> lightCounts = new HashMap<>();
        for (int i = 0; i < intervals; i++) { lightTrend.put(i, 0.0); lightCounts.put(i, 0); }

        recentEvents.forEach(e -> {
            int timeValue = intervalType.equals("hour") ? e.getTimestamp().getHour() : e.getTimestamp().getMinute();
            // For minute range, we might need a relative minute if it spans across an hour
            // but for simplicity let's stick to absolute for now
            lightTrend.put(timeValue, lightTrend.getOrDefault(timeValue, 0.0) + (e.getLightLevel() != null ? e.getLightLevel() : 0));
            lightCounts.put(timeValue, lightCounts.getOrDefault(timeValue, 0) + 1);
        });

        stats.put("lightTrend", lightTrend.entrySet().stream()
            .map(entry -> {
                Map<String, Object> point = new HashMap<>();
                point.put("label", intervalType.equals("hour") ? entry.getKey() + ":00" : entry.getKey() + "m");
                point.put("value", entry.getValue() / Math.max(1, lightCounts.get(entry.getKey())));
                point.put("sortKey", entry.getKey());
                return point;
            }).sorted((a,b) -> (Integer)a.get("sortKey") - (Integer)b.get("sortKey")).toList());

        // 2. Security Alert Trend
        Map<Integer, Long> securityTrend = new HashMap<>();
        recentEvents.stream().filter(e -> Boolean.TRUE.equals(e.getMotionDetected())).forEach(e -> {
            int timeValue = intervalType.equals("hour") ? e.getTimestamp().getHour() : e.getTimestamp().getMinute();
            securityTrend.put(timeValue, securityTrend.getOrDefault(timeValue, 0L) + 1);
        });

        stats.put("securityTrend", securityTrend.entrySet().stream()
            .map(entry -> {
                Map<String, Object> point = new HashMap<>();
                point.put("label", intervalType.equals("hour") ? entry.getKey() + ":00" : entry.getKey() + "m");
                point.put("alerts", entry.getValue());
                point.put("sortKey", entry.getKey());
                return point;
            }).sorted((a,b) -> (Integer)a.get("sortKey") - (Integer)b.get("sortKey")).toList());

        // 3. Action Distribution (Pie Chart data)
        var actionLogs = actionLogRepository.findAll().stream()
                .filter(a -> a.getTriggeredAt().isAfter(startTime))
                .toList();
        Map<String, Long> actionCounts = actionLogs.stream()
                .collect(java.util.stream.Collectors.groupingBy(a -> a.getActionType(), java.util.stream.Collectors.counting()));
        stats.put("actionCounts", actionCounts);

        stats.put("totalDevices", totalDevices);
        stats.put("activeDevices", activeDevices);
        stats.put("totalTelemetry", sensorEventRepository.count());

        return stats;
    }
}

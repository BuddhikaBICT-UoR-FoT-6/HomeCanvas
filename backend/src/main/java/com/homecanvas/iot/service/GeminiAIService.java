package com.homecanvas.iot.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.Gson;
import com.homecanvas.iot.model.SensorEvent;
import com.homecanvas.iot.dto.AIPredictionDTOs.*;
import java.time.LocalDateTime;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Gemini AI Service - Handles all AI-powered analysis
 * 
 * Features:
 * 1. Predictive occupancy analysis from historical sensor data
 * 2. Natural language security alert generation
 * 3. Rate limiting to respect API quotas
 */
@Service
@Slf4j
public class GeminiAIService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model.name:gemini-1.5-flash}")
    private String modelName;

    @Value("${gemini.rate.limit.requests:60}")
    private int rateLimitRequests;

    @Value("${gemini.rate.limit.window:60000}")
    private int rateLimitWindow;

    private boolean isConfigured = false;
    private final Gson gson = new Gson();
    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    
    // Simple rate limiting without external library
    private AtomicInteger requestCount = new AtomicInteger(0);
    private AtomicLong windowStartTime = new AtomicLong(System.currentTimeMillis());

    @PostConstruct
    public void init() {
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("sk-test-key-for-development")) {
            log.warn("[GEMINI] API key not configured. AI features will be disabled.");
            log.warn("[GEMINI] Set GEMINI_API_KEY environment variable to enable.");
            isConfigured = false;
            return;
        }

        try {
            isConfigured = true;
            log.info("[GEMINI] Service initialized successfully with model: " + modelName);
        } catch (Exception e) {
            log.error("[GEMINI] Failed to initialize service: " + e.getMessage());
            isConfigured = false;
        }
    }

    /**
     * Check if request is within rate limit (60 per minute)
     */
    private boolean isWithinRateLimit() {
        long currentTime = System.currentTimeMillis();
        long windowStart = windowStartTime.get();
        
        // Reset window if time has passed
        if (currentTime - windowStart >= rateLimitWindow) {
            requestCount.set(0);
            windowStartTime.set(currentTime);
        }
        
        // Check limit
        if (requestCount.get() < rateLimitRequests) {
            requestCount.incrementAndGet();
            return true;
        }
        
        return false;
    }

    /**
     * Analyze historical sensor data to predict occupancy patterns
     * 
     * Example Output:
     * "Morning occupancy: 8-9am (95% confidence), Evening: 5-7pm (88% confidence), Night: 10pm-6am minimal activity"
     */
    public String predictOccupancyPattern(List<SensorEvent> historicalData) {
        if (!isConfigured) {
            log.warn("[GEMINI] Service not configured, returning default prediction");
            return "Insufficient data or service not configured. Deploy with GEMINI_API_KEY to enable AI predictions.";
        }

        if (!isWithinRateLimit()) {
            log.warn("[GEMINI] Rate limit exceeded for prediction analysis");
            return "Rate limit exceeded. Please try again later.";
        }

        try {
            // Group data by hour and calculate occupancy probability
            String dataAnalysis = historicalData.stream()
                .collect(Collectors.groupingBy(event -> {
                    String time = event.getTimestamp().toLocalTime().toString();
                    return time.substring(0, 2);  // Hour only (HH:00)
                }))
                .entrySet().stream()
                .map(entry -> String.format(
                    "%s:00 - Motion: %d%%, Avg Sound: %d, Avg Light: %d",
                    entry.getKey(),
                    (int)(entry.getValue().stream().filter(SensorEvent::getMotionDetected).count() * 100 / entry.getValue().size()),
                    (int)entry.getValue().stream().mapToInt(SensorEvent::getNoiseLevel).average().orElse(0),
                    (int)entry.getValue().stream().mapToInt(SensorEvent::getLightLevel).average().orElse(0)
                ))
                .collect(Collectors.joining("\n"));

            String prompt = String.format(
                "Analyze these 7 days of sensor data from a smart home and identify occupancy patterns:\n\n%s\n\n" +
                "Provide a 3-4 sentence summary of occupancy patterns (focus: peak hours, frequency, consistency). " +
                "Format: 'Morning: X-Yam, Evening: X-Ypm, etc.' Be concise and data-driven.",
                dataAnalysis
            );

            return callGeminiAPI(prompt);

        } catch (Exception e) {
            log.error("[GEMINI] Prediction analysis failed: " + e.getMessage(), e);
            return "Unable to generate prediction at this time.";
        }
    }

    /**
     * Engine 1: Simplified Semantic Action Prompt ("What are they doing?")
     */
    public ActionPredictionResponse predictCurrentAction(int light, int sound, boolean motion) {
        if (!isConfigured) {
            return new ActionPredictionResponse("AI Engine Offline", 0);
        }

        try {
            String time = LocalDateTime.now().toLocalTime().toString().substring(0, 5);
            String prompt = String.format(
                "You are a smart home context engine. Look at the current sensor data and time of day. Output a strict JSON object guessing the human action occurring.\n\n" +
                "Input Data: Time: %s. PIR: %b, Sound: %d, LDR: %d.\n\n" +
                "Output Schema:\n" +
                "{\n" +
                "\"predicted_action\": (String: A short phrase like 'Watching TV', 'Sleeping', 'Cooking', 'Room Empty'),\n" +
                "\"confidence_score\": (Integer 0-100)\n" +
                "}",
                time, motion, sound, light
            );

            String jsonResult = callGeminiAPI(prompt);
            if (jsonResult != null) {
                // Strip potential markdown code blocks if Gemini includes them
                jsonResult = jsonResult.replace("```json", "").replace("```", "").trim();
                return gson.fromJson(jsonResult, ActionPredictionResponse.class);
            }
        } catch (Exception e) {
            log.error("[GEMINI] Action prediction failed: " + e.getMessage());
        }
        return new ActionPredictionResponse("Unknown Activity", 50);
    }

    /**
     * Engine 2: Simplified RCA Prompt ("What just happened?")
     */
    public RCAResponse analyzeAlarmRCA(int soundLevel, boolean preMotion, boolean postMotion, int preSound, int postSound) {
        if (!isConfigured) {
            return new RCAResponse("AI Analysis Unavailable", false);
        }

        try {
            String time = LocalDateTime.now().toLocalTime().toString().substring(0, 5);
            String prompt = String.format(
                "You are a forensic security AI. An alarm was triggered by a sound spike. Analyze the timeline before and after the trigger. Decide if this is a real threat or a false alarm. Output strict JSON.\n\n" +
                "Input Data: Time %s.\n" +
                "Pre-Trigger: PIR=%b, Sound=%d.\n" +
                "Trigger: Sound=%d.\n" +
                "Post-Trigger: PIR=%b, Sound=%d.\n\n" +
                "Output Schema:\n" +
                "{\n" +
                "\"root_cause_prediction\": (String: A 1-sentence explanation of what physically caused the alarm based on the timeline),\n" +
                "\"is_true_threat\": (Boolean: true if intruder, false if likely environmental noise)\n" +
                "}",
                time, preMotion, preSound, soundLevel, postMotion, postSound
            );

            String jsonResult = callGeminiAPI(prompt);
            if (jsonResult != null) {
                jsonResult = jsonResult.replace("```json", "").replace("```", "").trim();
                return gson.fromJson(jsonResult, RCAResponse.class);
            }
        } catch (Exception e) {
            log.error("[GEMINI] RCA analysis failed: " + e.getMessage());
        }
        return new RCAResponse("Unable to classify threat", true);
    }

    public String generateSecurityAlert(int soundLevel, boolean lockdown, long timestamp) {
        if (!isConfigured) {
            return String.format("Security Alert - Sound Level: %d%s",
                soundLevel,
                lockdown ? " [LOCKDOWN ACTIVE]" : "");
        }

        if (!isWithinRateLimit()) {
            log.warn("[GEMINI] Rate limit exceeded for alert generation");
            return "ALERT: Sound level anomaly detected";
        }

        try {
            String threatLevel = soundLevel > 3000 ? "CRITICAL" :
                                soundLevel > 2500 ? "HIGH" :
                                soundLevel > 2000 ? "MEDIUM" : "LOW";

            String prompt = String.format(
                "Classify this sensor anomaly in ONE sentence (max 15 words):\n" +
                "Sound Level: %d (normal: 500-2000, threshold: >3000 = glass break)\n" +
                "Lockdown Status: %s\n" +
                "Threat Level: %s\n" +
                "Response format: '[LEVEL] [EVENT] [CONTEXT]'",
                soundLevel, lockdown ? "ACTIVE" : "INACTIVE", threatLevel
            );

            String result = callGeminiAPI(prompt);
            return result != null ? result : simulateAlertResponse(soundLevel, lockdown);

        } catch (Exception e) {
            log.error("[GEMINI] Alert generation failed: " + e.getMessage(), e);
            return "SECURITY ALERT: Anomaly detected";
        }
    }

    /**
     * Call Gemini API via REST
     */
    private String callGeminiAPI(String prompt) {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost httpPost = new HttpPost(GEMINI_API_URL + "?key=" + apiKey);
            
            // Build request body
            JsonObject requestBody = new JsonObject();
            JsonArray contents = new JsonArray();
            JsonObject content = new JsonObject();
            JsonArray parts = new JsonArray();
            JsonObject part = new JsonObject();
            part.addProperty("text", prompt);
            parts.add(part);
            content.add("parts", parts);
            contents.add(content);
            requestBody.add("contents", contents);
            
            httpPost.setEntity(new StringEntity(
                gson.toJson(requestBody),
                ContentType.APPLICATION_JSON
            ));

            var response = httpClient.execute(httpPost, classicHttpResponse -> {
                if (classicHttpResponse.getCode() == 200) {
                    String responseBody = new String(classicHttpResponse.getEntity().getContent().readAllBytes());
                    JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);
                    
                    if (jsonResponse.has("candidates") && jsonResponse.getAsJsonArray("candidates").size() > 0) {
                        JsonObject candidate = jsonResponse.getAsJsonArray("candidates").get(0).getAsJsonObject();
                        if (candidate.has("content") && candidate.getAsJsonObject("content").has("parts")) {
                            JsonObject contentObj = candidate.getAsJsonObject("content")
                                .getAsJsonArray("parts").get(0).getAsJsonObject();
                            return contentObj.get("text").getAsString();
                        }
                    }
                }
                return null;
            });
            
            return response;
            
        } catch (Exception e) {
            log.error("[GEMINI] API call failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Check if Gemini service is properly configured
     */
    public boolean isServiceAvailable() {
        return isConfigured;
    }

    /**
     * Get current rate limit status (for monitoring)
     */
    public String getRateLimitStatus() {
        long currentTime = System.currentTimeMillis();
        long windowStart = windowStartTime.get();
        long timeRemainingMs = rateLimitWindow - (currentTime - windowStart);
        long timeRemainingSeconds = Math.max(0, timeRemainingMs / 1000);
        
        return String.format("Rate limit: %d/%d requests used, resets in %d seconds",
            requestCount.get(), rateLimitRequests, timeRemainingSeconds);
    }

    // ==================== SIMULATION HELPERS ====================
    // These simulate Gemini responses until the library is fully integrated

    private String simulateAlertResponse(int soundLevel, boolean lockdown) {
        if (soundLevel > 3000) {
            return "[CRITICAL] Possible glass break detected - Emergency protocols activated";
        } else if (soundLevel > 2500) {
            return "[HIGH] Loud noise event detected - Sound level spike observed";
        } else if (soundLevel > 2000) {
            return "[MEDIUM] Notable sound activity - Possible conversation or appliance noise";
        } else {
            return "[LOW] Sound level spike - Minor environmental noise";
        }
    }
}

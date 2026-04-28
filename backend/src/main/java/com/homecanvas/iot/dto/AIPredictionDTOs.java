package com.homecanvas.iot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AIPredictionDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionPredictionResponse {
        private String predicted_action;
        private int confidence_score;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RCAResponse {
        private String root_cause_prediction;
        private boolean is_true_threat;
    }
}

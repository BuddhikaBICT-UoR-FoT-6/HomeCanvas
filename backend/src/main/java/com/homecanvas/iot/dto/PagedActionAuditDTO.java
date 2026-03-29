package com.homecanvas.iot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagedActionAuditDTO {

    private List<ActionLogDTO> content; // Array of action logs
    private Integer pageNumber; // Current page (0-indexed)
    private Integer pageSize; // Results per page
    private Long totalElements; // Total actions for this device
    private Integer totalPages; // Total pages available
    private Boolean last; // Is this the last page?
}

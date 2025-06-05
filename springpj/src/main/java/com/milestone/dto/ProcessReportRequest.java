package com.milestone.dto;

import java.time.LocalDateTime;

public class ProcessReportRequest {
    private Long reportId;
    private String action; // "HIDE", "DELETE", "SUSPEND"
    private LocalDateTime suspendUntil;
    private String suspendReason;

    public ProcessReportRequest() {
    }

    public Long getReportId() {
        return reportId;
    }

    public void setReportId(Long reportId) {
        this.reportId = reportId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public LocalDateTime getSuspendUntil() {
        return suspendUntil;
    }

    public void setSuspendUntil(LocalDateTime suspendUntil) {
        this.suspendUntil = suspendUntil;
    }

    public String getSuspendReason() {
        return suspendReason;
    }

    public void setSuspendReason(String suspendReason) {
        this.suspendReason = suspendReason;
    }
}

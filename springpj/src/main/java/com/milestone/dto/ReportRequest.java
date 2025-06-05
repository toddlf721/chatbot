package com.milestone.dto;

public class ReportRequest {
    private Long reportedBoardNo;
    private String reason;

    public ReportRequest() {
    }

    public Long getReportedBoardNo() {
        return reportedBoardNo;
    }

    public void setReportedBoardNo(Long reportedBoardNo) {
        this.reportedBoardNo = reportedBoardNo;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    @Override
    public String toString() {
        return "ReportRequest{" +
                "reportedBoardNo=" + reportedBoardNo +
                ", reason='" + reason + '\'' +
                '}';
    }
}

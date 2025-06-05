package com.milestone.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Builder;
import com.milestone.entity.Report;

import java.time.LocalDateTime;

@Builder
@Getter
@AllArgsConstructor
public class ReportResponse {
        private Long reportId;
        private Long reportedBoardNo;
        private Long reporterMemberNo;
        private String reporterNickname;
        private String reason;
        private String status;
        private LocalDateTime createdAt;

        public static ReportResponse fromEntity(Report report, String nickname) {
                return ReportResponse.builder()
                                .reportId(report.getReportId())
                                .reportedBoardNo(report.getReportedBoardNo())
                                .reporterMemberNo(
                                                report.getReporter() != null ? report.getReporter().getMemberNo()
                                                                : null)
                                .reporterNickname(
                                                report.getReporter() != null ? report.getReporter().getNickname()
                                                                : "(알 수 없음)")
                                .reason(report.getReason())
                                .status(report.getStatus().name())
                                .createdAt(report.getCreatedAt())
                                .build();
        }
}

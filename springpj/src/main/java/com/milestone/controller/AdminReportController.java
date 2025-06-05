package com.milestone.controller;

import com.milestone.dto.ProcessReportRequest;
import com.milestone.dto.ReportResponse;
import com.milestone.entity.Board;
import com.milestone.entity.Report;
import com.milestone.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {

    private final ReportService reportService;

    public AdminReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /** 모든 신고 리스트 조회 */
    @GetMapping
    public ResponseEntity<List<ReportResponse>> listAll() {
        List<ReportResponse> list = reportService.getAllReports().stream()
                .map(r -> {
                    Long reporterId = r.getReporter() != null ? r.getReporter().getMemberNo() : null;
                    String nickname = r.getReporter() != null ? r.getReporter().getNickname() : "(알 수 없음)";
                    return new ReportResponse(
                            r.getReportId(),
                            r.getReportedBoardNo(),
                            reporterId,
                            nickname,
                            r.getReason(),
                            r.getStatus().name(),
                            r.getCreatedAt());
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    /* 미처리 신고 수 */
    @GetMapping("/pending-count")
    public ResponseEntity<Long> getPendingReportCount() {
        return ResponseEntity.ok(reportService.getPendingReportCount());
    }

    /** 신고 처리 (숨기기, 삭제, 계정 정지) */
    @PostMapping("/process")
    public ResponseEntity<Void> process(@RequestBody ProcessReportRequest req) {
        // 1) 신고 정보 조회
        Report rpt = reportService.getReport(req.getReportId());
        Long boardNo = rpt.getReportedBoardNo();

        switch (req.getAction()) {
            case "HIDE":
                reportService.hideBoard(boardNo);
                break;

            case "DELETE":
                reportService.deleteBoard(boardNo);
                break;

            case "SUSPEND":
                Board board = reportService.getBoardById(boardNo);
                Long offenderId = board.getMember().getMemberNo();
                reportService.suspendMember(offenderId, req.getSuspendUntil(), req.getSuspendReason());
                break;

            default:
                throw new IllegalArgumentException("알 수 없는 action: " + req.getAction());
        }

        // 2) 신고 상태를 RESOLVED 로 변경
        reportService.resolveReport(req.getReportId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/recent")
    public ResponseEntity<List<ReportResponse>> getRecentReports() {
        List<Report> reports = reportService.getRecentReports();
        List<ReportResponse> response = reports.stream()
                .map(r -> {
                    Long reporterId = r.getReporter() != null ? r.getReporter().getMemberNo() : null;
                    String nickname = r.getReporter() != null ? r.getReporter().getNickname() : "(알 수 없음)";
                    return new ReportResponse(
                            r.getReportId(),
                            r.getReportedBoardNo(),
                            reporterId,
                            nickname,
                            r.getReason(),
                            r.getStatus().name(),
                            r.getCreatedAt());
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getTotalReportCount() {
        List<Report> allReports = reportService.getAllReports();
        return ResponseEntity.ok((long) allReports.size());
    }
}

package com.milestone.controller;

import com.milestone.dto.ReportRequest;
import com.milestone.dto.ReportResponse;
import com.milestone.service.ReportService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    @Autowired
    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    public ResponseEntity<?> createReport(@RequestBody ReportRequest request, HttpSession session) {
        try {
            Long reporterMemberNo = (Long) session.getAttribute("LOGGED_IN_MEMBER");
            System.out.println("📌 세션 memberNo: " + reporterMemberNo);
            System.out.println("📦 요청 데이터: " + request);

            if (reporterMemberNo == null) {
                return ResponseEntity.status(401).body("로그인이 필요합니다.");
            }
            reportService.createReport(request.getReportedBoardNo(), reporterMemberNo, request.getReason());
            return ResponseEntity.ok("신고가 정상적으로 접수되었습니다.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("신고 처리 중 오류가 발생했습니다.");
        }
    }

    @PostMapping("/process")
    public ResponseEntity<?> processReport(@RequestBody Map<String, Object> payload) {
        try {
            Long reportId = Long.valueOf(payload.get("reportId").toString());
            String action = payload.get("action").toString();
            String reason = (String) payload.getOrDefault("suspendReason", null);

            LocalDateTime until = null;
            if (payload.containsKey("suspendUntil") && payload.get("suspendUntil") != null) {
                until = LocalDateTime.parse(payload.get("suspendUntil").toString());
            }

            reportService.processReport(reportId, action, until, reason);
            return ResponseEntity.ok("신고 처리가 완료되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("처리 중 오류 발생: " + e.getMessage());
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<List<ReportResponse>> getRecentReports() {
        List<ReportResponse> recentReports = reportService.getRecentReports(5);
        System.out.println("📋 최근 신고 수: " + recentReports.size()); // 로그 찍기
        return ResponseEntity.ok(recentReports);
    }

}

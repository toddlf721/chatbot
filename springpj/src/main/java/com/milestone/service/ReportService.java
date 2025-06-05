package com.milestone.service;

import com.milestone.entity.Report;
import com.milestone.entity.ReportStatus;
import com.milestone.repository.ReportRepository;
import com.milestone.repository.BoardRepository;
import com.milestone.repository.MemberRepository;
import com.milestone.dto.ReportResponse;
import com.milestone.entity.Board;
import com.milestone.entity.Member;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Pageable;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;

    public ReportService(ReportRepository reportRepository,
            BoardRepository boardRepository,
            MemberRepository memberRepository) {
        this.reportRepository = reportRepository;
        this.boardRepository = boardRepository;
        this.memberRepository = memberRepository;
    }

    public Report createReport(Long reportedBoardNo, Long reporterMemberNo, String reason) {
        Member reporter = memberRepository.findById(reporterMemberNo)
        .orElseThrow(() -> new IllegalArgumentException("신고한 회원이 존재하지 않습니다."));

        Report report = new Report();
        report.setReportedBoardNo(reportedBoardNo);
        report.setReporter(reporter);
        report.setReason(reason);
        report.setStatus(ReportStatus.PENDING);
        return reportRepository.save(report);
    }

    public Long getPendingReportCount() {
        return reportRepository.countByStatus(ReportStatus.PENDING);
    }

    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    // 최근 신고 5건 조회
    public List<Report> getRecentReports() {
        return reportRepository.findTop5ByOrderByCreatedAtDesc();
    }

    public Report getReport(Long reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("해당 신고가 존재하지 않습니다."));
    }

    public String getReporterNickname(Long memberNo) {
        return memberRepository.findById(memberNo)
                .map(Member::getMemberNickname) // ❗ 여기서 Member 엔티티 필드에 따라 수정
                .orElse("알 수 없음");
    }

    public String getReportedBoardTitle(Long boardNo) {
        return boardRepository.findById(boardNo)
                .map(Board::getBoardTitle)
                .orElse("(삭제된 게시물)");
    }

    public void hideBoard(Long boardNo) {
        Optional<Board> boardOpt = boardRepository.findById(boardNo);
        boardOpt.ifPresent(board -> {
            board.setVisible(false);
            boardRepository.save(board);
        });
    }

    public void deleteBoard(Long boardNo) {
        boardRepository.deleteById(boardNo);
    }

    public void suspendMember(Long memberNo, LocalDateTime suspendUntil, String reason) {
        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("해당 회원이 존재하지 않습니다."));
        member.setMemberStatus("suspended");
        member.setMemberSuspendUntil(suspendUntil);
        member.setMemberSuspendReason(reason);
        memberRepository.save(member);
    }

    public void resolveReport(Long reportId) {
        Report report = getReport(reportId);
        report.setStatus(ReportStatus.RESOLVED);
        reportRepository.save(report);
    }

    public void processReport(Long reportId, String action, LocalDateTime suspendUntil, String suspendReason) {
        Report report = getReport(reportId);
        Long boardNo = report.getReportedBoardNo();

        if ("DELETE".equals(action)) {
            deleteBoard(boardNo);
        } else if ("BAN".equals(action)) {
            Board board = boardRepository.findById(boardNo)
                    .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다."));
            Member member = board.getMember(); // 또는 report에서 직접 memberNo 추출

            if (member != null) {
                suspendMember(member.getMemberNo(), suspendUntil, suspendReason);
            } else {
                throw new IllegalArgumentException("게시글에 작성자가 존재하지 않습니다.");
            }
        }

        resolveReport(reportId);
    }

    public Board getBoardById(Long boardNo) {
        return boardRepository.findById(boardNo)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시물이 존재하지 않습니다."));
    }

    public List<ReportResponse> getRecentReports(int count) {
        Pageable pageable = PageRequest.of(0, count);
        List<Report> reports = reportRepository.findAllByOrderByCreatedAtDesc(pageable);

        return reports.stream()
                .map(report -> {
                    String nickname = report.getReporter() != null ? report.getReporter().getNickname() : "알 수 없음";
                    return ReportResponse.fromEntity(report, nickname);
                })
                .collect(Collectors.toList());
    }

}

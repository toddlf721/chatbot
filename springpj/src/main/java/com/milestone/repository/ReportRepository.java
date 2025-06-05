package com.milestone.repository;

import com.milestone.entity.Report;
import com.milestone.entity.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

import org.springframework.data.domain.Pageable;
public interface ReportRepository extends JpaRepository<Report, Long> {
    /** 상태별 신고 조회 */
    List<Report> findByStatus(ReportStatus status);

    /** 상태별 신고 수 조회 (예: 미처리 신고 수) */
    Long countByStatus(ReportStatus status);

    List<Report> findTop5ByOrderByCreatedAtDesc();

    // 최근 신고 N건 (동적)
    List<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

}

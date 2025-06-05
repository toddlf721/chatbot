package com.milestone.repository;

import com.milestone.entity.PopupNotice;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PopupNoticeRepository extends JpaRepository<PopupNotice, Long> {

    PopupNotice findTopByOrderByCreatedAtDesc();

    PopupNotice findTopByStartDateBeforeAndEndDateAfterOrderByStartDateDesc(LocalDateTime start, LocalDateTime end);

}
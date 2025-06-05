package com.milestone.dto;

import com.milestone.entity.PopupNotice;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PopupNoticeResponse {

    private Long id;
    private String content;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime createdAt;

    public static PopupNoticeResponse fromEntity(PopupNotice notice) {
        return PopupNoticeResponse.builder()
                .id(notice.getId())
                .content(notice.getContent())
                .startDate(notice.getStartDate())
                .endDate(notice.getEndDate())
                .createdAt(notice.getCreatedAt())
                .build();
    }
}
package com.milestone.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class PopupNoticeRequest {
    private String content;
    private String startDate; // String으로 받기
    private String endDate;
}

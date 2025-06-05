package com.milestone.dto;

import com.milestone.entity.Member;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDto {

    private Long messageNo;
    private Member messageFrom;
    private Member messageTo;
    private String messageContent;
    private LocalDateTime messageInputdate; // Date -> date로 변경
    private Boolean messageToCheck; // 추가
}

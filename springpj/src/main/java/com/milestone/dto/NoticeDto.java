package com.milestone.dto;

import com.milestone.entity.Notice;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoticeDto {
    private Long noticeNo;
    private Long memberNo;
    private Long noticeSender;
    private String noticeSenderName;  // 발신자 이름 추가
    private String noticeSenderPhoto;  // 발신자 프로필 사진 추가 (있다면)
    private String noticeType;
    private Long noticeTypeNo;
    private String noticeMessage;
    private boolean noticeRead;
    private LocalDateTime noticeInputdate;
}

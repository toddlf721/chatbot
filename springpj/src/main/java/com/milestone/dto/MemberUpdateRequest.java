package com.milestone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberUpdateRequest {
    private String memberName;
    private String memberNickname;
    private String memberIntroduce;
    private String resetProfileImage; // 프로필 이미지 초기화 여부
    private String memberVisible; // 계정 공개 범위 설정
    private String notificationSettings; // 알림 설정 JSON 문자열
}
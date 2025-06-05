package com.milestone.dto;

import lombok.Data;


import java.time.LocalDateTime;



@Data
public class SuspendMemberRequest {
    private LocalDateTime suspendUntil; // 정지 해제 날짜
    private String reason; // 🔥 정지 사유 필드 추가
}

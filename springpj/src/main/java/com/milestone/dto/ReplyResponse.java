package com.milestone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplyResponse {

    private Long replyNo;

    private Long memberNo;

    private String memberNickname;

    private Long boardNo;

    private Long replyParentNo; // 대댓글인 경우 부모 댓글 번호

    private String replyContent;

    private Long replyLike;

    private String replyStatus; // "active", "deleted", "reported"

    private LocalDateTime replyInputdate;

    private LocalDateTime replyUpdatedate;
}
package com.milestone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplyRequest {

    @NotNull(message = "게시물 번호는 필수입니다.")
    private Long boardNo;

    private Long replyParentNo; // 대댓글인 경우 부모 댓글 번호

    @NotBlank(message = "댓글 내용은 필수입니다.")
    @Size(max = 1000, message = "댓글 내용은 최대 1000자입니다.")
    private String replyContent;
}
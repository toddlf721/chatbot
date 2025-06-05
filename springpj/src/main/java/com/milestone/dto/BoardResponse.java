package com.milestone.dto;

import com.milestone.entity.Board;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardResponse {

    private Long boardNo;

    private Long memberNo;

    private String memberName;

    private String memberNickname;

    private String memberPhoto;

    private String boardType; // "daily" or "study"

    private String boardCategory;

    private String boardTitle;

    private String boardContent;

    private Long boardLike;

    private Long boardScrap;

    private Long boardReadhit;

    private String boardVisible; // "public", "logined", "follow"

    private LocalDateTime boardInputdate;

    private String boardImage; // 대표 이미지 URL

    private List<String> tags; // 태그 목록

    private boolean isLiked; // 현재 사용자의 좋아요 상태

    private boolean isScraped; // 현재 사용자의 스크랩 상태

    private Long replyCount; // 댓글 수

    // Entity를 Response DTO로 변환하는 정적 메서드
    public static BoardResponse fromEntity(Board board, List<String> tags,
                                           boolean isLiked, boolean isScraped,
                                           String boardImage, Long replyCount) {
        return BoardResponse.builder()
                .boardNo(board.getBoardNo())
                .memberNo(board.getMember().getMemberNo())
                .memberName(board.getMember().getMemberName())
                .memberNickname(board.getMember().getMemberNickname())
                .memberPhoto(board.getMember().getMemberPhoto())
                .boardType(board.getBoardType())
                .boardCategory(board.getBoardCategory())
                .boardTitle(board.getBoardTitle())
                .boardContent(board.getBoardContent())
                .boardLike(board.getBoardLike())
                .boardScrap(board.getBoardScrap())
                .boardReadhit(board.getBoardReadhit())
                .boardVisible(board.getBoardVisible())
                .boardInputdate(board.getBoardInputdate())
                .boardImage(boardImage)
                .tags(tags)
                .isLiked(isLiked)
                .isScraped(isScraped)
                .replyCount(replyCount)
                .build();
    }
}
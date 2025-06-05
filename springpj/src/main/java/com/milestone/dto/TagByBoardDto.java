package com.milestone.dto;

import com.milestone.entity.BoardImage;
import com.milestone.entity.Reply;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TagByBoardDto {


    private int boardCnt;

    private Long boardNo;
    private String thumbnailImage;
    private Long boardLike;
    private Long boardReplies;
    private String boardType;
    private String boardTitle;
    private String memberNickname;
    private String memberPhoto;

    private LocalDateTime boardInputdate;

}

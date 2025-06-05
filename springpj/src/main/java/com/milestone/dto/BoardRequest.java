package com.milestone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardRequest {

    private String boardType; // "daily" or "study"

    private String boardCategory;

    private String boardTitle;

    @NotBlank(message = "게시물 내용은 필수입니다.")
    @Size(max = 2000, message = "게시물 내용은 최대 2000자입니다.")
    private String boardContent;

    private String boardVisible; // "public", "follow", "private"

    private String tags; // JSON 형식의 태그 배열 문자열 (예: ["java", "spring", "react"])

    private List<MultipartFile> images;
}
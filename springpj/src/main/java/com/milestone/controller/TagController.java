package com.milestone.controller;

import com.milestone.dto.TagBoardCountDto;
import com.milestone.dto.TagByBoardDto;
import com.milestone.entity.Tag;
import com.milestone.service.BoardService;
import com.milestone.service.TagService;
import com.milestone.dto.BoardResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private static final Logger logger = LoggerFactory.getLogger(TagController.class);
    private final TagService tagService;
    private final BoardService boardService;

    /**
     * 인기 태그 목록 조회 API
     */
    @GetMapping("/popular")
    public ResponseEntity<List<String>> getPopularTags(
            @RequestParam(defaultValue = "10") int limit) {
        logger.info("인기 태그 목록 조회 요청 - 제한: {}", limit);
        List<String> popularTags = tagService.getPopularTags(limit);
        return ResponseEntity.ok(popularTags);
    }

    /**
     * 특정 태그가 포함된 게시물 목록 조회 API
     */
    @GetMapping("/{tagName}/boards")
    public ResponseEntity<List<BoardResponse>> getBoardsByTag(
            @PathVariable String tagName,
            HttpSession session) {
        logger.info("태그별 게시물 조회 요청 - 태그: {}", tagName);

        // 태그 이름으로 게시물 번호 목록 조회
        List<Long> boardIds = tagService.getBoardIdsByTagName(tagName);

        // 게시물 번호 목록을 사용하여 게시물 정보 조회
        List<BoardResponse> boards = boardService.getBoardsByIds(boardIds, session);

        return ResponseEntity.ok(boards);
    }

    // 특정 태그가 포함된 게시물 목록 + 게시물 수
    @GetMapping("/searchtag")
    public ResponseEntity<List<TagBoardCountDto>> searchTagByBoardCounts(@RequestParam String query){


        List<TagBoardCountDto> tags = tagService.searchNameByTag(query);


        return ResponseEntity.ok(tags);
    }



    /**
     * 특정 태그가 포함된 게시물 목록 조회 - PathVariable 방식
     * @param tagName 태그명
     * @return 게시물 목록
     */
    @GetMapping("/boardlist/{tagName}")
    public ResponseEntity<List<TagByBoardDto>> boardlistByTagName(@PathVariable String tagName) {
        System.out.println("TAG NAME : " + tagName);

        // 태그별 게시물 조회
        List<TagByBoardDto> boardList = tagService.findTagByBoardDtosByTagName(tagName);

        System.out.println("boardlist : " + boardList);


        return ResponseEntity.ok(boardList);
//
    }

}
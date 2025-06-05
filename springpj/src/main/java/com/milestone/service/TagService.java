package com.milestone.service;

import com.milestone.dto.TagBoardCountDto;
import com.milestone.dto.TagByBoardDto;
import com.milestone.entity.Board;
import com.milestone.entity.BoardImage;
import com.milestone.entity.BoardTag;
import com.milestone.entity.Tag;
import com.milestone.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private static final Logger logger = LoggerFactory.getLogger(TagService.class);
    private final TagRepository tagRepository;
    private final BoardTagRepository boardTagRepository;
    private final BoardRepository boardRepository;
    private final ObjectMapper objectMapper;
    private final BoardImageRepository boardImageRepository;
    private final ReplyRepository replyRepository;

    /**
     * 게시물에 태그 저장
     */
    @Transactional
    public void saveBoardTags(Board board, List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return;
        }

        for (String tagName : tagNames) {
            // 태그 이름 유효성 검사
            if (tagName == null || tagName.trim().isEmpty()) {
                continue;
            }

            // 태그 이름 정리 (공백 제거, 소문자 변환)
            String normalizedTagName = normalizeTagName(tagName);

            // 중복 태그 확인
            boolean isDuplicate = tagRepository.existsByBoardBoardNoAndTagName(board.getBoardNo(), normalizedTagName);
            if (isDuplicate) {
                continue;
            }

            // 새 태그 생성 및 저장
            Tag tag = Tag.builder()
                    .tagName(normalizedTagName)
                    .board(board)
                    .build();

            tagRepository.save(tag);
        }
    }

    /**
     * 게시물의 태그 업데이트
     */
    @Transactional
    public void updateBoardTags(Board board, List<String> newTagNames) {
        // 태그 이름 정리
        List<String> normalizedTagNames = newTagNames.stream()
                .filter(tagName -> tagName != null && !tagName.trim().isEmpty())
                .map(this::normalizeTagName)
                .collect(Collectors.toList());

        // 기존 태그 가져오기
        List<Tag> existingTags = tagRepository.findByBoardBoardNo(board.getBoardNo());
        List<String> existingTagNames = existingTags.stream()
                .map(Tag::getTagName)
                .collect(Collectors.toList());

        // 삭제할 태그 찾기 (기존 태그 중 새로운 태그 목록에 없는 것)
        List<Tag> tagsToRemove = existingTags.stream()
                .filter(tag -> !normalizedTagNames.contains(tag.getTagName()))
                .collect(Collectors.toList());

        // 추가할 태그 찾기 (새로운 태그 중 기존 태그 목록에 없는 것)
        List<String> tagsToAdd = normalizedTagNames.stream()
                .filter(tag -> !existingTagNames.contains(tag))
                .collect(Collectors.toList());

        // 태그 삭제
        for (Tag tag : tagsToRemove) {
            tagRepository.delete(tag);
        }

        // 태그 추가
        for (String tagName : tagsToAdd) {
            Tag tag = Tag.builder()
                    .tagName(tagName)
                    .board(board)
                    .build();

            tagRepository.save(tag);
        }
    }

    /**
     * 게시물의 태그 삭제
     */
    @Transactional
    public void deleteBoardTags(Board board) {
        tagRepository.deleteByBoardBoardNo(board.getBoardNo());
    }

    /**
     * 특정 게시물의 태그 목록 조회
     */
    @Transactional(readOnly = true)
    public List<String> getBoardTags(Long boardNo) {
        List<Tag> tags = tagRepository.findByBoardBoardNo(boardNo);
        return tags.stream()
                .map(Tag::getTagName)
                .collect(Collectors.toList());
    }

    /**
     * 인기 태그 목록 조회
     */
    @Transactional(readOnly = true)
    public List<String> getPopularTags(int limit) {
        return boardTagRepository.findMostUsedTags(limit);
    }

    /**
     * 특정 태그가 포함된 게시물 ID 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Long> getBoardIdsByTagName(String tagName) {
        // 태그 이름 정규화
        String normalizedTagName = normalizeTagName(tagName);

        // 태그로 게시물 ID 목록 직접 조회
        List<Tag> tags = tagRepository.findByTagName(normalizedTagName);
        return tags.stream()
                .map(tag -> tag.getBoard().getBoardNo())
                .collect(Collectors.toList());
    }

    /**
     * 태그 이름 정규화 (공백 제거, 소문자 변환)
     */
    private String normalizeTagName(String tagName) {
        if (tagName == null) return "";
        // #으로 시작하면 제거
        tagName = tagName.startsWith("#") ? tagName.substring(1) : tagName;
        // 공백 제거, 소문자 변환
        return tagName.trim().toLowerCase();
    }

    /**
     * JSON 문자열에서 태그 목록 추출 유틸리티 메서드
     */
    public List<String> parseTagsFromJson(String tagsJson) {
        if (tagsJson == null || tagsJson.isEmpty()) {
            return new ArrayList<>();
        }

        try {
            // JSON 배열 역직렬화
            if (tagsJson.startsWith("[") && tagsJson.endsWith("]")) {
                try {
                    return objectMapper.readValue(tagsJson, new TypeReference<List<String>>() {});
                } catch (Exception e) {
                    logger.warn("JSON 배열 파싱 실패, 문자열 파싱 시도: {}", e.getMessage());
                }
            }

            // 따옴표, 대괄호 제거 후 쉼표로 분리
            tagsJson = tagsJson.replaceAll("[\\[\\]\"]", "");
            String[] tagArray = tagsJson.split(",");

            return java.util.Arrays.stream(tagArray)
                    .map(String::trim)
                    .filter(tag -> !tag.isEmpty())
                    .map(this::normalizeTagName)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("태그 파싱 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    public List<TagBoardCountDto> searchNameByTag(String query){

        List<TagBoardCountDto> tags = new ArrayList<TagBoardCountDto>();
        tags = tagRepository.findTagNameWithBoardCount(query);
        return tags;
    }

    public int countByTag(String tagName) {

        int boardCount = tagRepository.countByTagName(tagName);
        return boardCount;
    }




    public List<TagByBoardDto> findTagByBoardDtosByTagName(String tagName) {



        //태그에 해당하는 태그들을 갖고옴
        List<Tag> tags = tagRepository.findTagsByTagName(tagName);

        System.out.println("tags" + tags);

        List<Board> boards = new ArrayList<Board>();

        for(Tag tg : tags){
            Board board = new Board();
            board = boardRepository.findByBoardNo(tg.getBoard().getBoardNo());
            boards.add(board);
        }


        System.out.println("boards : " + boards);


        List<TagByBoardDto> results = new ArrayList<TagByBoardDto>();
        TagByBoardDto dto = new TagByBoardDto();

        for(Board board : boards){

            System.out.println("BOARD : " + board);

            dto.setBoardNo(board.getBoardNo());
            dto.setBoardLike(board.getBoardLike());
            dto.setBoardType(board.getBoardType());
            dto.setBoardTitle(board.getBoardTitle());
            dto.setBoardInputdate(board.getBoardInputdate());

            List<BoardImage> images = boardImageRepository.findByBoardBoardNoOrderByBoardImageOrderAsc(board.getBoardNo());
            dto.setThumbnailImage(images.get(0).getBoardImageName());

            //댓글개수
            Long reples = replyRepository.countByBoardBoardNoAndReplyStatus(board.getBoardNo(),"active");

            dto.setBoardReplies(reples);

            results.add(dto);
        }

        System.out.println("results : " + results);


        return results;
    }
}
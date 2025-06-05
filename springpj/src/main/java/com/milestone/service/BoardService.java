package com.milestone.service;

import com.milestone.dto.BoardRequest;
import com.milestone.dto.BoardResponse;
import com.milestone.entity.Board;
import com.milestone.entity.BoardImage;
import com.milestone.entity.Member;
import com.milestone.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {

    private static final Logger logger = LoggerFactory.getLogger(BoardService.class);
    private final BoardRepository boardRepository;
    private final BoardImageRepository boardImageRepository;
    private final MemberRepository memberRepository;
    private final LikeRepository likeRepository;
    private final ScrapRepository scrapRepository;
    private final ReplyRepository replyRepository;
    private final FollowRepository followRepository;
    private final TagService tagService;
    private final StudyImageService studyImageService;
    private final StudyImageRepository studyImageRepository;
    private static final String SESSION_KEY = "LOGGED_IN_MEMBER";

    /**
     * 모든 게시물 조회
     */
    @Transactional(readOnly = true)
    public List<BoardResponse> getAllBoards(HttpSession session) {
        Long currentMemberNo = (Long) session.getAttribute(SESSION_KEY);
        List<Board> boards = boardRepository.findAllByOrderByBoardInputdateDesc();

        // 접근 권한이 있는 게시물만 필터링
        return boards.stream()
                .filter(board -> hasBoardAccess(board, currentMemberNo))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 게시물 ID로 게시물 조회
     */
    @Transactional
    public BoardResponse getBoardById(Long boardNo, HttpSession session) {
        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다: " + boardNo));

        Long currentMemberNo = (Long) session.getAttribute(SESSION_KEY);

        // 게시물 접근 권한 검사 추가
        validateBoardAccess(board, currentMemberNo);

        // 조회수 증가
        board.setBoardReadhit(board.getBoardReadhit() + 1);
        boardRepository.save(board);

        boolean isLiked = false;
        boolean isScraped = false;

        if (currentMemberNo != null) {
            isLiked = likeRepository.existsByMemberMemberNoAndLikeTypeAndLikeTypeNo(
                    currentMemberNo, "board", boardNo);
            isScraped = scrapRepository.existsByMemberMemberNoAndBoardBoardNo(
                    currentMemberNo, boardNo);
        }

        // 태그 목록 조회
        List<String> tags = tagService.getBoardTags(boardNo);

        // 대표 이미지 URL 가져오기
        String imageUrl = null;
        List<BoardImage> images = boardImageRepository.findByBoardBoardNoOrderByBoardImageOrderAsc(boardNo);
        if (!images.isEmpty()) {
            imageUrl = images.get(0).getBoardImagePath();
        }

        // 댓글 수 조회
        long replyCount = replyRepository.countByBoardBoardNoAndReplyStatus(boardNo, "active");

        return BoardResponse.fromEntity(board, tags, isLiked, isScraped, imageUrl, replyCount);
    }

    /**
     * ID 목록으로 게시물 조회
     */
    @Transactional(readOnly = true)
    public List<BoardResponse> getBoardsByIds(List<Long> boardIds, HttpSession session) {
        if (boardIds == null || boardIds.isEmpty()) {
            return new ArrayList<>();
        }

        Long currentMemberNo = (Long) session.getAttribute(SESSION_KEY);

        List<Board> boards = boardRepository.findByBoardNoIn(boardIds);

        // 결과 목록을 원래 ID 순서대로 정렬
        Map<Long, Board> boardMap = boards.stream()
                .collect(Collectors.toMap(Board::getBoardNo, board -> board));

        List<BoardResponse> result = new ArrayList<>();

        for (Long boardId : boardIds) {
            Board board = boardMap.get(boardId);
            if (board != null) {
                boolean isLiked = false;
                boolean isScraped = false;

                if (currentMemberNo != null) {
                    isLiked = likeRepository.existsByMemberMemberNoAndLikeTypeAndLikeTypeNo(
                            currentMemberNo, "board", boardId);
                    isScraped = scrapRepository.existsByMemberMemberNoAndBoardBoardNo(
                            currentMemberNo, boardId);
                }

                String imageUrl = null;
                List<BoardImage> images = boardImageRepository.findByBoardBoardNoOrderByBoardImageOrderAsc(boardId);
                if (!images.isEmpty()) {
                    imageUrl = images.get(0).getBoardImagePath();
                }

                List<String> tags = tagService.getBoardTags(boardId);
                long replyCount = replyRepository.countByBoardBoardNoAndReplyStatus(boardId, "active");

                result.add(BoardResponse.fromEntity(board, tags, isLiked, isScraped, imageUrl, replyCount));
            }
        }

        return result;
    }

    /**
     * 게시물 타입별 조회
     */
    @Transactional(readOnly = true)
    public List<BoardResponse> getBoardsByType(String boardType, HttpSession session) {
        Long currentMemberNo = (Long) session.getAttribute(SESSION_KEY);
        List<Board> boards = boardRepository.findByBoardTypeOrderByBoardInputdateDesc(boardType);

        // 접근 권한이 있는 게시물만 필터링
        return boards.stream()
                .filter(board -> hasBoardAccess(board, currentMemberNo))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 게시물 접근 권한 검사
     * @param board 접근하려는 게시물
     * @param currentMemberNo 현재 로그인한 회원 번호
     * @return 접근 가능 여부
     */
    private boolean hasBoardAccess(Board board, Long currentMemberNo) {
        // 전체 공개 게시물은 모두 접근 가능
        if ("public".equals(board.getBoardVisible())) {
            return true;
        }

        // 비로그인 사용자는 전체 공개 게시물만 접근 가능
        if (currentMemberNo == null) {
            return false;
        }

        // 본인 게시물은 항상 접근 가능
        if (board.getMember().getMemberNo().equals(currentMemberNo)) {
            return true;
        }

        // private(비공개) 게시물은 본인만 접근 가능 - 여기서 이미 본인이 아님이 확인됨
        if ("private".equals(board.getBoardVisible())) {
            return false;
        }

        // 팔로워 공개 게시물이면 팔로우 관계 확인
        if ("follow".equals(board.getBoardVisible())) {
            // 게시물 작성자의 팔로워 목록에 현재 사용자가 있는지 확인 (팔로우 상태가 accepted인 경우만)
            return followRepository.existsByFollowMemberMemberNoAndFollowerMemberNoAndFollowStatus(
                    board.getMember().getMemberNo(), currentMemberNo, "accepted");
        }

        // 그 외는 접근 불가
        return false;
    }

    /**
     * 게시물 접근 권한 검사 후 예외 발생
     * 
     * @param board           접근하려는 게시물
     * @param currentMemberNo 현재 로그인한 회원 번호
     * @throws IllegalArgumentException 접근 권한이 없는 경우
     */
    private void validateBoardAccess(Board board, Long currentMemberNo) {
        if (!hasBoardAccess(board, currentMemberNo)) {
            String message;
            if (currentMemberNo == null) {
                message = "로그인이 필요한 게시물입니다.";
            } else if ("follow".equals(board.getBoardVisible())) {
                message = "팔로워만 볼 수 있는 게시물입니다.";
            } else {
                message = "접근 권한이 없는 게시물입니다.";
            }
            throw new IllegalArgumentException(message);
        }
    }

    /**
     * 회원별 게시물 조회
     */
    @Transactional(readOnly = true)
    public List<BoardResponse> getBoardsByMember(Long memberNo) {
        List<Board> boards = boardRepository.findByMemberMemberNoOrderByBoardInputdateDesc(memberNo);
        return boards.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 게시물 ID로 첫 번째 이미지 가져오기
     */
    @Transactional(readOnly = true)
    public BoardImage getBoardFirstImage(Long boardNo) {
        List<BoardImage> images = boardImageRepository.findByBoardBoardNoOrderByBoardImageOrderAsc(boardNo);
        if (images.isEmpty()) {
            return null;
        }
        return images.get(0);
    }

    /**
     * 게시물 작성 - 이미지를 DB에 저장하는 방식으로 변경
     */
    @Transactional
    public BoardResponse createBoard(BoardRequest request, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        // 게시물 공개 설정 처리 - 사용자 설정 반영
        String boardVisible = request.getBoardVisible();
        if (boardVisible == null || boardVisible.isEmpty()) {
            // 기본값은 사용자의 전체 설정을 따름
            boardVisible = member.getMemberVisible();
        }

        // 게시물 엔티티 생성
        Board board = Board.builder()
                .member(member)
                .boardType(request.getBoardType())
                .boardTitle(request.getBoardTitle())
                .boardContent(request.getBoardContent())
                .boardVisible(boardVisible)
                .boardLike(0L)
                .boardScrap(0L)
                .boardReadhit(0L)
                .boardCategory(request.getBoardCategory() != null ? request.getBoardCategory() : "keyMemory")
                .build();

        // 게시물 저장
        Board savedBoard = boardRepository.save(board);
        logger.info("게시물 저장 성공 - ID: {}", savedBoard.getBoardNo());

        // 스터디 게시물인 경우, 임시 저장된 이미지를 게시물에 연결
        if ("study".equals(request.getBoardType())) {
            String studySessionId = (String) session.getAttribute("STUDY_SESSION_ID");
            if (studySessionId != null) {
                // 스터디 이미지 연결
                studyImageService.linkImagesToBoard(studySessionId, savedBoard);
                // 연결 후 세션에서 제거
                session.removeAttribute("STUDY_SESSION_ID");
            }
        }

        // 태그 처리
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            try {
                // JSON 문자열에서 태그 배열 추출
                List<String> tagList = tagService.parseTagsFromJson(request.getTags());
                tagService.saveBoardTags(savedBoard, tagList);
                logger.info("태그 저장 성공: {}", tagList);
            } catch (Exception e) {
                logger.error("태그 처리 중 오류 발생: {}", e.getMessage(), e);
            }
        }

        // 이미지 처리 - MySQL에 직접 저장하는 방식으로 변경
        String firstImageUrl = null; // 대표 이미지 URL 변수 선언
        List<MultipartFile> images = request.getImages(); // 누락된 선언 추가

        if (images != null && !images.isEmpty()) {
            try {
                // 기존 이미지가 있으면 삭제 (새로운 게시물이므로 불필요하지만 일관성을 위해 추가)
                boardImageRepository.deleteByBoardBoardNo(savedBoard.getBoardNo());

                // 새 이미지 저장
                for (int i = 0; i < images.size(); i++) {
                    MultipartFile image = images.get(i);
                    if (image == null || image.isEmpty())
                        continue;

                    // 파일 이름 및 확장자
                    String originalFilename = image.getOriginalFilename();
                    String fileExtension = "";
                    if (originalFilename != null && originalFilename.contains(".")) {
                        fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    }
                    String fileName = "board_" + savedBoard.getBoardNo() + "_" + UUID.randomUUID() + fileExtension;

                    // 이미지 바이너리 및 MIME 타입
                    byte[] imageData = image.getBytes();
                    String contentType = image.getContentType();
                    String imagePath = "/api/images/" + savedBoard.getBoardNo();

                    BoardImage boardImage = BoardImage.builder()
                            .board(savedBoard)
                            .boardImageName(fileName)
                            .boardImagePath(imagePath)
                            .boardImageData(imageData)
                            .boardImageType(contentType != null ? contentType : "image/jpeg")
                            .boardImageOrder(i)
                            .build();

                    boardImageRepository.save(boardImage);

                    // 대표 이미지 하나만 저장 (첫 번째 이미지)
                    if (i == 0) {
                        firstImageUrl = imagePath;
                    }

                    logger.info("이미지 저장 완료: {}", fileName);
                }
            } catch (IOException e) {
                logger.error("이미지 처리 실패: {}", e.getMessage(), e);
                throw new RuntimeException("이미지 저장 중 오류가 발생했습니다.", e);
            }
        }

        // 응답 DTO 생성
        return BoardResponse.builder()
                .boardNo(savedBoard.getBoardNo())
                .memberNo(member.getMemberNo())
                .memberName(member.getMemberName())
                .memberNickname(member.getMemberNickname())
                .memberPhoto(member.getMemberPhoto())
                .boardType(savedBoard.getBoardType())
                .boardCategory(savedBoard.getBoardCategory())
                .boardTitle(savedBoard.getBoardTitle())
                .boardImage(firstImageUrl)
                .boardContent(savedBoard.getBoardContent())
                .boardLike(savedBoard.getBoardLike())
                .boardScrap(savedBoard.getBoardScrap())
                .boardReadhit(savedBoard.getBoardReadhit())
                .boardVisible(savedBoard.getBoardVisible())
                .boardInputdate(savedBoard.getBoardInputdate())
                .tags(tagService.getBoardTags(savedBoard.getBoardNo()))
                .isLiked(false)
                .isScraped(false)
                .replyCount(0L)
                .build();
    }

    /**
     * 게시물 수정
     */
    @Transactional
    public BoardResponse updateBoard(Long boardNo, BoardRequest request, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다: " + boardNo));

        // 게시물 작성자 확인
        if (!board.getMember().getMemberNo().equals(memberNo)) {
            throw new IllegalArgumentException("게시물을 수정할 권한이 없습니다.");
        }

        // 게시물 정보 업데이트
        board.setBoardContent(request.getBoardContent());
        if (request.getBoardTitle() != null) {
            board.setBoardTitle(request.getBoardTitle());
        }
        if (request.getBoardVisible() != null) {
            board.setBoardVisible(request.getBoardVisible());
        }

        Board updatedBoard = boardRepository.save(board);

        // 태그 처리
        if (request.getTags() != null) {
            try {
                List<String> tagList = tagService.parseTagsFromJson(request.getTags());
                tagService.updateBoardTags(updatedBoard, tagList);
            } catch (Exception e) {
                logger.error("태그 업데이트 중 오류 발생: {}", e.getMessage(), e);
            }
        }

        // 이미지 처리
        List<MultipartFile> images = request.getImages();
        if (images != null && !images.isEmpty()) {
            try {
                // 기존 이미지가 있으면 삭제
                boardImageRepository.deleteByBoardBoardNo(boardNo);

                // 새 이미지 저장
                for (int i = 0; i < images.size(); i++) {
                    MultipartFile image = images.get(i);
                    if (image == null || image.isEmpty())
                        continue;

                    // 파일 이름 및 확장자
                    String originalFilename = image.getOriginalFilename();
                    String fileExtension = "";
                    if (originalFilename != null && originalFilename.contains(".")) {
                        fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    }
                    String fileName = "board_" + updatedBoard.getBoardNo() + "_" + UUID.randomUUID() + fileExtension;

                    // 이미지 바이너리 및 MIME 타입
                    byte[] imageData = image.getBytes();
                    String contentType = image.getContentType();
                    String imagePath = "/api/images/" + updatedBoard.getBoardNo();

                    BoardImage boardImage = BoardImage.builder()
                            .board(updatedBoard)
                            .boardImageName(fileName)
                            .boardImagePath(imagePath)
                            .boardImageData(imageData)
                            .boardImageType(contentType != null ? contentType : "image/jpeg")
                            .boardImageOrder(i)
                            .build();

                    boardImageRepository.save(boardImage);

                    logger.info("이미지 업데이트 완료: {}", fileName);
                }
            } catch (IOException e) {
                logger.error("이미지 처리 실패: {}", e.getMessage(), e);
                throw new RuntimeException("이미지 저장 중 오류가 발생했습니다.", e);
            }
        }

        return convertToDto(updatedBoard);
    }

    /**
     * 게시물 삭제
     */
    @Transactional
    public void deleteBoard(Long boardNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member loginUser = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다: " + boardNo));

        // ✅ 작성자이거나 관리자일 경우만 삭제 허용
        if (!board.getMember().getMemberNo().equals(loginUser.getMemberNo()) && !loginUser.isAdmin()) {
            throw new IllegalArgumentException("게시물을 삭제할 권한이 없습니다.");
        }

        // 연관된 태그 삭제
        tagService.deleteBoardTags(board);

        // 스터디 게시물인 경우 스터디 이미지 삭제
        if ("study".equals(board.getBoardType())) {
            try {
                studyImageRepository.deleteByBoardBoardNo(boardNo);
                logger.info("스터디 이미지 삭제 성공 - 게시물 ID: {}", boardNo);
            } catch (Exception e) {
                logger.error("스터디 이미지 삭제 중 오류: {}", e.getMessage(), e);
                // 이미지 삭제 실패해도 게시물은 삭제 진행
            }
        }

        // 게시물 삭제 (외래 키 제약조건에 따라 관련 이미지, 좋아요, 스크랩 등이 자동 삭제됨)
        boardRepository.delete(board);
    }

    /**
     * 이미지 ID로 이미지 정보 조회
     */
    @Transactional(readOnly = true)
    public BoardImage getBoardImageInfo(Long imageId) {
        return boardImageRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("이미지를 찾을 수 없습니다: " + imageId));
    }

    /**
     * 파일명으로 이미지 정보 조회
     */
    @Transactional(readOnly = true)
    public BoardImage getBoardImageByFilename(String filename) {
        Optional<BoardImage> imageOptional = boardImageRepository.findByBoardImageName(filename);

        if (imageOptional.isPresent()) {
            return imageOptional.get();
        } else {
            // 기본 이미지 반환 또는 대체 처리
            logger.warn("이미지를 찾을 수 없음: {}", filename);
            return createDefaultImage();
        }
    }

    private BoardImage createDefaultImage() {
        // 기본 이미지 데이터 생성 (예: 프로필 기본 이미지)
        try {
            // 클래스패스에서 기본 이미지 로드
            Resource resource = new ClassPathResource("/static/icon/profileimage.png");
            byte[] imageData = Files.readAllBytes(resource.getFile().toPath());

            // 기본 이미지 정보로 BoardImage 객체 생성
            BoardImage defaultImage = new BoardImage();
            defaultImage.setBoardImageName("default_image.png");
            defaultImage.setBoardImageData(imageData);
            defaultImage.setBoardImageType("image/png");
            defaultImage.setBoardImagePath("/icon/profileimage.png");
            defaultImage.setBoardImageOrder(0);

            return defaultImage;
        } catch (IOException e) {
            logger.error("기본 이미지 로드 중 오류: {}", e.getMessage(), e);
            // 최소한의 빈 이미지 데이터 반환
            BoardImage emptyImage = new BoardImage();
            emptyImage.setBoardImageName("empty.png");
            emptyImage.setBoardImageData(new byte[0]);
            emptyImage.setBoardImageType("image/png");
            emptyImage.setBoardImagePath("/icon/profileimage.png");
            emptyImage.setBoardImageOrder(0);
            return emptyImage;
        }
    }

    /**
     * 게시물 엔티티를 DTO로 변환
     */
    private BoardResponse convertToDto(Board board) {
        // 사용자의 좋아요/스크랩 상태는 현재 세션 정보가 없으므로 false로 초기화
        boolean isLiked = false;
        boolean isScraped = false;

        // 게시물 이미지 URL 가져오기
        String imageUrl = null;
        List<BoardImage> images = boardImageRepository.findByBoardBoardNoOrderByBoardImageOrderAsc(board.getBoardNo());
        if (!images.isEmpty()) {
            imageUrl = images.get(0).getBoardImagePath();
        }

        // 태그 목록 가져오기
        List<String> tags = tagService.getBoardTags(board.getBoardNo());

        // 댓글 수 조회
        long replyCount = replyRepository.countByBoardBoardNoAndReplyStatus(board.getBoardNo(), "active");

        // 작성자 정보 처리 - 탈퇴한 회원인 경우 익명 처리
        String authorName = "탈퇴한 회원";
        String authorNickname = "탈퇴한 회원";
        String authorPhoto = "/icon/profileimage.png";

        // 회원이 활성 상태인 경우에만 실제 정보 사용
        if (board.getMember() != null && "active".equals(board.getMember().getMemberStatus())) {
            authorName = board.getMember().getMemberName();
            authorNickname = board.getMember().getMemberNickname();
            authorPhoto = board.getMember().getMemberPhoto();
        }

        return BoardResponse.builder()
                .boardNo(board.getBoardNo())
                .memberNo(board.getMember().getMemberNo())
                .memberName(authorName)
                .memberNickname(authorNickname)
                .memberPhoto(authorPhoto)
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
                .boardImage(imageUrl)
                .tags(tags)
                .isLiked(isLiked)
                .isScraped(isScraped)
                .replyCount(replyCount)
                .build();
    }

    /**
     * 게시물 카테고리 변경
     */
    @Transactional
    public BoardResponse updateBoardCategory(Long boardNo, String category, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다: " + boardNo));

        // 게시물 작성자 확인
        if (!board.getMember().getMemberNo().equals(memberNo)) {
            throw new IllegalArgumentException("게시물을 수정할 권한이 없습니다.");
        }

        // 카테고리 업데이트
        board.setBoardCategory(category);
        Board updatedBoard = boardRepository.save(board);

        logger.info("게시물 카테고리 변경 성공 - ID: {}, 카테고리: {}", boardNo, category);
        return convertToDto(updatedBoard);
    }

    /**
     * 외부 URL 경로를 API 경로로 변환 (이미지 표시 문제 해결)
     */
    public String convertImagePathsToApiUrls(String content) {
        if (content == null)
            return "";
        // uploads 경로를 API 경로로 변환
        return content.replace("http://localhost:9000/uploads/", "/api/images/content/")
                .replace("https://localhost:9000/uploads/", "/api/images/content/")
                .replace("/uploads/", "/api/images/content/");
    }

    /**
     * 스터디 게시물 전용 조회 (이미지 경로 처리 포함)
     */
    @Transactional(readOnly = true)
    public List<BoardResponse> getStudyBoardsWithProcessedContent(HttpSession session) {
        Long currentMemberNo = (Long) session.getAttribute(SESSION_KEY);
        List<Board> boards = boardRepository.findStudyBoardsOrderByBoardInputdateDesc();

        // 접근 권한이 있는 게시물만 필터링
        return boards.stream()
                .filter(board -> hasBoardAccess(board, currentMemberNo))
                .map(board -> {
                    // 기본 DTO 변환
                    BoardResponse response = convertToDto(board);

                    // 콘텐츠 이미지 경로 처리
                    if (response.getBoardContent() != null) {
                        response.setBoardContent(convertImagePathsToApiUrls(response.getBoardContent()));
                    }

                    return response;
                })
                .collect(Collectors.toList());
    }
}
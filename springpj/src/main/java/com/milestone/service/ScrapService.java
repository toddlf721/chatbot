package com.milestone.service;

import com.milestone.entity.Board;
import com.milestone.entity.Member;
import com.milestone.entity.Scrap;
import com.milestone.repository.BoardRepository;
import com.milestone.repository.MemberRepository;
import com.milestone.repository.ScrapRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScrapService {

    private static final Logger logger = LoggerFactory.getLogger(ScrapService.class);
    private final ScrapRepository scrapRepository;
    private final MemberRepository memberRepository;
    private final BoardRepository boardRepository;
    private static final String SESSION_KEY = "LOGGED_IN_MEMBER";

    /**
     * 게시물 스크랩
     */
    @Transactional
    public void scrapBoard(Long boardNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        // 이미 스크랩한 게시물인지 확인
        boolean alreadyScrapped = scrapRepository.existsByMemberAndBoard(member, board);
        if (alreadyScrapped) {
            throw new IllegalArgumentException("이미 스크랩한 게시물입니다.");
        }

        // 스크랩 생성
        Scrap scrap = Scrap.builder()
                .member(member)
                .board(board)
                .build();

        scrapRepository.save(scrap);

        // 게시물 스크랩 수 증가
        board.setBoardScrap(board.getBoardScrap() + 1);
        boardRepository.save(board);

        logger.info("게시물 스크랩 성공 - 게시물 ID: {}, 회원 ID: {}", boardNo, memberNo);
    }

    /**
     * 게시물 스크랩 취소
     */
    @Transactional
    public void unscrapBoard(Long boardNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        // 스크랩 조회
        Scrap scrap = scrapRepository.findByMemberAndBoard(member, board)
                .orElseThrow(() -> new IllegalArgumentException("스크랩한 기록이 없습니다."));

        // 스크랩 삭제
        scrapRepository.delete(scrap);

        // 게시물 스크랩 수 감소
        if (board.getBoardScrap() > 0) {
            board.setBoardScrap(board.getBoardScrap() - 1);
            boardRepository.save(board);
        }

        logger.info("게시물 스크랩 취소 성공 - 게시물 ID: {}, 회원 ID: {}", boardNo, memberNo);
    }

    /**
     * 현재 로그인한 사용자가 스크랩한 게시물 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Long> getScrapsByMember(HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        List<Scrap> scraps = scrapRepository.findByMember(member);
        return scraps.stream()
                .map(scrap -> scrap.getBoard().getBoardNo())
                .collect(Collectors.toList());
    }

    /**
     * 특정 게시물에 대해 현재 로그인한 사용자의 스크랩 상태 확인
     */
    @Transactional(readOnly = true)
    public boolean checkScrapStatus(Long boardNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            return false;
        }

        return scrapRepository.existsByMemberMemberNoAndBoardBoardNo(memberNo, boardNo);
    }
}
package com.milestone.service;

import com.milestone.dto.CategoryUpdateRequest;
import com.milestone.entity.CategoryName;
import com.milestone.entity.Member;
import com.milestone.repository.CategoryNameRepository;
import com.milestone.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private static final Logger logger = LoggerFactory.getLogger(CategoryService.class);
    private final CategoryNameRepository categoryNameRepository;
    private final MemberRepository memberRepository;
    private static final String SESSION_KEY = "LOGGED_IN_MEMBER";

    /**
     * 카테고리 이름 업데이트
     */
    @Transactional
    public CategoryName updateCategoryName(CategoryUpdateRequest request, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        // 기존 카테고리 조회
        Optional<CategoryName> existingCategory = categoryNameRepository.findByMemberNoAndCategoryCode(
                memberNo, request.getCategoryCode());

        CategoryName categoryName;

        if (existingCategory.isPresent()) {
            // 기존 카테고리 업데이트
            categoryName = existingCategory.get();
            categoryName.setCategoryName(request.getCategoryName());
        } else {
            // 새 카테고리 생성
            categoryName = CategoryName.builder()
                    .memberNo(memberNo)
                    .categoryCode(request.getCategoryCode())
                    .categoryName(request.getCategoryName())
                    .build();
        }

        return categoryNameRepository.save(categoryName);
    }

    /**
     * 특정 회원의 카테고리 이름 목록 조회
     */
    @Transactional(readOnly = true)
    public Map<String, String> getCategoryNames(Long memberNo) {
        List<CategoryName> categories = categoryNameRepository.findByMemberNo(memberNo);

        Map<String, String> categoryMap = new HashMap<>();
        categoryMap.put("keyMemory", "키 메모리");  // 기본값
        categoryMap.put("activity1", "활동 1");     // 기본값
        categoryMap.put("activity2", "활동 2");     // 기본값

        // 사용자 지정 카테고리 이름이 있으면 덮어쓰기
        for (CategoryName category : categories) {
            categoryMap.put(category.getCategoryCode(), category.getCategoryName());
        }

        return categoryMap;
    }
}
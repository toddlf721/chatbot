package com.milestone.controller;

import com.milestone.dto.CategoryUpdateRequest;
import com.milestone.entity.CategoryName;
import com.milestone.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private static final Logger logger = LoggerFactory.getLogger(CategoryController.class);
    private final CategoryService categoryService;

    /**
     * 카테고리 이름 업데이트 API
     */
    @PutMapping
    public ResponseEntity<CategoryName> updateCategoryName(
            @RequestBody CategoryUpdateRequest request,
            HttpSession session) {

        logger.info("카테고리 이름 업데이트 요청 - 코드: {}, 이름: {}",
                request.getCategoryCode(), request.getCategoryName());

        CategoryName updatedCategory = categoryService.updateCategoryName(request, session);
        return ResponseEntity.ok(updatedCategory);
    }

    /**
     * 회원별 카테고리 이름 목록 조회 API
     */
    @GetMapping("/{memberNo}")
    public ResponseEntity<Map<String, String>> getCategoryNames(@PathVariable Long memberNo) {
        logger.info("회원 카테고리 이름 조회 요청 - 회원 ID: {}", memberNo);

        Map<String, String> categoryNames = categoryService.getCategoryNames(memberNo);
        return ResponseEntity.ok(categoryNames);
    }
}
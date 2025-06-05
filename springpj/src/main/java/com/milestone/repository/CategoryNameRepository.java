package com.milestone.repository;

import com.milestone.entity.CategoryName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryNameRepository extends JpaRepository<CategoryName, Long> {

    List<CategoryName> findByMemberNo(Long memberNo);

    Optional<CategoryName> findByMemberNoAndCategoryCode(Long memberNo, String categoryCode);

    void deleteByMemberNoAndCategoryCode(Long memberNo, String categoryCode);
}
package com.milestone.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "category_name")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryName {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_no", nullable = false)
    private Long memberNo;

    @Column(name = "category_code", nullable = false, length = 20)
    private String categoryCode;

    @Column(name = "category_name", nullable = false, length = 30)
    private String categoryName;
}
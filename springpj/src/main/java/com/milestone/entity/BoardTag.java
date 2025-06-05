package com.milestone.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "board_tag")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tag_no")
    private Long tagNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_no", nullable = false)
    private Board board;

    @Column(name = "tag_name", nullable = false, length = 20)
    private String tagName;

    @CreationTimestamp
    @Column(name = "tag_inputdate", nullable = false, updatable = false)
    private LocalDateTime tagInputdate;
}
package com.milestone.service;

import com.milestone.dto.MemberSearchDto;
import com.milestone.entity.Member;
import com.milestone.repository.MemberRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final MemberRepository memberRepository;




    @Transactional
    public List<Member> memberIdSearch (String query){

        return memberRepository
                .findByMemberNicknameContainingAndMemberVisibleAndMemberStatusOrderByMemberLastloginDesc(
                        query, "public", "active")
                .orElse(Collections.emptyList());
    }

}

package com.milestone.repository;

import com.milestone.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message,Long> {

    // 기본 메시지 목록 조회 (네이티브 SQL 사용)
    @Query(value = "SELECT * FROM message m WHERE m.message_to = :userId AND m.message_to_visible = true " +
            "ORDER BY m.message_from_check ASC, m.message_inputdate DESC",
            nativeQuery = true)
    Page<Message> findAllMessages(@Param("userId") Long userId, Pageable pageable);

    // 발신자로 검색하는 쿼리
    @Query(value = "SELECT * FROM message " +
            "WHERE message_to = :userId " +
            "AND message_to_visible = true " +
            "AND message_from = :keyword " +
            "ORDER BY message_to_check ASC, message_inputdate DESC",
            nativeQuery = true)
    Page<Message> findBySenderName(@Param("userId") Long userId, @Param("keyword") String keyword, Pageable pageable);

    // 내용으로 검색하는 쿼리
    @Query(value = "SELECT * FROM message " +
            "WHERE message_to = :userId " +
            "AND message_to_visible = true " +
            "AND message_content LIKE %:keyword% " +
            "ORDER BY message_to_check ASC, message_inputdate DESC",
            nativeQuery = true)
    Page<Message> findByContentText(@Param("userId") Long userId, @Param("keyword") String keyword, Pageable pageable);




    // 사용자가 보낸 쪽지 중 보낸 사람에게 보이는 쪽지 목록 조회
    @Query(value = "SELECT * FROM message " +
            "WHERE message_from = :userId " +
            "AND message_from_visible = true " +
            "ORDER BY message_inputdate DESC",
            nativeQuery = true)
    Page<Message> findAllSentMessages(@Param("userId") Long userId, Pageable pageable);

    // 발신자로 검색하는 쿼리
    @Query(value = "SELECT * FROM message " +
            "WHERE message_from = :userId " +
            "AND message_from_visible = true " +
            "AND message_to = :receipt " +
            "ORDER BY message_inputdate DESC",
            nativeQuery = true)
    Page<Message> findByreceiptName(@Param("userId") Long userId, @Param("receipt") String receipt, Pageable pageable);

    // 내용으로 검색하는 쿼리
    @Query(value = "SELECT * FROM message " +
            "WHERE message_from = :userId " +
            "AND message_from_visible = true " +
            "AND message_content LIKE %:content% " +
            "ORDER BY message_inputdate DESC",
            nativeQuery = true)
    Page<Message> findByfromContentText(@Param("userId") Long userId, @Param("content") String content, Pageable pageable);


    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.messageToVisible = false WHERE m.messageNo = :messageNo")
    int updateMessageToVisible(@Param("messageNo") Long messageNo);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.messageFromVisible = false WHERE m.messageNo = :messageNo")
    int updateMessageFromVisible(@Param("messageNo") Long messageNo);

    @Modifying
    @Query("UPDATE Message m SET m.messageToCheck = true WHERE m.messageNo = :messageNo")
    @Transactional
    int updateMessageToCheckToTrue(@Param("messageNo") Long messageNo);

    // 읽지 않은 쪽지 수 조회 메소드
    @Query("SELECT COUNT(m) FROM Message m WHERE m.messageTo.memberNo = :memberNo AND m.messageToCheck = false")
    int countUnreadMessagesByMemberNo(@Param("memberNo") Long memberNo);





    @Modifying
    @Query(value = "UPDATE message SET message_to_visible = false WHERE message_to IN :memberNos", nativeQuery = true)
    int clearReceivedMessages(@Param("memberNo") List<Long> memberNo);

    @Modifying
    @Query(value = "UPDATE message SET message_from_visible = false WHERE message_from IN :memberNos", nativeQuery = true)
    int clearSentMessages(@Param("memberNo") List<Long> memberNos);



    @Query(value = "SELECT message_no FROM message WHERE message_to = :memberNo AND message_from_visible = false", nativeQuery = true)
    List<Long> findReceivedMessagesByMemberNoAndVisibleFromSenderFalse(@Param("memberNo") Long memberNo);


    @Query(value = "SELECT message_no FROM message WHERE message_to = :memberNo AND message_from_visible = true", nativeQuery = true)
    List<Long> findReceivedMessagesByMemberNoAndVisibleFromSender(@Param("memberNo") Long memberNo);




    @Query(value = "SELECT message_no FROM message WHERE message_from = :memberNo AND message_to_visible = true", nativeQuery = true)
    List<Long> findSentMessagesByMemberNoAndVisibleToReceiver(@Param("memberNo") Long memberNo);



    @Query(value = "SELECT message_no FROM message WHERE message_from = :memberNo AND message_to_visible = false", nativeQuery = true)
    List<Long> findSentMessagesByMemberNoAndVisibleToReceiverFalse(@Param("memberNo") Long memberNo);



    @Modifying
    @Transactional
    @Query(value="DELETE FROM message WHERE message_no IN :messageNos", nativeQuery = true)
    void deleteAllByMessageNos(@Param("messageNos") List<Long> messageNos);
}

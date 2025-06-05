package com.milestone.controller;

import com.milestone.dto.DeleteMessageRequest;
import com.milestone.dto.MemberResponse;
import com.milestone.dto.MessageDto;
import com.milestone.dto.MessageRequest;
import com.milestone.entity.Member;
import com.milestone.entity.Message;
import com.milestone.repository.MessageRepository;
import com.milestone.service.MemberService;
import com.milestone.service.MessageService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MemberService memberService;
    private final MessageService messageService;
    private final MessageRepository messageRepository;

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody MessageRequest requestDTO,HttpSession session) {
        try {
            // 현재 로그인한 사용자 정보 가져오기
            Optional<MemberResponse> login = memberService.getCurrentMember(session);
            if (!login.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "로그인이 필요합니다."));
            }

            MemberResponse loginUser = login.get();
            Member sender = memberService.findByMemberNo(loginUser.getMemberNo());


            // 메시지 내용 유효성 검사
            if (requestDTO.getContent() == null || requestDTO.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("success", false, "message", "메시지 내용은 필수입니다.")
                );
            }

            List<Long> receivers = requestDTO.getRecipients();

            // 수신자 목록 유효성 검사
            if (receivers == null || receivers.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "수신자는 최소 1명 이상이어야 합니다."));
            }

            // 각 수신자에게 메시지 전송
            List<Message> savedMessages = new ArrayList<>();

            for (Long receiverNo : receivers) {
                Member receiver = memberService.findByMemberNo(receiverNo);

                if (receiver != null) {
                    // Message 엔티티 생성
                    Message message = Message.builder()
                            .messageFrom(sender)
                            .messageTo(receiver)
                            .messageContent(requestDTO.getContent())
                            .messageToVisible(true)
                            .messageFromVisible(true)
                            .messageToCheck(false)
                            .messageInputdate(LocalDateTime.now())
                            .build();

                    savedMessages.add(messageService.saveMessage(message));
                }
            }

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "메시지가 성공적으로 전송되었습니다.",
                            "count", savedMessages.size()
                    )
            );

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "메시지 전송 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @GetMapping("/tolist/{nickname}")
    public ResponseEntity<?> getToMeMessagelist(@PathVariable String nickname,
                                                @RequestParam(required = false) String sender,
                                                @RequestParam(required = false) String content,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size){




        try{
            MemberResponse member = memberService.getMemberByNickname(nickname);


            Pageable pageable = PageRequest.of(page,size);
            Page<Message> tolist = messageService.findMessageByNickname(member.getMemberNo(),sender,content,pageable);

            // 직렬화 가능한 맵으로 변환
            List<Map<String, Object>> messageList = new ArrayList<>();

            for (Message message : tolist.getContent()) {
                Map<String, Object> messageMap = new HashMap<>();
                messageMap.put("messageNo", message.getMessageNo());
                messageMap.put("messageContent", message.getMessageContent());
                messageMap.put("messageToCheck", message.getMessageToCheck());
                messageMap.put("messageInputdate", message.getMessageInputdate().toString());

                // 발신자 정보를 별도의 맵으로 변환
                Map<String, Object> fromMember = new HashMap<>();
                if (message.getMessageFrom() != null) {
                    fromMember.put("memberNo", message.getMessageFrom().getMemberNo());
                    fromMember.put("nickname", message.getMessageFrom().getNickname());
                }
                messageMap.put("messageFrom", fromMember);

                messageList.add(messageMap);
            }

            // 페이지 정보를 포함한 응답 생성
            Map<String, Object> pageContent = new HashMap<>();
            pageContent.put("content", messageList);

            Map<String, Object> response = new HashMap<>();
            response.put("tolist", pageContent);
            response.put("totalPages", tolist.getTotalPages());
            response.put("totalElements", tolist.getTotalElements());
            response.put("currentPage", tolist.getNumber());
            response.put("size", tolist.getSize());
            System.out.println("response : " + response);

            return ResponseEntity.ok(response);
        }catch (Exception e){
            return ResponseEntity.badRequest().body("받은 쪽지함 목록을 불러오는데 실패했습니다 : " + e.getMessage());
        }


    }



    @GetMapping("/fromlist/{nickname}")
    public ResponseEntity<?> getFromMeMessagelist(@PathVariable String nickname,
                                                @RequestParam(required = false) String recipient,
                                                @RequestParam(required = false) String content,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size){




        try{
            MemberResponse member = memberService.getMemberByNickname(nickname);


            Pageable pageable = PageRequest.of(page,size);
            Page<Message> fromlist = messageService.findSenderMessageByNickname(member.getMemberNo(),recipient,content,pageable);

            // 직렬화 가능한 맵으로 변환
            List<Map<String, Object>> messageList = new ArrayList<>();

            for (Message message : fromlist.getContent()) {
                Map<String, Object> messageMap = new HashMap<>();
                messageMap.put("messageNo", message.getMessageNo());
                messageMap.put("messageContent", message.getMessageContent());
                messageMap.put("messageToCheck", message.getMessageToCheck());
                messageMap.put("messageInputdate", message.getMessageInputdate().toString());

                // 수신자 정보를 별도의 맵으로 변환
                Map<String, Object> toMember = new HashMap<>();
                if (message.getMessageFrom() != null) {
                    toMember.put("memberNo", message.getMessageTo().getMemberNo());
                    toMember.put("nickname", message.getMessageTo().getNickname());
                }
                messageMap.put("messageTo", toMember);

                messageList.add(messageMap);
            }

            // 페이지 정보를 포함한 응답 생성
            Map<String, Object> pageContent = new HashMap<>();
            pageContent.put("content", messageList);

            Map<String, Object> response = new HashMap<>();
            response.put("fromlist", pageContent);
            response.put("totalPages", fromlist.getTotalPages());
            response.put("totalElements", fromlist.getTotalElements());
            response.put("currentPage", fromlist.getNumber());
            response.put("size", fromlist.getSize());
            System.out.println("response : " + response);

            return ResponseEntity.ok(response);
        }catch (Exception e){
            return ResponseEntity.badRequest().body("보낸 쪽지함 목록을 불러오는데 실패했습니다 : " + e.getMessage());
        }


    }

    @PostMapping("/delete/received")
    public ResponseEntity<?> deleteReceivedMessages(@RequestBody DeleteMessageRequest request) {

        try {
            if (request.getMessageIds() == null || request.getMessageIds().isEmpty()) {
                return ResponseEntity.badRequest().body("삭제할 쪽지를 선택해주세요.");
            }

            int count = messageService.deleteReceivedMessages(request.getMessageIds());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", count + "개의 쪽지가 삭제되었습니다.");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("쪽지 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }

    }

    @PostMapping("/delete/sent")
    public ResponseEntity<?> deleteSentMessages(@RequestBody DeleteMessageRequest request) {

        try {
            if (request.getMessageIds() == null || request.getMessageIds().isEmpty()) {
                return ResponseEntity.badRequest().body("삭제할 쪽지를 선택해주세요.");
            }

            int count = messageService.deleteSentMessages(request.getMessageIds());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", count + "개의 쪽지가 삭제되었습니다.");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("쪽지 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }

    }

    // 쪽지 상세 조회 API (받은 쪽지)
    @GetMapping("/received/{messageNo}")
    public ResponseEntity<?> getReceivedMessageDetail(@PathVariable Long messageNo) {


        try {
            Message message = messageService.getMessageById(messageNo);

            if (message == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("쪽지를 찾을 수 없습니다.");
            }
            // 필요한 정보만 맵으로 구성
            Map<String, Object> response = new HashMap<>();
            response.put("messageNo", message.getMessageNo());
            response.put("messageContent", message.getMessageContent());

            // 필드명을 프론트엔드 기대값으로 맞춤 (소문자 d 사용)
            response.put("messageInputdate", message.getMessageInputdate().toString());

            // 발신자 정보 (필요한 필드만)
            Map<String, Object> fromMember = new HashMap<>();
            if (message.getMessageFrom() != null) {
                fromMember.put("memberNo", message.getMessageFrom().getMemberNo());
                fromMember.put("nickname", message.getMessageFrom().getMemberNickname());
            }
            response.put("messageFrom", fromMember);

            // 수신자 정보 (필요한 필드만)
            Map<String, Object> toMember = new HashMap<>();
            if (message.getMessageTo() != null) {
                toMember.put("memberNo", message.getMessageTo().getMemberNo());
                toMember.put("nickname", message.getMessageTo().getMemberNickname());
            }
            response.put("messageTo", toMember);

            System.out.println("Response: " + response);
            // TODO: 권한 체크 - 실제 구현 시 현재 로그인한 사용자가 해당 쪽지의 수신자인지 확인 필요

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("쪽지 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 쪽지 상세 조회 API (보낸 쪽지)
    @GetMapping("/sent/{messageNo}")
    public ResponseEntity<?> getSentMessageDetail(@PathVariable Long messageNo) {
        try {
            Message message = messageService.getMessageById(messageNo);

            if (message == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("쪽지를 찾을 수 없습니다.");
            }

            // 필요한 정보만 맵으로 구성
            Map<String, Object> response = new HashMap<>();
            response.put("messageNo", message.getMessageNo());
            response.put("messageContent", message.getMessageContent());

            // 필드명을 프론트엔드 기대값으로 맞춤 (소문자 d 사용)
            response.put("messageInputdate", message.getMessageInputdate().toString());

            // 발신자 정보 (필요한 필드만)
            Map<String, Object> fromMember = new HashMap<>();
            if (message.getMessageFrom() != null) {
                fromMember.put("memberNo", message.getMessageFrom().getMemberNo());
                fromMember.put("nickname", message.getMessageFrom().getMemberNickname());
            }
            response.put("messageFrom", fromMember);

            // 수신자 정보 (필요한 필드만)
            Map<String, Object> toMember = new HashMap<>();
            if (message.getMessageTo() != null) {
                toMember.put("memberNo", message.getMessageTo().getMemberNo());
                toMember.put("nickname", message.getMessageTo().getMemberNickname());
            }
            response.put("messageTo", toMember);

            System.out.println("Response: " + response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("쪽지 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 쪽지 읽음 처리 API
    @PostMapping("/read/{messageNo}")
    public ResponseEntity<?> markMessageAsRead(@PathVariable Long messageNo) {
        try {
            int updated = messageService.markMessageAsRead(messageNo);

            if (updated==1) {
                return ResponseEntity.ok(Map.of("success", true, "message", "쪽지를 읽음 처리했습니다."));
            } else {
                return ResponseEntity.ok(Map.of("success", false, "message", "이미 읽은 쪽지이거나 쪽지를 찾을 수 없습니다."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("쪽지 읽음 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @GetMapping("/unread-count/{memberNo}")
    public ResponseEntity<?> getUnreadMessageCount(@PathVariable Long memberNo) {


        try {
            int count = messageService.countUnreadMessages(memberNo);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("읽지 않은 쪽지 수 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @DeleteMapping("/clear-to")
    public ResponseEntity<?> clearAllMessages(HttpSession session) {
        // 현재 로그인한 사용자 ID 가져오기
        Long memberNo = (Long) session.getAttribute("LOGGED_IN_MEMBER");

        if (memberNo == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "로그인이 필요합니다."));
        }

        try {
            // 현재 사용자의 모든 쪽지 삭제
            messageService.deleteAllByMessageTo(memberNo);


            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "쪽지함이 성공적으로 비워졌습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", "쪽지함을 비우는 중 오류가 발생했습니다: " + e.getMessage()
                    ));
        }
    }

    @DeleteMapping("/clear-sent")
    public ResponseEntity<?> clearSentMessages(HttpSession session) {


        System.out.println("sent");
        // 현재 로그인한 사용자 ID 가져오기
        Long memberNo = (Long) session.getAttribute("LOGGED_IN_MEMBER");

        System.out.println("memberno : " + memberNo);

        if (memberNo == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "로그인이 필요합니다."));
        }

        try {
            System.out.println("모든쪽지 지우기");
            // 현재 사용자의 모든 쪽지 삭제
            messageService.deleteAllByMessageFrom(memberNo);


            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "쪽지함이 성공적으로 비워졌습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", "쪽지함을 비우는 중 오류가 발생했습니다: " + e.getMessage()
                    ));
        }
    }
}





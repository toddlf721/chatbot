package com.milestone.service;

import com.milestone.entity.Message;
import com.milestone.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;

    //쪽지 전송
    public Message saveMessage(Message message) {
        return messageRepository.save(message);
    }


    public Page<Message> findMessageByNickname(Long userId, String sender, String content, Pageable pageable) {
        if (sender != null && !sender.trim().isEmpty()) {
            return messageRepository.findBySenderName(userId, sender.trim(), pageable);
        } else if (content != null && !content.trim().isEmpty()) {
            return messageRepository.findByContentText(userId, content.trim(), pageable);
        } else {
            return messageRepository.findAllMessages(userId, pageable);
        }
    }

    public Page<Message> findSenderMessageByNickname(Long memberNo, String recipient, String content, Pageable pageable) {
        if (recipient != null && !recipient.trim().isEmpty()) {
            return messageRepository.findByreceiptName(memberNo, recipient.trim(), pageable);
        } else if (content != null && !content.trim().isEmpty()) {
            return messageRepository.findByfromContentText(memberNo, content.trim(), pageable);
        } else {
            return messageRepository.findAllSentMessages(memberNo, pageable);
        }

    }

    public int deleteReceivedMessages(List<Long> messageIds) {
        int num = 0;
        for(Long id : messageIds){
            Optional<Message> message = messageRepository.findById(id);
            if(message.get().getMessageFromVisible() == false){
               num += messageRepository.updateMessageToVisible(id);
            }else{
                messageRepository.deleteById(id);
                num+=1;
            }

        }

        return num;

    }

    public int deleteSentMessages(List<Long> messageIds) {
        int num = 0;
        for(Long id : messageIds){
            Optional<Message> message = messageRepository.findById(id);

            messageRepository.updateMessageToCheckToTrue(message.get().getMessageNo());

            if(message.get().getMessageToVisible() == false){
                num += messageRepository.updateMessageFromVisible(id);
            }else{
                messageRepository.deleteById(id);
                num+=1;
            }

        }

        return num;
    }

    public Message getMessageById(Long messageNo) {
        return messageRepository.findById(messageNo).get();
    }

    public int markMessageAsRead(Long messageNo) {
        return messageRepository.updateMessageToCheckToTrue(messageNo);
    }

    public int countUnreadMessages(Long memberNo) {
            return messageRepository.countUnreadMessagesByMemberNo(memberNo);
    }



    public void deleteAllByMessageTo(Long memberNo) {
        int num = 0;
        List<Long> messages = messageRepository.findReceivedMessagesByMemberNoAndVisibleFromSenderFalse(memberNo);

        if (!messages.isEmpty()) {
            messageRepository.deleteAllByMessageNos(messages);
        }


        List<Long> messagess = messageRepository.findReceivedMessagesByMemberNoAndVisibleFromSender(memberNo);
        if(!messagess.isEmpty()){
        messageRepository.clearReceivedMessages(messagess);
        }


        System.out.println("TOSUM"+ num);
    }

    public void deleteAllByMessageFrom(Long memberNo) {

        int num = 0;
        // 1. 수신자에게 이미 안 보이는 메시지들은 완전히 삭제
        List<Long> messagesToDelete = messageRepository.findSentMessagesByMemberNoAndVisibleToReceiverFalse(memberNo);

        System.out.println("asfsa : " + messagesToDelete );
        if (!messagesToDelete.isEmpty()) {
            messageRepository.deleteAllByMessageNos(messagesToDelete);
            System.out.println("물리적으로 삭제된 메시지 수: " + messagesToDelete.size());
        }



        List<Long> messagesToUpdate = messageRepository.findSentMessagesByMemberNoAndVisibleToReceiver(memberNo);


        System.out.println("asfsa : " + messagesToUpdate );
        if(!messagesToUpdate.isEmpty()){
                num+=messageRepository.clearSentMessages(messagesToUpdate);

        }

        System.out.println("FRROMNUM : " + num);
    }
}
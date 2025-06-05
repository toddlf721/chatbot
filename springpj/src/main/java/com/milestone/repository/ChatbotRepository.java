package com.milestone.repository;

import com.milestone.entity.Chatbot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatbotRepository extends JpaRepository<Chatbot, Long> {
    
    
    List<Chatbot> findByHashtagContainingIgnoreCase(String hashtag);
  


}

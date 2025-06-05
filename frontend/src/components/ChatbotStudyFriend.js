// 기존 import 유지
import React, { useState, useEffect, useRef } from 'react';
import './ChatbotStudyFriend.css';

const ChatbotStudyFriend = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hashtagList, setHashtagList] = useState([
    "#편미분", "#테일러전개", "#행렬식", "#라플라스변환", "#고유값",
    "#포아송분포", "#기댓값", "#그라디언트", "#미분가능", "#삼각함수미분"
  ]);

  const messagesEndRef = useRef(null);

  // ✅ 여기만 수정
  useEffect(() => {
    fetch('/api/chatbot/hashtags')
      .then(res => res.json())
      .then(data => {
        if (data.hashtags) {
          const merged = [...new Set([...hashtagList, ...data.hashtags])];
          setHashtagList(merged);
        }
      })
      .catch(err => console.error('❌ 해시태그 로딩 실패:', err));
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const now = getCurrentTime();
      setMessages([
        { text: "안녕하세요! 📘 공부친구 챗봇입니다. 궁금한 점이 있나요?", sender: 'bot', time: now }
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getCurrentTime = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);

    const match = value.split(" ").pop();

    if (match.startsWith("#")) {
      // #만 입력한 경우 → 전체 해시태그 보여주기
      const filtered = match.length === 1
        ? hashtagList
        : hashtagList.filter(tag =>
          tag.toLowerCase().includes(match.toLowerCase())
        );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };


  const handleSuggestionClick = (tag) => {
    const words = input.split(" ");
    words.pop();
    const newInput = [...words, tag].join(" ") + " ";
    setInput(newInput);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const now = getCurrentTime();

    // 1. 도움말 입력 시 커스텀 메시지로 응답
    if (input.trim() === '도움') {
      const helpMessage = {
        text: (
          <div style={{ lineHeight: '1.6', fontSize: '14px' }}>
            <strong>🛠️ 공부친구 챗봇 사용법 안내</strong><br /><br />
            💬 <strong>일반 질문</strong>: <em>이력서 작성</em>, <em>자기소개서 예시</em> 등 입력<br />
            🔍 <strong>해시태그 검색</strong>: <code>#편미분</code>, <code>#고유값</code> 등 키워드 설명 제공<br />
            📚 <strong>유사 질문 인식</strong>: 질문이 비슷해도 자동 인식해 응답<br /><br />
            ⌨️ <strong>단축키 사용</strong>:<br />
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li><code>도움</code> : 이 안내 다시 보기</li>
              <li><code>안녕</code>, <code>고마워</code> : 간단한 인사 응답</li>
            </ul><br />
            📌 <strong>예시</strong>: <em>이력서 작성방법</em>, <code>#라플라스변환</code>
          </div>
        ),
        sender: 'bot',
        time: now
      };

      setMessages(prev => [
        ...prev,
        { text: input, sender: 'user', time: now },
        helpMessage
      ]);
      setInput('');
      return;
    }

    // 기존 입력 처리
    const userMessage = { text: input, sender: 'user', time: now };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const botReply = await sendMessageToServer(input, now);
    setMessages(prev => [...prev, botReply]);
  };
  const sendMessageToServer = async (msg, time) => {
    try {
      // ✅ 이 부분도 상대경로로 수정
      const res = await fetch('http://localhost:5050/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });

      const data = await res.json();
      return { text: data.response, sender: 'bot', time };
    } catch (err) {
      return { text: '🚨 서버 오류가 발생했습니다.', sender: 'bot', time };
    }
  };

  const resetChat = () => {
    const now = getCurrentTime();
    setMessages([
      { text: "안녕하세요! 📘 공부친구 챗봇입니다. 궁금한 점이 있나요?", sender: 'bot', time: now }
    ]);
  };
  

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 10000 }}>
      <button className="chatbot-button" onClick={() => setIsOpen(!isOpen)}>
        {"</>"}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chat-header">📘 공부친구 MILESTONE
            <span
              style={{ float: 'right', cursor: 'pointer' }}
              onClick={resetChat}
              title="대화 초기화"
            >
              🧹
            </span>

          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender}-message`}>
                <div>{msg.text}</div>
                <div className={`timestamp ${msg.sender}-timestamp`}>{msg.time}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="chat-input" style={{ position: 'relative' }}>
            <input
              type="text"
              value={input}
              onChange={handleChange}
              placeholder="메시지를 입력하세요..."
              onFocus={() => {
                if (input.includes("#")) setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            <button type="submit" className="send-button">전송</button>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="hashtag-suggestions">
                {suggestions.map((tag, idx) => (
                  <li key={idx} onClick={() => handleSuggestionClick(tag)}>{tag}</li>
                ))}
              </ul>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotStudyFriend;

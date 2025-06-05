import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Message.css';
import Swal from 'sweetalert2';

function Message() {

    // 1. React Hooks 선언
    const { nickname } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // 2. location에서 state 추출
    const locationState = location.state || {};
    
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(0);
    const [selectAll, setSelectAll] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [searchType, setSearchType] = useState('content');

    const [page, setPage] = useState(locationState.page || 0);
    const [activeTab, setActiveTab] = useState(locationState.activeTab || '받은 쪽지');
    const [perPage, setPerPage] = useState(locationState.perPage || 15);
    const [totalMessages, setTotalMessages] = useState(0);


    useEffect(() => {
        fetchMessages();
    }, [nickname, page, perPage, activeTab]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            
            // 검색 파라미터 설정
            let params = { page, size: perPage };
            
            // 검색어가 있는 경우에만 검색 파라미터 추가
            if (keyword.trim() !== '') {
                if (searchType === 'sender') {
                    // 받은 쪽지일 때는 'sender' 파라미터 사용
                    params.sender = keyword;
                } else if (searchType === 'content') {
                    params.content = keyword;
                }
                
                if (activeTab === '보낸 쪽지' && searchType === 'sender') {
                    // 보낸 쪽지일 때는 'recipient' 파라미터 사용
                    delete params.sender;
                    params.recipient = keyword;
                }
            }
            
            // 탭에 따라 다른 API 엔드포인트 호출
            let endpoint = '/api/messages/tolist/' + nickname;
            let responseKey = 'tolist';
            
            if (activeTab === '보낸 쪽지') {
                endpoint = '/api/messages/fromlist/' + nickname;
                responseKey = 'fromlist';
            }
            
            const response = await axios.get(endpoint, { params });
            
            if (response.data && response.data[responseKey] && response.data[responseKey].content) {
                // 체크박스 상태를 추가
                const messageData = response.data[responseKey].content.map(msg => ({
                    ...msg,
                    isSelected: false
                }));
                setMessages(messageData); // 총 쪽지 개수 설정
                setTotalMessages(response.data[responseKey].totalElements || 0);
                setTotalPages(response.data.totalPages || 0);
                setError(null);
            } else {
                throw new Error("응답 데이터 형식이 올바르지 않습니다.");
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError('쪽지를 불러오는데 실패했습니다.');
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    // 검색 핸들러
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        fetchMessages();
    };

    // 메시지 선택 핸들러
    const handleSelectMessage = (index) => {
        const updatedMessages = [...messages];
        updatedMessages[index].isSelected = !updatedMessages[index].isSelected;
        setMessages(updatedMessages);
    };

    // 모두 선택/해제 핸들러
    const handleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        
        const updatedMessages = messages.map(msg => ({
            ...msg,
            isSelected: newSelectAll
        }));
        
        setMessages(updatedMessages);
    };

    // 선택된 메시지 삭제 핸들러
    const handleDeleteSelected = async () => {
        // 선택된 메시지 ID 배열 생성
        const selectedMessageIds = messages
            .filter(msg => msg.isSelected)
            .map(msg => msg.messageNo);
        
        if (selectedMessageIds.length === 0) {
            Swal.fire({
                title: "삭제할 쪽지를 선택해주세요!",
                icon: "warning",
                draggable: true
              });

            return;
        }
        
        try {
            // 확인 대화상자
            if (!window.confirm('선택한 쪽지를 삭제하시겠습니까?')) {
                return;
            }
            
            // 삭제 API 호출
            const endpoint = activeTab === '받은 쪽지' 
                ? '/api/messages/delete/received' 
                : '/api/messages/delete/sent';
            
            const response = await axios.post(endpoint, { messageIds: selectedMessageIds });
            
            // 성공 시 알림 표시 및 목록 새로고침
            if (response.data && response.data.success) {
                Swal.fire(response.data.message);
            } else {
                Swal.fire({
                    title: "선택한 쪽지가 삭제되었습니다!",
                    icon: "success",
                    draggable: true
                  });
    
            }
            
            setSelectAll(false);
            fetchMessages();
        } catch (err) {
            console.error('Error deleting messages:', err);
            Swal.fire({
                title: "쪽지 삭제 중 오류가 발생했습니다",
                icon: "error",
                draggable: true
              });
        }
    };

    // 메시지 내용 truncate 함수
    const truncateContent = (content, maxLength = 30) => {
        if (!content) return '';
        return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    };

    // 메시지 클릭 핸들러 (상세보기)
    const handleMessageClick = (messageNo) => {
        // 상세보기 페이지로 이동
        const messageType = activeTab === '받은 쪽지' ? 'received' : 'sent';
        
        navigate(`/messages/${messageType}/${messageNo}`, {
            state: {
                page: page,
                tab: activeTab,
                perPage: perPage
            }});
    };

      // 쪽지함 비우기 함수
const clearMessages = async () => {
    const messageType = activeTab === '받은 쪽지' ? '받은' : '보낸';
    
    try {
      // SweetAlert2로 확인 대화상자 표시
      const result = await Swal.fire({
        title: `${messageType} 쪽지함을 비우시겠습니까?`,
        text: "삭제된 쪽지는 복구할 수 없습니다!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "예, 비우겠습니다",
        cancelButtonText: "취소"
      });
  
      // 사용자가 '예, 비우겠습니다' 버튼을 클릭한 경우
      if (result.isConfirmed) {
        // API 엔드포인트 결정 - 활성화된 탭에 따라 다른 엔드포인트 사용
        const endpoint = activeTab === '받은 쪽지' 
          ? 'http://localhost:9000/api/messages/clear-to' 
          : 'http://localhost:9000/api/messages/clear-sent';
        
        // 백엔드 API 호출하여 해당 쪽지함 비우기
        const response = await axios.delete(endpoint);
  
        // API 호출 성공 시
        if (response.status === 200) {
          Swal.fire({
            title: "삭제 완료!",
            text: `${messageType} 쪽지함이 비워졌습니다.`,
            icon: "success"
          });
          
          // 쪽지 목록 다시 불러오기
          fetchMessages();
        }
      }
    } catch (error) {
      // 오류 처리
      console.error(`${messageType} 쪽지함 비우기 중 오류 발생:`, error);
      
      Swal.fire({
        title: "오류 발생",
        text: `${messageType} 쪽지함을 비우는 중 문제가 발생했습니다. 다시 시도해주세요.`,
        icon: "error"
      });
    }
  };



    if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;
    if (error) return <div className="error-container">{error}</div>;

    return (
        <div className="message-container">
            {/* 탭 메뉴 */}
            <div className="message-tabs">
                <button 
                    className={`tab-button ${activeTab === '받은 쪽지' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('받은 쪽지');
                        setPage(0);
                    }}
                >
                    받은 쪽지
                </button>
                <button 
                    className={`tab-button ${activeTab === '보낸 쪽지' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('보낸 쪽지');
                        setPage(0);
                    }}
                >
                    보낸 쪽지
                </button>
                <div className="tab-spacer"></div>
                <button 
                 className="tab-action-button"
                onClick={() => navigate('/messageform')}
      >
                <i className="fas fa-paper-plane"></i> 쪽지 보내기
                </button>
            </div>

            {/* 쪽지함 제목 */}
            <div className="message-box-header">
                <h2>{activeTab} <span className="message-count">{totalMessages}</span></h2>
                <button className="compose-button" onClick={clearMessages}>
                    <i className="fas fa-envelope"></i> 쪽지함비우기
                </button>
            </div>

            {/* 액션 버튼 - 상단 삭제 버튼 제거 */}
            <div className="message-actions">
                {/* 왼쪽 액션 영역 비움 */}
                <div className="left-actions">
                    {/* 삭제 버튼 제거됨 */}
                </div>
                
                {/* 검색 및 정렬 */}
                <div className="right-actions">
                    <form onSubmit={handleSearch} className="search-form">
                        <select 
                            value={searchType} 
                            onChange={(e) => setSearchType(e.target.value)}
                            className="search-type"
                        >
                            <option value="content">쪽지내용</option>
                            <option value={activeTab === '받은 쪽지' ? 'sender' : 'recipient'}>
                                {activeTab === '받은 쪽지' ? '발신자' : '수신자'}
                            </option>
                        </select>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="검색어를 입력하세요"
                            className="search-input"
                        />
                        <button type="submit" className="search-button">검색</button>
                    </form>
                    
                    <select 
                        value={perPage} 
                        onChange={(e) => {
                            const value = Number(e.target.value);
                            setPerPage(value);
                            setPage(0); // 페이지 크기 변경 시 첫 페이지로 이동
                        }}
                        className="per-page-select"
                    >
                        <option value="10">10개씩</option>
                        <option value="15">15개씩</option>
                        <option value="30">30개씩</option>
                        <option value="9999">전체목록</option>
                    </select>
                </div>
            </div>

            {/* 메시지 목록 */}
            <div className="message-list">
                <table>
                    <thead>
                        <tr>
                            <th className="checkbox-col">
                                <input 
                                    type="checkbox" 
                                    checked={selectAll} 
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="sender-col">
                                {activeTab === '받은 쪽지' ? '보낸 사람' : '받은 사람'}
                            </th>
                            <th className="content-col">쪽지 내용</th>
                            <th className="sent-col">
                                {activeTab === '받은 쪽지' ? '보낸 시각' : '발신 시각'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {messages.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="no-messages">
                                    {activeTab === '받은 쪽지' ? '받은 쪽지가 없습니다.' : '보낸 쪽지가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            messages.map((message, index) => (
                                <tr 
                                    key={message.messageNo} 
                                    className={`message-row ${
                                        (activeTab === '받은 쪽지' && !message.messageToCheck) 
                                        ? 'unread' : ''}`}
                                >
                                    <td className="checkbox-col">
                                        <input 
                                            type="checkbox" 
                                            checked={message.isSelected} 
                                            onChange={() => handleSelectMessage(index)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                    <td 
                                        className="sender-col"
                                        onClick={() => handleMessageClick(message.messageNo)}
                                    >
                                        {activeTab === '받은 쪽지' 
                                            ? (message.messageFrom?.nickname || '알 수 없음')
                                            : (message.messageTo?.nickname || '알 수 없음')}
                                    </td>
                                    <td 
                                        className="content-col"
                                    >
                                        <a 
                                            href="#" 
                                            className="message-link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleMessageClick(message.messageNo);
                                            }}
                                        >
                                            {truncateContent(message.messageContent, 30)}
                                        </a>
                                    </td>
                                    <td 
                                        className="sent-col"
                                        onClick={() => handleMessageClick(message.messageNo)}
                                    >
                                        {formatDate(message.messageInputdate)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 하단 액션 버튼 */}
            <div className="message-bottom-actions">
                <div className="left-actions">
                    <button 
                        className="action-button delete"
                        onClick={handleDeleteSelected}
                    >
                        삭제
                    </button>
                </div>
                
                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <button 
                            onClick={() => setPage(0)} 
                            disabled={page === 0}
                            className="page-button"
                        >
                            처음
                        </button>
                        <button 
                            onClick={() => setPage(Math.max(0, page - 1))} 
                            disabled={page === 0}
                            className="page-button"
                        >
                            이전
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = page < 2 ? i : page > totalPages - 3 ? totalPages - 5 + i : page - 2 + i;
                            if (pageNum >= 0 && pageNum < totalPages) {
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={page === pageNum ? 'page-button active' : 'page-button'}
                                    >
                                        {pageNum + 1}
                                    </button>
                                );
                            }
                            return null;
                        })}
                        
                        <button 
                            onClick={() => setPage(Math.min(totalPages - 1, page + 1))} 
                            disabled={page === totalPages - 1}
                            className="page-button"
                        >
                            다음
                        </button>
                        <button 
                            onClick={() => setPage(totalPages - 1)} 
                            disabled={page === totalPages - 1}
                            className="page-button"
                        >
                            마지막
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
    
    // 날짜 포맷팅 함수
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return dateString; // 파싱 실패 시 원래 문자열 반환
        }
        
        // 날짜와 시간 포맷 (예: 25-04-14 [00:15])
        const year = date.getFullYear().toString().substring(2); // 2025 -> 25
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${year}-${month}-${day} [${hours}:${minutes}]`;
    }
}

export default Message;
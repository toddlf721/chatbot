import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './MessageDetail.css';
import Swal from 'sweetalert2';

function MessageDetail() {
    const { type, messageNo } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // 이전 페이지 정보를 state에서 가져옴
    const previousState = location.state || {};
    const { page = 0, tab = '받은 쪽지', perPage = 15 } = previousState;
    
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        fetchMessageDetail();
    }, [messageNo, type]);
    
    const fetchMessageDetail = async () => {
        try {
            setLoading(true);
            
            const response = await axios.get(`http://localhost:9000/api/messages/${type}/${messageNo}`);
            
            console.log(response.data);
            if (response.data) {
                setMessage(response.data);
                
                // 읽음 상태 업데이트 (받은 쪽지인 경우에만)
                if (type === 'received' && !response.data.messageToCheck) {
                    const response = await axios.post(`http://localhost:9000/api/messages/read/${messageNo}`);
                    console.log(response);
                }
            } else {
                throw new Error("쪽지 정보를 가져오는데 실패했습니다.");
            }
            
            setError(null);
        } catch (err) {
            console.error('Error fetching message detail:', err);
            setError('쪽지 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleGoBack = () => {
        // 이전 페이지 정보를 포함하여 목록 페이지로 이동
        const userString = sessionStorage.getItem('currentUser');
        const user = userString ? JSON.parse(userString) : null;
       // const nickname = message?.messageFrom?.nickname || message?.messageTo?.nickname || '';
        navigate(`/messages/${user.memberNickname}`, {
            state: {
                returnedFromDetail: true,
                page: page,
                activeTab: tab,
                perPage: perPage
            }
        });
    };
    
    const handleDelete = async () => {
        try {
            if (!window.confirm('이 쪽지를 삭제하시겠습니까?')) {
                return;
            }
            
            const endpoint = type === 'received'
                ? 'http://localhost:9000/api/messages/delete/received'
                : 'http://localhost:9000/api/messages/delete/sent';
            
            await axios.post(endpoint, { messageIds: [messageNo] });
            
            Swal.fire({
                title: "쪽지가 삭제되었습니다!",
                icon: "success",
                draggable: true
              });
            
            // 삭제 후 목록 페이지로 이동 (페이지 정보 유지)
            const nickname = message?.messageFrom?.nickname || message?.messageTo?.nickname || '';
            navigate(`/messages/${nickname}`, {
                state: {
                    returnedFromDetail: true,
                    page: page,
                    activeTab: tab,
                    perPage: perPage
                }
            });
        } catch (err) {
            console.error('Error deleting message:', err);
              Swal.fire({
                            title: "쪽지 삭제 중 오류가 발생했습니다",
                            icon: "error",
                            draggable: true
                          });
        }
    };
    
    const handleReply = () => {
        if (message && message.messageFrom) {
            navigate(`/messageform/${message.messageFrom.nickname}`);
        }
    };
    
    if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;
    if (error) return <div className="error-container">{error}</div>;
    if (!message) return <div className="error-container">쪽지를 찾을 수 없습니다.</div>;
    
    return (
        <div className="message-detail-container">
            <div className="message-detail-header">
                <h2>{type === 'received' ? '받은 쪽지 상세보기' : '보낸 쪽지 상세보기'}</h2>
                <button className="back-button" onClick={handleGoBack}>
                    <i className="fas fa-arrow-left"></i> 목록으로
                </button>
            </div>
            
            <div className="message-detail-content">
                <div className="message-info">
                    <div className="info-row">
                        <div className="info-label">{type === 'received' ? '보낸 사람' : '받은 사람'}</div>
                        <div className="info-value">
                            {type === 'received' 
                                ? (message.messageFrom?.nickname || '알 수 없음')
                                : (message.messageTo?.nickname || '알 수 없음')}
                        </div>
                    </div>
                    <div className="info-row">
                        <div className="info-label">날짜</div>
                        <div className="info-value">{formatDate(message.messageInputdate)}</div>
                    </div>
                </div>
                
                <div className="message-content">
                    <pre>{message.messageContent}</pre>
                </div>
                
                <div className="message-actions">
                    <div className="action-buttons">
                        {type === 'received' && (
                            <button className="action-button reply" onClick={handleReply}>
                                <i className="fas fa-reply"></i> 답장하기
                            </button>
                        )}
                        <button className="action-button delete" onClick={handleDelete}>
                            <i className="fas fa-trash"></i> 삭제하기
                        </button>
                    </div>
                </div>
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
        
        // 날짜와 시간 포맷 (예: 2025-04-14 00:15)
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
}

export default MessageDetail;
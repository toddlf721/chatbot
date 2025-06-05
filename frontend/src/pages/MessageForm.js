import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MessageForm.css';

function MessageForm() {
    const { nickname } = useParams();
    const [error, setError] = useState(null);
    const [member, setMember] = useState(null);
    const [messageContent, setMessageContent] = useState('');
    const [messageSent, setMessageSent] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef(null);
    const dropdownRef = useRef(null);
    const initialMemberRef = useRef(null); // URL에서 가져온 초기 멤버 참조 저장
    const navigate = useNavigate();

    useEffect(() => {
        const currentUserString = sessionStorage.getItem("currentUser");
        const currentUser = currentUserString ? JSON.parse(currentUserString) : null;
    
        if (!currentUser) {
            setError("로그인이 필요합니다.");
            setTimeout(() => navigate('/login'), 2000);
            return;
        }
    
        // nickname이 존재할 경우에만 초기 회원 로드
        if (nickname) {
            const fetchMember = async () => {
                try {
                    const response = await axios.get(`/api/members/profile/${nickname}`);
                    console.log('초기 멤버 로드:', response.data);
                    setMember(response.data);
                    setSelectedMembers([response.data]); 
                    initialMemberRef.current = response.data.memberNo;
                    setError(null);
                } catch (err) {
                    setError('회원을 조회하는데 실패했습니다');
                    console.error('회원 조회 실패', err);
                }
            };
            
            fetchMember();
        } else {
            // nickname이 없는 경우 빈 선택 목록으로 시작
            setSelectedMembers([]);
            initialMemberRef.current = null;
        }
    }, [nickname, navigate]);

    // 드롭다운 외부 클릭시 닫기
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // 입력할 때마다 검색 실행 (디바운스 적용)
    useEffect(() => {
        if (searchTerm.length >= 2) {
            setIsSearching(true);
            
            // 기존 타이머 취소
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
            
            // 새 타이머 설정 (500ms 후에 검색)
            searchTimeout.current = setTimeout(() => {
                handleSearch();
            }, 500);
        } else {
            setShowDropdown(false);
            setSearchResults([]);
        }
        
        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchTerm]);

    const handleSearch = async () => {
        if (searchTerm.length < 2) return;
        
        try {
            // 컨트롤러 엔드포인트와 파라미터 이름 맞추기: 'nickname' -> 'query'
            const response = await axios.get(`/api/members/search?query=${searchTerm}`);
            console.log('search : ', response.data);
            
            // 이미 선택된 회원은 검색 결과에서 제외
            const filteredResults = response.data.filter(
                member => !selectedMembers.some(m => m.memberNo === member.memberNo)
            );
            
            setSearchResults(filteredResults);
            setShowDropdown(true);
            setIsSearching(false);
        } catch (err) {
            console.error('회원 검색 실패', err);
            setIsSearching(false);
        }
    };

    const handleAddMember = (member) => {
        if (!selectedMembers.some(m => m.memberNo === member.memberNo)) {
            setSelectedMembers([...selectedMembers, member]);
        }
        setShowDropdown(false);
        setSearchTerm(''); // 선택 후 검색어 초기화
    };

    const handleRemoveMember = (memberNo) => {
        // 초기 멤버가 있고, 그 멤버인 경우에만 삭제 불가
        if (initialMemberRef.current !== null && memberNo === initialMemberRef.current) {
            return;
        }
        setSelectedMembers(selectedMembers.filter(m => m.memberNo !== memberNo));
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        try {
            const recipientNumbers = selectedMembers.map(m => m.memberNo);
            console.log('전송할 수신자 번호 목록:', recipientNumbers);

            // 백엔드 API에 맞게 요청 데이터 구조화
            await axios.post(`/api/messages`, { 
                content: messageContent, 
                recipients: recipientNumbers
            });
            setMessageContent('');
            setMessageSent(true);
            setTimeout(() => setMessageSent(false), 3000);



        } catch (error) {
            console.error('쪽지 전송 실패:', error);
            setError('쪽지 전송에 실패했습니다.');
        }
    };
    
    return (
        <div className="message-form-container">
            <h1>SEND MESSAGE</h1>
            {error && !member && <p className="error-message">{error}</p>}
            
            <div className="search-container">
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="닉네임으로 회원 검색 (2글자 이상)"
                        onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                    />
                    {isSearching && <div className="search-spinner"></div>}
                </div>
                
                {showDropdown && (
                    <div className="search-results-dropdown" ref={dropdownRef}>
                        {searchResults.length > 0 ? (
                            searchResults.map(member => (
                                <div 
                                    key={member.memberNo} 
                                    className="search-result-item"
                                    onClick={() => handleAddMember(member)}
                                >
                                    <div className="member-info">
                                        <span className="member-nickname">{member.memberNickname}</span>
                                        <span className="member-name">{member.memberName}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">검색 결과가 없습니다</div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="selected-members-container">
                <h2>선택된 회원 ({selectedMembers.length}명)</h2>
                <div className="selected-members-list">
                    {selectedMembers.map(member => (
                        <div 
                            key={member.memberNo} 
                            className={`selected-member-item ${member.memberNo === initialMemberRef.current ? 'initial-member' : ''}`}
                        >
                            <span>{member.memberNickname}</span>
                            {member.memberNo !== initialMemberRef.current ? (
                                <button 
                                    className="remove-button"
                                    onClick={() => handleRemoveMember(member.memberNo)}
                                >
                                    ×
                                </button>
                            ) : (
                                <span className="locked-icon" title="고정된 수신자">🔒</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            
            <form onSubmit={handleSendMessage}>
                <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="쪽지 내용을 입력하세요..."
                    required
                />
                <button 
                    type="submit" 
                    className="send-button"
                    disabled={selectedMembers.length === 0 || messageContent.trim() === ''}
                >
                    SEND
                </button>
            </form>
            
            {messageSent && <p className="success-message">쪽지가 성공적으로 전송되었습니다!</p>}
        </div>
    );
}

export default MessageForm;
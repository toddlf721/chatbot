import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTimestamp } from '../utils/dateUtils';
import { Editor } from '@tinymce/tinymce-react';
import APIService from '../services/APIService';
import './PostModal.css';

function PostModal({
  id,
  username,
  profileImage,
  image,
  content,
  likes,
  comments,
  commentsList = [],
  setCommentsList,
  timestamp,
  tags = [],
  isLiked = false,
  isSaved = false,
  onLike,
  onSave,
  onClose,
  onEdit,
  onDelete,
  users,
  fetchComments,
  currentUser: propCurrentUser
}) {
  const [commentText, setCommentText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editTags, setEditTags] = useState(tags);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(propCurrentUser);
  const commentsEndRef = useRef(null);
  const optionsRef = useRef(null);
  const editorRef = useRef(null);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const editImageInputRef = useRef(null);
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);
  const modalRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(image)) {
      setImages(image);
    } else if (image) {
      setImages([image]);
    } else {
      setImages([]);
    }
  }, [image]);

  // 다음 이미지로 이동
  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  // 이전 이미지로 이동
  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // 사용자 정보 로드 (Props에서 전달되지 않은 경우)
  useEffect(() => {
    if (!currentUser) {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        // 세션 스토리지에 없으면 API로 가져오기
        APIService.getCurrentUser()
          .then(userData => {
            setCurrentUser(userData);
          })
          .catch(error => {
            console.error('현재 사용자 정보 로드 중 오류:', error);
          });
      }
    }
  }, [currentUser]);

  // 이미지 오류 처리 함수
  const handleImageError = (e) => {
    e.target.onerror = null; // 무한 루프 방지
    e.target.src = '/icon/image.png';
  };

  // 프로필 이미지 오류 처리 함수
  const handleProfileImageError = (e) => {
    e.target.onerror = null; // 무한 루프 방지
    e.target.src = '/icon/profileimage.png';
  };

  // 프로필 이미지 변경 감지 및 댓글 새로고침
  useEffect(() => {
    // 세션 스토리지의 사용자 정보 변경 감지
    const handleStorageChange = () => {
      if (id && fetchComments) {
        fetchComments();

        // 세션 스토리지에서 현재 사용자 정보 다시 가져오기
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      }
    };

    // 프로필 업데이트 이벤트 핸들러
    const handleProfileUpdate = () => {
      console.log('PostModal: 프로필 업데이트 이벤트 감지됨');
      if (id && fetchComments) {
        // 약간의 지연을 두고 댓글 새로고침 (이미지 서버 업데이트 시간 고려)
        setTimeout(() => {
          fetchComments();

          // 세션 스토리지에서 현재 사용자 정보 다시 가져오기
          const storedUser = sessionStorage.getItem('currentUser');
          if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
          }
        }, 300);
      }
    };

    // 이벤트 리스너 추가
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [id, fetchComments]);

  // 댓글 수정 시작 함수
  const handleEditCommentStart = (commentId, commentText) => {
    setEditCommentId(commentId);
    setEditCommentText(commentText);
  };

  // 댓글 수정 취소 함수
  const handleEditCommentCancel = () => {
    setEditCommentId(null);
    setEditCommentText('');
  };

  // 댓글 수정 저장 함수
  const handleEditCommentSave = async (commentId) => {
    if (!editCommentText.trim()) return;

    setIsLoading(true);
    try {
      await APIService.updateComment(commentId, {
        boardNo: id,
        replyNo: commentId,
        replyContent: editCommentText
      });

      // 댓글 목록 새로고침
      await fetchComments();

      // 수정 모드 종료
      setEditCommentId(null);
      setEditCommentText('');
    } catch (error) {
      console.error('댓글 수정 중 오류:', error);
      alert('댓글 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ESC 키를 누르면 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // 옵션 메뉴 바깥을 클릭하면 닫기
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showOptions && optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showOptions]);

  // 오버레이를 클릭하면 모달 닫기
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('post-modal-overlay')) {
      onClose();
    }
  };

  // 현재 로그인한 사용자의 프로필 이미지 가져오기
  const getCurrentUserProfileImage = () => {
    if (currentUser && currentUser.memberPhoto) {
      return currentUser.memberPhoto;
    }
    return '/icon/profileimage.png';
  };

  // 댓글 입력 내용 변경 처리
  const handleCommentChange = (e) => {
    setCommentText(e.target.value);
  };

  // 댓글 등록 처리
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    // 🔒 정지 회원 차단
    if (currentUser?.memberStatus === 'suspended') {
      const until = new Date(currentUser.memberSuspendUntil).toLocaleDateString();
      alert(`정지 상태입니다. ${until}까지 댓글 작성이 제한됩니다.`);
      return;
    }


    if (commentText.trim()) {
      setIsLoading(true);
      try {
        await APIService.createComment({
          boardNo: id,
          replyContent: commentText
        });

        // 현재 사용자 정보로 낙관적 UI 업데이트
        if (currentUser) {
          const timestamp = new Date().toISOString();
          const newComment = {
            id: `temp-${Date.now()}`, // 임시 ID
            username: currentUser.memberNickname,
            text: commentText,
            timestamp: '방금 전',
            profileImage: currentUser.memberPhoto || '/icon/profileimage.png'
          };

          // 댓글 목록 업데이트 (새 댓글 추가)
          setCommentsList(prevComments => [newComment, ...prevComments]);
        }

        // 댓글 입력창 초기화
        setCommentText('');

        // 백그라운드에서 모든 댓글 다시 가져오기
        setTimeout(() => {
          fetchComments();
        }, 500);
      } catch (error) {
        console.error('댓글 등록 중 오류:', error);
        alert('댓글 등록 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 옵션 메뉴 열기/닫기
  const toggleOptions = (e) => {
    e.stopPropagation();
    setShowOptions(!showOptions);
  };

  // 게시물 수정 모드 진입
  const handleEditPost = () => {
    setShowOptions(false);
    setIsEditing(true);
    setEditImage(null);
    setEditImagePreview(null);
  };

  // 이미지 변경 핸들러
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setEditImage(file);

    // 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 파일 선택 다이얼로그 열기 함수
  const triggerEditImageInput = () => {
    editImageInputRef.current.click();
  };

  // 이미지 미리보기 제거 함수
  const removeEditImagePreview = () => {
    setEditImage(null);
    setEditImagePreview(null);
    if (editImageInputRef.current) {
      editImageInputRef.current.value = '';
    }
  };

  // 게시물 수정 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(content);
    setEditTags(tags);
    setTagInput('');
    setEditImage(null);
    setEditImagePreview(null);
    if (editImageInputRef.current) {
      editImageInputRef.current.value = '';
    }
  };

  // 게시물 수정 저장
  const handleSaveEdit = async () => {
    if (editContent.trim() === '') return;

    try {
      // FormData 객체 생성
      const formData = new FormData();

      // 게시물 데이터 객체 생성 - 더 많은 필드 포함
      const boardData = {
        boardContent: editContent,
        boardType: 'daily', // 게시물 타입 명시적 설정
        boardVisible: 'public', // 공개 범위 설정
        tags: JSON.stringify(editTags)
      };

      // board 데이터 추가
      formData.append('board', new Blob([JSON.stringify(boardData)], {
        type: 'application/json'
      }));

      // 새 이미지가 있는 경우 추가
      if (editImage) {
        formData.append('images', editImage);
        console.log('이미지 파일 정보:', editImage.name, editImage.size, editImage.type);
      }

      // FormData 내용 디버깅
      console.log('FormData 전송 내용:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // API 요청
      const response = await APIService.updatePost(id, formData);
      console.log('서버 응답:', response);

      // 부모 컴포넌트에 알림
      onEdit?.({
        content: editContent,
        tags: editTags,
        image: editImage
      });

      setIsEditing(false);
      setEditImage(null);
      setEditImagePreview(null);

      // 타임스탬프를 통해 현재 시각 저장
      const updateTimestamp = Date.now();

      // 데이터 새로고침을 위한 이벤트 발생 - 타임스탬프 추가
      window.dispatchEvent(new CustomEvent('refreshData', {
        detail: { timestamp: updateTimestamp, type: 'posts', imageUpdated: true }
      }));

      // 프로필 이미지와 동일하게 이미지 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('imageUpdated', {
        detail: { timestamp: updateTimestamp, postId: id }
      }));

      // 모달 닫기 전에 약간의 딜레이를 줘서 이미지가 업데이트될 시간 확보
      setTimeout(() => {
        // 모달 닫기
        onClose();

        // 알림 메시지
        alert('게시물이 성공적으로 수정되었습니다.');
      }, 300);
    } catch (error) {
      console.error('게시물 수정 중 오류:', error);
      alert('게시물 수정 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 게시물 삭제
  const handleDeletePost = async () => {
    const confirmDelete = window.confirm("정말 이 게시물을 삭제하시겠습니까?");
    if (!confirmDelete) return;

    try {
      await APIService.deletePost(id);
      alert("게시물이 삭제되었습니다.");

      if (onDelete) {
        onDelete();
      }

      onClose();
    } catch (error) {
      console.error("게시물 삭제 중 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 게시물 내용 수정 처리
  const handleContentChange = (e) => {
    setEditContent(e.target.value);
  };

  // 태그 입력값 변경 처리
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  // 태그 입력 시 Enter 또는 쉼표 처리
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // 태그 추가
  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
      setTagInput('');
    }
  };

  // 태그 입력창에서 포커스 벗어날 때 처리
  const handleTagInputBlur = () => {
    if (tagInput.trim()) {
      addTag();
    }
  };

  // 태그 삭제
  const removeTag = (indexToRemove) => {
    setEditTags(editTags.filter((_, index) => index !== indexToRemove));
  };

  // 댓글 삭제 처리
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      setIsLoading(true);
      try {
        await APIService.deleteComment(commentId);
        // 댓글 삭제 후 목록 새로고침
        await fetchComments();
      } catch (error) {
        console.error('댓글 삭제 중 오류:', error);
        alert('댓글 삭제 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  // 신고하기
  const handleReport = async () => {
    try {
      await APIService.reportPost(id, reportReason); // 게시글 ID + 이유 전달
      alert("신고가 접수되었습니다.");
    } catch (error) {
      console.error("신고 실패:", error.response?.data || error.message);
      alert("신고 중 오류 발생");
    }
  };

  return (
    <div className="post-modal-overlay" onClick={handleOverlayClick}>
      <div className="post-modal-container">
        <div className="post-modal-content" ref={modalRef} onClick={e => e.stopPropagation()}>
          <div className="post-modal-image-container">
            {images.length > 0 && (
              <>
                <img
                  src={APIService.getProcessedImageUrl(images[currentImageIndex])}
                  alt={`게시물 ${currentImageIndex + 1}`}
                  className="post-modal-image"
                  onError={(e) => {
                    console.log("이미지 로드 실패:", images[currentImageIndex]);
                    e.target.onerror = null;
                    e.target.src = '/icon/image.png';
                  }}
                />
                {images.length > 1 && (
                  <>
                    <button 
                      className="modal-image-nav-button prev" 
                      onClick={prevImage}
                      style={{ display: currentImageIndex === 0 ? 'none' : 'flex' }}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button 
                      className="modal-image-nav-button next" 
                      onClick={nextImage}
                      style={{ display: currentImageIndex === images.length - 1 ? 'none' : 'flex' }}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                    <div className="modal-image-indicator">
                      {images.map((_, index) => (
                        <div
                          key={index}
                          className={`modal-indicator-dot ${index === currentImageIndex ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="post-modal-details">
            <div className="post-modal-header">
              <Link to={`/profile/${username}`} className="post-user" onClick={(e) => e.stopPropagation()}>
                <div className="post-user-avatar">
                  <img
                    src={profileImage}
                    alt={username}
                    onError={handleProfileImageError}
                  />
                </div>
                <div className="post-username">{username}</div>
              </Link>
              {/* 작성자 본인 또는 관리자일 경우 옵션 버튼 표시 */}
              {(currentUser.memberNickname === username || currentUser.memberRole === 'ADMIN') && (
                <div className="options-container" ref={optionsRef}>
                  <button className="post-options" onClick={toggleOptions}>
                    <i className="fas fa-ellipsis-h"></i>
                  </button>

                  {showOptions && (
                    <div className="post-options-dropdown">
                      {/* 작성자만 수정 가능 */}
                      {currentUser.memberNickname === username && (
                        <button className="options-item" onClick={handleEditPost}>
                          <i className="fas fa-edit"></i> 게시물 수정
                        </button>
                      )}

                      {/* 관리자 또는 작성자 모두 삭제 가능 */}
                      <button className="options-item delete" onClick={handleDeletePost}>
                        <i className="fas fa-trash-alt"></i> 게시물 삭제
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="post-modal-comments">
              {/* 작성자 캡션 */}
              <div className="post-modal-caption">
                {isEditing ? (
                  <div className="post-edit-content">
                    <Editor
                      apiKey="mm2znjkik4v21pn6r4mgjq9b21xo8sa2l3cmwdnphoj0rr79"
                      value={editContent}
                      onInit={(evt, editor) => editorRef.current = editor}
                      init={{
                        height: 300,
                        menubar: false,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                          'bold italic forecolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'removeformat | help',
                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                      }}
                      onEditorChange={(newContent) => setEditContent(newContent)}
                    />

                    {/* 태그 입력 */}
                    <div className="tags-input">
                      {editTags.map((tag, index) => (
                        <div key={index} className="tag">
                          <span className="tag-text">#{tag}</span>
                          <button
                            type="button"
                            className="tag-remove"
                            onClick={() => removeTag(index)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                      <input
                        type="text"
                        placeholder="태그 입력 후 Enter (쉼표로 구분)"
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagInputKeyDown}
                        onBlur={handleTagInputBlur}
                      />
                    </div>

                    <div className="post-edit-actions">
                      <button className="post-edit-cancel" onClick={handleCancelEdit}>취소</button>
                      <button className="post-edit-save" onClick={handleSaveEdit}>저장</button>
                    </div>
                  </div>
                ) : (
                  <div className="post-content">
                    <div className="post-text" dangerouslySetInnerHTML={{ __html: content }}></div>
                    <div className="hashtags-container">
                      {tags.map((tag, index) => (
                        <Link
                          key={index}
                          to={`/tags/${tag}`}
                          className="hashtag"
                          onClick={(e) => e.stopPropagation()}
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 댓글 목록 */}
              <div className="post-modal-comment-list">
                {isLoading && <div className="comment-loading">댓글을 불러오는 중...</div>}

                {commentsList.length === 0 && !isLoading && (
                  <div className="empty-comments">
                    <p>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
                  </div>
                )}

                {[...commentsList].reverse().map(comment => (
                  <div key={comment.id} className="post-modal-comment">
                    <div className="post-user-avatar">
                      <img
                        src={comment.profileImage}
                        alt={comment.username}
                        onError={handleProfileImageError}
                      />
                    </div>
                    <div className="comment-content">
                      <Link to={`/profile/${comment.username}`} className="post-username" onClick={(e) => e.stopPropagation()}>
                        {comment.username}
                      </Link>
                      {editCommentId === comment.id ? (
                        // 댓글 수정 모드
                        <div className="comment-edit-form">
                          <textarea
                            className="comment-edit-textarea"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            autoFocus
                          ></textarea>
                          <div className="comment-edit-actions">
                            <button
                              className="comment-edit-cancel"
                              onClick={handleEditCommentCancel}
                            >
                              취소
                            </button>
                            <button
                              className="comment-edit-save"
                              onClick={() => handleEditCommentSave(comment.id)}
                              disabled={!editCommentText.trim() || isLoading}
                            >
                              {isLoading ? '저장 중...' : '저장'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="post-text">{comment.text}</div>
                          <div className="comment-time">{comment.timestamp}</div>
                        </>
                      )}
                    </div>

                    {/* 자신의 댓글인 경우에만 수정/삭제 버튼 표시 */}
                    {currentUser && currentUser.memberNickname === comment.username && (
                      <div className="comment-actions">
                        {editCommentId !== comment.id && (
                          <button
                            className="comment-edit-btn"
                            onClick={() => handleEditCommentStart(comment.id, comment.text)}
                            title="댓글 수정"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        )}
                        <button
                          className="comment-delete-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                          title="댓글 삭제"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            </div>

            <div className="post-modal-actions">
              <div className="post-actions-row">
                <div className="post-actions-left">
                  <button className={`post-action-btn ${isLiked ? 'liked' : ''}`} onClick={onLike}>
                    <i className={isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
                    <span className="likes-count">{likes}</span>
                  </button>
                  <button className="post-action-btn">
                    <i className="far fa-comment"></i>
                    <span className="comments-count">{commentsList.length || comments}</span>
                  </button>
                  <button className={`post-action-btn ${isSaved ? 'saved' : ''}`} onClick={onSave}>
                    <i className={isSaved ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
                  </button>
                  {currentUser && currentUser.memberRole !== 'ADMIN' && currentUser.memberNickname !== username && (
                    <button
                      onClick={() => setShowReportInput(prev => !prev)}
                      className="post-action-btn"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#e74c3c'
                      }}
                      aria-pressed={showReportInput}
                    >
                      <i className="fas fa-flag"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="post-modal-timestamp">
                {formatTimestamp(timestamp)}
              </div>

              <form className="post-comment-form" onSubmit={handleCommentSubmit}>

                {/* 댓글 작성 영역에 현재 로그인한 사용자의 프로필 이미지 표시 */}
                <div className="comment-user-avatar" style={{ marginRight: '10px', width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden' }}>
                  <img
                    src={getCurrentUserProfileImage()}
                    alt="내 프로필"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={handleProfileImageError}
                  />
                </div>
                <input
                  type="text"
                  placeholder="댓글 달기..."
                  value={commentText}
                  onChange={handleCommentChange}
                  className="post-comment-input"
                />
                <button
                  type="submit"
                  className="post-comment-button"
                  disabled={!commentText.trim() || isLoading}
                >
                  {isLoading ? '게시 중...' : '게시'}
                </button>
              </form>
              {/* 신고하기 영역 - 관리자만 안 보이게 조건 분기 */}
              {currentUser &&
                currentUser.memberRole !== 'ADMIN' &&
                currentUser.memberNickname !== username && (
                  <div className="report-section" style={{ marginTop: "20px" }}>
                    {showReportInput && (
                      <>
                        <textarea
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          placeholder="신고 사유를 입력하세요"
                          className="report-textarea"
                          style={{
                            width: "100%",
                            height: "60px",
                            marginBottom: "10px",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                          }}
                        />
                        <button
                          onClick={handleReport}
                          className="report-submit-btn"
                          style={{
                            width: "100%",
                            padding: "8px 0",
                            background: '#e74c3c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginTop: '4px'
                          }}
                          disabled={!reportReason.trim()}
                        >
                          신고 제출
                        </button>
                      </>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default PostModal;
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTimestamp } from '../utils/dateUtils';
import { Editor } from '@tinymce/tinymce-react';
import PostModal from './PostModal';
import APIService from '../services/APIService';
import './Post.css';

function Post({
  id,
  username,
  profileImage,
  imageUrl,
  content,
  likes = 0,
  comments = 0,
  timestamp,
  tags = [],
  isLiked = false,
  isSaved = false,
  onLike,
  onSave,
  onDelete,
  onEdit,
  users,
  fetchPosts
}) {
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editTags, setEditTags] = useState(tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const optionsRef = useRef(null);
  const editorRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const editImageInputRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);

  // 컴포넌트 마운트 시 댓글과 현재 사용자 정보 불러오기
  useEffect(() => {
    // 세션 스토리지에서 현재 로그인한 사용자 정보 가져오기
    const fetchCurrentUser = () => {
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
    };

    if (id) {
      fetchComments();
      fetchCurrentUser();
    }
  }, [id]);

  // API로부터 댓글 불러오기
  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const data = await APIService.getPostComments(id);

      // 현재 로그인한 사용자 정보 가져오기
      const storedUser = sessionStorage.getItem('currentUser');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;

      // 댓글 포맷팅
      const formattedComments = data.map(comment => {
        // 프로필 이미지 직접 URL 생성
        let profileImage = comment.memberNo ?
          `http://localhost:9000/api/images/profile/${comment.memberNo}?t=${Date.now()}` :
          '/icon/profileimage.png';

        return {
          id: comment.replyNo,
          username: comment.memberNickname,
          text: comment.replyContent,
          timestamp: formatTimestamp(comment.replyInputdate),
          profileImage: profileImage
        };
      });

      setCommentsList(formattedComments);
    } catch (error) {
      console.error('댓글 로드 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 프로필 이미지 변경 감지 및 댓글 새로고침
  useEffect(() => {
    // 프로필 업데이트 이벤트 핸들러
    const handleProfileUpdate = (event) => {
      console.log('Post 컴포넌트: 프로필 업데이트 이벤트 감지됨', event?.detail);
      if (id) {
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

    // 게시물 이미지 업데이트 이벤트 핸들러
    const handleImageUpdate = (event) => {
      console.log('Post 컴포넌트: 이미지 업데이트 이벤트 감지됨', event?.detail);

      // 이 게시물의 이미지가 업데이트된 경우
      if (id && event?.detail?.postId === id) {
        // 강제로 이미지 새로고침을 위한 타임스탬프 생성
        const timestamp = event?.detail?.timestamp || Date.now();

        // 이미지 URL에 타임스탬프 추가
        if (imageUrl) {
          // 이미지 URL에 타임스탬프 쿼리 파라미터 추가
          let updatedImageUrl = imageUrl;
          if (updatedImageUrl.includes('?')) {
            updatedImageUrl = updatedImageUrl.split('?')[0] + `?t=${timestamp}`;
          } else {
            updatedImageUrl = updatedImageUrl + `?t=${timestamp}`;
          }

          // 상태 업데이트 (React에서 렌더링을 강제로 다시 하도록)
          const img = new Image();
          img.src = updatedImageUrl;
          img.onload = () => {
            // 이미지가 로드된 후에 상태 업데이트
            const forceUpdateEvent = new CustomEvent('forceUpdate', {
              detail: { timestamp, postId: id }
            });
            window.dispatchEvent(forceUpdateEvent);
          };
        }
      }
    };

    // 이벤트 리스너 추가
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('imageUpdated', handleImageUpdate);
    window.addEventListener('storage', () => {
      const timestamp = localStorage.getItem('profileUpdated');
      if (timestamp && id) {
        fetchComments();
        // 세션 스토리지에서 현재 사용자 정보 다시 가져오기
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      }
    });

    // 프로필 이미지가 변경된 경우에도 댓글 새로고침 
    if (profileImage && id) {
      fetchComments();
    }

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('imageUpdated', handleImageUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [id, profileImage, imageUrl]);

  // 게시물 모달 열기
  const openModal = () => {
    setShowModal(true);
    document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
  };

  // 게시물 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    document.body.style.overflow = 'auto'; // 배경 스크롤 복원
  };

  // 옵션 메뉴 토글
  const toggleOptions = (e) => {
    e.stopPropagation();
    setShowOptions(!showOptions);
  };

  // 게시물 수정 시작
  const handleEditPost = () => {
    setIsEditing(true);
    setShowOptions(false);
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
    setEditTags(tags || []);
    setTagInput('');
    setEditImage(null);
    setEditImagePreview(null);
    if (editImageInputRef.current) {
      editImageInputRef.current.value = '';
    }
  };

  // 수정된 게시물 저장
  const handleSaveEdit = async () => {
    if (editContent.trim() === '') return;

    try {
      // FormData 객체 생성
      const formData = new FormData();

      // 게시물 데이터 객체 생성
      const boardData = {
        boardContent: editContent,
        boardType: 'daily', // 게시물 타입 설정
        boardVisible: 'public', // 공개 범위 설정
        tags: JSON.stringify(editTags)
      };

      // board 데이터 추가
      formData.append('board', new Blob([JSON.stringify(boardData)], {
        type: 'application/json'
      }));

      // 새 이미지가 있는 경우 추가 - FormData에 직접 추가
      if (editImage) {
        formData.append('images', editImage);
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

      // 수정 후 게시물 목록 새로고침
      if (fetchPosts) {
        await fetchPosts();
      }

      // 전체 데이터 새로고침을 위한 이벤트 발생
      window.dispatchEvent(new CustomEvent('refreshData', {
        detail: { timestamp: Date.now(), type: 'posts' }
      }));

      // 수정 성공 메시지
      alert('게시물이 성공적으로 수정되었습니다.');
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
      onDelete?.();

      // 삭제 후 게시물 목록 새로고침
      if (fetchPosts) {
        await fetchPosts();
      }
    } catch (error) {
      // console.error("Error deleting post:", error);
      // alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setShowOptions(false);
    }
  };

  // 수정 중 내용 입력 처리
  const handleContentChange = (e) => {
    setEditContent(e.target.value);
  };

  // 태그 입력값 변경 처리
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  // 태그 입력 시 키 입력 처리
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // 입력된 태그 추가
  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, ''); // # 기호가 앞에 있으면 제거
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
      setTagInput('');
    }
  };

  // 태그 입력창 포커스 해제 시 추가
  const handleTagInputBlur = () => {
    if (tagInput.trim()) {
      addTag();
    }
  };

  // 태그 제거
  const removeTag = (indexToRemove) => {
    setEditTags(editTags.filter((_, index) => index !== indexToRemove));
  };

  // 외부 클릭 시 옵션 메뉴 닫기
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

  // 프로필 이미지 오류 처리 함수
  const handleProfileImageError = (e) => {
    e.target.onerror = null; // 무한 루프 방지
    e.target.src = '/icon/profileimage.png';
  };

  // 현재 로그인한 사용자의 프로필 이미지 가져오기
  const getCurrentUserProfileImage = () => {
    if (currentUser && currentUser.memberPhoto) {
      return currentUser.memberPhoto;
    }
    return '/icon/profileimage.png';
  };

  const handleReport = async (postId) => {
    const reason = prompt("신고 사유를 입력하세요:");
    if (!reason) return;
  
    try {
      await APIService.reportPost(postId, reason);
      alert("신고가 접수되었습니다.");
    } catch (error) {
      console.error("신고 실패:", error.response?.data || error.message);
      alert("신고 처리 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    // imageUrl이 문자열인 경우 단일 이미지로 처리하고,
    // 배열인 경우 여러 이미지로 처리
    if (Array.isArray(imageUrl)) {
      setImages(imageUrl);
    } else if (imageUrl) {
      setImages([imageUrl]);
    } else {
      setImages([]);
    }
  }, [imageUrl]);

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

  return (
    <div className="post">
      <div className="post-image-container" onClick={openModal}>
        {images.length > 0 && (
          <>
            <img
              src={APIService.getProcessedImageUrl(images[currentImageIndex])}
              alt={`게시물 ${currentImageIndex + 1}`}
              className="post-image"
              onError={(e) => {
                console.log("이미지 로드 실패:", images[currentImageIndex]);
                e.target.onerror = null;
                e.target.src = '/icon/image.png';
              }}
            />
            {images.length > 1 && (
              <>
                <button 
                  className="image-nav-button prev" 
                  onClick={prevImage}
                  style={{ display: currentImageIndex === 0 ? 'none' : 'flex' }}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button 
                  className="image-nav-button next" 
                  onClick={nextImage}
                  style={{ display: currentImageIndex === images.length - 1 ? 'none' : 'flex' }}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
                <div className="image-indicator">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`indicator-dot ${index === currentImageIndex ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="post-header">
        <div className="post-header-left">
          <Link to={`/profile/${username}`} className="post-user">
            <div className="post-user-avatar">
              <img
                src={profileImage}
                alt={username}
                onError={handleProfileImageError}
              />
            </div>
            <div className="post-username">{username}</div>
          </Link>
        </div>

        <div className="post-header-actions">
          <div className="post-actions-left">
            <button className={`post-action-btn ${isLiked ? 'liked' : ''}`} onClick={onLike}>
              <i className={isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
              <span className="likes-count">{likes}</span>
            </button>
            <button className="post-action-btn" onClick={openModal}>
              <i className="far fa-comment"></i>
              <span className="comments-count">{commentsList.length || comments}</span>
            </button>
            <Link to={`/messageform/${username}`}>
              <button className="post-action-btn">
                <i className="far fa-paper-plane"></i>
              </button>
            </Link>
            <button className={`post-action-btn ${isSaved ? 'saved' : ''}`} onClick={onSave}>
              <i className={isSaved ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
            </button>
          </div>

          {currentUser && (
            <div className="options-container" ref={optionsRef}>
              <button className="post-options" onClick={toggleOptions}>
                <i className="fas fa-ellipsis-h"></i>
              </button>

              {showOptions && (
                <div className="post-options-dropdown">
                  {/* 작성자 본인인 경우 (수정/삭제 가능) */}
                  {(currentUser.memberNickname === username) && (
                    <>
                      <button className="options-item" onClick={handleEditPost}>
                        <i className="fas fa-edit"></i> 게시물 수정
                      </button>
                      <button className="options-item delete" onClick={handleDeletePost}>
                        <i className="fas fa-trash-alt"></i> 게시물 삭제
                      </button>
                    </>
                  )}

                  {/* 관리자이고 작성자가 아닌 경우 (삭제만 가능, 신고 X) */}
                  {(currentUser.memberRole === 'ADMIN' && currentUser.memberNickname !== username) && (
                    <button className="options-item delete" onClick={handleDeletePost}>
                      <i className="fas fa-trash-alt"></i> 게시물 삭제
                    </button>
                  )}

                  {/* 일반 회원이 작성자가 아닌 경우 (신고만 가능) */}
                  {(currentUser.memberRole !== 'ADMIN' && currentUser.memberNickname !== username) && (
                    <button className="options-item report" onClick={handleReport}>
                      <i className="fas fa-flag"></i> 신고하기
                    </button>
                  )}
                </div>
              )}
            </div>
          )}


        </div>
      </div>

      <div className="post-info">
        {isEditing ? (
          <div className="post-edit-content">
            {/* 이미지 수정 영역 추가 */}
            <div className="post-edit-image">
              <input
                type="file"
                ref={editImageInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleEditImageChange}
              />

              {editImagePreview ? (
                <div className="edit-image-preview">
                  <img src={editImagePreview} alt="미리보기" />
                  <button
                    type="button"
                    className="remove-edit-image"
                    onClick={removeEditImagePreview}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                <div className="edit-image-current">
                  <img
                    src={APIService.getProcessedImageUrl(imageUrl)}
                    alt="현재 이미지"
                    onError={(e) => {
                      console.log("이미지 로드 실패:", imageUrl);
                      e.target.onerror = null;
                      e.target.src = '/icon/image.png';
                    }}
                  />
                  <div className="edit-image-overlay">
                    <button
                      type="button"
                      className="change-image-btn"
                      onClick={triggerEditImageInput}
                    >
                      <i className="fas fa-camera"></i> 이미지 변경
                    </button>
                  </div>
                </div>
              )}
            </div>
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
          <>
            <div className="post-content">
              <div className={`post-text ${isExpanded ? 'expanded' : ''}`} dangerouslySetInnerHTML={{ __html: content }}></div>
              {content.length > 200 && (
                <button className="expand-button" onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}>
                  {isExpanded ? '접기' : '펼치기'}
                </button>
              )}
            </div>

            {tags.length > 0 && (
              <div className="hashtags-container">
                {tags.map((tag, index) => (
                  <Link key={index} to={`/tags/${tag}`} className="hashtag">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        <div className="post-timestamp">
          {formatTimestamp(timestamp)}
        </div>

        <div className="post-comments">
          {commentsList.length > 0 && (
            <div className="post-comments-preview"></div>
          )}
          <div className="post-view-comments" onClick={openModal}>
            {commentsList.length > 0 ? `댓글 ${commentsList.length}개 모두 보기` : "댓글 달기"}
          </div>
        </div>
      </div>

      {showModal && (
        <PostModal
          id={id}
          username={username}
          profileImage={profileImage}
          image={imageUrl}
          content={content}
          likes={likes}
          comments={comments}
          commentsList={commentsList}
          setCommentsList={setCommentsList}
          timestamp={timestamp}
          tags={tags}
          isLiked={isLiked}
          isSaved={isSaved}
          onLike={onLike}
          onSave={onSave}
          onClose={closeModal}
          onEdit={onEdit}
          onDelete={onDelete}
          users={users}
          fetchComments={fetchComments}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

export default Post;
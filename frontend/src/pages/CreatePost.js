import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import APIService from '../services/APIService';
import './CreatePost.css';

function CreatePost({ user, fetchPosts }) {
  const [activeTab, setActiveTab] = useState('daily');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const fileInputRef = useRef(null);
  const tagInputRef = useRef(null);
  const editorRef = useRef(null);
  const [boardCategory, setBoardCategory] = useState('keyMemory');
  const navigate = useNavigate();

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (images.length + files.length > 5) {
      alert('이미지는 최대 5개까지만 업로드할 수 있습니다.');
      return;
    }

    const newImages = [...images];
    const newPreviews = [...previews];

    files.forEach(file => {
      newImages.push(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        setPreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });

    setImages(newImages);
  };

  // 파일 입력 다이얼로그 트리거
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // 특정 이미지 미리보기 제거
  const removePreview = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setImages(newImages);
    setPreviews(newPreviews);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 태그 입력 변경 핸들러
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  // 태그 입력 키 입력 핸들러
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // 태그 추가
  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, ''); // # 접두사 제거
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  // 포커스 아웃 시 태그 추가
  const handleTagInputBlur = () => {
    if (tagInput.trim()) {
      addTag();
    }
  };

  // 태그 제거
  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  // 공개 범위 변경 핸들러
  const handleVisibilityChange = (e) => {
    setVisibility(e.target.value);
  };

  // 이미지 업로드 핸들러 (TinyMCE용)
  const handleEditorImageUpload = async (blobInfo) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('TinyMCE 이미지 업로드 시작:', blobInfo.filename());

        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());

        // study 타입인 경우 다른 API 엔드포인트 사용
        let response;
        if (activeTab === 'study') {
          response = await APIService.uploadStudyImage(formData);
        } else {
          response = await APIService.uploadImage(formData);
        }

        console.log('업로드 응답:', response);

        if (!response.imageUrl) {
          throw new Error('서버에서 이미지 URL을 받지 못했습니다.');
        }

        // API 경로가 아닌 경우 변환
        let imageUrl = response.imageUrl;
        if (imageUrl.startsWith('/uploads/')) {
          const filename = imageUrl.split('/uploads/').pop();
          imageUrl = `http://localhost:9000/api/images/content/${filename}`;
        } else if (!imageUrl.startsWith('http')) {
          // 상대 경로인 경우 전체 URL로 변환
          imageUrl = `http://localhost:9000${imageUrl}`;
        }

        console.log('최종 이미지 URL:', imageUrl);
        resolve(imageUrl);
      } catch (error) {
        console.error('TinyMCE 이미지 업로드 실패:', error);
        reject(error.message || '이미지 업로드에 실패했습니다.');
      }
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔒 정지 상태 검사
    if (user?.memberStatus === 'suspended') {
      const until = new Date(user.memberSuspendUntil).toLocaleDateString();
      alert(`정지 상태입니다. ${until}까지 게시글 작성이 제한됩니다.`);
      return;
    }

    // 유효성 검사
    if (activeTab === 'study' && !title) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!content) {
      alert('내용을 입력하세요.');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();

      const boardData = {
        boardType: activeTab,
        boardContent: content,
        boardVisible: visibility,
        boardTitle: activeTab === 'study' ? title : null,
        boardCategory: boardCategory,
        tags: JSON.stringify(tags)
      };

      console.log('게시물 데이터:', boardData);

      formData.append('board', new Blob([JSON.stringify(boardData)], {
        type: 'application/json'
      }));

      images.forEach(image => {
        formData.append('images', image);
      });

      // FormData 내용 확인
      for (let pair of formData.entries()) {
        console.log('FormData 항목:', pair[0], pair[1]);
      }

      // 게시물 제출
      await APIService.createPost(formData);

      // 성공 메시지 표시 후 이동
      alert('게시물이 등록되었습니다.');

      // 게시물 목록 새로고침을 위한 이벤트 발생
      window.dispatchEvent(new CustomEvent('refreshData', {
        detail: { timestamp: Date.now() }
      }));

      // 1초 후 홈으로 이동 (새로고침 이벤트가 완료될 시간 제공)
      setTimeout(() => {
        navigate('/home');
      }, 300);
    } catch (error) {
      console.error('게시물 생성 오류:', error);
      alert('게시물 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    const confirmCancel = window.confirm('작성 중인 내용이 사라집니다. 취소하시겠습니까?');
    if (confirmCancel) {
      navigate('/home');
    }
  };

  return (
    <div className="create-post">
      <div className="create-post-container">
        <div className="create-post-header">
          <h1 className="create-post-title">새 게시물 작성</h1>
          <p className="create-post-description">당신의 이야기를 공유해보세요.</p>
        </div>

        <div className="create-post-form">
          <div className="create-post-tabs">
            <button
              className={`create-post-tab ${activeTab === 'daily' ? 'active' : ''}`}
              onClick={() => handleTabChange('daily')}
            >
              일반 게시물
            </button>
            <button
              className={`create-post-tab ${activeTab === 'study' ? 'active' : ''}`}
              onClick={() => handleTabChange('study')}
            >
              학습 게시물
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* 학습 게시물인 경우 제목 입력 */}
            {activeTab === 'study' && (
              <div className="form-group">
                <label htmlFor="title">제목</label>
                <input
                  type="text"
                  id="title"
                  className="form-input"
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            )}

            {/* 이미지 업로드 영역 */}
            <div className="form-group">
              <label>이미지 (최대 5개)</label>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpload}
                multiple
              />

              {previews.length === 0 ? (
                <div className="upload-area" onClick={triggerFileInput}>
                  <i className="fas fa-image upload-icon"></i>
                  <p className="upload-text">이미지를 업로드하세요</p>
                  <p className="upload-subtext">최대 5개의 이미지를 선택할 수 있습니다</p>
                  <button type="button" className="upload-button">파일 선택</button>
                </div>
              ) : (
                <div className="preview-area">
                  <div className="image-previews-grid">
                    {previews.map((preview, index) => (
                      <div key={index} className="image-preview">
                        <img src={preview} alt={`미리보기 ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-preview"
                          onClick={() => removePreview(index)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                    {previews.length < 5 && (
                      <div className="add-more-images" onClick={triggerFileInput}>
                        <i className="fas fa-plus"></i>
                        <p>이미지 추가</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 내용 입력 */}
            <div className="form-group">
              <label htmlFor="content">내용</label>
              {activeTab === 'study' ? (
                <Editor
                  apiKey="mm2znjkik4v21pn6r4mgjq9b21xo8sa2l3cmwdnphoj0rr79"
                  onInit={(evt, editor) => editorRef.current = editor}
                  init={{
                    height: 500,
                    menubar: true,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'image media | alignright alignjustify | bullist numlist outdent indent | ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | image | help',
                    images_upload_handler: handleEditorImageUpload,
                    automatic_uploads: true,
                    file_picker_types: 'image',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px } img { max-width: 100%; height: auto; display: block; margin: 0 auto; }'
                  }}
                  value={content}
                  onEditorChange={(newContent) => setContent(newContent)}
                />
              ) : (
                <textarea
                  id="content"
                  className="form-textarea"
                  placeholder="내용을 입력하세요"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                ></textarea>
              )}
            </div>

            {/* 태그 입력 */}
            <div className="form-group">
              <label htmlFor="tags">태그</label>
              <div className="tags-input">
                {tags.map((tag, index) => (
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
                  ref={tagInputRef}
                  placeholder="태그 입력 후 Enter (쉼표로 구분)"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  onBlur={handleTagInputBlur}
                />
              </div>
            </div>

            {/* 일반 게시물인 경우에만 카테고리 선택 표시 */}
            {activeTab === 'daily' && (
              <div className="form-group">
                <label htmlFor="boardCategory">카테고리</label>
                <select
                  id="boardCategory"
                  className="form-input"
                  value={boardCategory}
                  onChange={(e) => setBoardCategory(e.target.value)}
                >
                  <option value="keyMemory">키 메모리</option>
                  <option value="activity1">활동 1</option>
                  <option value="activity2">활동 2</option>
                </select>
              </div>
            )}

            {/* 공개 범위 설정 */}
            <div className="form-group">
              <label htmlFor="visibility">공개 범위</label>
              <select
                id="visibility"
                className="form-input"
                value={visibility}
                onChange={handleVisibilityChange}
              >
                <option value="public">전체 공개</option>
                <option value="follow">팔로워만</option>
                <option value="private">비공개</option>
              </select>
            </div>

            {/* 액션 버튼 */}
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                취소
              </button>
              <button
                type="submit"
                className={`btn-publish ${(!content || (activeTab === 'study' && !title) || isLoading) ? 'disabled' : ''}`}
                disabled={!content || (activeTab === 'study' && !title) || isLoading}
              >
                {isLoading ? '처리 중...' : '게시하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;
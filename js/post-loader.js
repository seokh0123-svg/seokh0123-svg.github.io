/**
 * 게시글 로딩 및 마크다운 파싱
 */

class PostLoader {
  constructor() {
    this.currentPost = null;
    this.init();
  }

  /**
   * 초기화
   */
  init() {
    this.setupMarked();
    this.loadPostFromURL();
  }

  /**
   * Marked.js 설정
   */
  setupMarked() {
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        highlight: function(code, lang) {
          if (typeof Prism !== 'undefined' && lang && Prism.languages[lang]) {
            return Prism.highlight(code, Prism.languages[lang], lang);
          }
          return code;
        },
        breaks: true,
        gfm: true,
        tables: true,
        pedantic: false,
        sanitize: false,
        smartLists: true,
        smartypants: false
      });
    }
  }

  /**
   * URL에서 게시글 파일명 가져오기
   */
  getPostFileFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('file');
  }

  /**
   * URL에서 게시글 로드
   */
  async loadPostFromURL() {
    const fileName = this.getPostFileFromURL();
    
    if (!fileName) {
      this.showError('게시글 파일이 지정되지 않았습니다.');
      return;
    }

    try {
      await this.loadPost(fileName);
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      this.showError('게시글을 불러오는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 게시글 로드
   */
  async loadPost(fileName) {
    this.showLoading();
    
    try {
      // posts.json에서 게시글 메타데이터 가져오기
      const postsResponse = await fetch('posts.json');
      if (!postsResponse.ok) {
        throw new Error(`posts.json 로드 실패: ${postsResponse.status}`);
      }
      
      const posts = await postsResponse.json();
      const postMeta = posts.find(post => post.file === fileName);
      
      if (!postMeta) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }

      // 마크다운 파일 로드
      const markdownResponse = await fetch(`pages/${fileName}`);
      if (!markdownResponse.ok) {
        throw new Error(`마크다운 파일 로드 실패: ${markdownResponse.status}`);
      }
      
      const markdownContent = await markdownResponse.text();
      
      // Front Matter 파싱
      const { frontMatter, content } = this.parseFrontMatter(markdownContent);
      
      // 게시글 데이터 병합
      this.currentPost = {
        ...postMeta,
        ...frontMatter,
        content: content
      };

      // 페이지 렌더링
      this.renderPost();
      this.loadGiscus();
      
    } catch (error) {
      console.error('게시글 로드 오류:', error);
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Front Matter 파싱
   */
  parseFrontMatter(content) {
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontMatterMatch) {
      return {
        frontMatter: {},
        content: content
      };
    }

    const frontMatterText = frontMatterMatch[1];
    const markdownContent = frontMatterMatch[2];
    
    const frontMatter = {};
    const lines = frontMatterText.split('\n');
    
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        // 따옴표 제거
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        
        // 배열 파싱 (tags)
        if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch {
            value = value
              .slice(1, -1)
              .split(',')
              .map(tag => tag.trim().replace(/^['"]|['"]$/g, ''));
          }
        }
        
        frontMatter[key] = value;
      }
    });

    return {
      frontMatter,
      content: markdownContent
    };
  }

  /**
   * 게시글 렌더링
   */
  renderPost() {
    if (!this.currentPost) return;

    // 페이지 제목 설정
    document.title = `${this.currentPost.title} - 블로그`;
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
      pageTitle.textContent = this.currentPost.title;
    }

    // 게시글 메타 정보 렌더링
    this.renderPostMeta();
    
    // 게시글 내용 렌더링
    this.renderPostContent();
  }

  /**
   * 게시글 메타 정보 렌더링
   */
  renderPostMeta() {
    const postTitle = document.getElementById('postTitle');
    const postDate = document.getElementById('postDate');
    const postTags = document.getElementById('postTags');
    
    if (postTitle) {
      postTitle.textContent = this.currentPost.title;
    }
    
    if (postDate) {
      postDate.textContent = this.formatDate(this.currentPost.date);
    }
    
    if (postTags && this.currentPost.tags && this.currentPost.tags.length > 0) {
      postTags.innerHTML = this.currentPost.tags
        .map(tag => `<span class="post-tag">${this.escapeHtml(tag)}</span>`)
        .join('');
    }
  }

  /**
   * 게시글 내용 렌더링
   */
  renderPostContent() {
    const postContent = document.getElementById('postContent');
    if (!postContent) return;

    if (typeof marked !== 'undefined') {
      // Marked.js로 마크다운을 HTML로 변환
      const htmlContent = marked.parse(this.currentPost.content);
      postContent.innerHTML = htmlContent;
      
      // 코드 하이라이팅 적용
      if (typeof Prism !== 'undefined') {
        Prism.highlightAllUnder(postContent);
      }
    } else {
      // Marked.js가 없을 경우 기본 텍스트 표시
      postContent.innerHTML = `<pre>${this.escapeHtml(this.currentPost.content)}</pre>`;
    }
  }

  /**
   * Giscus 댓글 시스템 로드
   */
  loadGiscus() {
    const commentsSection = document.getElementById('giscus-comments');
    if (!commentsSection) return;

    // Giscus 설정
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'seokh0123-svg/seokh0123-svg.github.io');
    script.setAttribute('data-repo-id', 'R_kgDOKjQqJQ'); // 실제 저장소 ID로 변경 필요
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOKjQqJc4Cb8YJ'); // 실제 카테고리 ID로 변경 필요
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '1');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'ko');
    script.setAttribute('data-loading', 'lazy');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    commentsSection.appendChild(script);
  }

  /**
   * 로딩 표시
   */
  showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  /**
   * 로딩 숨기기
   */
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  /**
   * 에러 표시
   */
  showError(message) {
    const postContent = document.getElementById('postContent');
    if (postContent) {
      postContent.innerHTML = `
        <div class="error-message">
          <h2>❌ 오류</h2>
          <p>${this.escapeHtml(message)}</p>
          <a href="/" class="back-link">← 목록으로 돌아가기</a>
        </div>
      `;
    }
    this.hideLoading();
  }

  /**
   * HTML 이스케이프
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 날짜 포맷팅
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }
}

// DOM이 로드되면 포스트 로더 초기화
document.addEventListener('DOMContentLoaded', () => {
  new PostLoader();
});

// 전역에서 접근 가능하도록 export
window.PostLoader = PostLoader;

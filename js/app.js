/**
 * 메인 애플리케이션 로직
 */

class BlogApp {
  constructor() {
    this.posts = [];
    this.filteredPosts = [];
    this.categories = new Set();
    this.tags = new Set();
    this.currentPage = 1;
    this.postsPerPage = 12;
    
    this.init();
  }

  /**
   * 초기화
   */
  async init() {
    try {
      await this.loadPosts();
      this.setupEventListeners();
      this.renderPosts();
      this.populateFilters();
      this.hideLoading();
    } catch (error) {
      console.error('블로그 초기화 중 오류 발생:', error);
      this.showError('게시글을 불러오는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 게시글 데이터 로드
   */
  async loadPosts() {
    try {
      const response = await fetch('posts.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.posts = await response.json();
      this.filteredPosts = [...this.posts];
      this.extractCategoriesAndTags();
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      // posts.json이 없을 경우 빈 배열로 초기화
      this.posts = [];
      this.filteredPosts = [];
    }
  }

  /**
   * 카테고리와 태그 추출
   */
  extractCategoriesAndTags() {
    this.categories.clear();
    this.tags.clear();

    this.posts.forEach(post => {
      if (post.category) {
        this.categories.add(post.category);
      }
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => this.tags.add(tag));
      }
    });
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 검색
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
      
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch(e.target.value);
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const searchValue = searchInput ? searchInput.value : '';
        this.handleSearch(searchValue);
      });
    }

    // 필터
    const categoryFilter = document.getElementById('categoryFilter');
    const tagFilter = document.getElementById('tagFilter');

    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.handleFilter();
      });
    }

    if (tagFilter) {
      tagFilter.addEventListener('change', (e) => {
        this.handleFilter();
      });
    }
  }

  /**
   * 검색 처리
   */
  handleSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      this.filteredPosts = [...this.posts];
    } else {
      this.filteredPosts = this.posts.filter(post => {
        return (
          post.title.toLowerCase().includes(searchTerm) ||
          post.excerpt.toLowerCase().includes(searchTerm) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
          (post.category && post.category.toLowerCase().includes(searchTerm))
        );
      });
    }

    this.renderPosts();
    this.updatePostsCount();
  }

  /**
   * 필터 처리
   */
  handleFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    const tagFilter = document.getElementById('tagFilter');
    
    const selectedCategory = categoryFilter ? categoryFilter.value : '';
    const selectedTag = tagFilter ? tagFilter.value : '';

    this.filteredPosts = this.posts.filter(post => {
      const categoryMatch = !selectedCategory || post.category === selectedCategory;
      const tagMatch = !selectedTag || (post.tags && post.tags.includes(selectedTag));
      return categoryMatch && tagMatch;
    });

    this.renderPosts();
    this.updatePostsCount();
  }

  /**
   * 필터 옵션 채우기
   */
  populateFilters() {
    this.populateCategoryFilter();
    this.populateTagFilter();
  }

  /**
   * 카테고리 필터 채우기
   */
  populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    // 기존 옵션 제거 (전체 옵션 제외)
    while (categoryFilter.children.length > 1) {
      categoryFilter.removeChild(categoryFilter.lastChild);
    }

    // 카테고리 옵션 추가
    Array.from(this.categories).sort().forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }

  /**
   * 태그 필터 채우기
   */
  populateTagFilter() {
    const tagFilter = document.getElementById('tagFilter');
    if (!tagFilter) return;

    // 기존 옵션 제거 (전체 옵션 제외)
    while (tagFilter.children.length > 1) {
      tagFilter.removeChild(tagFilter.lastChild);
    }

    // 태그 옵션 추가
    Array.from(this.tags).sort().forEach(tag => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = tag;
      tagFilter.appendChild(option);
    });
  }

  /**
   * 게시글 렌더링
   */
  renderPosts() {
    const postsGrid = document.getElementById('postsGrid');
    if (!postsGrid) return;

    if (this.filteredPosts.length === 0) {
      this.showNoPosts();
      return;
    }

    postsGrid.innerHTML = '';
    
    this.filteredPosts.forEach(post => {
      const postCard = this.createPostCard(post);
      postsGrid.appendChild(postCard);
    });
  }

  /**
   * 게시글 카드 생성
   */
  createPostCard(post) {
    const card = document.createElement('a');
    card.href = `post.html?file=${encodeURIComponent(post.file)}`;
    card.className = 'post-card';
    
    const tagsHtml = post.tags && post.tags.length > 0 
      ? post.tags.map(tag => `<span class="post-card-tag">${this.escapeHtml(tag)}</span>`).join('')
      : '';

    card.innerHTML = `
      <h3 class="post-card-title">${this.escapeHtml(post.title)}</h3>
      <div class="post-card-meta">
        <time class="post-card-date">${this.formatDate(post.date)}</time>
        ${post.category ? `<span class="post-card-category">${this.escapeHtml(post.category)}</span>` : ''}
      </div>
      <p class="post-card-excerpt">${this.escapeHtml(post.excerpt)}</p>
      ${tagsHtml ? `<div class="post-card-tags">${tagsHtml}</div>` : ''}
    `;

    return card;
  }

  /**
   * 게시글 수 업데이트
   */
  updatePostsCount() {
    const postsCount = document.getElementById('postsCount');
    if (postsCount) {
      const count = this.filteredPosts.length;
      postsCount.textContent = `${count}개의 게시글`;
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
   * 게시글 없음 표시
   */
  showNoPosts() {
    const postsGrid = document.getElementById('postsGrid');
    const noPosts = document.getElementById('noPosts');
    
    if (postsGrid) postsGrid.innerHTML = '';
    if (noPosts) noPosts.style.display = 'block';
  }

  /**
   * 에러 표시
   */
  showError(message) {
    const postsGrid = document.getElementById('postsGrid');
    if (postsGrid) {
      postsGrid.innerHTML = `
        <div class="error-message">
          <p>❌ ${message}</p>
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

// DOM이 로드되면 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  new BlogApp();
});

// 전역에서 접근 가능하도록 export
window.BlogApp = BlogApp;

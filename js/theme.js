/**
 * 다크/라이트 모드 토글 기능
 */

class ThemeManager {
  constructor() {
    this.themeKey = 'blog-theme';
    this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
    this.init();
  }

  /**
   * 시스템 테마 감지
   */
  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * 저장된 테마 가져오기
   */
  getStoredTheme() {
    try {
      return localStorage.getItem(this.themeKey);
    } catch (e) {
      console.warn('로컬 스토리지에 접근할 수 없습니다:', e);
      return null;
    }
  }

  /**
   * 테마 저장하기
   */
  setStoredTheme(theme) {
    try {
      localStorage.setItem(this.themeKey, theme);
    } catch (e) {
      console.warn('로컬 스토리지에 저장할 수 없습니다:', e);
    }
  }

  /**
   * 테마 적용하기
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    this.updateThemeIcon();
    this.setStoredTheme(theme);
  }

  /**
   * 테마 아이콘 업데이트
   */
  updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  /**
   * 테마 토글
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }

  /**
   * 초기화
   */
  init() {
    // 테마 적용
    this.applyTheme(this.currentTheme);

    // 토글 버튼 이벤트 리스너
    const toggleButton = document.getElementById('themeToggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => this.toggleTheme());
    }

    // 시스템 테마 변경 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // 저장된 테마가 없을 때만 시스템 테마를 따름
      if (!this.getStoredTheme()) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });

    // 페이지 로드 시 애니메이션 방지
    document.documentElement.style.transition = 'none';
    setTimeout(() => {
      document.documentElement.style.transition = '';
    }, 100);
  }
}

// DOM이 로드되면 테마 매니저 초기화
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});

// 전역에서 접근 가능하도록 export
window.ThemeManager = ThemeManager;

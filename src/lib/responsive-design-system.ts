/**
 * 跨端统一设计系统 - Responsive Design System
 *
 * 设计哲学：
 * 1. Mobile First - 移动端优先，渐进增强
 * 2. Unified Visual Language - 统一的视觉语言
 * 3. Contextual Adaptation - 根据场景自适应，而非简单缩放
 * 4. Touch Optimized - 触控优先，最小44px点击区域
 *
 * 断点定义：
 * - Mobile: < 768px (默认)
 * - Tablet: 768px - 1023px
 * - Desktop: 1024px - 1439px
 * - Large: >= 1440px
 */

// ============================================
// 断点配置
// ============================================
export const breakpoints = {
  sm: 640,   // 小屏手机
  md: 768,   // 平板/大手机
  lg: 1024,  // 小桌面/平板横屏
  xl: 1280,  // 标准桌面
  '2xl': 1440, // 大屏桌面
} as const;

// ============================================
// 响应式间距系统
// ============================================
export const spacing = {
  // 页面内边距
  page: {
    mobile: 'px-4 py-6',
    tablet: 'md:px-6 md:py-8',
    desktop: 'lg:px-8 lg:py-12',
    wide: 'xl:px-12 xl:py-16',
  },
  // 卡片内边距
  card: {
    mobile: 'p-4',
    tablet: 'md:p-5',
    desktop: 'lg:p-6',
  },
  // 组件间距
  gap: {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
} as const;

// ============================================
// 响应式字体系统
// ============================================
export const typography = {
  // 页面标题
  pageTitle: {
    mobile: 'text-2xl font-bold',
    tablet: 'md:text-3xl',
    desktop: 'lg:text-4xl',
  },
  // 区块标题
  sectionTitle: {
    mobile: 'text-lg font-semibold',
    tablet: 'md:text-xl',
    desktop: 'lg:text-2xl',
  },
  // 卡片标题
  cardTitle: {
    mobile: 'text-base font-semibold',
    tablet: 'md:text-lg',
  },
  // 正文
  body: {
    mobile: 'text-sm',
    tablet: 'md:text-base',
  },
  // 辅助文字
  caption: {
    mobile: 'text-xs',
    tablet: 'md:text-sm',
  },
} as const;

// ============================================
// 响应式网格系统
// ============================================
export const grid = {
  // 单列布局（移动端默认）
  single: 'grid grid-cols-1',
  // 双列布局
  two: {
    mobile: 'grid grid-cols-1',
    tablet: 'md:grid-cols-2',
  },
  // 三列布局
  three: {
    mobile: 'grid grid-cols-1',
    tablet: 'md:grid-cols-2',
    desktop: 'lg:grid-cols-3',
  },
  // 四列布局
  four: {
    mobile: 'grid grid-cols-2',
    tablet: 'md:grid-cols-3',
    desktop: 'lg:grid-cols-4',
  },
  // 自适应卡片网格
  auto: {
    mobile: 'grid grid-cols-1',
    tablet: 'md:grid-cols-2',
    desktop: 'lg:grid-cols-3',
    wide: 'xl:grid-cols-4',
  },
} as const;

// ============================================
// 组件尺寸系统
// ============================================
export const componentSizes = {
  // 按钮
  button: {
    mobile: 'h-11 px-5 text-sm',
    desktop: 'lg:h-12 lg:px-6',
  },
  // 输入框
  input: {
    mobile: 'h-12 px-4 text-base', // text-base防止iOS缩放
    desktop: 'lg:h-14 lg:px-5',
  },
  // 卡片
  card: {
    mobile: 'rounded-2xl',
    desktop: 'lg:rounded-3xl',
  },
  // 图标
  icon: {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  },
} as const;

// ============================================
// 容器宽度系统
// ============================================
export const containers = {
  // 全宽
  full: 'w-full',
  // 内容容器
  content: {
    mobile: 'max-w-full',
    tablet: 'md:max-w-3xl',
    desktop: 'lg:max-w-5xl',
    wide: 'xl:max-w-7xl',
  },
  // 窄容器（阅读优化）
  narrow: {
    mobile: 'max-w-full',
    tablet: 'md:max-w-2xl',
    desktop: 'lg:max-w-3xl',
  },
} as const;

// ============================================
// 移动端特定优化
// ============================================
export const mobileOptimizations = {
  // 底部安全区域（iPhone X+）
  safeAreaBottom: 'pb-[env(safe-area-inset-bottom)]',
  // 顶部安全区域
  safeAreaTop: 'pt-[env(safe-area-inset-top)]',
  // 触摸优化
  touchTarget: 'min-h-[44px] min-w-[44px]',
  // 禁用文本选择（交互元素）
  noSelect: 'select-none',
  // 滚动惯性
  scrollMomentum: 'overflow-y-auto [-webkit-overflow-scrolling:touch]',
  // 固定底部栏
  fixedBottom: 'fixed bottom-0 left-0 right-0 z-50',
} as const;

// ============================================
// PC端特定优化
// ============================================
export const desktopOptimizations = {
  // 悬停效果
  hover: {
    lift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-300',
    glow: 'hover:shadow-glow transition-all duration-300',
    scale: 'hover:scale-105 transition-transform duration-300',
  },
  // 侧边栏宽度
  sidebar: 'w-64 lg:w-72',
  // 最大内容宽度
  maxContentWidth: 'max-w-6xl mx-auto',
} as const;

// ============================================
// 页面布局模板
// ============================================
export const pageLayouts = {
  // 标准页面布局
  standard: {
    mobile: 'min-h-screen bg-background',
    container: 'max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-12',
  },
  // 全宽页面布局
  fullWidth: {
    mobile: 'min-h-screen bg-background',
    container: 'w-full px-4 py-6 md:px-6 md:py-8',
  },
  // 分栏布局（PC）
  sidebar: {
    mobile: 'min-h-screen bg-background flex flex-col',
    tablet: 'md:flex-row',
    sidebar: 'w-full md:w-64 lg:w-72 flex-shrink-0',
    main: 'flex-1 min-w-0',
  },
} as const;

// ============================================
// 快捷组合类名
// ============================================
export const combined = {
  // 响应式页面容器
  pageContainer: 'max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-12',
  // 响应式卡片网格
  cardGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6',
  // 响应式按钮
  responsiveButton: 'h-11 px-5 text-sm lg:h-12 lg:px-6',
  // 响应式输入框
  responsiveInput: 'h-12 px-4 text-base lg:h-14 lg:px-5',
  // 响应式标题
  responsiveTitle: 'text-2xl font-bold md:text-3xl lg:text-4xl',
  // 响应式区块标题
  responsiveSectionTitle: 'text-lg font-semibold md:text-xl lg:text-2xl',
} as const;

// ============================================
// 帮助函数
// ============================================

/**
 * 根据断点获取类名
 */
export function getResponsiveClass(
  mobile: string,
  tablet?: string,
  desktop?: string,
  wide?: string
): string {
  return [mobile, tablet, desktop, wide].filter(Boolean).join(' ');
}

/**
 * 判断是否为移动端（用于JS逻辑）
 */
export function isMobileViewport(width: number): boolean {
  return width < breakpoints.md;
}

/**
 * 判断是否为平板（用于JS逻辑）
 */
export function isTabletViewport(width: number): boolean {
  return width >= breakpoints.md && width < breakpoints.lg;
}

/**
 * 判断是否为桌面（用于JS逻辑）
 */
export function isDesktopViewport(width: number): boolean {
  return width >= breakpoints.lg;
}

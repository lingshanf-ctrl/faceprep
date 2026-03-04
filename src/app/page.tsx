import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">FP</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg">FacePrep</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                登录
              </Link>
              <Link
                href="/practice"
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all"
              >
                开始使用
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center px-6 pt-20">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-10">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              <span className="text-sm font-medium text-blue-600">AI 驱动的面试练习</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 tracking-tight leading-tight">
              掌控你的
              <br />
              <span className="text-blue-600">面试</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">
              为求职者打造的智能面试准备平台。练习、获取反馈、拿下理想工作。
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/practice"
                className="w-full sm:w-auto px-10 py-4 text-white bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition-all"
              >
                开始练习
              </Link>
              <Link
                href="/questions"
                className="w-full sm:w-auto px-10 py-4 text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-all"
              >
                浏览题库
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 border-y border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">100+</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">题目数量</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">AI</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">AI 驱动</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">全天候</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">免费</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">免费开始</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              一切所需
            </h2>
            <p className="text-lg text-gray-600 max-w-xl">
              完整的面试准备工具箱
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl border border-gray-200 hover:border-blue-200 transition-all">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">精选题库</h3>
              <p className="text-gray-600 leading-relaxed">100+ 道精选面试题，覆盖所有主要类别</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl border border-gray-200 hover:border-blue-200 transition-all">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI 反馈</h3>
              <p className="text-gray-600 leading-relaxed">即时获得详细分析和可操作的改进建议</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl border border-gray-200 hover:border-blue-200 transition-all">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">进度追踪</h3>
              <p className="text-gray-600 leading-relaxed">可视化你的成长，识别需要提升的领域</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">如何使用</h2>
            <p className="text-lg text-gray-600">三步走向成功</p>
          </div>

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="text-8xl md:text-9xl font-bold text-blue-100 leading-none">01</div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">选择题库</h3>
                <p className="text-gray-600 max-w-md">浏览精选题库或获取随机题目，模拟真实面试场景</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 md:flex-row-reverse">
              <div className="text-8xl md:text-9xl font-bold text-blue-100 leading-none">02</div>
              <div className="text-center md:text-right">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">练习回答</h3>
                <p className="text-gray-600 max-w-md">思考并组织你的回答，就像在真实面试中一样</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="text-8xl md:text-9xl font-bold text-blue-100 leading-none">03</div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">获取 AI 反馈</h3>
                <p className="text-gray-600 max-w-md">接收详细分析，包括分数、优点和具体改进建议</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            准备好拿下
            <br />
            下一场面试了吗？
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-xl mx-auto">
            加入数千名通过 FacePrep 提升面试技能的求职者
          </p>
          <Link
            href="/practice"
            className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all"
          >
            免费开始
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">FP</span>
              </div>
              <span className="font-semibold text-gray-900">FacePrep</span>
            </div>
            <div className="text-gray-500 text-sm">
              © 2025 FacePrep. 版权所有.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

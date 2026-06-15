'use client';

import { Brain, MessageSquare, BarChart3, Zap } from 'lucide-react';

const features = [
  {
    id: 1,
    icon: Brain,
    title: 'Học tập được cá nhân hóa',
    description: 'AI phân tích cách học của bạn và điều chỉnh nội dung để phù hợp với tốc độ và phong cách học tập của riêng bạn.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 2,
    icon: MessageSquare,
    title: 'Hỗ trợ AI 24/7',
    description: 'Nhận câu trả lời tức thì cho bất kỳ câu hỏi nào. Trợ lý AI của chúng tôi luôn sẵn sàng giúp bạn hiểu những khái niệm khó.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 3,
    icon: BarChart3,
    title: 'Theo dõi tiến độ chi tiết',
    description: 'Theo dõi tiến độ học tập của bạn một cách chi tiết với các bảng thống kê trực quan và các khuyến nghị được cá nhân hóa.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 4,
    icon: Zap,
    title: 'Học tập hiệu quả hơn',
    description: 'Tiết kiệm thời gian với các bài học được tối ưu hóa, flashcard thông minh và câu đố được tạo ra bởi AI.',
    gradient: 'from-amber-500 to-orange-500',
  },
];

export default function LandingFeaturesSection() {
  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Các tính năng nổi bật
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Khám phá những tính năng mạnh mẽ được thiết kế để giúp bạn học tập hiệu quả hơn và đạt được mục tiêu của mình.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="group rounded-xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 cursor-pointer"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>

                <div className={`mt-4 h-1 w-0 bg-gradient-to-r ${feature.gradient} group-hover:w-8 transition-all duration-300`} />
              </div>
            );
          })}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">500+</div>
            <p className="text-gray-600">Khóa học có sẵn</p>
          </div>
          <div className="text-center border-l border-r border-gray-200">
            <div className="text-4xl font-bold text-emerald-600 mb-2">50+</div>
            <p className="text-gray-600">Chuyên đề được hỗ trợ</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">AI</div>
            <p className="text-gray-600">Công nghệ tiên tiến</p>
          </div>
        </div>
      </div>
    </section>
  );
}

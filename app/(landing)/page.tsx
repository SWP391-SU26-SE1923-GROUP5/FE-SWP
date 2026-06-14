import LandingNavbar from '@/components/LandingNavbar';
import LandingHeroSection from '@/components/LandingHeroSection';
import LandingFeaturesSection from '@/components/LandingFeaturesSection';
import LandingFooter from '@/components/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation Bar */}
      <LandingNavbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <LandingHeroSection />

        {/* Features Section */}
        <LandingFeaturesSection />

        {/* CTA Section */}
        <section id="contact" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-600 to-emerald-700">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Bắt đầu hành trình học tập của bạn ngay hôm nay
            </h2>
            <p className="text-lg text-emerald-50 mb-8 max-w-2xl mx-auto">
              Tham gia hàng nghìn học viên đã cải thiện kết quả học tập của họ với AIStudyHub.
            </p>
            <button className="inline-block px-8 py-4 bg-white text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition-colors duration-300 text-lg">
              Đăng ký miễn phí ngay
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}

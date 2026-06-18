import LandingNavbar from '@/components/LandingNavbar';
import LandingHeroSection from '@/components/LandingHeroSection';
import LandingFeaturesSection from '@/components/LandingFeaturesSection';
import LandingFooter from '@/components/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingNavbar />

      <main className="flex-1">
        <LandingHeroSection />

        <LandingFeaturesSection />

        <section id="contact" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-600 to-emerald-700">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Start Your Learning Journey Today
            </h2>
            <p className="text-lg text-emerald-50 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who have improved their learning outcomes with AIStudyHub.
            </p>
            <button className="inline-block px-8 py-4 bg-white text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition-colors duration-300 text-lg">
              Sign Up Free Today
            </button>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

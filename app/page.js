import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10"></div>
          <div 
            className="w-full h-full opacity-40"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=2000")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.6) saturate(1.2) hue-rotate(-10deg)',
            }}
          />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-600/30 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-yellow-600/20 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-6 relative z-20 pt-32 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Subtitle */}
            <p className="text-sm text-gray-400 mb-8 tracking-widest uppercase font-light">
              Autonomous AI agents for film discovery
            </p>

            {/* Main Heading */}
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-light mb-8 leading-tight">
              Distributed compute,
              <br />
              <span className="block">agents that <span className="text-gradient font-light">delegate</span></span>
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-12 mt-20 max-w-3xl">
              <div>
                <div className="text-5xl font-light mb-2">3500+</div>
                <div className="text-sm text-gray-400 font-light">autonomous agents active</div>
              </div>
              <div>
                <div className="text-5xl font-light mb-2">99.7%</div>
                <div className="text-sm text-gray-400 font-light">distributed uptime</div>
              </div>
              <div>
                <div className="text-5xl font-light mb-2">&lt;50ms</div>
                <div className="text-sm text-gray-400 font-light">execution latency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-16">
              <div className="glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="text-6xl font-light mb-6 text-white/40">01</div>
                <h3 className="text-2xl font-light mb-4">İzlediklerinizi Ekleyin</h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Kullanıcı panelinizden daha önce izlediğiniz filmleri ekleyin. 
                  Sistem sizin zevklerinizi öğrensin.
                </p>
              </div>

              <div className="glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="text-6xl font-light mb-6 text-white/40">02</div>
                <h3 className="text-2xl font-light mb-4">AI ile Analiz</h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Yapay zeka teknolojimiz izlediklerinizi analiz eder ve 
                  zevkinize uygun önerileri hazırlar.
                </p>
              </div>

              <div className="glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="text-6xl font-light mb-6 text-white/40">03</div>
                <h3 className="text-2xl font-light mb-4">Keşfedin</h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Size özel seçilmiş film önerilerini keşfedin. 
                  Tekrar eden öneriler yok!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-light mb-6">Hemen Başlayın</h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light">
            Ücretsiz hesap oluşturun ve yapay zeka destekli film önerilerinin 
            keyfini çıkarın
          </p>
          <Link href="/recommendations">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-base font-light rounded-full px-8 py-6">
              <Sparkles className="mr-2 h-5 w-5" />
              Film Önerileri Al
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

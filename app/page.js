import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, Film, TrendingUp, Star, Users, Clock } from 'lucide-react';

export default function HomePage() {
  const popularMovies = [
    { title: "The Conjuring", members: "45.8K", rating: "8.9", icon: "🎬" },
    { title: "Hereditary", members: "38.2K", rating: "8.5", icon: "🎭" },
    { title: "The Babadook", members: "32.1K", rating: "8.7", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-10"></div>
          <div 
            className="w-full h-full opacity-20"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=2000")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.4) saturate(1.2)',
            }}
          />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6b5b7a]/20 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#9d4edd]/20 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-6 relative z-20 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            {/* Left Side - Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#8b7a9e]/30 mb-8">
                <Sparkles className="h-4 w-4 text-[#b8a8c8]" />
                <span className="text-sm font-light text-[#b8a8c8]">The Best Film Recommendation AI</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-6xl md:text-7xl font-light mb-6 leading-tight">
                Find
                <br />
                <span className="text-gradient font-normal">The Fear</span>
              </h1>
              
              <p className="text-lg text-gray-400 font-light leading-relaxed mb-8 max-w-lg">
                Discover, share, and grow your film taste with Babadook.
                Find your perfect movie among thousands of AI-powered recommendations.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-12">
                <Link href="/recommendations">
                  <Button 
                    size="lg" 
                    className="btn-gradient text-white px-8 py-6 text-base font-light rounded-full shadow-lg shadow-[#8b7a9e]/30 hover:shadow-[#8b7a9e]/50 transition-all"
                  >
                    Explore Movies
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/userpanel">
                  <Button 
                    size="lg" 
                    variant="ghost" 
                    className="border border-white/20 hover:bg-white/10 px-8 py-6 text-base font-light rounded-full"
                  >
                    Add Your Movie
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-light mb-1">10,000+</div>
                  <div className="text-sm text-gray-400 font-light">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-light mb-1">500K+</div>
                  <div className="text-sm text-gray-400 font-light">Movies</div>
                </div>
                <div>
                  <div className="text-3xl font-light mb-1">1M+</div>
                  <div className="text-sm text-gray-400 font-light">Recommendations</div>
                </div>
              </div>
            </div>

            {/* Right Side - Popular Movies */}
            <div className="relative">
              {/* Trending Badge */}
              <div className="absolute -top-4 right-4 z-20">
                <div className="px-4 py-2 btn-gradient rounded-full text-sm font-light shadow-lg">
                  ✨ Trending
                </div>
              </div>

              {/* Popular Movies Card */}
              <div className="glass rounded-2xl p-6 border border-[#8b7a9e]/20 relative backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-light">Popular Movies</h3>
                  <Link href="/recommendations" className="text-sm text-[#b8a8c8] hover:text-[#d8c8e8] font-light">
                    View all 10,000+ movies →
                  </Link>
                </div>

                <div className="space-y-4">
                  {popularMovies.map((movie, idx) => (
                    <div 
                      key={idx}
                      className="glass rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg btn-gradient flex items-center justify-center text-2xl shadow-lg shadow-[#8b7a9e]/20">
                          {movie.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-light mb-1">{movie.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {movie.members}
                            </span>
                            <span className="flex items-center gap-1 text-green-400">
                              <TrendingUp className="h-3 w-3" />
                              Online
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-light">{movie.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Featured Badge */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6b5b7a]/20 border border-[#8b7a9e]/30">
                    <Sparkles className="h-3 w-3 text-[#b8a8c8]" />
                    <span className="text-xs font-light text-[#b8a8c8]">Featured</span>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#6b5b7a]/15 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#9d4edd]/15 rounded-full blur-3xl"></div>
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
            <div className="text-center mb-16">
              <h2 className="text-5xl font-light mb-4">How It Works</h2>
              <p className="text-gray-400 font-light">Three simple steps to get personalized movie recommendations</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group border border-white/5">
                <div className="w-16 h-16 rounded-full btn-gradient flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-[#8b7a9e]/20">
                  01
                </div>
                <h3 className="text-2xl font-light mb-4">Add Your Movies</h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Add movies you've watched from your user panel. Let the system learn your taste.
                </p>
              </div>

              <div className="glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group border border-white/5">
                <div className="w-16 h-16 rounded-full btn-gradient flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-[#8b7a9e]/20">
                  02
                </div>
                <h3 className="text-2xl font-light mb-4">AI Analysis</h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Our AI technology analyzes what you've watched and prepares recommendations that suit your taste.
                </p>
              </div>

              <div className="glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group border border-white/5">
                <div className="w-16 h-16 rounded-full btn-gradient flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-[#8b7a9e]/20">
                  03
                </div>
                <h3 className="text-2xl font-light mb-4">Discover</h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Discover movie recommendations selected especially for you. No repeat recommendations!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto glass rounded-3xl p-12 border border-[#8b7a9e]/20">
            <h2 className="text-5xl font-light mb-6">Get Started Today</h2>
            <p className="text-xl text-gray-400 mb-8 font-light">
              Create a free account and enjoy AI-powered movie recommendations
            </p>
            <Link href="/recommendations">
              <Button size="lg" className="btn-gradient text-white font-light rounded-full px-8 py-6 shadow-lg shadow-[#8b7a9e]/30 hover:shadow-[#8b7a9e]/50 transition-all">
                <Sparkles className="mr-2 h-5 w-5" />
                Get Movie Recommendations
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

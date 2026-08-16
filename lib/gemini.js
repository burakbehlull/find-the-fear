import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getMovieRecommendations(watchedMovies = [], useWatchHistory = false) {
  try {
    // Gemini Pro modelini dene (en stabil versiyon)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro'
    });

    let prompt;
    
    if (useWatchHistory && watchedMovies.length > 0) {
      const movieList = watchedMovies.map(m => m.title).join(', ');
      prompt = `Kullanıcı şu filmleri izlemiş: ${movieList}. 
      Bu filmlerin türüne, tarzına ve konusuna göre 5 film öner. 
      Önerdiğin filmler izlediği filmlerle benzer olmalı ama aynı filmler olmamalı.
      Her film için JSON formatında şu bilgileri ver:
      [
        {
          "title": "Film adı",
          "year": "Yıl",
          "genre": "Tür",
          "description": "Kısa açıklama (maksimum 150 karakter)",
          "reason": "Neden önerildi (maksimum 100 karakter)"
        }
      ]
      Sadece JSON array döndür, başka açıklama yapma. 5 film öner.`;
    } else {
      prompt = `Korku, gerilim ve psikolojik türlerinde 5 farklı film öner. 
      ${watchedMovies.length > 0 ? `Şu filmleri önerme: ${watchedMovies.map(m => m.title).join(', ')}.` : ''}
      Her film için JSON formatında şu bilgileri ver:
      [
        {
          "title": "Film adı",
          "year": "Yıl",
          "genre": "Tür",
          "description": "Kısa açıklama (maksimum 150 karakter)",
          "reason": "Neden önerildi (maksimum 100 karakter)"
        }
      ]
      Sadece JSON array döndür, başka açıklama yapma. 5 film öner.`;
    }

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Gemini Response:', text); // Debug için
    
    // JSON'u parse et - daha güvenli
    let jsonText = text;
    
    // Markdown code block varsa temizle
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // JSON array'i bul
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const movies = JSON.parse(jsonMatch[0]);
      return movies;
    }
    
    // Eğer JSON bulunamazsa fallback öneriler döndür
    console.warn('JSON parse edilemedi, fallback öneriler kullanılıyor');
    return getFallbackRecommendations(watchedMovies);
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    console.error('Error details:', error.message);
    
    // API hatası varsa fallback kullan
    return getFallbackRecommendations(watchedMovies);
  }
}

// Fallback öneriler (API hata verirse)
function getFallbackRecommendations(watchedMovies) {
  const allMovies = [
    {
      title: "The Conjuring",
      year: "2013",
      genre: "Korku, Gerilim",
      description: "Gerçek olaylara dayanan paranormal araştırmacı çiftin hikayesi.",
      reason: "Atmosferik korku ve gerçek olaylara dayanan hikaye"
    },
    {
      title: "Hereditary",
      year: "2018",
      genre: "Korku, Dram",
      description: "Bir ailenin karanlık sırlarını ortaya çıkaran korku filmi.",
      reason: "Psikolojik derinlik ve rahatsız edici atmosfer"
    },
    {
      title: "The Babadook",
      year: "2014",
      genre: "Korku, Dram",
      description: "Bir annenin ve oğlunun gizemli bir varlıkla mücadelesi.",
      reason: "Psikolojik korku ve güçlü karakterler"
    },
    {
      title: "Sinister",
      year: "2012",
      genre: "Korku, Gerilim",
      description: "Yazar yeni evinde korkunç found footage kayıtları bulur.",
      reason: "Karanlık atmosfer ve sürekli gerilim"
    },
    {
      title: "Insidious",
      year: "2010",
      genre: "Korku, Gerilim",
      description: "Bir ailenin oğlunun astral projeksiyonla yaşadığı korkunç olaylar.",
      reason: "Paranormal aktivite ve jump scare'ler"
    },
    {
      title: "The Witch",
      year: "2015",
      genre: "Korku, Drama",
      description: "1630'larda Yeni İngiltere'de geçen cadılık hikayesi.",
      reason: "Dönemsel korku ve yavaş yanma gerilim"
    },
    {
      title: "Get Out",
      year: "2017",
      genre: "Korku, Gerilim",
      description: "Genç bir adamın kız arkadaşının ailesini ziyareti kabus olur.",
      reason: "Sosyal yorum ve psikolojik gerilim"
    },
    {
      title: "A Quiet Place",
      year: "2018",
      genre: "Korku, Gerilim",
      description: "Sese duyarlı yaratıkların dünyasında hayatta kalmaya çalışan aile.",
      reason: "Sessizlik kullanımı ve aile dinamiği"
    }
  ];

  // İzlenmiş filmleri filtrele
  const watchedTitles = watchedMovies.map(m => m.title.toLowerCase());
  const filtered = allMovies.filter(m => !watchedTitles.includes(m.title.toLowerCase()));
  
  // Rastgele 5 film seç
  return filtered.sort(() => 0.5 - Math.random()).slice(0, 5);
}

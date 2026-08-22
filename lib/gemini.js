import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function normalizeTitle(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '');
}

function filterWatchedMovies(recommendations, watchedMovies) {
  const watchedNormalized = watchedMovies.map(m => normalizeTitle(m.title));
  return recommendations.filter(
    rec => !watchedNormalized.includes(normalizeTitle(rec.title))
  );
}

export async function getMovieRecommendations(watchedMovies = [], useWatchHistory = false) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.6-flash'
    });

    let prompt;
    const forbiddenList = watchedMovies.map(m => m.title).join(', ');
    const forbiddenWarning = watchedMovies.length > 0 
      ? `⚠️ ÇOK ÖNEMLİ KURAL: Aşağıdaki filmleri KESİNLİKLE, MUTLAKA ve HİÇBİR ŞARKÜTERDE ÖNERME: ${forbiddenList}. Eğer bu listedeki filmlerden birini önerirsen sistem çöker. Farklı ve benzersiz filmler öner.`
      : '';

    if (useWatchHistory && watchedMovies.length > 0) {
      const movieList = watchedMovies.map(m => m.title).join(', ');
      prompt = `Kullanıcı şu filmleri izlemiş: ${movieList}. 
      Bu filmlerin türüne, tarzına ve konusuna göre 5 TAMAMEN FARKLI film öner. 
      ${forbiddenWarning}
      Önerdiğin filmler izlediği filmlerle benzer olmalı ama AYNI OLMAMALI. Hatta aynı serinin başka filmini bile önerme.
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
      Sadece JSON array döndür, başka açıklama yapma. Tam olarak 5 film öner ve hiçbiri yasak listedeki filmler olmasın.`;
    } else {
      prompt = `Korku, gerilim ve psikolojik türlerinde 5 TAMAMEN FARKLI film öner. 
      ${forbiddenWarning}
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
      Sadece JSON array döndür, başka açıklama yapma. Tam olarak 5 film öner.`;
    }

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Gemini Response:', text);
    
    let jsonText = text;
    
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      let movies = JSON.parse(jsonMatch[0]);
      movies = filterWatchedMovies(movies, watchedMovies);
      
      if (movies.length < 5) {
        console.warn(`Gemini ${5 - movies.length} tane yasaklı film önermiş, fallback ile tamamlanıyor`);
        const fallback = getFallbackRecommendations(watchedMovies, 5 - movies.length);
        const existingTitles = movies.map(m => normalizeTitle(m.title));
        for (const fb of fallback) {
          if (!existingTitles.includes(normalizeTitle(fb.title))) {
            movies.push(fb);
            existingTitles.push(normalizeTitle(fb.title));
          }
        }
      }
      
      return movies.slice(0, 5);
    }
    
    console.warn('JSON parse edilemedi, fallback öneriler kullanılıyor');
    return getFallbackRecommendations(watchedMovies);
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    console.error('Error details:', error.message);
    
    return getFallbackRecommendations(watchedMovies);
  }
}

function getFallbackRecommendations(watchedMovies, count = 5) {
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
    },
    {
      title: "The Ring",
      year: "2002",
      genre: "Korku, Gerilim",
      description: "İzleyeni 7 gün içinde öldüren lanetli bir videotape hikayesi.",
      reason: "Kült paranormal korku ve unutulmaz sahneler"
    },
    {
      title: "Paranormal Activity",
      year: "2007",
      genre: "Korku, Gerilim",
      description: "Bir çifti gece boyu takip eden kamera ile kaydedilen paranormal olaylar.",
      reason: "Found footage türünün en iyi örneklerinden"
    },
    {
      title: "The Shining",
      year: "1980",
      genre: "Korku, Dram",
      description: "Yalnız bir otelde çalışan babanın akıl sağlığının yavaşça bozulması.",
      reason: "Stanley Kubrick imzalı efsane psikolojik korku"
    },
    {
      title: "Psycho",
      year: "1960",
      genre: "Korku, Gerilim",
      description: "Uzak bir motelde geçen klasik Hitchcock gerilim filmi.",
      reason: "Sinema tarihinin en ikonik korku filmlerinden"
    },
    {
      title: "The Exorcist",
      year: "1973",
      genre: "Korku, Dram",
      description: "Genç bir kızın başına gelen şeytani olaylar ve gerçekleştirilen eksorsizm.",
      reason: "Tüm zamanların en korkunç filmlerinden biri"
    },
    {
      title: "Poltergeist",
      year: "1982",
      genre: "Korku, Gerilim",
      description: "Sıradan bir ailenin evinde baş gösteren paranormal olaylar.",
      reason: "Steven Spielberg üretimi klasik korku"
    },
    {
      title: "It Follows",
      year: "2014",
      genre: "Korku, Gerilim",
      description: "Cinsel ilişki ile bulaşan doğaüstü bir lanetin hikayesi.",
      reason: "Özgün konulu ve atmosferik modern korku"
    },
    {
      title: "The Blair Witch Project",
      year: "1999",
      genre: "Korku, Gerilim",
      description: "Ormanda kaybolan üç öğrencinin çektiği found footage kayıtları.",
      reason: "Found footage türünü popülerleştiren kült film"
    }
  ];

  const watchedNormalized = watchedMovies.map(m => normalizeTitle(m.title));
  const filtered = allMovies.filter(m => !watchedNormalized.includes(normalizeTitle(m.title)));
  
  return filtered.sort(() => 0.5 - Math.random()).slice(0, count);
}

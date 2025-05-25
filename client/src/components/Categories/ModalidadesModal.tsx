import { useState, useEffect } from "react";
import { X, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";

interface ModalidadesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiData {
  geek: {
    anime: any[];
    movies: any[];
    games: any[];
  };
  sports: {
    football: any[];
    basketball: any[];
    general: any[];
  };
  music: {
    charts: any[];
    artists: any[];
    lyrics: any[];
  };
  math: {
    facts: any[];
    tools: any[];
  };
  health: {
    nasa: any;
    weather: any;
    tips: any[];
  };
}

export function ModalidadesModal({ isOpen, onClose }: ModalidadesModalProps) {
  const { toast } = useToast();
  const [data, setData] = useState<ApiData>({
    geek: { anime: [], movies: [], games: [] },
    sports: { football: [], basketball: [], general: [] },
    music: { charts: [], artists: [], lyrics: [] },
    math: { facts: [], tools: [] },
    health: { nasa: null, weather: null, tips: [] }
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const loadAllData = async () => {
    await Promise.all([
      loadGeekData(),
      loadSportsData(),
      loadMusicData(),
      loadMathData(),
      loadHealthData()
    ]);
  };

  const loadGeekData = async () => {
    setLoading(prev => ({ ...prev, geek: true }));
    try {
      // MangaDex API
      const animeResponse = await fetch("https://api.mangadex.org/manga?limit=5&order[followedCount]=desc");
      const animeData = await animeResponse.json();

      // OMDb API (using demo key - replace with actual key)
      const moviesResponse = await fetch("http://www.omdbapi.com/?apikey=trilogy&s=avengers&type=movie");
      const moviesData = await moviesResponse.json();

      // RAWG API (using demo key - replace with actual key)
      const gamesResponse = await fetch("https://api.rawg.io/api/games?key=YOUR_RAWG_KEY&page_size=5&ordering=-rating");
      const gamesData = await gamesResponse.json();

      setData(prev => ({
        ...prev,
        geek: {
          anime: animeData.data || [],
          movies: moviesData.Search || [],
          games: gamesData.results || []
        }
      }));
    } catch (error) {
      toast({
        title: "Erro ao carregar dados Geek",
        description: "Não foi possível carregar os dados da categoria Geek",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, geek: false }));
    }
  };

  const loadSportsData = async () => {
    setLoading(prev => ({ ...prev, sports: true }));
    try {
      // TheSportsDB API
      const generalResponse = await fetch("https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=4328");
      const generalData = await generalResponse.json();

      // API-Football (demo endpoint)
      const footballResponse = await fetch("https://v3.football.api-sports.io/fixtures?live=all", {
        headers: {
          'X-RapidAPI-Key': 'YOUR_API_KEY',
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      });
      const footballData = await footballResponse.json();

      // Ball Don't Lie API
      const basketballResponse = await fetch("https://www.balldontlie.io/api/v1/players?per_page=5");
      const basketballData = await basketballResponse.json();

      setData(prev => ({
        ...prev,
        sports: {
          football: footballData.response || [],
          basketball: basketballData.data || [],
          general: generalData.events || []
        }
      }));
    } catch (error) {
      toast({
        title: "Erro ao carregar dados de Esportes",
        description: "Não foi possível carregar os dados da categoria Esportes",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, sports: false }));
    }
  };

  const loadMusicData = async () => {
    setLoading(prev => ({ ...prev, music: true }));
    try {
      // Deezer API
      const chartsResponse = await fetch("https://api.deezer.com/chart");
      const chartsData = await chartsResponse.json();

      // Last.fm API
      const artistsResponse = await fetch("http://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=YOUR_LASTFM_KEY&format=json");
      const artistsData = await artistsResponse.json();

      // Genius API would require server-side proxy due to CORS
      const lyricsData = [];

      setData(prev => ({
        ...prev,
        music: {
          charts: chartsData.tracks?.data || [],
          artists: artistsData.artists?.artist || [],
          lyrics: lyricsData
        }
      }));
    } catch (error) {
      toast({
        title: "Erro ao carregar dados de Música",
        description: "Não foi possível carregar os dados da categoria Música",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, music: false }));
    }
  };

  const loadMathData = async () => {
    setLoading(prev => ({ ...prev, math: true }));
    try {
      // Numbers API
      const factsResponse = await fetch("http://numbersapi.com/random/math");
      const factsData = await factsResponse.text();

      setData(prev => ({
        ...prev,
        math: {
          facts: [{ fact: factsData }],
          tools: [
            { name: "Calculadora", description: "Calculadora avançada" },
            { name: "Conversor", description: "Conversor de unidades" }
          ]
        }
      }));
    } catch (error) {
      toast({
        title: "Erro ao carregar dados de Matemática",
        description: "Não foi possível carregar os dados da categoria Matemática",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, math: false }));
    }
  };

  const loadHealthData = async () => {
    setLoading(prev => ({ ...prev, health: true }));
    try {
      // NASA APOD API
      const nasaResponse = await fetch("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY");
      const nasaData = await nasaResponse.json();

      // OpenWeatherMap API
      const weatherResponse = await fetch("https://api.openweathermap.org/data/2.5/weather?q=Luanda&appid=YOUR_WEATHER_KEY&units=metric");
      const weatherData = await weatherResponse.json();

      setData(prev => ({
        ...prev,
        health: {
          nasa: nasaData,
          weather: weatherData,
          tips: [
            { tip: "Beba pelo menos 8 copos de água por dia" },
            { tip: "Faça 30 minutos de exercício diário" }
          ]
        }
      }));
    } catch (error) {
      toast({
        title: "Erro ao carregar dados de Saúde",
        description: "Não foi possível carregar os dados da categoria Saúde",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, health: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-surface h-full w-full max-w-7xl overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <h2 className="text-xl font-semibold">Modalidades</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={loadAllData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Geek Category */}
            <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🎮</span>
                  <span>Geek</span>
                  {loading.geek && <RefreshCw className="h-4 w-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Anime & Mangá</p>
                  <p className="text-sm opacity-75">
                    {data.geek.anime.length > 0 
                      ? `${data.geek.anime.length} mangás populares`
                      : "Carregando..."
                    }
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Filmes & Séries</p>
                  <p className="text-sm opacity-75">
                    {data.geek.movies.length > 0 
                      ? `${data.geek.movies.length} filmes encontrados`
                      : "Carregando..."
                    }
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Games</p>
                  <p className="text-sm opacity-75">
                    {data.geek.games.length > 0 
                      ? `${data.geek.games.length} jogos em destaque`
                      : "Carregando..."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sports Category */}
            <Card className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>⚽</span>
                  <span>Desporto</span>
                  {loading.sports && <RefreshCw className="h-4 w-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Futebol</p>
                  <p className="text-sm opacity-75">
                    {data.sports.football.length > 0 
                      ? `${data.sports.football.length} partidas ao vivo`
                      : "Carregando..."
                    }
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Basquete</p>
                  <p className="text-sm opacity-75">
                    {data.sports.basketball.length > 0 
                      ? `${data.sports.basketball.length} jogadores`
                      : "Carregando..."
                    }
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Outros Esportes</p>
                  <p className="text-sm opacity-75">
                    {data.sports.general.length > 0 
                      ? `${data.sports.general.length} eventos`
                      : "Carregando..."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Music Category */}
            <Card className="bg-gradient-to-br from-red-500 to-yellow-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🎵</span>
                  <span>Música</span>
                  {loading.music && <RefreshCw className="h-4 w-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Top Charts</p>
                  <p className="text-sm opacity-75">
                    {data.music.charts.length > 0 
                      ? `${data.music.charts.length} músicas em alta`
                      : "Carregando..."
                    }
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Artistas</p>
                  <p className="text-sm opacity-75">
                    {data.music.artists.length > 0 
                      ? `${data.music.artists.length} artistas populares`
                      : "Carregando..."
                    }
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Letras</p>
                  <p className="text-sm opacity-75">Genius API</p>
                </div>
              </CardContent>
            </Card>

            {/* Math Category */}
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🧮</span>
                  <span>Matemática</span>
                  {loading.math && <RefreshCw className="h-4 w-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Fato do Dia</p>
                  <p className="text-sm opacity-75">
                    {data.math.facts.length > 0 
                      ? data.math.facts[0].fact
                      : "Carregando fato..."
                    }
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Ferramentas</p>
                  <p className="text-sm opacity-75">Calculadoras e conversores</p>
                </div>
              </CardContent>
            </Card>

            {/* Health/Nature Category */}
            <Card className="bg-gradient-to-br from-green-400 to-blue-400 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🌿</span>
                  <span>Saúde & Natureza</span>
                  {loading.health && <RefreshCw className="h-4 w-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">NASA - Foto do Dia</p>
                  <p className="text-sm opacity-75">
                    {data.health.nasa 
                      ? data.health.nasa.title 
                      : "Carregando..."
                    }
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Clima</p>
                  <p className="text-sm opacity-75">
                    {data.health.weather 
                      ? `${Math.round(data.health.weather.main?.temp || 0)}°C em ${data.health.weather.name}`
                      : "Carregando..."
                    }
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Dicas de Saúde</p>
                  <p className="text-sm opacity-75">Conteúdo curado</p>
                </div>
              </CardContent>
            </Card>

            {/* Technology Category */}
            <Card className="bg-gradient-to-br from-gray-700 to-blue-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>💻</span>
                  <span>Tecnologia</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Notícias Tech</p>
                  <p className="text-sm opacity-75">Últimas novidades</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">Criptomoedas</p>
                  <p className="text-sm opacity-75">Preços em tempo real</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="font-medium">GitHub</p>
                  <p className="text-sm opacity-75">Repos em destaque</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Data Sections */}
          {data.geek.anime.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Mangás Populares</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.geek.anime.slice(0, 6).map((manga: any) => (
                  <Card key={manga.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h4 className="font-medium">{manga.attributes?.title?.en || "Título não disponível"}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {manga.attributes?.description?.en?.slice(0, 100) || "Descrição não disponível"}...
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        {manga.attributes?.status || "Status desconhecido"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

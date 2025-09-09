import React, { useState, useEffect, useRef } from 'react';

// Main App Component
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isDiyaLit, setIsDiyaLit] = useState(false);
  const [showAarti, setShowAarti] = useState(false);
  const [shloka, setShloka] = useState({ quote: "Loading...", bhaavarth: "" });

  const [bhajans, setBhajans] = useState({});
  const [currentBhajan, setCurrentBhajan] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);
  const bellRef = useRef(null);
  const bellAudioSrc = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3';

  // State and logic for the daily quote
  const getDailyShlokaIndex = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 1);
    const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    return diffDays % 365;
  };

  const fetchShloka = async (index = null) => {
    try {
      const res = await fetch('/shloka.json');
      const data = await res.json();
      const shlokaIndex = index !== null ? index : getDailyShlokaIndex();
      setShloka(data[shlokaIndex]);
    } catch (err) {
      console.error("Error loading shloka:", err);
    }
  };

  useEffect(() => {
    fetchShloka();
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const timeout = nextMidnight.getTime() - now.getTime();
    const midnightTimer = setTimeout(() => {
      fetchShloka();
      setInterval(fetchShloka, 24 * 60 * 60 * 1000);
    }, timeout);

    return () => clearTimeout(midnightTimer);
  }, []);

  // Audio player useEffects
  useEffect(() => {
    fetch('/bhajans.json')
      .then(res => res.json())
      .then(data => setBhajans(data))
      .catch(err => console.error('Error loading bhajans:', err));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (currentBhajan) {
      audio.src = currentBhajan.file;
      audio.load();
      if (isPlaying) {
        audio.play().catch(e => console.error("Audio playback failed:", e));
      }
    }
  }, [currentBhajan]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.play().catch(e => console.error("Audio playback failed:", e));
      } else {
        audio.pause();
      }
    }
  }, [isPlaying]);

  const handleNavClick = (page) => {
    setCurrentPage(page);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const handleBellClick = () => {
    if (!bellRef.current) {
      bellRef.current = new Audio(bellAudioSrc);
    }
    bellRef.current.play().catch(e => console.error("Bell sound playback failed:", e));
  };

  const handleDiyaClick = () => setIsDiyaLit(prev => !prev);

  const handleAartiClick = () => {
    setShowAarti(true);
    setTimeout(() => setShowAarti(false), 3000);
  };

  const flatBhajanList = Object.values(bhajans).flat();
  const nextBhajan = () => {
    if (!currentBhajan) return;
    const index = flatBhajanList.findIndex(b => b.title === currentBhajan.title);
    const next = flatBhajanList[(index + 1) % flatBhajanList.length];
    setCurrentBhajan(next);
    setIsPlaying(true);
  };

  const prevBhajan = () => {
    if (!currentBhajan) return;
    const index = flatBhajanList.findIndex(b => b.title === currentBhajan.title);
    const prev = flatBhajanList[(index - 1 + flatBhajanList.length) % flatBhajanList.length];
    setCurrentBhajan(prev);
    setIsPlaying(true);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onBellClick={handleBellClick}
            onDiyaClick={handleDiyaClick}
            onAartiClick={handleAartiClick}
            isDiyaLit={isDiyaLit}
            showAarti={showAarti}
            shloka={shloka}
          />
        );
      case 'bhajan':
        return (
          <BhajanPage
            bhajans={bhajans}
            currentBhajan={currentBhajan}
            setCurrentBhajan={setCurrentBhajan}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            nextBhajan={nextBhajan}
            prevBhajan={prevBhajan}
            audioRef={audioRef}
          />
        );
      case 'gallery':
        return <GalleryPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5DC] font-sans text-gray-800">
      <script src="https://cdn.tailwindcss.com"></script>
      <Header currentPage={currentPage} onNavClick={handleNavClick} />
      <main className="pt-20 pb-8">
        {renderPage()}
      </main>
      <Footer />
      {/* Global audio player */}
      <audio ref={audioRef} onEnded={nextBhajan}></audio>
    </div>
  );
}

// Header Component
const Header = ({ currentPage, onNavClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-[#8B4513] font-[Inter]">mandir</h1>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-[#8B4513] p-2 rounded-full hover:bg-[#F5DEB3] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
        <nav className={`fixed inset-y-0 right-0 w-64 bg-[#FFF8DC] shadow-lg transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out md:static md:w-auto md:bg-transparent md:shadow-none md:translate-x-0`}>
          <div className="flex flex-col md:flex-row items-center h-full pt-16 md:pt-0">
            <button onClick={() => setIsOpen(false)} className="md:hidden absolute top-4 right-4 text-[#8B4513] p-2 rounded-full hover:bg-[#F5DEB3] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <NavItem label="Home" page="home" currentPage={currentPage} onClick={onNavClick} />
            <NavItem label="Bhajan" page="bhajan" currentPage={currentPage} onClick={onNavClick} />
            <NavItem label="Gallery" page="gallery" currentPage={currentPage} onClick={onNavClick} />
          </div>
        </nav>
      </div>
    </header>
  );
};

// NavItem Component
const NavItem = ({ label, page, currentPage, onClick }) => (
  <button
    onClick={() => onClick(page)}
    className={`
      px-4 py-2 rounded-full font-medium transition-all duration-200
      ${currentPage === page ? 'bg-[#D2B48C] text-white shadow-md' : 'text-[#8B4513] hover:bg-[#F5DEB3]'}
      w-full md:w-auto text-left md:text-center mt-2 md:mt-0
    `}
  >
    {label}
  </button>
);

// Section Wrapper
const Section = ({ id, children }) => (
  <section id={id} className="container mx-auto px-4 py-8 md:py-16">
    {children}
  </section>
);

// HomePage Component
const HomePage = ({ onBellClick, onDiyaClick, onAartiClick, isDiyaLit, showAarti, shloka }) => {
  const [showBhavaarth, setShowBhavaarth] = useState(false);
  const handleBhavaarthClick = () => setShowBhavaarth(prev => !prev);

  return (
    <Section id="home">
      <div className="bg-gradient-to-r from-[#f8f4e1] via-[#e2d6b7] to-[#d1c0a1] py-12">
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-[#8B4513] mb-6">LIVE DARSHAN</h2>
          <h3 className="text-2xl md:text-3xl font-semibold text-[#6a4e23]">
            સ્વાગત છે <span className="text-[#8B4513]">શ્રીમતી જયશ્રીબેન પટેલ</span> તમારા મંદિરમાં
          </h3>
        </div>
      </div>

      {/* Interactive Icons */}
      <div className="flex justify-center items-center space-x-8 my-8">
        <button onClick={onBellClick} className="p-4 rounded-full shadow-lg bg-[#FFF8DC] hover:bg-[#F5DEB3] transition-colors transform hover:scale-105">
          <svg className="w-10 h-10 text-[#FFD700]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.686 2 6 4.686 6 8v5.5a1.5 1.5 0 0 0 .75 1.3L5.5 16.5c-1.332 1.332-1.332 3.49 0 4.822 1.332 1.332 3.49 1.332 4.822 0L12 18l1.678 3.322c1.332 1.332 3.49 1.332 4.822 0 1.332-1.332 1.332-3.49 0-4.822L17.25 14.8A1.5 1.5 0 0 0 18 13.5V8c0-3.314-2.686-6-6-6zM8 8c0-2.21 1.79-4 4-4s4 1.79 4 4v5.5a1.5 1.5 0 0 0-.75 1.3l1.5 1.5c.983.983.983 2.576 0 3.559-.983.983-2.576.983-3.559 0L12 18.25l-1.191 2.382c-.983.983-2.576.983-3.559 0-.983-.983-.983-2.576 0-3.559l1.5-1.5a1.5 1.5 0 0 0-.75-1.3V8z" />
          </svg>
        </button>
        <button onClick={onDiyaClick} className="p-4 rounded-full shadow-lg bg-[#FFF8DC] hover:bg-[#F5DEB3] transition-colors transform hover:scale-105">
          <svg className="w-10 h-10" fill={isDiyaLit ? 'gold' : '#8B4513'} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
          </svg>
        </button>
        <button onClick={onAartiClick} className="p-4 rounded-full shadow-lg bg-[#FFF8DC] hover:bg-[#F5DEB3] transition-colors transform hover:scale-105">
          <svg className="w-10 h-10 text-[#FFD700]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.686 2 6 4.686 6 8v8.006c0 1.104.896 2 2 2h8c1.104 0 2-.896 2-2V8c0-3.314-2.686-6-6-6zM12 4c2.21 0 4 1.79 4 4v8.006c0 .552-.448 1-1 1h-6c-.552 0-1-.448-1-1V8c0-2.21 1.79-4 4-4zM8 18h8v2H8v-2z" />
          </svg>
        </button>
      </div>

      {/* Floating Aarti Thaali (Conditionally rendered) */}
      {showAarti && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="relative p-8 rounded-full bg-[#FFF8DC] animate-pulse">
            <svg className="w-48 h-48 text-[#FFD700]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-4-9h8v2H8v-2zM7 8h10v2H7V8zm-2 2h14v2H5v-2z" />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_5px_rgba(255,0,0,0.7)]"></div>
          </div>
        </div>
      )}

      {/* Youtube Feed (Mock) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            className="w-full h-64 md:h-80"
            src="https://www.youtube.com/embed/SOMWOTvJ6f8"
            title="Shree KasthBhanjandev Hanumanji Mandir Salangpur Live Darshan"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
          <div className="p-4">
            <h4 className="text-xl font-semibold text-[#8B4513]">Hanumanji's Blessings</h4>
            <p className="text-sm text-gray-600 mt-2">Join the live darshan from Salangpur Hanumanji Mandir and seek divine blessings.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            className="w-full h-64 md:h-80"
            src="https://www.youtube.com/embed/-b423zbfQmU"
            title="Shree Somnath Temple Live Darshan"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
          <div className="p-4">
            <h4 className="text-xl font-semibold text-[#8B4513]">Somnath Jyotirlinga Darshan</h4>
            <p className="text-sm text-gray-600 mt-2">Experience the serene atmosphere of the first Jyotirlinga of Lord Shiva.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            className="w-full h-64 md:h-80"
            src="https://www.youtube.com/embed/Di2Np01s52g"
            title="Dwarkadhish Live Darshan"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
          <div className="p-4">
            <h4 className="text-xl font-semibold text-[#8B4513]">Dwarkadhish Darshan</h4>
            <p className="text-sm text-gray-600 mt-2">Witness the divine presence of Lord Krishna in Dwarka.</p>
          </div>
        </div>
      </div>


      {/* Bhagwad Geeta Daily Quote */}
      <div className="bg-[#FFF8DC] rounded-lg shadow-xl p-8 my-12 text-center border border-[#D2B48C]">
        <h4 className="text-xl md:text-2xl font-bold text-[#8B4513] mb-4">ભગવદ ગીતામાંથી આજે વાચ્યું...</h4>
        <p className="text-lg text-gray-800 italic mb-4">"{shloka.quote}"</p>
        <button
          onClick={handleBhavaarthClick}
          className="px-6 py-3 rounded-full bg-[#D2B48C] text-white font-semibold hover:bg-[#8B4513] transition-colors shadow-md"
        >
          ભાવાર્થ
        </button>
        {showBhavaarth && <p className="mt-4 text-gray-700 font-medium">"{shloka.bhaavarth}"</p>}
      </div>
    </Section>
  );
};

// BhajanPage Component
const BhajanPage = ({ bhajans, currentBhajan, setCurrentBhajan, isPlaying, setIsPlaying, nextBhajan, prevBhajan, audioRef }) => {
  const [showBook, setShowBook] = useState(false);

  const togglePlay = () => setIsPlaying(prev => !prev);
  const selectBhajan = (bhajan) => {
    setCurrentBhajan(bhajan);
    setIsPlaying(true);
  };
  const toggleView = () => setShowBook(prev => !prev);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const setAudioData = () => setDuration(audio.duration);

    if (audio) {
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', setAudioData);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', setAudioData);
      };
    }
  }, [audioRef.current]);

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = e.target.value;
      setCurrentTime(e.target.value);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Section id="bhajan">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-5xl font-bold text-[#8B4513]">Bhajans</h2>
      </div>

      {!showBook && (
        <>
          {/* Audio Player */}
          <div className="bg-[#FFF8DC] rounded-2xl shadow-xl p-6 md:p-8 transform transition-all duration-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Bhajan Player</h3>
              <button onClick={toggleView} className="px-4 py-2 text-sm rounded-full font-semibold shadow-md bg-[#8B4513] text-white hover:bg-[#D2B48C] transition-colors">
                Open Bhajan Book
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between mb-6">
              <div className="text-center md:text-left">
                <p className="text-lg font-bold">{currentBhajan?.title || 'No Bhajan Selected'}</p>
                <p className="text-sm opacity-80">{currentBhajan?.singer || 'N/A'}</p>
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0 text-[#8B4513]">
                <button onClick={prevBhajan} className="p-3 rounded-full hover:bg-white/20 transition-colors">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M10 17.59L14.59 13 10 8.41V11H4v2h6v2.59zM19 4h-2v16h2V4z" /></svg>
                </button>
                <button onClick={togglePlay} className="p-4 rounded-full bg-white/30 hover:bg-white/40 transition-colors shadow-lg">
                  <svg className={`w-12 h-12`} fill="currentColor" viewBox="0 0 24 24">
                    {isPlaying ? (<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />) : (<path d="M8 5v14l11-7z" />)}
                  </svg>
                </button>
                <button onClick={nextBhajan} className="p-3 rounded-full hover:bg-white/20 transition-colors">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14 6.41L9.41 11 14 15.59V13h6V11h-6V8.41zM5 4h2v16H5V4z" /></svg>
                </button>
              </div>
            </div>

            {/* Seek Slider and Time Display */}
            <div className="flex items-center space-x-4 mt-4">
              <span className="text-sm font-medium">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-medium">{formatTime(duration)}</span>
            </div>

          </div>

          {/* Playlist */}
          <div className="mt-8">
            <h4 className="text-xl font-bold text-[#8B4513] mb-4">Playlist</h4>
            <ul className="space-y-4">
              {Object.keys(bhajans).map((section, sIdx) => (
                <li key={sIdx} className="mb-6">
                  <h5 className="font-semibold text-lg mb-2">{section}</h5>
                  <ul>
                    {bhajans[section].map((bhajan, idx) => (
                      <li
                        key={idx}
                        onClick={() => selectBhajan(bhajan)}
                        className={`p-4 rounded-lg shadow-md cursor-pointer transition-all duration-200 ${currentBhajan?.title === bhajan.title ? 'bg-[#D2B48C] text-white shadow-lg' : 'bg-white hover:bg-[#F5DEB3]'}`}
                      >
                        <p className="font-semibold">{bhajan.title}</p>
                        <p className="text-sm">{bhajan.singer}</p>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Bhajan Book */}
      {showBook && <BhajanBook flipBookUrl="/bhajan-lyrics.json" toggleView={toggleView} />}
    </Section>
  );
};

// BhajanBook component with page flip effect
const BhajanBook = ({ flipBookUrl, toggleView }) => {
  const [book, setBook] = useState({});
  const [pageIndex, setPageIndex] = useState(0);
  const sections = Object.keys(book);
  const pages = sections.flatMap(section => book[section].map(b => ({ ...b, section })));

  useEffect(() => {
    fetch(flipBookUrl)
      .then(res => res.json())
      .then(data => setBook(data))
      .catch(err => console.error('Error loading Bhajan Book:', err));
  }, [flipBookUrl]);

  const nextPage = () => setPageIndex(prev => Math.min(prev + 1, pages.length - 1));
  const prevPage = () => setPageIndex(prev => Math.max(prev - 1, 0));

  if (!pages.length) return <p>Loading Bhajan Book...</p>;

  const current = pages[pageIndex];

  return (
    <div className="relative bg-[#FFF8DC] p-6 rounded-xl shadow-lg border border-[#D2B48C] max-w-3xl mx-auto">
      <button onClick={toggleView} className="absolute top-2 right-2 px-2 py-1 bg-[#8B4513] text-white rounded">Close Book</button>
      <h3 className="text-xl font-bold text-[#8B4513] mb-2">{current.section}</h3>
      <div className="bg-white p-4 rounded shadow-lg min-h-[300px]">
        <p className="font-semibold text-lg">{current.title}</p>
        <p className="text-sm opacity-80 mb-2">{current.singer}</p>
        <pre className="whitespace-pre-wrap font-sans text-gray-800">{current.lyrics || 'Lyrics not added yet'}</pre>
        {current.meaning && <p className="italic text-[#8B4513] mt-2">{current.meaning}</p>}
      </div>
      <div className="flex justify-between mt-4">
        <button onClick={prevPage} disabled={pageIndex === 0} className="px-4 py-2 bg-[#8B4513] text-white rounded disabled:opacity-50">Previous</button>
        <span className="text-sm text-gray-600">{pageIndex + 1} / {pages.length}</span>
        <button onClick={nextPage} disabled={pageIndex === pages.length - 1} className="px-4 py-2 bg-[#8B4513] text-white rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
};

const GalleryPage = () => {
  const [images, setImages] = useState([]);
  const [filter, setFilter] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showFunFact, setShowFunFact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch gallery data
  useEffect(() => {
    fetch("/gallery.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load gallery.json");
        return res.json();
      })
      .then((data) => {
        setImages(data);
        setCategories([...new Set(data.map((item) => item.category))]);
        setFilter([...new Set(data.map((item) => item.category))][0]); // default to first category
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading gallery:", err);
        setError("Could not load gallery data.");
        setLoading(false);
      });
  }, []);

  // Filtered items
  const filteredImages = filter
    ? images.filter((item) => item.category === filter)
    : images;

  if (loading) {
    return <p className="text-center text-gray-600">Loading gallery...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600">{error}</p>;
  }

  return (
    <Section id="gallery">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-5xl font-bold text-[#8B4513] drop-shadow-md">
          Explore Our Gallery
        </h2>
        <p className="mt-2 text-gray-600">
          Discover temples, sacred places, gods, and heritage.
        </p>
      </div>

      {/* Category Buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 shadow-md ${filter === cat
              ? "bg-[#8B4513] text-white scale-105"
              : "bg-[#F8F1E7] text-[#8B4513] hover:bg-[#E6D3B3]"
              }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredImages.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
            onClick={() => {
              setSelectedImage(item);
              setShowFunFact(false);
            }}
          >
            {/* Image */}
            <div className="relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-60 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-gray-200">{item.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 relative transform transition-all duration-300 scale-100 hover:scale-[1.01]"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-[#8B4513] p-2 rounded-full hover:bg-[#F5DEB3] transition"
            >
              ✕
            </button>

            {/* Title */}
            <h3 className="text-3xl font-bold text-[#8B4513] mb-4">
              {selectedImage.title}
            </h3>

            {/* Image */}
            <img
              src={selectedImage.image}
              alt={selectedImage.title}
              className="w-full h-auto object-cover rounded-lg mb-6"
            />

            {/* History */}
            <p className="text-gray-700 leading-relaxed mb-6">
              {selectedImage.history}
            </p>

            {/* Fun Fact */}
            {selectedImage.mystery && (
              <div>
                <button
                  onClick={() => setShowFunFact((prev) => !prev)}
                  className="px-5 py-2 bg-[#D2B48C] text-white font-medium rounded-lg shadow-md hover:bg-[#8B4513] transition-colors"
                >
                  {showFunFact ? "Hide Fun Fact" : "Show Fun Fact"}
                </button>

                {showFunFact && (
                  <p className="mt-4 text-sm text-gray-800 bg-[#FDF7F0] p-4 rounded-lg border-l-4 border-[#8B4513] animate-slideDown">
                    {selectedImage.mystery}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
};


const Footer = () => {
  return (
    <footer className="bg-[#8B4513] text-white mt-12">

      {/* Bottom Bar */}
      <div className="border-t border-white/20 py-4 text-center text-sm text-gray-200">
        &copy; {new Date().getFullYear()} Mandir. All rights reserved.
      </div>
    </footer>
  );
};
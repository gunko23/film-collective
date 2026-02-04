import React, { useState } from 'react';

// Film Collective - Log Film Modal
// Search for a film and quickly rate it
// Ratings are universal across all collectives

export default function LogFilmModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [watchedDate, setWatchedDate] = useState('today');
  const [review, setReview] = useState('');
  const [step, setStep] = useState('search'); // 'search' | 'rate'

  const colors = {
    bg: '#08080a',
    surface: '#0f0f12',
    surfaceLight: '#161619',
    cream: '#f8f6f1',
    accent: '#e07850',
    accentSoft: '#d4a574',
    cool: '#7b8cde',
  };

  const displayRating = hoverRating || userRating;

  const Icons = {
    Search: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" />
        <path d="M16 16L20 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Close: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Back: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

  // Mock search results
  const searchResults = searchQuery.length > 1 ? [
    { id: 1, title: 'Past Lives', year: '2023', director: 'Celine Song', poster: colors.accent },
    { id: 2, title: 'Passages', year: '2023', director: 'Ira Sachs', poster: colors.cool },
    { id: 3, title: 'Past Perfect', year: '2019', director: 'Jorge Torres', poster: colors.accentSoft },
  ].filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  // Recent films for quick access
  const recentFilms = [
    { id: 4, title: 'Dune: Part Two', year: '2024', poster: colors.cool },
    { id: 5, title: 'Poor Things', year: '2023', poster: '#f472b6' },
    { id: 6, title: 'The Holdovers', year: '2023', poster: colors.accentSoft },
  ];

  const handleSelectFilm = (film) => {
    setSelectedFilm(film);
    setStep('rate');
  };

  const handleSubmit = () => {
    console.log({
      film: selectedFilm,
      rating: userRating,
      watchedDate,
      review
    });
    setIsOpen(false);
  };

  const scrollbarStyles = `
    .modal-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .modal-scroll::-webkit-scrollbar-track {
      background: transparent;
      margin: 8px 0;
    }
    .modal-scroll::-webkit-scrollbar-thumb {
      background: rgba(248, 246, 241, 0.1);
      border-radius: 3px;
    }
    .modal-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(248, 246, 241, 0.2);
    }
    .modal-scroll {
      scrollbar-width: thin;
      scrollbar-color: rgba(248, 246, 241, 0.1) transparent;
    }
  `;

  if (!isOpen) return null;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backdropFilter: 'blur(4px)'
      }}>
        {/* Modal */}
        <div style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          backgroundColor: colors.bg,
          borderRadius: '20px',
          border: `1px solid ${colors.cream}10`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: `1px solid ${colors.cream}08`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {step === 'rate' && (
                <button
                  onClick={() => { setStep('search'); setSelectedFilm(null); setUserRating(0); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px', display: 'flex'
                  }}
                >
                  <Icons.Back color={colors.cream} size={22} />
                </button>
              )}
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.cream }}>
                {step === 'search' ? 'Log a Film' : 'Rate Film'}
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px', display: 'flex'
              }}
            >
              <Icons.Close color={`${colors.cream}60`} size={22} />
            </button>
          </div>

          {/* Content */}
          <div 
            className="modal-scroll"
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '20px'
            }}
          >
            {step === 'search' && (
              <>
                {/* Search input */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  backgroundColor: colors.surface,
                  borderRadius: '12px',
                  border: `1px solid ${colors.cream}08`,
                  marginBottom: '24px'
                }}>
                  <Icons.Search color={`${colors.cream}40`} size={20} />
                  <input
                    type="text"
                    placeholder="Search for a film..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '16px',
                      color: colors.cream
                    }}
                  />
                </div>

                {/* Search results */}
                {searchQuery.length > 1 && (
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{
                      fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: `${colors.cream}40`, marginBottom: '12px'
                    }}>Results</p>
                    
                    {searchResults.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {searchResults.map((film) => (
                          <button
                            key={film.id}
                            onClick={() => handleSelectFilm(film)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '14px',
                              padding: '12px',
                              backgroundColor: colors.surface,
                              border: `1px solid ${colors.cream}06`,
                              borderRadius: '12px',
                              cursor: 'pointer',
                              color: colors.cream,
                              textAlign: 'left',
                              width: '100%',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceLight}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.surface}
                          >
                            <div style={{
                              width: '48px', height: '68px', borderRadius: '6px',
                              background: `linear-gradient(135deg, ${film.poster}60, ${colors.cool}30)`,
                              flexShrink: 0
                            }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>{film.title}</p>
                              <p style={{ fontSize: '13px', color: `${colors.cream}50` }}>
                                {film.year} · {film.director}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '14px', color: `${colors.cream}40`, textAlign: 'center', padding: '20px' }}>
                        No films found
                      </p>
                    )}
                  </div>
                )}

                {/* Recent / Quick access */}
                {searchQuery.length < 2 && (
                  <div>
                    <p style={{
                      fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: `${colors.cream}40`, marginBottom: '12px'
                    }}>Quick Add</p>
                    
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                      {recentFilms.map((film) => (
                        <button
                          key={film.id}
                          onClick={() => handleSelectFilm(film)}
                          style={{
                            flex: 1,
                            padding: 0,
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{
                            aspectRatio: '2/3', borderRadius: '8px',
                            background: `linear-gradient(135deg, ${film.poster}60, ${colors.cool}30)`,
                            marginBottom: '8px',
                            transition: 'transform 0.15s'
                          }} 
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          />
                          <p style={{ fontSize: '12px', fontWeight: 500, color: colors.cream }}>
                            {film.title}
                          </p>
                          <p style={{ fontSize: '11px', color: `${colors.cream}45` }}>{film.year}</p>
                        </button>
                      ))}
                    </div>

                    <div style={{
                      padding: '16px',
                      backgroundColor: colors.surface,
                      borderRadius: '12px',
                      border: `1px dashed ${colors.cream}15`,
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '14px', color: `${colors.cream}50` }}>
                        Can't find a film? Try searching by director or year.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 'rate' && selectedFilm && (
              <>
                {/* Selected film */}
                <div style={{
                  display: 'flex', gap: '16px', marginBottom: '28px',
                  padding: '16px',
                  backgroundColor: colors.surface,
                  borderRadius: '14px',
                  border: `1px solid ${colors.cream}06`
                }}>
                  <div style={{
                    width: '72px', height: '100px', borderRadius: '8px',
                    background: `linear-gradient(135deg, ${selectedFilm.poster}60, ${colors.cool}30)`,
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <p style={{ fontSize: '18px', fontWeight: 600, color: colors.cream, marginBottom: '4px' }}>
                      {selectedFilm.title}
                    </p>
                    <p style={{ fontSize: '14px', color: `${colors.cream}50` }}>
                      {selectedFilm.year} {selectedFilm.director && `· ${selectedFilm.director}`}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div style={{ marginBottom: '28px' }}>
                  <p style={{
                    fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: `${colors.cream}40`, marginBottom: '16px', textAlign: 'center'
                  }}>Your Rating</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '4px', fontSize: '36px',
                          color: star <= displayRating ? colors.accent : `${colors.cream}20`,
                          transform: star <= displayRating ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.15s ease'
                        }}
                      >★</button>
                    ))}
                  </div>
                  <p style={{ textAlign: 'center', fontSize: '14px', color: `${colors.cream}50` }}>
                    {userRating > 0 ? `${userRating} out of 5` : 'Tap to rate'}
                  </p>
                </div>

                {/* When did you watch */}
                <div style={{ marginBottom: '28px' }}>
                  <p style={{
                    fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: `${colors.cream}40`, marginBottom: '12px'
                  }}>When did you watch?</p>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { id: 'today', label: 'Today' },
                      { id: 'yesterday', label: 'Yesterday' },
                      { id: 'other', label: 'Other' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setWatchedDate(option.id)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: watchedDate === option.id ? `${colors.accent}15` : colors.surface,
                          border: `1px solid ${watchedDate === option.id ? colors.accent + '40' : colors.cream + '08'}`,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          color: watchedDate === option.id ? colors.cream : `${colors.cream}60`,
                          fontSize: '14px',
                          fontWeight: watchedDate === option.id ? 500 : 400,
                          transition: 'all 0.15s'
                        }}
                      >{option.label}</button>
                    ))}
                  </div>
                </div>

                {/* Optional review */}
                <div>
                  <p style={{
                    fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: `${colors.cream}40`, marginBottom: '12px'
                  }}>Add a note <span style={{ color: `${colors.cream}25` }}>(optional)</span></p>
                  
                  <textarea
                    placeholder="What did you think?"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '14px',
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.cream}08`,
                      borderRadius: '12px',
                      color: colors.cream,
                      fontSize: '14px',
                      lineHeight: 1.5,
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {step === 'rate' && (
            <div style={{
              padding: '20px',
              borderTop: `1px solid ${colors.cream}08`,
              flexShrink: 0
            }}>
              <button
                onClick={handleSubmit}
                disabled={userRating === 0}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: userRating > 0 ? colors.accent : colors.surfaceLight,
                  border: 'none',
                  borderRadius: '12px',
                  color: userRating > 0 ? colors.bg : `${colors.cream}40`,
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: userRating > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s'
                }}
              >
                {userRating > 0 ? 'Save Rating' : 'Rate to continue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

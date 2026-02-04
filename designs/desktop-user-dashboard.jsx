import React, { useState } from 'react';

// Film Collective - Desktop User Dashboard
// Sidebar + main content layout

export default function DesktopUserDashboard() {
  const [activeTab, setActiveTab] = useState('all');

  const colors = {
    bg: '#08080a',
    surface: '#0f0f12',
    surfaceLight: '#161619',
    cream: '#f8f6f1',
    accent: '#e07850',
    accentSoft: '#d4a574',
    cool: '#7b8cde',
  };

  // Simplified icons for desktop
  const Icons = {
    TonightsPick: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="19" cy="5" r="1.5" fill={color} opacity="0.6" />
      </svg>
    ),
    LogFilm: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="14" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M7 7V4C7 3.45 7.45 3 8 3H16C16.55 3 17 3.45 17 4V7" stroke={color} strokeWidth="1.5" />
        <circle cx="8.5" cy="13" r="1.5" stroke={color} strokeWidth="1.5" />
        <circle cx="15.5" cy="13" r="1.5" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    Heart: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 20L4.5 12.5C2.5 10.5 2.5 7 4.5 5C6.5 3 10 3 12 5.5C14 3 17.5 3 19.5 5C21.5 7 21.5 10.5 19.5 12.5L12 20Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    Family: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 10L12 3L21 10M5 10V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Trophy: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M8 4H16V10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10V4Z" stroke={color} strokeWidth="1.5" />
        <path d="M12 14V17M8 20H16M10 17H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Briefcase: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="13" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M8 7V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V7" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    Bell: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth="1.5" />
        <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Settings: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
        <path d="M12 2V5M12 19V22M2 12H5M19 12H22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Plus: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" strokeDasharray="2 3" />
        <path d="M12 8V16M8 12H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    ChevronRight: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M9 18L15 12L9 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

  const user = {
    name: 'Mike',
    fullName: 'Mike Gunko',
    stats: { movies: 322, shows: 2, collectives: 4, avgRating: 3.8 },
    topFilms: [
      { rank: 1, title: 'The Godfather', year: '1972', poster: colors.accent },
      { rank: 2, title: 'There Will Be Blood', year: '2007', poster: colors.cool },
      { rank: 3, title: 'The Dark Knight', year: '2008', poster: colors.accentSoft },
    ]
  };

  const collectives = [
    { id: 1, name: 'Misha + Mike', members: 2, role: 'owner', icon: 'Heart', color: '#f472b6', unread: 3 },
    { id: 2, name: 'Tiger Pride', members: 6, role: 'owner', icon: 'Trophy', color: colors.accent, unread: 0 },
    { id: 3, name: 'Gunko Bros', members: 4, role: 'member', icon: 'Family', color: colors.cool, unread: 5 },
    { id: 4, name: 'Work Film Club', members: 8, role: 'member', icon: 'Briefcase', color: colors.accentSoft, unread: 0 },
  ];

  const activity = [
    { id: 1, user: 'Dan Gunko', avatar: colors.cool, action: 'rated', film: 'Spider-Man: Across the Spider-Verse', rating: 4.5, collective: 'Gunko Bros', time: '1h ago', poster: colors.accent },
    { id: 2, user: 'Misha', avatar: '#f472b6', action: 'started a discussion about', film: 'Past Lives', collective: 'Misha + Mike', time: '3 days ago', poster: colors.accentSoft },
    { id: 3, user: 'Kurtis Foster', avatar: colors.accentSoft, action: 'rated', film: 'Dune: Part Two', rating: 5, collective: 'Tiger Pride', time: '5 days ago', poster: colors.cool },
    { id: 4, user: 'Alex Chen', avatar: '#34d399', action: 'added to watchlist', film: 'Oppenheimer', collective: 'Work Film Club', time: '1 week ago', poster: colors.accent },
  ];

  const getIcon = (iconName, color, size = 24) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent color={color} size={size} /> : null;
  };

  const scrollbarStyles = `
    .elegant-scroll::-webkit-scrollbar { width: 6px; }
    .elegant-scroll::-webkit-scrollbar-track { background: transparent; }
    .elegant-scroll::-webkit-scrollbar-thumb { background: rgba(248, 246, 241, 0.1); border-radius: 3px; }
    .elegant-scroll::-webkit-scrollbar-thumb:hover { background: rgba(248, 246, 241, 0.2); }
  `;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: colors.bg,
        color: colors.cream,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Sidebar */}
        <aside style={{
          width: '280px',
          backgroundColor: colors.surface,
          borderRight: `1px solid ${colors.cream}08`,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          overflowY: 'auto'
        }} className="elegant-scroll">
          {/* Logo */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '36px', height: '36px' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '24px', height: '24px',
                  border: `2px solid ${colors.accent}`,
                  borderRadius: '50%'
                }} />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: '20px', height: '20px',
                  backgroundColor: colors.cool,
                  borderRadius: '4px',
                  opacity: 0.8
                }} />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em' }}>Film Collective</span>
            </div>
          </div>

          {/* User greeting */}
          <div style={{
            padding: '16px',
            backgroundColor: colors.surfaceLight,
            borderRadius: '14px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px',
                borderRadius: '50%',
                backgroundColor: colors.accent
              }} />
              <div>
                <p style={{ fontSize: '11px', color: `${colors.cream}50`, marginBottom: '2px' }}>Welcome back</p>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>{user.fullName}</p>
              </div>
            </div>
            
            {/* Mini stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { value: user.stats.movies, label: 'Movies' },
                { value: user.stats.avgRating, label: 'Avg Rating' },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '10px',
                  backgroundColor: colors.surface,
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '18px', fontWeight: 600 }}>{stat.value}</p>
                  <p style={{ fontSize: '10px', color: `${colors.cream}45`, textTransform: 'uppercase' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Collectives list */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${colors.cream}40` }}>
                Your Collectives
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {collectives.map((collective) => (
                <button
                  key={collective.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: colors.cream,
                    textAlign: 'left',
                    position: 'relative',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceLight}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    backgroundColor: `${collective.color}15`,
                    border: `1px solid ${collective.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {getIcon(collective.icon, collective.color, 20)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 500 }}>{collective.name}</p>
                    <p style={{ fontSize: '11px', color: `${colors.cream}45` }}>{collective.members} members</p>
                  </div>
                  {collective.unread > 0 && (
                    <span style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      backgroundColor: colors.accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 600, color: colors.bg
                    }}>{collective.unread}</span>
                  )}
                </button>
              ))}

              {/* Create new */}
              <button style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px',
                backgroundColor: 'transparent',
                border: `1px dashed ${colors.cream}15`,
                borderRadius: '10px',
                cursor: 'pointer',
                color: `${colors.cream}50`,
                textAlign: 'left'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  backgroundColor: colors.surfaceLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icons.Plus color={`${colors.cream}40`} size={20} />
                </div>
                <span style={{ fontSize: '14px' }}>Create collective</span>
              </button>
            </div>
          </div>

          {/* Settings */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: `${colors.cream}50`,
            marginTop: '16px'
          }}>
            <Icons.Settings color={`${colors.cream}40`} size={20} />
            <span style={{ fontSize: '14px' }}>Settings</span>
          </button>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1,
          marginLeft: '280px',
          padding: '32px 48px'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                Dashboard
              </h1>
              <p style={{ fontSize: '15px', color: `${colors.cream}50` }}>
                Here's what's happening across your collectives
              </p>
            </div>
            <button style={{
              width: '44px', height: '44px', borderRadius: '50%',
              backgroundColor: colors.surface, border: `1px solid ${colors.cream}08`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative'
            }}>
              <Icons.Bell color={colors.cream} size={22} />
              <div style={{
                position: 'absolute', top: '10px', right: '10px',
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: colors.accent
              }} />
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '40px'
          }}>
            <button style={{
              padding: '28px',
              background: `linear-gradient(135deg, ${colors.accent}15, ${colors.accent}05)`,
              border: `1px solid ${colors.accent}25`,
              borderRadius: '16px',
              textAlign: 'left',
              cursor: 'pointer',
              color: colors.cream,
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                backgroundColor: `${colors.accent}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icons.TonightsPick color={colors.accent} size={28} />
              </div>
              <div>
                <p style={{ fontSize: '18px', fontWeight: 500, marginBottom: '4px' }}>Tonight's Pick</p>
                <p style={{ fontSize: '14px', color: `${colors.cream}50` }}>Find something everyone wants to watch</p>
              </div>
              <Icons.ChevronRight color={`${colors.cream}30`} size={24} />
            </button>

            <button style={{
              padding: '28px',
              backgroundColor: colors.surface,
              border: `1px solid ${colors.cream}08`,
              borderRadius: '16px',
              textAlign: 'left',
              cursor: 'pointer',
              color: colors.cream,
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                backgroundColor: colors.surfaceLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icons.LogFilm color={colors.cream} size={28} />
              </div>
              <div>
                <p style={{ fontSize: '18px', fontWeight: 500, marginBottom: '4px' }}>Log a Film</p>
                <p style={{ fontSize: '14px', color: `${colors.cream}50` }}>Rate and review what you watched</p>
              </div>
              <Icons.ChevronRight color={`${colors.cream}30`} size={24} />
            </button>
          </div>

          {/* Two column layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: '32px'
          }}>
            {/* Activity Feed */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <p style={{
                  fontSize: '11px', letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: `${colors.cream}40`
                }}>Collective Activity</p>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['All', 'Ratings', 'Discussions'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab.toLowerCase())}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: activeTab === tab.toLowerCase() ? colors.accent : 'transparent',
                        color: activeTab === tab.toLowerCase() ? colors.bg : `${colors.cream}60`,
                        border: `1px solid ${activeTab === tab.toLowerCase() ? colors.accent : colors.cream}15`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >{tab}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activity.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex', gap: '16px', padding: '20px',
                    backgroundColor: colors.surface, borderRadius: '14px',
                    border: `1px solid ${colors.cream}06`
                  }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      backgroundColor: item.avatar, flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '15px', lineHeight: 1.4, marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600 }}>{item.user}</span>
                        <span style={{ color: `${colors.cream}60` }}> {item.action} </span>
                        <span style={{ fontWeight: 500 }}>{item.film}</span>
                      </p>
                      {item.rating && (
                        <div style={{ display: 'flex', gap: '3px', marginBottom: '8px', alignItems: 'center' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} style={{
                              fontSize: '14px',
                              color: s <= Math.floor(item.rating) ? colors.accent : `${colors.cream}20`
                            }}>★</span>
                          ))}
                          <span style={{ fontSize: '14px', color: colors.accent, marginLeft: '6px', fontWeight: 500 }}>
                            {item.rating}
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '4px 10px', backgroundColor: colors.surfaceLight,
                          borderRadius: '6px', fontSize: '12px', color: `${colors.cream}60`
                        }}>{item.collective}</span>
                        <span style={{ fontSize: '12px', color: `${colors.cream}35` }}>{item.time}</span>
                      </div>
                    </div>
                    <div style={{
                      width: '52px', height: '72px', borderRadius: '8px',
                      background: `linear-gradient(135deg, ${item.poster}50, ${colors.cool}30)`,
                      flexShrink: 0
                    }} />
                  </div>
                ))}
              </div>

              <button style={{
                width: '100%', padding: '16px', marginTop: '16px',
                backgroundColor: 'transparent',
                border: `1px solid ${colors.cream}10`,
                borderRadius: '10px',
                fontSize: '14px',
                color: `${colors.cream}50`,
                cursor: 'pointer'
              }}>Load more activity</button>
            </div>

            {/* Right column */}
            <div>
              {/* Top Films */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '16px'
                }}>
                  <p style={{
                    fontSize: '11px', letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: `${colors.cream}40`
                  }}>Your Top 3 Films</p>
                  <button style={{
                    fontSize: '13px', color: colors.cool,
                    background: 'none', border: 'none', cursor: 'pointer'
                  }}>Edit</button>
                </div>

                <div style={{
                  backgroundColor: colors.surface,
                  borderRadius: '14px',
                  padding: '16px',
                  border: `1px solid ${colors.cream}06`
                }}>
                  {user.topFilms.map((film, i) => (
                    <div key={film.rank} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '12px 0',
                      borderBottom: i < 2 ? `1px solid ${colors.cream}06` : 'none'
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        backgroundColor: film.rank === 1 ? colors.accent : colors.surfaceLight,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 700,
                        color: film.rank === 1 ? colors.bg : colors.cream
                      }}>{film.rank}</div>
                      <div style={{
                        width: '40px', height: '56px', borderRadius: '6px',
                        background: `linear-gradient(135deg, ${film.poster}60, ${colors.cool}30)`
                      }} />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 500 }}>{film.title}</p>
                        <p style={{ fontSize: '12px', color: `${colors.cream}45` }}>{film.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div>
                <p style={{
                  fontSize: '11px', letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: `${colors.cream}40`,
                  marginBottom: '16px'
                }}>Your Stats</p>

                <div style={{
                  backgroundColor: colors.surface,
                  borderRadius: '14px',
                  padding: '20px',
                  border: `1px solid ${colors.cream}06`
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px'
                  }}>
                    {[
                      { value: user.stats.movies, label: 'Movies' },
                      { value: user.stats.shows, label: 'Shows' },
                      { value: user.stats.collectives, label: 'Collectives' },
                      { value: user.stats.avgRating, label: 'Avg Rating' },
                    ].map((stat, i) => (
                      <div key={i} style={{
                        padding: '16px',
                        backgroundColor: colors.surfaceLight,
                        borderRadius: '10px',
                        textAlign: 'center'
                      }}>
                        <p style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>{stat.value}</p>
                        <p style={{ fontSize: '11px', color: `${colors.cream}45`, textTransform: 'uppercase' }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

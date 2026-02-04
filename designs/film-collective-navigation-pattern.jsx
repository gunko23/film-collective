import React, { useState } from 'react';

// Film Collective - Navigation Pattern
// Consistent footer nav + secondary tab bar inside collectives

export default function FilmCollectiveNavigation() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [collectiveTab, setCollectiveTab] = useState('feed');

  const colors = {
    bg: '#08080a',
    surface: '#0f0f12',
    surfaceLight: '#161619',
    cream: '#f8f6f1',
    accent: '#e07850',
    accentSoft: '#d4a574',
    cool: '#7b8cde',
  };

  // Custom Icon Components
  const Icons = {
    TonightsPick: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="19" cy="5" r="1.5" fill={color} opacity="0.6" />
        <circle cx="5" cy="18" r="1" fill={color} opacity="0.4" />
      </svg>
    ),
    LogFilm: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="14" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M7 7V4C7 3.45 7.45 3 8 3H16C16.55 3 17 3.45 17 4V7" stroke={color} strokeWidth="1.5" />
        <circle cx="8.5" cy="13" r="1.5" stroke={color} strokeWidth="1.5" />
        <circle cx="15.5" cy="13" r="1.5" stroke={color} strokeWidth="1.5" />
        <path d="M10 13H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Heart: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 20L4.5 12.5C2.5 10.5 2.5 7 4.5 5C6.5 3 10 3 12 5.5C14 3 17.5 3 19.5 5C21.5 7 21.5 10.5 19.5 12.5L12 20Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    Family: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 10L12 3L21 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V10" stroke={color} strokeWidth="1.5" />
        <path d="M10 20V15C10 14.45 10.45 14 11 14H13C13.55 14 14 14.45 14 15V20" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    Trophy: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M8 4H16V10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10V4Z" stroke={color} strokeWidth="1.5" />
        <path d="M8 6H5C4.45 6 4 6.45 4 7V8C4 9.65 5.35 11 7 11H8" stroke={color} strokeWidth="1.5" />
        <path d="M16 6H19C19.55 6 20 6.45 20 7V8C20 9.65 18.65 11 17 11H16" stroke={color} strokeWidth="1.5" />
        <path d="M12 14V17" stroke={color} strokeWidth="1.5" />
        <path d="M8 20H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 17H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Briefcase: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="13" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M8 7V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V7" stroke={color} strokeWidth="1.5" />
        <path d="M3 12H21" stroke={color} strokeWidth="1.5" />
        <path d="M10 12V14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 12V14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Plus: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" strokeDasharray="2 3" />
        <path d="M12 8V16M8 12H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Bell: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21C13.37 21.62 12.71 22 12 22C11.29 22 10.63 21.62 10.27 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Home: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3L21 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 9.5V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V9.5" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    Search: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" />
        <path d="M16 16L20 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Collective: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="10" r="4" stroke={color} strokeWidth="1.5" />
        <circle cx="15" cy="10" r="4" stroke={color} strokeWidth="1.5" />
        <path d="M5 20C5 16.5 7 14 9 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19 20C19 16.5 17 14 15 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Profile: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" />
        <path d="M5 20C5 16.13 8.13 13 12 13C15.87 13 19 16.13 19 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Back: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Settings: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
        <path d="M12 2V5M12 19V22M2 12H5M19 12H22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4.93 4.93L7.05 7.05M16.95 16.95L19.07 19.07M4.93 19.07L7.05 16.95M16.95 7.05L19.07 4.93" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Chat: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 11H8.01M12 11H12.01M16 11H16.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    Film: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M2 8H22M2 16H22M6 4V20M18 4V20" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    Insights: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 20V14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 20V10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 20V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19 20V6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="4" cy="12" r="2" stroke={color} strokeWidth="1.5" />
        <circle cx="9" cy="8" r="2" stroke={color} strokeWidth="1.5" />
        <circle cx="14" cy="10" r="2" stroke={color} strokeWidth="1.5" />
        <circle cx="19" cy="4" r="2" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
  };

  const user = {
    name: 'Mike',
    stats: { movies: 322, shows: 2, collectives: 4, avgRating: 3.8 },
    topFilms: [
      { rank: 1, title: 'The Godfather', poster: colors.accent },
      { rank: 2, title: 'There Will Be Blood', poster: colors.cool },
      { rank: 3, title: 'The Dark Knight', poster: colors.accentSoft },
    ]
  };

  const collectives = [
    { id: 1, name: 'Misha + Mike', members: 2, role: 'owner', icon: 'Heart', color: '#f472b6', unread: 3 },
    { id: 2, name: 'Tiger Pride', members: 6, role: 'owner', icon: 'Trophy', color: colors.accent, unread: 0 },
    { id: 3, name: 'Gunko Bros', members: 4, role: 'member', icon: 'Family', color: colors.cool, unread: 5 },
    { id: 4, name: 'Work Film Club', members: 8, role: 'member', icon: 'Briefcase', color: colors.accentSoft, unread: 0 },
  ];

  const currentCollective = collectives[0]; // Misha + Mike for demo

  const activity = [
    { id: 1, user: 'Dan Gunko', avatar: colors.cool, action: 'rated', film: 'Spider-Man: Across the Spider-Verse', rating: 4.5, collective: 'Gunko Bros', time: '1h ago', poster: colors.accent },
    { id: 2, user: 'Misha', avatar: '#f472b6', action: 'started a discussion about', film: 'Past Lives', collective: 'Misha + Mike', time: '3 days ago', poster: colors.accentSoft },
  ];

  const collectiveMessages = [
    { id: 1, user: 'Misha', avatar: '#f472b6', message: "Just finished Past Lives... I'm not okay 😭", time: '2:34 PM' },
    { id: 2, user: 'Mike', avatar: colors.accent, message: "RIGHT?? That ending scene...", time: '2:36 PM' },
    { id: 3, user: 'Misha', avatar: '#f472b6', message: "We need to watch more A24 films", time: '2:40 PM' },
  ];

  const getCollectiveIcon = (iconName, color, size = 24) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent color={color} size={size} /> : null;
  };

  const scrollbarStyles = `
    .elegant-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
    .elegant-scroll::-webkit-scrollbar-track { background: transparent; }
    .elegant-scroll::-webkit-scrollbar-thumb { background: rgba(248, 246, 241, 0.1); border-radius: 4px; }
    .elegant-scroll::-webkit-scrollbar-thumb:hover { background: rgba(248, 246, 241, 0.2); }
    .elegant-scroll { scrollbar-width: thin; scrollbar-color: rgba(248, 246, 241, 0.1) transparent; }
    .hide-scroll::-webkit-scrollbar { display: none; }
    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  `;

  // Footer Navigation Component (consistent across all screens)
  const FooterNav = () => (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '12px 20px 28px',
      backgroundColor: colors.surface,
      borderTop: `1px solid ${colors.cream}08`,
      display: 'flex',
      justifyContent: 'space-around'
    }}>
      {[
        { id: 'dashboard', label: 'Home', Icon: Icons.Home },
        { id: 'search', label: 'Search', Icon: Icons.Search },
        { id: 'collectives', label: 'Collectives', Icon: Icons.Collective },
        { id: 'profile', label: 'Profile', Icon: Icons.Profile },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setCurrentView(item.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <item.Icon 
            color={currentView === item.id || (currentView === 'collective' && item.id === 'collectives') 
              ? colors.accent 
              : `${colors.cream}40`} 
            size={22} 
          />
          <span style={{ 
            fontSize: '10px', 
            fontWeight: 500,
            color: currentView === item.id || (currentView === 'collective' && item.id === 'collectives')
              ? colors.accent 
              : `${colors.cream}40`
          }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );

  // Dashboard View
  const DashboardView = () => (
    <div className="elegant-scroll" style={{ height: 'calc(100vh - 220px)', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '13px', color: `${colors.cream}50`, marginBottom: '4px' }}>Welcome back</p>
          <h1 style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.02em' }}>{user.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: colors.surface, border: `1px solid ${colors.cream}08`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative'
          }}>
            <Icons.Bell color={colors.cream} size={20} />
            <div style={{
              position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px',
              borderRadius: '50%', backgroundColor: colors.accent, border: `2px solid ${colors.surface}`
            }} />
          </button>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: colors.accent }} />
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { value: user.stats.movies, label: 'Movies' },
            { value: user.stats.shows, label: 'Shows' },
            { value: user.stats.collectives, label: 'Collectives' },
            { value: user.stats.avgRating, label: 'Avg' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '14px 10px', backgroundColor: colors.surface, borderRadius: '12px',
              textAlign: 'center', border: `1px solid ${colors.cream}06`
            }}>
              <p style={{ fontSize: '20px', fontWeight: 600, marginBottom: '2px' }}>{stat.value}</p>
              <p style={{ fontSize: '9px', color: `${colors.cream}45`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button style={{
            padding: '20px 16px',
            background: `linear-gradient(135deg, ${colors.accent}15, ${colors.accent}05)`,
            border: `1px solid ${colors.accent}25`, borderRadius: '14px',
            textAlign: 'left', cursor: 'pointer', color: colors.cream,
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              backgroundColor: `${colors.accent}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icons.TonightsPick color={colors.accent} size={24} />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 500 }}>Tonight's Pick</p>
              <p style={{ fontSize: '12px', color: `${colors.cream}50`, marginTop: '2px' }}>Find something to watch</p>
            </div>
          </button>
          <button style={{
            padding: '20px 16px', backgroundColor: colors.surface,
            border: `1px solid ${colors.cream}08`, borderRadius: '14px',
            textAlign: 'left', cursor: 'pointer', color: colors.cream,
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              backgroundColor: colors.surfaceLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icons.LogFilm color={colors.cream} size={24} />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 500 }}>Log a Film</p>
              <p style={{ fontSize: '12px', color: `${colors.cream}50`, marginTop: '2px' }}>Rate what you watched</p>
            </div>
          </button>
        </div>
      </div>

      {/* Your Collectives */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${colors.cream}40`, fontWeight: 500 }}>
            Your Collectives
          </p>
          <button style={{ fontSize: '13px', color: colors.cool, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', marginRight: '-20px', paddingRight: '20px' }}>
          {collectives.map((collective) => (
            <div 
              key={collective.id} 
              onClick={() => setCurrentView('collective')}
              style={{
                flexShrink: 0, width: '160px', padding: '16px',
                backgroundColor: colors.surface, borderRadius: '14px',
                border: `1px solid ${colors.cream}06`, cursor: 'pointer', position: 'relative'
              }}
            >
              {collective.unread > 0 && (
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  backgroundColor: colors.accent, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 600, color: colors.bg
                }}>{collective.unread}</div>
              )}
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                backgroundColor: `${collective.color}15`, border: `1px solid ${collective.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
              }}>
                {getCollectiveIcon(collective.icon, collective.color)}
              </div>
              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{collective.name}</p>
              <p style={{ fontSize: '12px', color: `${colors.cream}45`, marginBottom: '8px' }}>{collective.members} members</p>
              {collective.role === 'owner' && (
                <span style={{
                  display: 'inline-block', padding: '4px 8px',
                  backgroundColor: `${colors.cool}15`, borderRadius: '6px',
                  fontSize: '10px', fontWeight: 600, color: colors.cool,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>Owner</span>
              )}
            </div>
          ))}
          <div style={{
            flexShrink: 0, width: '160px', padding: '16px',
            backgroundColor: 'transparent', borderRadius: '14px',
            border: `1px dashed ${colors.cream}12`, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textAlign: 'center', minHeight: '140px'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              backgroundColor: colors.surface, display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
            }}>
              <Icons.Plus color={`${colors.cream}40`} size={24} />
            </div>
            <p style={{ fontSize: '13px', color: `${colors.cream}40` }}>Create new</p>
          </div>
        </div>
      </div>

      {/* Top Films */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${colors.cream}40`, fontWeight: 500 }}>Your Top 3 Films</p>
          <button style={{ fontSize: '13px', color: colors.cool, background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {user.topFilms.map((film) => (
            <div key={film.rank} style={{ flex: 1, position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '8px', left: '8px',
                width: '22px', height: '22px', borderRadius: '6px',
                backgroundColor: film.rank === 1 ? colors.accent : colors.surfaceLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: film.rank === 1 ? colors.bg : colors.cream, zIndex: 10
              }}>{film.rank}</div>
              <div style={{ aspectRatio: '2/3', borderRadius: '10px', background: `linear-gradient(135deg, ${film.poster}60, ${colors.cool}30)`, marginBottom: '8px' }} />
              <p style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{film.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div style={{ padding: '0 20px 24px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${colors.cream}40`, fontWeight: 500, marginBottom: '14px' }}>Recent Activity</p>
        {activity.map((item) => (
          <div key={item.id} style={{
            display: 'flex', gap: '12px', padding: '14px',
            backgroundColor: colors.surface, borderRadius: '12px',
            border: `1px solid ${colors.cream}06`, marginBottom: '10px'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: item.avatar, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', lineHeight: 1.4, marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>{item.user}</span>
                <span style={{ color: `${colors.cream}60` }}> {item.action} </span>
                <span style={{ fontWeight: 500 }}>{item.film}</span>
              </p>
              {item.rating && (
                <div style={{ display: 'flex', gap: '2px', marginBottom: '6px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} style={{ fontSize: '12px', color: s <= Math.floor(item.rating) ? colors.accent : `${colors.cream}20` }}>★</span>
                  ))}
                  <span style={{ fontSize: '12px', color: colors.accent, marginLeft: '4px' }}>{item.rating}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ padding: '3px 8px', backgroundColor: colors.surfaceLight, borderRadius: '4px', fontSize: '11px', color: `${colors.cream}50` }}>{item.collective}</span>
                <span style={{ fontSize: '11px', color: `${colors.cream}35` }}>{item.time}</span>
              </div>
            </div>
            <div style={{ width: '44px', height: '60px', borderRadius: '6px', background: `linear-gradient(135deg, ${item.poster}50, ${colors.cool}30)`, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );

  // Collective View (with secondary tab bar)
  const CollectiveView = () => (
    <div style={{ height: 'calc(100vh - 220px)', display: 'flex', flexDirection: 'column' }}>
      {/* Collective Header */}
      <div style={{ padding: '12px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button 
            onClick={() => setCurrentView('dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginLeft: '-8px' }}
          >
            <Icons.Back color={colors.cream} size={22} />
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginRight: '-8px' }}>
            <Icons.Settings color={`${colors.cream}60`} size={22} />
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            backgroundColor: `${currentCollective.color}15`,
            border: `1px solid ${currentCollective.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {getCollectiveIcon(currentCollective.icon, currentCollective.color, 28)}
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '4px' }}>
              {currentCollective.name}
            </h1>
            <p style={{ fontSize: '13px', color: `${colors.cream}50` }}>
              {currentCollective.members} members · You're the owner
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Tab Bar */}
      <div style={{ 
        padding: '0 20px',
        borderBottom: `1px solid ${colors.cream}08`
      }}>
        <div className="hide-scroll" style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
          {[
            { id: 'feed', label: 'Feed', Icon: Icons.Home },
            { id: 'chat', label: 'Chat', Icon: Icons.Chat },
            { id: 'films', label: 'Films', Icon: Icons.Film },
            { id: 'insights', label: 'Insights', Icon: Icons.Insights },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCollectiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: collectiveTab === tab.id ? `2px solid ${colors.accent}` : '2px solid transparent',
                color: collectiveTab === tab.id ? colors.cream : `${colors.cream}50`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginBottom: '-1px'
              }}
            >
              <tab.Icon color={collectiveTab === tab.id ? colors.accent : `${colors.cream}40`} size={18} />
              <span style={{ fontSize: '14px', fontWeight: collectiveTab === tab.id ? 500 : 400 }}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="elegant-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {collectiveTab === 'feed' && (
          <div>
            {/* Quick actions for this collective */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              <button style={{
                padding: '16px',
                background: `linear-gradient(135deg, ${colors.accent}15, ${colors.accent}05)`,
                border: `1px solid ${colors.accent}25`, borderRadius: '12px',
                textAlign: 'left', cursor: 'pointer', color: colors.cream
              }}>
                <Icons.TonightsPick color={colors.accent} size={20} />
                <p style={{ fontSize: '14px', fontWeight: 500, marginTop: '10px' }}>Tonight's Pick</p>
              </button>
              <button style={{
                padding: '16px', backgroundColor: colors.surface,
                border: `1px solid ${colors.cream}08`, borderRadius: '12px',
                textAlign: 'left', cursor: 'pointer', color: colors.cream
              }}>
                <Icons.Chat color={colors.cream} size={20} />
                <p style={{ fontSize: '14px', fontWeight: 500, marginTop: '10px' }}>Start Discussion</p>
              </button>
            </div>

            {/* Recent activity in this collective */}
            <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${colors.cream}40`, fontWeight: 500, marginBottom: '14px' }}>Recent Activity</p>
            <div style={{
              padding: '16px', backgroundColor: colors.surface,
              borderRadius: '12px', border: `1px solid ${colors.cream}06`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f472b6' }} />
                <div>
                  <p style={{ fontSize: '14px' }}><span style={{ fontWeight: 600 }}>Misha</span> <span style={{ color: `${colors.cream}60` }}>rated</span> <span style={{ fontWeight: 500 }}>Past Lives</span></p>
                  <p style={{ fontSize: '12px', color: `${colors.cream}40`, marginTop: '2px' }}>2 hours ago</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} style={{ fontSize: '14px', color: s <= 5 ? colors.accent : `${colors.cream}20` }}>★</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {collectiveTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Messages */}
            <div style={{ flex: 1 }}>
              {collectiveMessages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: msg.avatar, flexShrink: 0 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{msg.user}</span>
                      <span style={{ fontSize: '11px', color: `${colors.cream}35` }}>{msg.time}</span>
                    </div>
                    <div style={{
                      backgroundColor: colors.surface, padding: '12px 14px',
                      borderRadius: '14px', borderTopLeftRadius: '4px'
                    }}>
                      <p style={{ fontSize: '14px', lineHeight: 1.45 }}>{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px', backgroundColor: colors.surface,
              borderRadius: '100px', marginTop: '16px'
            }}>
              <input 
                type="text" placeholder="Message..."
                style={{
                  flex: 1, backgroundColor: 'transparent', border: 'none',
                  outline: 'none', fontSize: '14px', color: colors.cream
                }}
              />
              <button style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: colors.accent, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.bg} strokeWidth="2.5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {collectiveTab === 'films' && (
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${colors.cream}40`, fontWeight: 500, marginBottom: '14px' }}>
              Films in this collective
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[colors.accent, colors.cool, colors.accentSoft, '#f472b6', colors.accent, colors.cool].map((color, i) => (
                <div key={i}>
                  <div style={{ aspectRatio: '2/3', borderRadius: '8px', background: `linear-gradient(135deg, ${color}50, ${colors.cool}30)`, marginBottom: '8px' }} />
                  <p style={{ fontSize: '11px', color: `${colors.cream}70` }}>Film {i + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {collectiveTab === 'insights' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              {[
                { label: 'Films Rated', value: '47' },
                { label: 'Discussions', value: '12' },
                { label: 'Avg Rating', value: '4.1' },
                { label: 'Compatibility', value: '84%' },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '16px', backgroundColor: colors.surface,
                  borderRadius: '12px', border: `1px solid ${colors.cream}06`
                }}>
                  <p style={{ fontSize: '10px', color: `${colors.cream}40`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{stat.label}</p>
                  <p style={{ fontSize: '24px', fontWeight: 600 }}>{stat.value}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${colors.cream}40`, fontWeight: 500, marginBottom: '14px' }}>
              Taste Match
            </p>
            <div style={{
              padding: '16px', backgroundColor: colors.surface,
              borderRadius: '12px', border: `1px solid ${colors.cream}06`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f472b6' }} />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>Misha</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 600, color: colors.cool }}>84%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: colors.surfaceLight, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '84%', height: '100%', backgroundColor: colors.cool, borderRadius: '3px' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div style={{
        minHeight: '100vh', backgroundColor: '#050506',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        padding: '40px 20px', fontFamily: '-apple-system, sans-serif', gap: '40px'
      }}>
        {/* View switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'sticky', top: '40px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: `${colors.cream}40`, marginBottom: '8px' }}>View</p>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'collective', label: 'Inside Collective' },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setCurrentView(view.id)}
              style={{
                padding: '12px 20px',
                backgroundColor: currentView === view.id ? colors.accent : colors.surface,
                color: currentView === view.id ? colors.bg : colors.cream,
                border: `1px solid ${currentView === view.id ? colors.accent : colors.cream}15`,
                borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textAlign: 'left'
              }}
            >{view.label}</button>
          ))}
          
          {currentView === 'collective' && (
            <>
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: `${colors.cream}40`, marginTop: '16px', marginBottom: '8px' }}>Tab</p>
              {['feed', 'chat', 'films', 'insights'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCollectiveTab(tab)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: collectiveTab === tab ? `${colors.cool}20` : 'transparent',
                    color: collectiveTab === tab ? colors.cool : `${colors.cream}60`,
                    border: `1px solid ${collectiveTab === tab ? colors.cool : colors.cream}15`,
                    borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', textTransform: 'capitalize'
                  }}
                >{tab}</button>
              ))}
            </>
          )}
        </div>

        {/* Phone frame */}
        <div style={{
          width: '375px', backgroundColor: colors.bg, color: colors.cream,
          borderRadius: '40px', overflow: 'hidden', position: 'relative',
          border: `1px solid ${colors.cream}10`, boxShadow: '0 50px 100px rgba(0,0,0,0.5)'
        }}>
          {/* Status bar */}
          <div style={{
            padding: '14px 24px 10px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: '14px', fontWeight: 600
          }}>
            <span>9:41</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
                {[4, 6, 8, 10].map((h, i) => (
                  <div key={i} style={{ width: '3px', height: `${h}px`, backgroundColor: colors.cream, borderRadius: '1px' }} />
                ))}
              </div>
              <div style={{ width: '24px', height: '12px', border: `1px solid ${colors.cream}`, borderRadius: '3px', padding: '2px', marginLeft: '4px' }}>
                <div style={{ width: '80%', height: '100%', backgroundColor: colors.cream, borderRadius: '1px' }} />
              </div>
            </div>
          </div>

          {/* Content */}
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'collective' && <CollectiveView />}

          {/* Consistent Footer Nav */}
          <FooterNav />

          {/* Home indicator */}
          <div style={{
            position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
            width: '134px', height: '5px', backgroundColor: colors.cream, borderRadius: '100px', opacity: 0.2
          }} />
        </div>
      </div>
    </>
  );
}

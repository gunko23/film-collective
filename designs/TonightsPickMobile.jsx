import React, { useState } from 'react';

// Film Collective - Tonight's Pick Mobile
// Full-screen mobile view with phone frame preview

export default function TonightsPickMobile() {
  const [step, setStep] = useState(1);
  const [selectedMembers, setSelectedMembers] = useState(['mike']);
  const [selectedMood, setSelectedMood] = useState('any');
  const [maxRuntime, setMaxRuntime] = useState('any');
  const [contentRating, setContentRating] = useState('any');
  const [showContentFilters, setShowContentFilters] = useState(true);
  const [contentFilters, setContentFilters] = useState({
    violence: 'any',
    sexNudity: 'any',
    language: 'any',
    substances: 'any',
    frightening: 'any'
  });

  const colors = {
    bg: '#08080a',
    surface: '#0f0f12',
    surfaceLight: '#161619',
    cream: '#f8f6f1',
    accent: '#e07850',
    accentSoft: '#d4a574',
    cool: '#7b8cde',
  };

  const Icons = {
    Back: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Sparkle: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="19" cy="5" r="1.5" fill={color} opacity="0.6" />
      </svg>
    ),
    Check: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M5 13L9 17L19 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    ChevronDown: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    ChevronUp: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M6 15L12 9L18 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Home: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3L21 9.5M5 9.5V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Search: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" />
        <path d="M16 16L20 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Collective: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="10" r="4" stroke={color} strokeWidth="1.5" />
        <circle cx="15" cy="10" r="4" stroke={color} strokeWidth="1.5" />
        <path d="M5 20C5 16.5 7 14 9 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19 20C19 16.5 17 14 15 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Bell: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth="1.5" />
        <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Profile: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" />
        <path d="M5 20C5 16.13 8.13 13 12 13C15.87 13 19 16.13 19 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    AnyMood: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    Fun: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M7 6V4M17 6V4M7 18V20M17 18V20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Intense: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    Emotional: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 20L4.5 12.5C2.5 10.5 2.5 7 4.5 5C6.5 3 10 3 12 5.5C14 3 17.5 3 19.5 5C21.5 7 21.5 10.5 19.5 12.5L12 20Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    Mindless: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
        <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 9H9.01M15 9H15.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    Acclaimed: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M8 4H16V10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10V4Z" stroke={color} strokeWidth="1.5" />
        <path d="M12 14V17M8 20H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Filter: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
        <path d="M12 8V8.01M12 11V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Violence: ({ color, size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M14.5 4L18 7.5L11 14.5L7.5 11L14.5 4Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M3 21L7.5 16.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Heart: ({ color, size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 20L4.5 12.5C2.5 10.5 2.5 7 4.5 5C6.5 3 10 3 12 5.5C14 3 17.5 3 19.5 5C21.5 7 21.5 10.5 19.5 12.5L12 20Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    Language: ({ color, size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    Substance: ({ color, size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M8 3H16L18 8H6L8 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M6 8V19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V8" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    Frightening: ({ color, size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
        <path d="M8 15C8 15 9 13 12 13C15 13 16 15 16 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 10V9M15 10V9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };

  const members = [
    { id: 'austin', name: 'Austin Peik', initials: 'A', color: colors.accent },
    { id: 'dan', name: 'Dan Gunko', initials: 'DG', color: colors.cool },
    { id: 'jake', name: 'Jake Bangert', initials: 'JB', color: '#22c55e' },
    { id: 'kurtis', name: 'Kurtis Foster', initials: 'KF', color: colors.accentSoft },
    { id: 'mike', name: 'Mike Gunko', initials: 'MG', color: colors.accent },
    { id: 'unknown', name: 'Unknown', initials: 'U', color: '#f472b6' },
  ];

  const moods = [
    { id: 'any', label: 'Any Mood', subtitle: 'Show me everything', Icon: Icons.AnyMood },
    { id: 'fun', label: 'Fun', subtitle: 'Light & entertaining', Icon: Icons.Fun },
    { id: 'intense', label: 'Intense', subtitle: 'Edge of your seat', Icon: Icons.Intense },
    { id: 'emotional', label: 'Emotional', subtitle: 'Feel all the feels', Icon: Icons.Emotional },
    { id: 'mindless', label: 'Mindless', subtitle: 'Turn brain off', Icon: Icons.Mindless },
    { id: 'acclaimed', label: 'Acclaimed', subtitle: "Critics' favorites", Icon: Icons.Acclaimed },
  ];

  const runtimes = [
    { id: 'any', label: 'Any' },
    { id: '90', label: '90m' },
    { id: '120', label: '120m' },
    { id: '150', label: '150m' },
  ];

  const ratings = [
    { id: 'any', label: 'Any' },
    { id: 'g', label: 'G' },
    { id: 'pg', label: 'PG' },
    { id: 'pg13', label: 'PG-13' },
    { id: 'r', label: 'R' },
  ];

  const filterLevels = ['any', 'none', 'mild', 'mod', 'severe'];
  const filterLabels = ['Any', 'None', 'Mild', 'Mod', 'Severe'];

  const contentFilterCategories = [
    { id: 'violence', label: 'Violence', Icon: Icons.Violence },
    { id: 'sexNudity', label: 'Sex/Nudity', Icon: Icons.Heart },
    { id: 'language', label: 'Language', Icon: Icons.Language },
    { id: 'substances', label: 'Substances', Icon: Icons.Substance },
    { id: 'frightening', label: 'Frightening Scenes', Icon: Icons.Frightening },
  ];

  const toggleMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const selectAllMembers = () => setSelectedMembers(members.map(m => m.id));

  const scrollbarStyles = `
    .elegant-scroll::-webkit-scrollbar { width: 4px; }
    .elegant-scroll::-webkit-scrollbar-track { background: transparent; }
    .elegant-scroll::-webkit-scrollbar-thumb { background: rgba(248, 246, 241, 0.1); border-radius: 2px; }
  `;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#050506',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Phone frame */}
        <div style={{
          width: '375px',
          height: '812px',
          backgroundColor: colors.bg,
          borderRadius: '40px',
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid ${colors.cream}10`,
          boxShadow: '0 50px 100px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Status bar */}
          <div style={{
            padding: '14px 24px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: 600,
            color: colors.cream,
            flexShrink: 0
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

          {/* Header */}
          <div style={{
            padding: '8px 20px 16px',
            flexShrink: 0
          }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: `${colors.cream}60`, marginBottom: '14px', padding: 0,
              fontSize: '14px'
            }}>
              <Icons.Back color={`${colors.cream}60`} size={18} />
              Back to Feed
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `linear-gradient(135deg, ${colors.accent}25, ${colors.accentSoft}15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icons.Sparkle color={colors.accent} size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 600, color: colors.cream, marginBottom: '2px' }}>Tonight's Pick</h1>
                <p style={{ fontSize: '13px', color: `${colors.cream}50` }}>Find the perfect film for your group</p>
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <div style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${colors.cream}06`,
            flexShrink: 0
          }}>
            {[
              { num: 1, label: 'Who' },
              { num: 2, label: 'Mood' },
              { num: 3, label: 'Results' },
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => s.num < step && setStep(s.num)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'none', border: 'none',
                    cursor: s.num <= step ? 'pointer' : 'default',
                    padding: 0
                  }}
                >
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: step >= s.num ? colors.accent : colors.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 600,
                    color: step >= s.num ? colors.bg : `${colors.cream}40`
                  }}>{s.num}</div>
                  <span style={{
                    fontSize: '13px', fontWeight: step === s.num ? 600 : 400,
                    color: step >= s.num ? colors.cream : `${colors.cream}40`
                  }}>{s.label}</span>
                </button>
                {i < 2 && (
                  <div style={{
                    flex: 1, height: '1px',
                    backgroundColor: step > s.num ? colors.accent : `${colors.cream}10`,
                    margin: '0 10px'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Content */}
          <div className="elegant-scroll" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px'
          }}>
            {/* Step 1: Who */}
            {step === 1 && (
              <>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '14px'
                }}>
                  <p style={{ fontSize: '14px', color: colors.cream }}>Who's watching tonight?</p>
                  <button
                    onClick={selectAllMembers}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 500, color: colors.accent
                    }}
                  >Select All</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 14px',
                        backgroundColor: selectedMembers.includes(member.id) ? `${colors.accent}10` : colors.surface,
                        border: `1px solid ${selectedMembers.includes(member.id) ? colors.accent + '30' : colors.cream + '06'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: colors.cream,
                        width: '100%',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        backgroundColor: member.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 600, color: colors.bg
                      }}>{member.initials}</div>
                      
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 500 }}>{member.name}</p>
                        {selectedMembers.includes(member.id) && (
                          <p style={{ fontSize: '12px', color: colors.accent, marginTop: '1px' }}>Selected</p>
                        )}
                      </div>

                      <div style={{
                        width: '22px', height: '22px', borderRadius: '6px',
                        backgroundColor: selectedMembers.includes(member.id) ? colors.accent : 'transparent',
                        border: `2px solid ${selectedMembers.includes(member.id) ? colors.accent : colors.cream + '20'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {selectedMembers.includes(member.id) && <Icons.Check color={colors.bg} size={12} />}
                      </div>
                    </button>
                  ))}
                </div>

                <p style={{
                  textAlign: 'center', fontSize: '13px',
                  color: `${colors.cream}50`, marginTop: '16px'
                }}>
                  {selectedMembers.length} of {members.length} selected
                </p>
              </>
            )}

            {/* Step 2: Mood */}
            {step === 2 && (
              <>
                <p style={{ fontSize: '14px', color: colors.cream, marginBottom: '12px' }}>
                  What are you in the mood for?
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  marginBottom: '24px'
                }}>
                  {moods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMood(m.id)}
                      style={{
                        padding: '14px 12px',
                        backgroundColor: selectedMood === m.id ? `${colors.accent}10` : colors.surface,
                        border: `1px solid ${selectedMood === m.id ? colors.accent + '35' : colors.cream + '06'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: colors.cream,
                        textAlign: 'left'
                      }}
                    >
                      <m.Icon color={selectedMood === m.id ? colors.accent : `${colors.cream}45`} size={22} />
                      <p style={{ fontSize: '14px', fontWeight: 500, marginTop: '8px', marginBottom: '2px' }}>{m.label}</p>
                      <p style={{ fontSize: '11px', color: `${colors.cream}40` }}>{m.subtitle}</p>
                    </button>
                  ))}
                </div>

                {/* Runtime */}
                <p style={{
                  fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: `${colors.cream}40`, marginBottom: '8px'
                }}>Maximum runtime <span style={{ opacity: 0.5 }}>(optional)</span></p>
                
                <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
                  {runtimes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setMaxRuntime(r.id)}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: maxRuntime === r.id ? `${colors.accent}12` : colors.surface,
                        border: `1px solid ${maxRuntime === r.id ? colors.accent + '35' : colors.cream + '08'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: maxRuntime === r.id ? colors.cream : `${colors.cream}55`,
                        fontSize: '13px',
                        fontWeight: maxRuntime === r.id ? 500 : 400
                      }}
                    >{r.label}</button>
                  ))}
                </div>

                {/* Content Rating */}
                <p style={{
                  fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: `${colors.cream}40`, marginBottom: '8px'
                }}>Content rating <span style={{ opacity: 0.5 }}>(optional)</span></p>
                
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {ratings.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setContentRating(r.id)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: contentRating === r.id ? `${colors.accent}12` : colors.surface,
                        border: `1px solid ${contentRating === r.id ? colors.accent + '35' : colors.cream + '08'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: contentRating === r.id ? colors.cream : `${colors.cream}55`,
                        fontSize: '13px',
                        fontWeight: contentRating === r.id ? 500 : 400
                      }}
                    >{r.label}</button>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: `${colors.cream}30`, marginBottom: '18px', lineHeight: 1.4 }}>
                  Selecting a rating will include that rating and below (e.g., PG-13 includes G, PG, and PG-13)
                </p>

                {/* Content Filters */}
                <button
                  onClick={() => setShowContentFilters(!showContentFilters)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '14px',
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.cream}08`,
                    borderRadius: showContentFilters ? '12px 12px 0 0' : '12px',
                    cursor: 'pointer',
                    color: colors.cream
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icons.Filter color={`${colors.cream}45`} size={18} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Content Filters</span>
                  </div>
                  {showContentFilters
                    ? <Icons.ChevronUp color={`${colors.cream}40`} size={18} />
                    : <Icons.ChevronDown color={`${colors.cream}40`} size={18} />
                  }
                </button>

                {showContentFilters && (
                  <div style={{
                    padding: '14px',
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.cream}08`,
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px'
                  }}>
                    <p style={{ fontSize: '12px', color: `${colors.cream}45`, marginBottom: '14px', lineHeight: 1.4 }}>
                      Set maximum levels for each category. Movies exceeding these levels will be filtered out.
                    </p>

                    {/* Presets */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <button style={{
                        padding: '6px 12px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${colors.cream}15`,
                        borderRadius: '100px',
                        cursor: 'pointer',
                        color: `${colors.cream}55`,
                        fontSize: '12px'
                      }}>Clear All</button>
                      <button style={{
                        padding: '6px 12px',
                        backgroundColor: '#22c55e20',
                        border: `1px solid #22c55e40`,
                        borderRadius: '100px',
                        cursor: 'pointer',
                        color: '#22c55e',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>Kid-Friendly</button>
                      <button style={{
                        padding: '6px 12px',
                        backgroundColor: `${colors.cool}20`,
                        border: `1px solid ${colors.cool}40`,
                        borderRadius: '100px',
                        cursor: 'pointer',
                        color: colors.cool,
                        fontSize: '12px',
                        fontWeight: 500
                      }}>Family Night</button>
                    </div>

                    {contentFilterCategories.map((cat) => (
                      <div key={cat.id} style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <cat.Icon color={`${colors.cream}45`} size={16} />
                          <span style={{ fontSize: '13px', color: `${colors.cream}65` }}>{cat.label}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {filterLevels.map((level, i) => (
                            <button
                              key={level}
                              onClick={() => setContentFilters(prev => ({ ...prev, [cat.id]: level }))}
                              style={{
                                flex: 1,
                                padding: '6px 2px',
                                backgroundColor: contentFilters[cat.id] === level ? `${colors.accent}12` : colors.surfaceLight,
                                border: `1px solid ${contentFilters[cat.id] === level ? colors.accent + '35' : 'transparent'}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: contentFilters[cat.id] === level ? colors.cream : `${colors.cream}45`,
                                fontSize: '11px',
                                fontWeight: contentFilters[cat.id] === level ? 500 : 400
                              }}
                            >{filterLabels[i]}</button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <p style={{ fontSize: '11px', color: `${colors.cream}30`, marginTop: '12px', lineHeight: 1.4 }}>
                      Note: Movies without parental guide data in our database will still be shown.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 20px 12px',
            borderTop: `1px solid ${colors.cream}08`,
            flexShrink: 0
          }}>
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={selectedMembers.length === 0}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: selectedMembers.length > 0 ? colors.accent : colors.surfaceLight,
                  border: 'none',
                  borderRadius: '12px',
                  color: selectedMembers.length > 0 ? colors.bg : `${colors.cream}40`,
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: selectedMembers.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >Continue</button>
            )}

            {step === 2 && (
              <>
                <button
                  onClick={() => setStep(3)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: colors.accent,
                    border: 'none',
                    borderRadius: '12px',
                    color: colors.bg,
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '10px'
                  }}
                >
                  <Icons.Sparkle color={colors.bg} size={18} />
                  Get Recommendations
                </button>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: `${colors.cream}55`,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Icons.Back color={`${colors.cream}45`} size={14} />
                  Back
                </button>
              </>
            )}
          </div>

          {/* Bottom nav */}
          <div style={{
            padding: '10px 20px 28px',
            backgroundColor: colors.surface,
            borderTop: `1px solid ${colors.cream}08`,
            display: 'flex',
            justifyContent: 'space-around',
            flexShrink: 0
          }}>
            {[
              { icon: Icons.Home, label: 'Home', active: false },
              { icon: Icons.Search, label: 'Search', active: false },
              { icon: Icons.Collective, label: 'Collectives', active: true },
              { icon: Icons.Bell, label: 'Alerts', active: false },
              { icon: Icons.Profile, label: 'Profile', active: false },
            ].map((item) => (
              <button key={item.label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer'
              }}>
                <item.icon color={item.active ? colors.accent : `${colors.cream}40`} size={22} />
                <span style={{ fontSize: '10px', color: item.active ? colors.accent : `${colors.cream}40` }}>{item.label}</span>
              </button>
            ))}
          </div>

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

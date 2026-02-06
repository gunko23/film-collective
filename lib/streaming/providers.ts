/**
 * US streaming providers with TMDB watch provider IDs
 * These IDs are used for TMDB discover + watch provider queries
 */

export type StreamingProvider = {
  id: number            // TMDB watch_provider_id
  name: string          // Display name
  shortName: string     // Short label for compact UI
  logoPath: string      // TMDB logo path (use getImageUrl to build full URL)
}

// Major US streaming services — ordered by popularity
// Logo paths sourced from TMDB /watch/providers/movie endpoint
export const US_STREAMING_PROVIDERS: StreamingProvider[] = [
  { id: 8,    name: "Netflix",             shortName: "Netflix",    logoPath: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" },
  { id: 337,  name: "Disney Plus",         shortName: "Disney+",    logoPath: "/97yvRBw1GzX7fXprcF80er19ot.jpg" },
  { id: 1899, name: "Max",                 shortName: "Max",        logoPath: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg" },
  { id: 9,    name: "Amazon Prime Video",  shortName: "Prime",      logoPath: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg" },
  { id: 350,  name: "Apple TV Plus",       shortName: "Apple TV+",  logoPath: "/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg" },
  { id: 15,   name: "Hulu",                shortName: "Hulu",       logoPath: "/bxBlRPEPpMVDc4jMhSrTf2339DW.jpg" },
  { id: 386,  name: "Peacock",             shortName: "Peacock",    logoPath: "/2aGrp1xw3qhwCYvNGAJZPdjfeeX.jpg" },
  { id: 2616, name: "Paramount Plus",      shortName: "Paramount+", logoPath: "/5wym1C0jAvJeGirPdgVpcW0CCuy.jpg" },
  { id: 283,  name: "Crunchyroll",         shortName: "Crunchyroll",logoPath: "/fzN5Jok5Ig1eJ7gyNGoMhnLSCfh.jpg" },
]

// Subscription-based services only (same list — all are subscription)
export const US_SUBSCRIPTION_PROVIDERS: StreamingProvider[] = US_STREAMING_PROVIDERS

export const PROVIDER_MAP = new Map(US_STREAMING_PROVIDERS.map(p => [p.id, p]))

export function getDiscussionChannelName(collectiveId: string) {
  return `collective:${collectiveId}:discussion`
}

export function getFeedChannelName(collectiveId: string, ratingId: string) {
  return `collective:${collectiveId}:feed:${ratingId}`
}

export function getMovieChannelName(collectiveId: string, tmdbId: string | number, mediaType: string) {
  return `collective:${collectiveId}:movie:${tmdbId}:${mediaType}`
}

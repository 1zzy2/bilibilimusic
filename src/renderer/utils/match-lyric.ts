const normalize = (value: string) => (value ?? "").normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
export function lyricQuery(item: {title?: string; artist?: string}) {
    return (item.title ?? "").replace(/^\s*\d+[.、\s]+/, "").replace(/\.(mp3|flac|wav|m4a)$/i, "").trim();
}
export function matchesLyric(song: {title?: string; artist?: string}, candidate: {title?: string; artist?: string}) {
    const title = lyricQuery(song);
    const parts = title.split(/\s*[-–—]\s*/);
    const candidateTitle = normalize(candidate.title);
    const candidateArtist = normalize(candidate.artist);
    if (!candidateTitle || !candidateArtist) return false;
    return (normalize(title) === candidateTitle && !!normalize(song.artist) && normalize(song.artist) === candidateArtist)
        || (parts.length === 2 && ((normalize(parts[0]) === candidateTitle && normalize(parts[1]) === candidateArtist)
            || (normalize(parts[1]) === candidateTitle && normalize(parts[0]) === candidateArtist)));
}

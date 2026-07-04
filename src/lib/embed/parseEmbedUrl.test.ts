import { describe, it, expect } from 'vitest';
import { parseEmbedUrl } from './parseEmbedUrl';

describe('parseEmbedUrl', () => {
  it('YouTube watch → nocookie embed', () => {
    expect(parseEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      platform: 'youtube', embedSrc: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', tur: 'video', oran: '16/9',
    });
  });
  it('youtu.be kısa link', () => {
    expect(parseEmbedUrl('https://youtu.be/dQw4w9WgXcQ')?.embedSrc).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });
  it('youtube /embed formu', () => {
    expect(parseEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')?.platform).toBe('youtube');
  });
  it('Vimeo → player embed', () => {
    expect(parseEmbedUrl('https://vimeo.com/123456789')).toEqual({
      platform: 'vimeo', embedSrc: 'https://player.vimeo.com/video/123456789', tur: 'video', oran: '16/9',
    });
  });
  it('SoundCloud → w.soundcloud player, ses, oran null', () => {
    const r = parseEmbedUrl('https://soundcloud.com/artist/track-name');
    expect(r?.platform).toBe('soundcloud');
    expect(r?.tur).toBe('ses');
    expect(r?.oran).toBeNull();
    expect(r?.embedSrc).toContain('https://w.soundcloud.com/player/?url=');
    expect(r?.embedSrc).toContain(encodeURIComponent('https://soundcloud.com/artist/track-name'));
  });
  it('Spotify track → embed', () => {
    expect(parseEmbedUrl('https://open.spotify.com/track/abc123XYZ')).toEqual({
      platform: 'spotify', embedSrc: 'https://open.spotify.com/embed/track/abc123XYZ', tur: 'ses', oran: null,
    });
  });
  it('Spotify episode', () => {
    expect(parseEmbedUrl('https://open.spotify.com/episode/xyz789')?.embedSrc).toBe('https://open.spotify.com/embed/episode/xyz789');
  });
  it('tanınmayan host → null', () => {
    expect(parseEmbedUrl('https://example.com/video/1')).toBeNull();
  });
  it('javascript: şeması → null', () => {
    expect(parseEmbedUrl('javascript:alert(1)')).toBeNull();
  });
  it('geçersiz URL → null', () => {
    expect(parseEmbedUrl('not a url')).toBeNull();
  });
  it('boş → null', () => {
    expect(parseEmbedUrl('')).toBeNull();
  });
});

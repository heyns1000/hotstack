import { Hono } from 'hono';
import type { Env } from '../types';

const spotify = new Hono<{ Bindings: Env }>();

// Get user's top tracks
spotify.get('/top-tracks', async (c) => {
  try {
    const token = c.env.SPOTIFY_ACCESS_TOKEN;
    if (!token) {
      return c.json({ error: 'SPOTIFY_ACCESS_TOKEN not configured' }, 500);
    }

    const response = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return c.json({ 
        error: 'Spotify API error',
        details: errorData 
      }, 500);
    }

    const data = await response.json();
    return c.json(data as any);
  } catch (error) {
    console.error('Spotify API error:', error);
    return c.json({ 
      error: 'Failed to fetch top tracks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get user profile
spotify.get('/me', async (c) => {
  try {
    const token = c.env.SPOTIFY_ACCESS_TOKEN;
    if (!token) {
      return c.json({ error: 'SPOTIFY_ACCESS_TOKEN not configured' }, 500);
    }

    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      return c.json({ 
        error: 'Spotify API error',
        details: errorData 
      }, 500);
    }

    const data = await response.json();
    return c.json(data as any);
  } catch (error) {
    console.error('Spotify API error:', error);
    return c.json({ 
      error: 'Failed to fetch user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Create playlist
spotify.post('/playlists', async (c) => {
  try {
    const { userId, name, description, isPublic } = await c.req.json();
    const token = c.env.SPOTIFY_ACCESS_TOKEN;

    if (!token) {
      return c.json({ error: 'SPOTIFY_ACCESS_TOKEN not configured' }, 500);
    }

    const response = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          public: isPublic || false
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return c.json({ 
        error: 'Spotify API error',
        details: errorData 
      }, 500);
    }

    const data = await response.json();
    return c.json(data as any);
  } catch (error) {
    console.error('Spotify API error:', error);
    return c.json({ 
      error: 'Failed to create playlist',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Add tracks to playlist
spotify.post('/playlists/:playlistId/tracks', async (c) => {
  try {
    const playlistId = c.req.param('playlistId');
    const { uris } = await c.req.json();
    const token = c.env.SPOTIFY_ACCESS_TOKEN;

    if (!token) {
      return c.json({ error: 'SPOTIFY_ACCESS_TOKEN not configured' }, 500);
    }

    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return c.json({ 
        error: 'Spotify API error',
        details: errorData 
      }, 500);
    }

    const data = await response.json();
    return c.json(data as any);
  } catch (error) {
    console.error('Spotify API error:', error);
    return c.json({ 
      error: 'Failed to add tracks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default spotify;

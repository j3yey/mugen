// server.ts
import { db } from '$lib/server/db';
import { tblUsers } from '$lib/server/db/schema';
import { json, type RequestHandler } from '@sveltejs/kit';
import { sha512 } from 'js-sha512';
import fetch from 'node-fetch';
import { eq } from 'drizzle-orm';
import CryptoJS from "crypto-js";


const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

interface Anime {
    mal_id: number;
    title: string;
    images: {
        jpg: {
            image_url: string;
            large_image_url?: string;  // Optional large image URL
        };
    };
}

const getAnimeImages = (anime: Anime) => {
    return anime.images.jpg.large_image_url || anime.images.jpg.image_url;
};

const fetchGenres = async () => {
    const response = await fetch(`${JIKAN_BASE_URL}/genres/anime`);
    if (!response.ok) {
        throw new Error(`Failed to fetch genres: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data; // Jikan API returns genres in `data`
};

// Define the handler for various query types
export const GET: RequestHandler = async ({ url }) => {
    const searchQuery = url.searchParams.get('search'); // Get search query
    const recommendationsForId = url.searchParams.get('recommendations'); // Get recommendations
    const isTopRanked = url.searchParams.get('top'); // Check if top-ranked anime is requested
    const genres = url.searchParams.get('genres'); // Get genres filter if provided

    // Fetch anime by search query and genres
    if (searchQuery || genres) {
        try {
            const params = new URLSearchParams();

            if (searchQuery) params.append('q', searchQuery);
            if (genres) params.append('genres', genres); // Jikan API supports filtering by genres (comma-separated)
            params.append('limit', '10'); // Limit the results to 10

            const response = await fetch(`${JIKAN_BASE_URL}/anime?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch anime: ${response.statusText}`);
            }

            const data = await response.json();
            return json({ searchResults: data.data });
        } catch (error) {
            return json({ error: (error as Error).message }, { status: 500 });
        }
    }

    // Fetch recommendations for a specific anime
    if (recommendationsForId) {
        try {
            const response = await fetch(`${JIKAN_BASE_URL}/anime/${recommendationsForId}/recommendations`);
            if (!response.ok) {
                throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
            }

            const data = await response.json();
            return json({ recommendations: data.data });
        } catch (error) {
            return json({ error: (error as Error).message }, { status: 500 });
        }
    }

    // Fetch top-ranked anime
    if (isTopRanked) {
        try {
            const response = await fetch(`${JIKAN_BASE_URL}/top/anime`);
            if (!response.ok) {
                throw new Error(`Failed to fetch top-ranked anime: ${response.statusText}`);
            }

            const data = await response.json();
            return json({ topRankedAnime: data.data });
        } catch (error) {
            return json({ error: (error as Error).message }, { status: 500 });
        }
    }

    // Fetch genres
    if (url.searchParams.has('genres') && !searchQuery && !genres) {
        try {
            const genresData = await fetchGenres();
            return json({ genres: genresData });
        } catch (error) {
            return json({ error: (error as Error).message }, { status: 500 });
        }
    }

    if (recommendationsForId) {
        try {
            const response = await fetch(`${JIKAN_BASE_URL}/anime/${recommendationsForId}/recommendations`);
            if (!response.ok) {
                throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
            }

            const data: JikanRecommendationsResponse = await response.json();
            return json({ recommendations: data.data });
        } catch (error) {
            return json({ error: (error as Error).message }, { status: 500 });
        }
    }

    if (isTopRanked) {
        try {
            const response = await fetch(`${JIKAN_BASE_URL}/top/anime`);
            if (!response.ok) {
                throw new Error(`Failed to fetch top-ranked anime: ${response.statusText}`);
            }

            const data: JikanSearchResponse = await response.json();
            return json({ topRankedAnime: data.data });
        } catch (error) {
            return json({ error: (error as Error).message }, { status: 500 });
        }
    }

    return json({ message: "No valid query provided." }, { status: 400 });
};


// POST: Login
export const POST: RequestHandler = async ({ request }) => {
    const { username, password } = await request.json();

    if (!username || !password) {
        return json({ message: "Missing Values!" }, { status: 400 });
    }

    const hashedPassword = sha512(password);
    const users = await db.select().from(tblUsers).where(eq(tblUsers.username, username));
    
    if (users.length === 0 || users[0].password !== hashedPassword) {
        return json({ message: "Invalid username or password!" }, { status: 401 });
    }

    return json({ success: true, message: "Login successful!" });
};


// PUT: Register
export const PUT: RequestHandler = async ({ request }) => {
    const { body, key } = await request.json();
    const decrypted = CryptoJS.AES.decrypt(body, key).toString(CryptoJS.enc.Utf8);
    let requestBody: any = JSON.parse(decrypted);

    if (!requestBody.username || !requestBody.password) {
        return json({ message: "Missing Values!" }, { status: 400 });
    }

    const existingUsers = await db.select().from(tblUsers).where(eq(tblUsers.username, requestBody.username));

    if (existingUsers.length > 0) {
        return json({ message: "Username already exists!" }, { status: 409 });
    }

    const query = await db.insert(tblUsers).values({ 
        username: requestBody.username, 
        password: sha512(requestBody.password) 
    });

    return json({ success: query.changes > 0, message: "Registration successful!" });
};
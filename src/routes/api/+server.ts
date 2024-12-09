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
            large_image_url?: string; // Optional large image URL
        };
    };
}

interface Genre {
    mal_id: number;
    name: string;
}

const getAnimeImages = (anime: Anime) => {
    return anime.images.jpg.large_image_url || anime.images.jpg.image_url;
};

const fetchGenres = async (): Promise<Genre[]> => {
    const response = await fetch(`${JIKAN_BASE_URL}/genres/anime`);
    if (!response.ok) {
        throw new Error(`Failed to fetch genres: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data; // Jikan API returns genres in `data`
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, options = {}, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            
            if (response.ok) {
                return response;
            }
            
            if (response.status === 429) {
                // Exponential backoff: 2^attempt * 1000 ms
                const waitTime = Math.pow(2, attempt) * 1000;
                console.log(`Rate limited. Waiting ${waitTime}ms before retry.`);
                await delay(waitTime);
                continue;
            }
            
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
        }
    }
}

// Define the handler for various query types
export const GET: RequestHandler = async ({ url }) => {
    const searchQuery = url.searchParams.get('search');
    const recommendationsForId = url.searchParams.get('recommendations');
    const isTopRanked = url.searchParams.get('top');
    const genresFilter = url.searchParams.get('genres');
    const fetchGenresOnly = url.searchParams.get('fetchGenres'); // To fetch genres only

    try {
        // Fetch genres explicitly if fetchGenresOnly parameter is present
        if (fetchGenresOnly) {
            const genresData = await fetchGenres();
            return json({ genres: genresData });
        }

        // Fetch anime by search query and genres
        if (searchQuery || genresFilter) {
            let allResults: any[] = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const params = new URLSearchParams();
                if (searchQuery) params.append('q', searchQuery);
                if (genresFilter) params.append('genres', genresFilter);
                params.append('page', page.toString());
                params.append('limit', '25');  // Max per page

                const response = await fetch(`${JIKAN_BASE_URL}/anime?${params.toString()}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch anime: ${response.statusText}`);
                }

                const data = await response.json();
                
                // If no more results, break the loop
                if (data.data.length === 0) {
                    hasMore = false;
                    break;
                }

                // Add current page results to all results
                allResults = [...allResults, ...data.data];

                // Optional: limit total results to prevent overwhelming the client
                if (allResults.length >= 50) {
                    break;
                }

                page++;
            }

            return json({ searchResults: allResults });
        }
        // Fetch recommendations for a specific anime
        if (recommendationsForId) {
            const response = await fetch(`${JIKAN_BASE_URL}/anime/${recommendationsForId}/recommendations`);
            if (!response.ok) {
                throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
            }

            const data = await response.json();
            return json({ recommendations: data.data });
        }

        // Fetch top-ranked anime
       if (isTopRanked) {
            let allTopRankedAnime: any[] = [];
            let page = 1;
            let hasMore = true;

            while (hasMore && page <= 4) {  // Limit to 4 pages to prevent rate limiting
                const response = await fetch(`${JIKAN_BASE_URL}/top/anime?page=${page}&limit=25`);
                
                if (!response.ok) {
                    // If rat limited, wait and retry
                    if (response.status === 429) {
                        await new Promise(resolve => setTimeout(resolve, 2000));  // 2 second delay
                        continue;
                    }
                    throw new Error(`Failed to fetch top-ranked anime: ${response.statusText}`);
                }

                const data = await response.json();
                
                // If no more results, break the loop
                if (data.data.length === 0) {
                    hasMore = false;
                    break;
                }

                // Add current page results to all results
                allTopRankedAnime = [...allTopRankedAnime, ...data.data];

                // Optional: limit total results
                if (allTopRankedAnime.length >= 200) {
                    break;
                }

                page++;
            }

            return json({ topRankedAnime: allTopRankedAnime });
        }
    } catch (error) {
        console.error('Error in top ranked anime fetch:', error);
        return json({ error: (error as Error).message }, { status: 500 });
    }
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

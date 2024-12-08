// server.ts
import { db } from '$lib/server/db';
import { tblUsers } from '$lib/server/db/schema';
import { json, type RequestHandler } from '@sveltejs/kit';
import { sha512 } from 'js-sha512';
import fetch from 'node-fetch';
import { eq } from 'drizzle-orm';
import CryptoJS from "crypto-js";


const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// Define types for the Jikan API response
interface Anime {
    mal_id: number;
    title: string;
    images: {
        jpg: {
            image_url: string;
        };
    };
}

interface JikanSearchResponse {
    data: Anime[];
}

interface JikanRecommendationsResponse {
    data: {
        entry: Anime;
    }[];
}

export const GET: RequestHandler = async ({ url }) => {
    const searchQuery = url.searchParams.get('search');
    const recommendationsForId = url.searchParams.get('recommendations');

    if (searchQuery) {
        try {
            const response = await fetch(`${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(searchQuery)}&limit=10`);
            if (!response.ok) {
                throw new Error(`Failed to fetch search results: ${response.statusText}`);
            }

            const data: JikanSearchResponse = await response.json();
            return json({ searchResults: data.data });
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

    // Default response if no search or recommendations are requested
    return json({ message: "No search query or recommendations provided." }, { status: 400 });
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
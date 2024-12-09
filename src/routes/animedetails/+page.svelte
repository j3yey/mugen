<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { slide, fade } from 'svelte/transition';

    // Extend the Anime interface to include more details
    interface Anime {
        mal_id: number;
        title: string;
        title_japanese?: string;
        type?: string;
        episodes?: number;
        status?: string;
        aired?: {
            from?: string;
            to?: string;
        };
        duration?: string;
        rating?: string;
        score?: number;
        rank?: number;
        popularity?: number;
        synopsis?: string;
        background?: string;
        genres?: Array<{
            mal_id: number;
            name: string;
        }>;
        studios?: Array<{
            mal_id: number;
            name: string;
        }>;
        images: {
            jpg: {
                image_url: string;
                large_image_url?: string;
            };
        };
    }

    let animeDetails: Anime | null = null;
    let loading = true;
    let error: string | null = null;

    const fetchAnimeDetails = async (animeId: number) => {
        try {
            loading = true;
            const res = await fetch(`/api?animeDetails=${animeId}`);
            if (!res.ok) throw new Error(await res.text());

            const data: { animeDetails: Anime } = await res.json();
            animeDetails = data.animeDetails;
        } catch (err) {
            console.error('Error fetching anime details:', err);
            error = err instanceof Error ? err.message : 'An unknown error occurred';
        } finally {
            loading = false;
        }
    };

    onMount(() => {
        // Extract anime ID from the URL query parameters
        const animeId = $page.url.searchParams.get('id');
        if (animeId) {
            fetchAnimeDetails(parseInt(animeId, 10));
        }
    });

    const logout = async () => {
        try {
            const response = await fetch('/api', { method: 'DELETE' });
            if (response.ok) {
                // Use SvelteKit's client-side routing for navigation
                goto('/');
            } else {
                const errorData = await response.json();
                console.error('Logout failed:', errorData.message);
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };
</script>

<nav class="top-navbar" transition:slide>
    <div class="navbar-left">
        <h1 class="brand-name">Mugen</h1>
    </div>
    <div class="navbar-right">
        <a href="/home" class="nav-link">Home</a>
        <button class="logout-button" on:click={logout}>Logout</button>
    </div>
</nav>

<div class="app-container">
    <div class="anime-details-container">
        {#if loading}
            <div class="loading-spinner">Loading anime details...</div>
        {:else if error}
            <div class="error-message">{error}</div>
        {:else if animeDetails}
            <div class="details-content" transition:fade>
                <div class="anime-header">
                    <img 
                        src={animeDetails.images.jpg.large_image_url || animeDetails.images.jpg.image_url} 
                        alt={animeDetails.title} 
                        class="anime-poster"
                        transition:fade
                    />
                    <div class="anime-title-section">
                        <h1>{animeDetails.title}</h1>
                        {#if animeDetails.title_japanese}
                            <h2 class="japanese-title">{animeDetails.title_japanese}</h2>
                        {/if}
                        
                        <div class="anime-meta">
                            {#if animeDetails.type}
                                <span class="meta-tag">{animeDetails.type}</span>
                            {/if}
                            {#if animeDetails.episodes}
                                <span class="meta-tag">{animeDetails.episodes} Episodes</span>
                            {/if}
                            {#if animeDetails.status}
                                <span class="meta-tag">{animeDetails.status}</span>
                            {/if}
                        </div>

                        {#if animeDetails.score}
                            <div class="anime-score">
                                Score: {animeDetails.score}/10
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="anime-additional-info">
                    {#if animeDetails.genres && animeDetails.genres.length > 0}
                        <div class="info-section">
                            <h3>Genres</h3>
                            <div class="tag-list">
                                {#each animeDetails.genres as genre}
                                    <span class="tag">{genre.name}</span>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    {#if animeDetails.studios && animeDetails.studios.length > 0}
                        <div class="info-section">
                            <h3>Studios</h3>
                            <div class="tag-list">
                                {#each animeDetails.studios as studio}
                                    <span class="tag">{studio.name}</span>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    {#if animeDetails.synopsis}
                        <div class="info-section">
                            <h3>Synopsis</h3>
                            <p>{animeDetails.synopsis}</p>
                        </div>
                    {/if}

                    {#if animeDetails.background}
                        <div class="info-section">
                            <h3>Background</h3>
                            <p>{animeDetails.background}</p>
                        </div>
                    {/if}

                    <div class="additional-stats">
                        {#if animeDetails.rank}
                            <div class="stat">
                                <strong>Rank</strong>
                                <span>#{animeDetails.rank}</span>
                            </div>
                        {/if}
                        {#if animeDetails.popularity}
                            <div class="stat">
                                <strong>Popularity</strong>
                                <span>#{animeDetails.popularity}</span>
                            </div>
                        {/if}
                        {#if animeDetails.aired?.from}
                            <div class="stat">
                                <strong>Aired</strong>
                                <span>
                                    {new Date(animeDetails.aired.from).toLocaleDateString()} 
                                    {#if animeDetails.aired.to}
                                        - {new Date(animeDetails.aired.to).toLocaleDateString()}
                                    {/if}
                                </span>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style lang="postcss">
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

    :global(body) {
        margin: 0;
        padding: 0;
        font-family: 'Inter', sans-serif;
        background-color: #121212;
        color: #e0e0e0;
    }

    /* Scrollbar Styling */
    ::-webkit-scrollbar {
        width: 8px;
    }

    ::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        transition: background-color 0.3s ease;
    }

    ::-webkit-scrollbar-thumb:hover {
        background-color: rgba(255, 255, 255, 0.4);
    }

    /* Navigation Styles */
    .top-navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background-color: rgba(30, 30, 30, 0.9);
        backdrop-filter: blur(10px);
        position: sticky;
        top: 0;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }

    .brand-name {
        font-size: 1.5em;
        font-weight: 700;
        color: #00e5ff;
        margin: 0;
    }

    .navbar-right {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .nav-link {
        text-decoration: none;
        color: #e0e0e0;
        font-weight: 600;
        padding: 8px 15px;
        border-radius: 6px;
        transition: background-color 0.3s ease;
    }

    .nav-link:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .logout-button {
        background-color: #ff4757;
        border: none;
        color: white;
        font-weight: 600;
        padding: 8px 15px;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .logout-button:hover {
        background-color: #ff6b81;
    }

    /* App Container Styles */
    .app-container {
        display: flex;
        justify-content: center;
        padding: 20px;
        min-height: calc(100vh - 70px);
    }

    .anime-details-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 1200px;
    }

    .details-content {
        display: flex;
        flex-direction: column;
        background-color: rgba(40, 40, 40, 0.7);
        border-radius: 12px;
        padding: 30px;
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        width: 100%;
    }

    .anime-header {
        display: flex;
        margin-bottom: 30px;
        gap: 30px;
    }

    .anime-poster {
        width: 300px;
        height: 450px;
        object-fit: cover;
        border-radius: 12px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    }

    .anime-title-section {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .anime-title-section h1 {
        color: #00e5ff;
        margin: 0 0 10px 0;
        font-size: 2.5em;
        font-weight: 700;
    }

    .japanese-title {
        color: rgba(255, 255, 255, 0.7);
        margin: 0 0 15px 0;
        font-size: 1.2em;
        font-weight: 300;
    }

    .anime-meta {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
    }

    .meta-tag {
        background-color: rgba(0, 229, 255, 0.1);
        color: #00e5ff;
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 0.9em;
    }

    .anime-score {
        background-color: rgba(0, 229, 255, 0.1);
        color: #00e5ff;
        padding: 10px;
        border-radius: 6px;
        display: inline-block;
        font-weight: 600;
    }

    .anime-additional-info {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .info-section {
        background-color: rgba(255, 255, 255, 0.05);
        padding: 20px;
        border-radius: 10px;
    }

    .info-section h3 {
        color: #00e5ff;
        margin-bottom: 10px;
        border-bottom: 2px solid rgba(0, 229, 255, 0.3);
        padding-bottom: 10px;
    }

    .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }

    .tag {
        background-color: rgba(0, 229, 255, 0.1);
        color: #00e5ff;
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 0.9em;
    }

    .additional-stats {
        display: flex;
        justify-content: space-between;
        background-color: rgba(255, 255, 255, 0.05);
        padding: 20px;
        border-radius: 10px;
    }

    .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: #e0e0e0;
    }

    .stat strong {
        color: #00e5ff;
        margin-bottom: 5px;
        font-weight: 600;
    }

    .loading-spinner, .error-message {
        color: #00e5ff;
        font-size: 1.5em;
        text-align: center;
    }
</style>
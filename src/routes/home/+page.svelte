<script lang="ts">
import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { goto } from '$app/navigation';
    import { fade, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    interface Genre {
        mal_id: number;
        name: string;
    }

    interface Anime {
        mal_id: number;
        title: string;
        images: {
            jpg: {
                image_url: string;
                large_image_url?: string;
            };
        };
        rank: number;
        score?: number;
        genres?: Genre[];
        unique_key?: number;
    }

    interface Recommendation {
        entry: {
            mal_id: number;
            title: string;
            images: {
                jpg: {
                    image_url: string;
                    large_image_url?: string;
                };
            };
        };
    }

    let searchQuery = '';
    let selectedGenre = '';
    let genres = writable<Genre[]>([]);
    let searchResults = writable<Anime[]>([]);
    let recommendations = writable<Record<number, Recommendation[]>>({});
    let topRankedAnime = writable<Anime[]>([]);
    let selectedAnime = writable<Anime | null>(null);
    let isLoading = writable<boolean>(false);

    const fetchSearchResults = async () => {
        isLoading.set(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('search', searchQuery);
            if (selectedGenre) params.append('genres', selectedGenre);

            const res = await fetch(`/api?${params.toString()}`);
            if (!res.ok) throw new Error(await res.text());

            const data: { searchResults: Anime[] } = await res.json();
            const uniqueSearchResults = data.searchResults.map((anime, index) => ({
                ...anime,
                unique_key: anime.mal_id * 1000 + index
            }));
            searchResults.set(uniqueSearchResults);
        } catch (err) {
            console.error('Error fetching search results:', err);
        } finally {
            isLoading.set(false);
        }
    };

    const fetchGenres = async () => {
        try {
            const res = await fetch('/api?fetchGenres=true');
            if (!res.ok) throw new Error(await res.text());

            const data: { genres: Genre[] } = await res.json();
            genres.set(data.genres);
        } catch (err) {
            console.error('Error fetching genres:', err);
        }
    };

    const fetchRecommendations = async (animeId: number) => {
        // Clear previous recommendations
        recommendations.set({});
        isLoading.set(true);
        try {
            const res = await fetch(`/api?recommendations=${animeId}`);
            if (!res.ok) throw new Error(await res.text());

            const data: { recommendations: Recommendation[] } = await res.json();
            recommendations.update((recMap) => ({
                ...recMap,
                [animeId]: data.recommendations,
            }));
        } catch (err) {
            console.error('Error fetching recommendations:', err);
        } finally {
            isLoading.set(false);
        }
    };


    const fetchTopRankedAnime = async () => {
        isLoading.set(true);
        try {
            const res = await fetch('/api?top=true');
            if (!res.ok) throw new Error(await res.text());

            const data: { topRankedAnime: Anime[] } = await res.json();
            // Add unique keys to prevent duplicate keys
            const uniqueTopRankedAnime = data.topRankedAnime.map((anime, index) => ({
                ...anime,
                unique_key: anime.mal_id * 1000 + index
            }));
            topRankedAnime.set(uniqueTopRankedAnime);
        } catch (err) {
            console.error('Error fetching top-ranked anime:', err);
        } finally {
            isLoading.set(false);
        }
    };

    const navigateToAnimeDetails = (animeId: number) => {
        goto(`/animedetails?id=${animeId}`);
    };

    const selectAnime = (anime: Anime) => {
        selectedAnime.set(anime);
        navigateToAnimeDetails(anime.mal_id);
    };

    const logout = async () => {
        try {
            const response = await fetch('/api', { method: 'DELETE' });
            if (response.ok) {
                goto('/');
            } else {
                const errorData = await response.json();
                console.error('Logout failed:', errorData.message);
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    onMount(() => {
        fetchTopRankedAnime();
        fetchGenres();
    });

    // Enhanced search with debounce
    let searchTimeout: number;
    const debouncedSearch = () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(fetchSearchResults, 500) as unknown as number;
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
    <div class="welcome-container">
        
        <!-- Top Ranked Anime Section -->
        <div class="top-ranked-container">
            <h2 class="section-header">Top Ranked Anime</h2>
            <div class="top-ranked-list">
                {#if $topRankedAnime.length > 0}
                    <div class="anime-grid">
                        {#each $topRankedAnime as anime (anime.unique_key)}
                            <div 
                                class="anime-container"
                                class:selected={$selectedAnime?.mal_id === anime.mal_id}
                                on:click={() => selectAnime(anime)}
                                on:keydown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        selectAnime(anime);
                                    }
                                }}
                                role="button"
                                tabindex="0"
                                transition:fade
                            >
                                <div class="anime-image-wrapper">
                                    <img 
                                        src={anime.images.jpg.large_image_url || anime.images.jpg.image_url} 
                                        alt={anime.title}
                                    />
                                </div>
                                <div class="anime-details">
                                    <strong>{anime.title}</strong>
                                    {#if anime.score}
                                        <span class="anime-score">Score: {anime.score}</span>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="loading-text">Loading top-ranked anime...</p>
                {/if}
            </div>
        </div>
        
        <!-- Search Results Container -->
        <div class="search-results-container">
            <div class="search-bar-wrapper">
                <div class="search-input-container">
                    <i class="search-icon">🔍</i>
                    <input
                        type="text"
                        placeholder="Search for an anime..."
                        bind:value={searchQuery}
                        on:input={debouncedSearch}
                        class="search-input enhanced-input"
                    />
                </div>
            
                <div class="genre-select-container">
                    <select 
                        bind:value={selectedGenre} 
                        on:change={fetchSearchResults}
                        class="genre-select enhanced-select"
                    >
                        <option value="" class="genre-option">All Genres</option>
                        {#each $genres as genre}
                            <option value={genre.mal_id} class="genre-option">{genre.name}</option>
                        {/each}
                    </select>
                </div>
            </div>
            
            <div class="results-list">
                {#if $isLoading}
                    <div class="loading-spinner">Loading...</div>
                {:else if $searchResults.length > 0}
                    <div class="anime-grid">
                        {#each $searchResults as anime (anime.unique_key)}
                            <div 
                                class="anime-container"
                                on:click={() => selectAnime(anime)}
                                on:keydown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        selectAnime(anime);
                                    }
                                }}
                                role="button"
                                tabindex="0"
                                transition:fade
                            >
                                <div class="anime-image-wrapper">
                                    <img 
                                        src={anime.images.jpg.large_image_url || anime.images.jpg.image_url} 
                                        alt={anime.title}
                                    />
                                </div>
                                <div class="anime-details">
                                    <strong>{anime.title}</strong>
                                    <button 
                                        class="recommend-btn"
                                        on:click|stopPropagation={() => fetchRecommendations(anime.mal_id)}
                                    >
                                        Get Recommendations
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="empty-results">No anime found. Try a different search.</p>
                {/if}
            </div>
        </div>
        
        <!-- Recommendations Container -->
        <div class="recommendations-container">
            <h2 class="section-header">Recommendations</h2>
            <div class="recommendations-list">
                {#if $recommendations && Object.keys($recommendations).length > 0}
                    {#each Object.entries($recommendations) as [animeId, recs] (animeId)}
                        <div class="recommendation-group" transition:slide>
                            <h3>Based on: {$searchResults.find(a => a.mal_id == animeId)?.title}</h3>
                            <div class="anime-grid">
                                {#each recs as rec (rec.entry.mal_id)}
                                    <div 
                                        class="anime-container recommendation"
                                        on:click={() => navigateToAnimeDetails(rec.entry.mal_id)}
                                        on:keydown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                navigateToAnimeDetails(rec.entry.mal_id);
                                            }
                                        }}
                                        role="button"
                                        tabindex="0"
                                        transition:fade
                                    >
                                        <div class="anime-image-wrapper">
                                            <img 
                                                src={rec.entry.images.jpg.large_image_url || rec.entry.images.jpg.image_url}
                                                alt={rec.entry.title}
                                            />
                                        </div>
                                        <div class="anime-details">
                                            <strong>{rec.entry.title}</strong>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                {:else}
                    <p class="empty-recommendations">No recommendations available.</p>
                {/if}
            </div>
        </div>
    </div>
</div>
<style lang="postcss">
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

    /* Base Reset and Global Styles */
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
        margin-top:20px;
        display: flex;
        justify-content: center;
        padding: 20px;
    }

    .welcome-container {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 20px;
        max-width: 1400px;
        width: 100%;
    }

    /* Shared Container Styles */
    .top-ranked-container, 
    .search-results-container, 
    .recommendations-container {
        background-color: rgba(40, 40, 40, 0.7);
        border-radius: 12px;
        padding: 20px;
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .section-header {
        color: #00e5ff;
        margin-bottom: 15px;
        font-size: 1.2em;
        border-bottom: 2px solid rgba(0, 229, 255, 0.3);
        padding-bottom: 10px;
    }

    /* List Styles */
    .top-ranked-list, 
    .results-list, 
    .recommendations-list {
        max-height: 600px;
        overflow-y: auto;
    }

     .recommendation {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        padding: 10px;
        border-radius: 8px;
        transition: background-color 0.3s ease;
        cursor: pointer;
    }

     
    
    .recommendation:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

     img, 
    img, 
    .recommendation img {
        width: 80px;
        height: 120px;
        object-fit: cover;
    }
   

input, select{
    color: black !important;
}
.anime-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 15px;
        width: 100%;
    }

    .anime-container {
        background-color: rgba(50, 50, 50, 0.7);
        border-radius: 10px;
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .anime-container:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }

    .anime-image-wrapper {
        width: 100%;
        padding-top: 150%; /* 2:3 aspect ratio */
        position: relative;
    }

    .anime-image-wrapper img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .anime-details {
    padding: 10px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* Change to flex-start to align at the top */
    align-items: center; /* Center-align text horizontally */
    flex-grow: 1;
    min-height: 60px; /* Set a consistent minimum height */
}

.anime-details strong {
    margin-bottom: 5px;
    font-size: 0.9em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%; /* Ensure text doesn't overflow */
    display: block; /* Ensure full width for ellipsis */
    text-align: center; /* Ensure centered text */
}

    .recommend-btn {
        margin-top: 5px;
        background-color: #00e5ff;
        color: #121212;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 0.8em;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .recommend-btn:hover {
        background-color: #00b3cc;
    }

    .anime-container.selected {
        border: 2px solid #00e5ff;
    }
    .anime-container .anime-details {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
}

.search-bar-wrapper {
    display: flex;
    gap: 15px;
    background-color: rgba(50, 50, 50, 0.7);
    border-radius: 12px;
    padding: 10px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.search-input-container {
    flex-grow: 1;
    position: relative;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #00e5ff;
    opacity: 0.7;
    pointer-events: none;
}

.enhanced-input {
    width: 100%;
    padding: 12px 12px 12px 40px;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #e0e0e0 !important;
    font-size: 1em;
    transition: 
        border-color 0.3s ease, 
        background-color 0.3s ease;
}

.enhanced-input:focus {
    outline: none;
    border-color: #00e5ff;
    background-color: rgba(255, 255, 255, 0.2);
}

.genre-select-container {
    flex-shrink: 0;
    width: 200px;
}

.enhanced-select {
    width: 100%;
    padding: 12px;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #e0e0e0 !important;
    font-size: 1em;
    transition: 
        border-color 0.3s ease, 
        background-color 0.3s ease;
    appearance: none;
    background-image: linear-gradient(45deg, transparent 50%, #00e5ff 50%), linear-gradient(135deg, #00e5ff 50%, transparent 50%);
    background-position: calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px);
    background-size: 5px 5px, 5px 5px;
    background-repeat: no-repeat;
}

.enhanced-select:focus {
    outline: none;
    border-color: #00e5ff;
    background-color: rgba(255, 255, 255, 0.2);
}

.genre-option {
    background-color: #121212;
    color: #e0e0e0;
}

    </style>
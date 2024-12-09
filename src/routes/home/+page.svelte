<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';

    interface Genre {
        mal_id: number;
        name: string;
    }

    // Define interfaces for the fetched data
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

        const fetchSearchResults = async () => {
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('search', searchQuery);
            if (selectedGenre) params.append('genres', selectedGenre);

            const res = await fetch(`/api?${params.toString()}`);
            if (!res.ok) throw new Error(await res.text());

            const data: { searchResults: Anime[] } = await res.json();
            searchResults.set(data.searchResults);
        } catch (err) {
            console.error('Error fetching search results:', err);
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
        }
    };

    const fetchTopRankedAnime = async () => {
        try {
            const res = await fetch('/api?top=true');
            if (!res.ok) throw new Error(await res.text());

            const data: { topRankedAnime: Anime[] } = await res.json();
            topRankedAnime.set(data.topRankedAnime);
        } catch (err) {
            console.error('Error fetching top-ranked anime:', err);
        }
    };

    const selectAnime = (anime: Anime) => {
        selectedAnime.set(anime); // Update the selected anime
    };

    onMount(() => {
        fetchTopRankedAnime();
        fetchGenres();  // This will now use the new endpoint parameter
    });

    // Reactive statement to update the background when a new anime is selected
   
</script>

<div class="welcome-container">
    <h1>Anime Search & Recommendations</h1>
    <!-- Top Ranked Anime Section -->
    <div class="top-ranked-container">
        <h2>Top Ranked Anime</h2>
        <div class="top-ranked-list">
            {#if $topRankedAnime.length > 0}
                <ul>
                    {#each $topRankedAnime as anime}
                        <li
                            class="top-ranked"
                            on:click={() => selectAnime(anime)} 
                            style="border: 2px solid {$selectedAnime?.mal_id === anime.mal_id ? 'gold' : 'transparent'};"
                        >
                            <img src={anime.images.jpg.large_image_url || anime.images.jpg.image_url} 
                                 alt={anime.title} 
                                 style="max-width: 150px; border-radius: 5px; margin-right: 10px;" />
                            <div>
                                <strong> {anime.title}</strong>
                            </div>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p>Loading top-ranked anime...</p>
            {/if}
        </div>
    </div>

   <!-- New Search Results Container -->
   <div class="search-results-container">
    
    <!-- Search Bar Inside Search Results Container -->
    <div class="search-bar">
        <input
            type="text"
            placeholder="Search for an anime..."
            bind:value={searchQuery}
        />
        <select bind:value={selectedGenre}>
            <option value="">All Genres</option>
            {#each $genres as genre}
                <option value={genre.mal_id}>{genre.name}</option>
            {/each}
        </select>
        <button on:click={fetchSearchResults}>Search</button>
    </div>

    <div class="results-list">
        {#if $searchResults.length > 0}
            <ul>
                {#each $searchResults as anime}
                    <li class="anime">
                        <img src={anime.images.jpg.large_image_url || anime.images.jpg.image_url} 
                             alt={anime.title} 
                             style="max-width: 150px; border-radius: 5px; margin-right: 10px;" />
                        <div>
                            <strong>{anime.title}</strong>
                            <button on:click={() => fetchRecommendations(anime.mal_id)}>
                                Get Recommendations
                            </button>
                        </div>
                    </li>
              {/each}
            </ul>
        {/if}

    </div>
</div>
    <!-- Recommendations Container -->
    <div class="recommendations-container">
        <h2>Recommendations</h2>
        <div class="recommendations-list">
            {#if $recommendations && Object.keys($recommendations).length > 0}
                {#each Object.entries($recommendations) as [animeId, recs]}
                    <div class="recommendation-group">
                        <h3>Based on: {$searchResults.find(a => a.mal_id == animeId)?.title}</h3>
                        <ul>
                            {#each recs as rec}
                                <li class="recommendation">
                                    <img 
                                        src={rec.entry.images.jpg.large_image_url || rec.entry.images.jpg.image_url}
                                        alt={rec.entry.title}
                                        style="max-width: 150px; border-radius: 5px; margin-right: 10px;" />
                                    <div>
                                        <strong>{rec.entry.title}</strong>
                                    </div>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/each}
            {:else}
                <p>No recommendations available. Search and select an anime to see recommendations.</p>
            {/if}
        </div>
    </div>
</div>

<style>
     @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&family=Roboto:wght@400;700&display=swap');
    /* Scrollbar styling */
::-webkit-scrollbar {
    width: 8px; /* Set the width of the scrollbar */
}

::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.4); /* Dark color for the thumb */
    border-radius: 10px; /* Rounded corners for the thumb */
    transition: background-color 0.3s ease; /* Smooth transition for the thumb */
}

::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.6); /* Darker thumb when hovered */
}

::-webkit-scrollbar-track {
    background-color: rgba(255, 255, 255, 0.1); /* Light background for the track */
    border-radius: 10px; /* Rounded corners for the track */
}

::-webkit-scrollbar-track-piece {
    background-color: rgba(255, 255, 255, 0.1); /* Light color for the track piece */
}


   .welcome-container {
       display: flex;
       flex-direction: column; /* Stack elements vertically */
       justify-content: flex-start;
       align-items: center;
       height: 100vh;
       font-family: 'Poppins', sans-serif;
       position: relative;
       transition: background 0.3s ease;
       padding-top: 20px; /* Space from top */
       background-color: lightblue ;
   }
   
   .top-ranked-container {
    position: absolute; /* Allows free positioning within the parent */
    top: 100px; /* Adjust to move it down as needed */
    left: 80px; /* Position it on the left side */
    width: 500px;
    padding: 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.15); /* Light glassy effect */
    backdrop-filter: blur(10px); /* Blur effect */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Add a subtle shadow */
    border: 1px solid rgba(255, 255, 255, 0.3); /* Border for better visibility */
    max-height: 800px; /* Maximum height of the entire container */
    z-index: 1;
    display: flex;
    flex-direction: column;
}

.top-ranked-container h2 {
    position: sticky;
    top: 0;
    padding: 10px;
    margin: 0;
    font-size: 18px;
    font-weight: bold;
    z-index: 2; /* Make sure the header is on top */
    border-radius: 5px;
}

/* Hide the scrollbar but keep the ability to scroll */
/* Make the scrollbar smaller and hide the arrows */
.top-ranked-list {
    overflow-y: auto; /* Allows scrolling but hides arrows when not needed */
    flex-grow: 1;
    max-height: 700px;
    padding-right: 10px;    
}


.top-ranked img {
    max-width: 80px;
    border-radius: 5px;
    margin-right: 8px;
    cursor: pointer; /* Indicate clickable items */
}

.top-ranked {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.recommendations-container {
        position: absolute;
        top: 100px;
        right: 80px;
        width: 500px;
        padding: 10px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        max-height: 800px;
        height: 770px;
        z-index: 1;
        display: flex;
        flex-direction: column;
    }

    .recommendations-container h2 {
        position: sticky;
        top: 0;
        padding: 10px;
        margin: 0;
        font-size: 18px;
        font-weight: bold;
        z-index: 2;
        border-radius: 5px;
    }

    .recommendations-list {
        overflow-y: auto;
        flex-grow: 1;
        max-height: 700px;
        padding-right: 10px;
    }

    .recommendation-group {
        margin-bottom: 20px;
    }

    .recommendation-group h3 {
        font-size: 16px;
        font-weight: bold;
        margin: 10px 0;
    }

    .recommendations-list ul {
        padding: 0;
        list-style: none;
    }

    .recommendation {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }

    .search-results-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 500px;
    padding: 20px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    max-height: 770px;
    z-index: 1;
    position: relative;
    height: 900px;
    top:55px;
}

/* Search bar styles inside search-results-container */
.search-bar {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
}

.search-bar input {
    padding: 8px;
    font-size: 16px;
}

.search-bar button {
    padding: 8px;
    font-size: 16px;
    margin-left: 10px;
    cursor: pointer;
}

/* Styling for the search results list */
.results-list {
    overflow-y: auto;
    flex-grow: 1;
    max-height: 700px;
    padding-right: 10px;
}

.results-list ul {
    padding: 0;
    list-style: none;
}

.anime {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.anime img {
    max-width: 80px;
    border-radius: 5px;
    margin-right: 8px;
}

.anime button {
    cursor: pointer;
    margin-top: 5px;
}

    .search-results-container h2 {
        position: sticky;
        top: 0;
        padding: 10px;
        margin: 0;
        font-size: 18px;
        font-weight: bold;
        z-index: 2;
        border-radius: 5px;
    }

   </style>
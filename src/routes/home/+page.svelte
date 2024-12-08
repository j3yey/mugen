<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';

    // Define interfaces for the fetched data
    interface Anime {
        mal_id: number;
        title: string;
        images: {
            jpg: {
                image_url: string;
            };
        };
    }

    interface Recommendation {
        entry: {
            mal_id: number;
            title: string;
            images: {
                jpg: {
                    image_url: string;
                };
            };
        };
    }

    let searchQuery = '';
    let searchResults = writable<Anime[]>([]);
    let recommendations = writable<Record<number, Recommendation[]>>({});

    const fetchSearchResults = async () => {
        if (!searchQuery.trim()) return;

        try {
            const res = await fetch(`/api?search=${encodeURIComponent(searchQuery)}`);
            if (!res.ok) throw new Error(await res.text());

            const data: { searchResults: Anime[] } = await res.json();
            searchResults.set(data.searchResults);
        } catch (err) {
            console.error('Error fetching search results:', err);
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
</script>

<style>
    .anime img, .recommendation img {
        max-width: 100px;
        border-radius: 5px;
        margin-right: 10px;
    }

    .anime, .recommendation {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }
</style>

<div class="container">
    <h1>Anime Search & Recommendations</h1>

    <div class="search-bar">
        <input
            type="text"
            placeholder="Search for an anime..."
            bind:value={searchQuery}
        />
        <button on:click={fetchSearchResults}>Search</button>
    </div>

    <div class="results">
        <h2>Search Results</h2>
        {#if $searchResults.length > 0}
            <ul>
                {#each $searchResults as anime}
                    <li class="anime">
                        <img src={anime.images.jpg.image_url} alt={anime.title} />
                        <div>
                            <strong>{anime.title}</strong>
                            <button on:click={() => fetchRecommendations(anime.mal_id)}>
                                Get Recommendations
                            </button>
                        </div>

                        <!-- Show recommendations for this anime -->
                        {#if $recommendations[anime.mal_id]?.length > 0}
                            <ul>
                                {#each $recommendations[anime.mal_id] as rec}
                                    <li class="recommendation">
                                        <img src={rec.entry.images.jpg.image_url} alt={rec.entry.title} />
                                        {rec.entry.title}
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </li>
                {/each}
            </ul>
        {:else}
            <p>No results found.</p>
        {/if}
    </div>
</div>



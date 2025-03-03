///////// API Keys Handling /////////
let apiKeysLoaded = false;
let TMDB_API_KEY = "";
let OPENAI_API_KEY = "";

// Fetch API keys from Netlify function
async function fetchAPIKeys() {
    try {
        const response = await fetch("/.netlify/functions/getKeys");
        if (!response.ok) throw new Error("Failed to fetch API keys");
        const data = await response.json();
        TMDB_API_KEY = data.TMDB_API_KEY;
        OPENAI_API_KEY = data.OPENAI_API_KEY;
        apiKeysLoaded = true;
        console.log("API Keys Loaded Successfully");
    } catch (error) {
        console.error("Error fetching API keys:", error);
    }
}

// Ensures API calls wait until keys are loaded
async function ensureKeysLoaded() {
    if (!apiKeysLoaded) {
        await fetchAPIKeys();
    }
}

// Usage Example: Wrap API calls inside ensureKeysLoaded()
async function searchByTitle(title) {
    await ensureKeysLoaded(); // Ensure keys are ready before calling API
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
        );
        const data = await response.json();
        displayResults(data.results);
    } catch (error) {
        console.error("Error fetching title search results:", error);
    }
}

// Call fetchAPIKeys() at the start of the script
fetchAPIKeys();

///////// Home Page Script /////////
// Toggle Navigation Menu
function toggleMenu() {
    const menu = document.querySelector(".nav-menu");
    menu.classList.toggle("active");
}

// Ensure the page loads with data
document.addEventListener("DOMContentLoaded", function () {
    if (typeof TMDB_API_KEY === "undefined") {
        console.error("TMDB_API_KEY is not defined. Make sure config.js is loaded.");
        return;
    }
    
    console.log("Fetching initial data...");
    fetchTrendingMovies();
    fetchRandomMovies();
    fetchRecommendationOfTheDay();
});

// Fetch Trending Movies
async function fetchTrendingMovies() {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        
        const trendingContainer = document.getElementById("trendingMovies");
        if (!trendingContainer) {
            console.error("Trending movies container not found.");
            return;
        }
        
        trendingContainer.innerHTML = data.results.map(movie => `
            <div class='movie-card' onclick="goToDetails(${movie.id}, 'movie')">
                <img src="${movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'assets/img/placeholder.png'}" alt="${movie.title}">
                <p>${movie.title}</p>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error fetching trending movies:", error);
    }
}

// Fetch Random Movies
async function fetchRandomMovies() {
    console.log("Fetching new random movies...");
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
        const data = await response.json();
        
        const randomMovies = document.getElementById("randomMovies");
        if (!randomMovies) {
            console.error("randomMovies container not found.");
            return;
        }

        randomMovies.innerHTML = ""; // Clear previous results

        let selectedMovies = new Set();
        let maxMovies = Math.min(6, data.results.length); // Avoid errors if fewer results are available

        while (selectedMovies.size < maxMovies) {
            let randomIndex = Math.floor(Math.random() * data.results.length);
            selectedMovies.add(randomIndex);
        }

        selectedMovies.forEach(index => {
            const movie = data.results[index];
            if (!movie) return;

            const posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'assets/img/placeholder.png';

            const movieCard = document.createElement("div");
            movieCard.classList.add("movie-card");
            movieCard.innerHTML = `
                <div onclick="goToDetails(${movie.id}, 'movie')">
                    <img src="${posterPath}" alt="${movie.title}">
                    <h4>${movie.title}</h4>
                </div>
            `;
            randomMovies.appendChild(movieCard);
        });

        console.log("Movies refreshed successfully.");
    } catch (error) {
        console.error("Error fetching random movies:", error);
    }
}

// Fetch Recommendation of the Day (Movie, Series, Anime)
async function fetchRecommendationOfTheDay() {
    console.log("Fetching recommendation of the day...");
    const recoContainer = document.getElementById("recommendationOfTheDay");
    if (!recoContainer) {
        console.error("recommendationOfTheDay container not found.");
        return;
    }
    recoContainer.innerHTML = "";

    try {
        const [movie, series, anime] = await Promise.all([
            fetchRandomItem("movie"),
            fetchRandomItem("tv"),
            fetchRandomItem("anime")
        ]);

        recoContainer.innerHTML = `
            <div class='movie-card' onclick="goToDetails(${movie.id}, 'movie')">
                <img src="${movie.poster}" alt="${movie.title}">
                <p>${movie.title}</p>
            </div>
            <div class='movie-card' onclick="goToDetails(${series.id}, 'tv')">
                <img src="${series.poster}" alt="${series.title}">
                <p>${series.title}</p>
            </div>
            <div class='movie-card' onclick="goToDetails(${anime.id}, 'tv')">
                <img src="${anime.poster}" alt="${anime.title}">
                <p>${anime.title}</p>
            </div>
        `;
    } catch (error) {
        console.error("Error fetching recommendations:", error);
    }
}

// Fetch Random Movie, Series, or Anime
async function fetchRandomItem(type) {
    let url;
    if (type === "anime") {
        url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`;
    } else {
        url = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_API_KEY}&sort_by=popularity.desc`;
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            console.error(`No results found for ${type}`);
            return { id: null, title: "Not Found", poster: "assets/img/placeholder.png" };
        }
        
        const randomIndex = Math.floor(Math.random() * data.results.length);
        return {
            id: data.results[randomIndex].id,
            title: data.results[randomIndex].title || data.results[randomIndex].name,
            poster: data.results[randomIndex].poster_path ? `https://image.tmdb.org/t/p/w500${data.results[randomIndex].poster_path}` : "assets/img/placeholder.png"
        };
    } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        return { id: null, title: "Error", poster: "assets/img/placeholder.png" };
    }
}

// Redirect to Details Page
function goToDetails(movieId, type = 'movie') {
    if (!movieId) return;
    window.location.href = `/html/details.html?id=${encodeURIComponent(movieId)}&type=${encodeURIComponent(type)}`;
}

///////// Details Page Script /////////
// Redirect when a movie is clicked
function goToDetails(movieId, type = 'movie') {
    if (!movieId) return;
    window.location.href = `/html/details.html?id=${encodeURIComponent(movieId)}&type=${encodeURIComponent(type)}`;
}

// Fetch Movie or TV Show Details
async function getMovieDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    const type = urlParams.get('type'); // 'movie' or 'tv'

    if (!itemId || !type) {
        console.error("Invalid item ID or type.");
        return;
    }

    try {
        const response = await fetch(`https://api.themoviedb.org/3/${type}/${itemId}?api_key=${TMDB_API_KEY}&append_to_response=videos,similar`);
        const itemData = await response.json();

        if (!itemData || itemData.success === false) {
            console.error("Invalid response data:", itemData);
            return;
        }

        document.getElementById("movieTitle").innerText = itemData.title || itemData.name;
        document.getElementById("movieInfo").innerHTML = `
            <strong>Release Date:</strong> ${itemData.release_date || itemData.first_air_date || "N/A"} <br>
            <strong>Rating:</strong> ${itemData.vote_average ? itemData.vote_average.toFixed(1) : "N/A"} / 10 <br>
            <strong>Overview:</strong> ${itemData.overview || "No overview available."}
        `;

        // Display Trailer (if available)
        const trailerContainer = document.getElementById("trailerContainer");
        trailerContainer.innerHTML = ""; // Clear previous content

        if (itemData.videos && itemData.videos.results.length > 0) {
            const trailer = itemData.videos.results.find(video => video.type === "Trailer");
            trailerContainer.innerHTML = trailer
                ? `<iframe src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>`
                : "<p>No trailer available</p>";
        } else {
            trailerContainer.innerHTML = "<p>No trailer available</p>";
        }

        // Display Similar Movies or Series
        displaySimilarMovies(itemData.similar, type);
    } catch (error) {
        console.error("Error fetching movie details:", error);
    }
}

// Display Similar Movies or Series
function displaySimilarMovies(similarData, type) {
    const similarContainer = document.getElementById("similarMovies");
    similarContainer.innerHTML = ""; // Clear previous content

    if (!similarData || !similarData.results || similarData.results.length === 0) {
        similarContainer.innerHTML = "<p>No similar movies found</p>";
        return;
    }

    similarData.results.slice(0, 5).forEach(similar => {
        if (!similar) return;

        const posterPath = similar.poster_path
            ? `https://image.tmdb.org/t/p/w500${similar.poster_path}`
            : "assets/img/placeholder.png";

        const movieCard = document.createElement("div");
        movieCard.classList.add("movie-card");
        movieCard.innerHTML = `
            <div onclick="goToDetails(${similar.id}, '${type}')">
                <img src="${posterPath}" alt="${similar.title || similar.name}">
                <h4>${similar.title || similar.name}</h4>
            </div>
        `;
        similarContainer.appendChild(movieCard);
    });
}

// Ensure details load when on details.html
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("/html/details.html")) {
        getMovieDetails();
    }
});

///////// Search Page Script /////////
document.addEventListener("DOMContentLoaded", function () {
    const searchBox = document.getElementById("searchBox");
    const searchBtn = document.getElementById("searchBtn");
    const searchResultsContainer = document.getElementById("searchResults");

    if (!searchResultsContainer) {
        console.error("Error: searchResults container not found in DOM.");
        return;
    }

    searchBtn.addEventListener("click", handleSearch);
    searchBox.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            handleSearch();
        }
    });

    async function handleSearch() {
        const query = searchBox.value.trim();
        if (!query) {
            alert("Please enter a search term!");
            return;
        }

        if (isTitleSearch(query)) {
            await searchByTitle(query);
        } else {
            await searchByMood(query);
        }
    }

    function isTitleSearch(input) {
        return !input.toLowerCase().includes("feel") && !input.toLowerCase().includes("like");
    }

    async function searchByTitle(title) {
        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
            );
            const data = await response.json();
            displayResults(data.results);
        } catch (error) {
            console.error("Error fetching title search results:", error);
        }
    }

    async function searchByMood(mood) {
        try {
            console.log(`Fetching AI suggestions for mood: ${mood}`);

            const aiMovies = await fetchMoviesFromAI(mood);
            if (!aiMovies || aiMovies.length === 0) {
                alert("Could not get AI recommendations. Try searching for a title.");
                return;
            }

            const movieDetails = await fetchMovieDetailsFromTMDb(aiMovies);
            displayResults(movieDetails);
        } catch (error) {
            console.error("Error handling mood-based search:", error);
        }
    }

    async function fetchMoviesFromAI(mood) {
        try {
            console.log(`Fetching AI suggestions for mood: ${mood}`);

            const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4-turbo",
                    messages: [{ role: "user", content: `Suggest five popular movies for someone feeling "${mood}". Return as a JSON array.` }]
                })
            });

            if (!response.ok) {
                console.error("OpenAI API error:", response.status, response.statusText);
                return [];
            }

            const data = await response.json();
            console.log("OpenAI API Response:", data);

            return JSON.parse(data.choices[0].message.content.trim());
        } catch (error) {
            console.error("Error fetching AI movie suggestions:", error);
            return [];
        }
    }

    async function fetchMovieDetailsFromTMDb(movieTitles) {
        const movieDetails = [];
        for (const title of movieTitles) {
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
                );
                const data = await response.json();
                if (data.results.length > 0) {
                    movieDetails.push(data.results[0]);
                }
            } catch (error) {
                console.error(`Error fetching details for ${title}:`, error);
            }
        }
        return movieDetails;
    }

    function displayResults(results) {
        searchResultsContainer.innerHTML = "";

        if (!results || results.length === 0) {
            searchResultsContainer.innerHTML = "<p>No results found. Try a different search.</p>";
            return;
        }

        results.forEach(item => {
            const card = document.createElement("div");
            card.classList.add("movie-card");

            const img = document.createElement("img");
            img.src = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "assets/images/no-image.jpg";
            img.alt = item.title || item.name;
            img.onclick = () => goToDetailsPage(item.id, item.media_type || "movie");

            const title = document.createElement("p");
            title.textContent = item.title || item.name;

            card.appendChild(img);
            card.appendChild(title);
            searchResultsContainer.appendChild(card);
        });
    }

    function goToDetailsPage(id, type) {
        window.location.href = `/html/details.html?id=${id}&type=${type}`;
    }
});

///////// Recommendations Page /////////

// TMDb Genre IDs mapped to moods
const moodToGenreMap = {
    "Excited": 28, // Action
    "Relaxed": 18, // Drama
    "Adventurous": 12, // Adventure
    "Romantic": 10749, // Romance
    "Thrilling": 53, // Thriller
    "Mysterious": 9648, // Mystery
    "Scary": 27, // Horror
    "Funny": 35, // Comedy
    "Inspiring": 99, // Documentary
    "Fantasy": 14, // Fantasy
    "Sci-Fi": 878 // Science Fiction
};

// Function to extract mood from user input using OpenAI API
async function extractMoodFromInput(userInput) {
    await ensureKeysLoaded(); // Ensure API key is available

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",
                messages: [{ role: "user", content: `Extract the mood from this input: "${userInput}". Return only a single mood word.` }],
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error("OpenAI API request failed");

        const data = await response.json();
        let extractedMood = data.choices[0].message.content.trim();

        if (!moodToGenreMap[extractedMood]) {
            extractedMood = await suggestClosestMood(extractedMood); // Find closest match
        }

        return extractedMood;
    } catch (error) {
        console.error("Error extracting mood:", error);
        return getRandomMood(); // Fallback list if AI fails
    }
}

// Function to find the closest mood match from moodToGenreMap
async function suggestClosestMood(userMood) {
    await ensureKeysLoaded(); // Ensure API key is available

    const availableMoods = Object.keys(moodToGenreMap);
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",
                messages: [{
                    role: "user",
                    content: `Given the available moods: ${availableMoods.join(", ")}. Which one is the closest match to "${userMood}"? Return only the best matching mood.`
                }],
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error("OpenAI API request failed");

        const data = await response.json();
        let suggestedMood = data.choices[0].message.content.trim();

        return moodToGenreMap[suggestedMood] ? suggestedMood : getRandomMood(); // Ensure valid mood
    } catch (error) {
        console.error("Error suggesting closest mood:", error);
        return getRandomMood(); // Fallback if AI fails
    }
}

// Function to fetch recommendations based on mood/genre
async function fetchRecommendations() {
    const inputField = document.getElementById("preferenceInput");
    if (!inputField) {
        console.error("Error: preferenceInput element not found!");
        return;
    }

    let userInput = inputField.value.trim();
    if (!userInput) {
        alert("Please enter a mood or genre!");
        return;
    }

    let mood = moodToGenreMap[userInput] ? userInput : await extractMoodFromInput(userInput); // Handle full sentences
    const genreId = moodToGenreMap[mood] || null;

    const movieUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc${genreId ? `&with_genres=${genreId}` : ""}`;
    const tvUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc${genreId ? `&with_genres=${genreId}` : ""}`;
    const animeUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&with_genres=16`; // 16 = Animation (Anime)

    try {
        console.log(`Fetching recommendations for Mood: ${mood} (Genre ID: ${genreId})`);

        const [moviesResponse, tvResponse, animeResponse] = await Promise.all([
            fetch(movieUrl),
            fetch(tvUrl),
            fetch(animeUrl)
        ]);

        if (!moviesResponse.ok || !tvResponse.ok || !animeResponse.ok) throw new Error("TMDb API request failed");

        const moviesData = await moviesResponse.json();
        const tvData = await tvResponse.json();
        const animeData = await animeResponse.json();

        console.log("Movies:", moviesData);
        console.log("TV Series:", tvData);
        console.log("Anime:", animeData);

        displayRecommendations(moviesData.results, "recommendedMovies");
        displayRecommendations(tvData.results, "recommendedSeries");
        displayRecommendations(animeData.results, "recommendedAnime");

    } catch (error) {
        console.error("Error fetching recommendations:", error);
        alert("Could not get recommendations. Try again later.");
    }
}

// Function to suggest a random mood using OpenAI or fallback list
async function suggestMood() {
    const inputField = document.getElementById("preferenceInput");
    if (!inputField) {
        console.error("Error: preferenceInput element not found!");
        return;
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",
                messages: [{ role: "user", content: "Suggest a random mood for a movie night." }],
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error("OpenAI API request failed");

        const data = await response.json();
        console.log("OpenAI API Response:", data);

        if (data?.choices?.length > 0) {
            let mood = data.choices[0].message.content.trim();
            if (!moodToGenreMap[mood]) mood = getRandomMood(); // Fallback if unknown mood
            inputField.value = mood;
        }
    } catch (error) {
        console.error("Error suggesting mood:", error);
        inputField.value = getRandomMood(); // Use fallback list
    }
}

// Event Listener for "Suggest Mood" Button
document.getElementById("suggestMoodBtn")?.addEventListener("click", suggestMood);

// Function to display recommendations with poster & details link
function displayRecommendations(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Error: ${containerId} element not found!`);
        return;
    }

    container.innerHTML = "";

    if (!items || items.length === 0) {
        container.innerHTML = "<p>No recommendations found.</p>";
        return;
    }

    items.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("movie-card");

        const titleElement = document.createElement("p");
        titleElement.textContent = item.title || item.name; // TV series uses "name"

        const poster = document.createElement("img");
        poster.src = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "placeholder.jpg";
        poster.alt = titleElement.textContent;
        poster.classList.add("movie-poster");

        // Clickable card to go to details page
        card.onclick = () => {
            window.location.href = `/html/details.html?id=${item.id}&type=${item.title ? "movie" : "tv"}`;
        };

        card.appendChild(poster);
        card.appendChild(titleElement);
        container.appendChild(card);
    });
}

// Helper function to get a random predefined mood
function getRandomMood() {
    const moods = Object.keys(moodToGenreMap);
    return moods[Math.floor(Math.random() * moods.length)];
}
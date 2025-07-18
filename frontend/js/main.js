document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing page scripts');
    console.log('Current page:', window.location.pathname);
    console.log('Current origin:', window.location.origin);

    // Update navigation bar based on authentication status
    updateNavigation();

    // Protect authenticated routes
    const isAuthenticated = !!localStorage.getItem('token');
    console.log('isAuthenticated on load:', isAuthenticated);
    console.log('Token on load:', localStorage.getItem('token'));
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const protectedPages = ['movies.html', 'profile.html', 'movie-details.html'];
    const publicPages = ['index.html', 'login.html', 'signup.html'];

    // Redirect authenticated users away from public pages
    if (isAuthenticated && publicPages.includes(currentPage)) {
        window.location.href = 'movies.html';
        return;
    }
    // Redirect unauthenticated users away from protected pages
    if (!isAuthenticated && protectedPages.includes(currentPage)) {
        window.location.href = 'index.html';
        return;
    }

    // Movies page
    if (document.getElementById('movieGrid')) {
        console.log('Movies page detected, fetching movies');
        fetchMovies();

        const searchInput = document.getElementById('searchInput');
        const languageFilter = document.getElementById('languageFilter');
        const genreFilter = document.getElementById('genreFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (searchInput) searchInput.addEventListener('input', fetchMovies);
        if (languageFilter) languageFilter.addEventListener('change', fetchMovies);
        if (genreFilter) genreFilter.addEventListener('change', fetchMovies);
        if (sortFilter) sortFilter.addEventListener('change', fetchMovies);
    }

    // Movie details page
    if (document.getElementById('movieDetails')) {
        console.log('Movie details page detected');
        fetchMovieDetails();
        setupTrackingActions();
        fetchReviews();
    }

    // Login page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('Login form detected, attaching event listener');
        loginForm.addEventListener('submit', handleLogin);
    }

    // Sign Up page
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        console.log('Signup form detected, attaching event listener');
        signupForm.addEventListener('submit', handleSignup);
    }

    // Profile page
    if (document.getElementById('userInfo')) {
        console.log('Profile page detected, loading user data');
        loadUserProfile();
        fetchWatchedMovies();
        fetchWatchlist();
        setupProfileEdit();
    }

    // Chatbot
    const chatbotButton = document.getElementById('chatbotButton');
    if (chatbotButton) {
        console.log('Chatbot detected, setting up');
        setupChatbot();
    }

    // Logout
    setupLogout();
});

function updateNavigation() {
    console.log('updateNavigation called');
    const nav = document.getElementById('nav');
    if (!nav) {
        console.error('Navigation element with id="nav" not found on page:', window.location.pathname);
        return;
    }
    console.log('Nav element found');
    const isAuthenticated = !!localStorage.getItem('token');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('Current token:', localStorage.getItem('token') || 'none');

    nav.innerHTML = isAuthenticated
        ? `
            <a href="movies.html">Movies</a>
            <a href="profile.html">Profile</a>
            <a href="#" id="logout">Logout</a>
        `
        : `
            <a href="index.html">Home</a>
            <a href="login.html">Login</a>
            <a href="signup.html">Sign Up</a>
        `;
    console.log('Navigation updated to:', nav.innerHTML);
}

function setupLogout() {
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        console.log('Logout button found, attaching event listener');
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.log('Logged out, token removed');
            updateNavigation();
            console.log('Redirecting to index.html');
            alert('Logged out successfully!');
            window.location.href = 'index.html';
        });
    }
}

async function fetchMovies() {
    const movieGrid = document.getElementById('movieGrid');
    if (!movieGrid) {
        console.warn('movieGrid element not found');
        return;
    }

    const searchInput = document.getElementById('searchInput') ? document.getElementById('searchInput').value : '';
    const languageFilter = document.getElementById('languageFilter') ? document.getElementById('languageFilter').value : '';
    const genreFilter = document.getElementById('genreFilter') ? document.getElementById('genreFilter').value : '';
    const sortFilter = document.getElementById('sortFilter') ? document.getElementById('sortFilter').value : '';

    const query = new URLSearchParams();
    if (searchInput) query.append('search', searchInput);
    if (languageFilter) query.append('language', languageFilter);
    if (genreFilter) query.append('genre', genreFilter);
    if (sortFilter) query.append('sort', sortFilter);

    try {
        const url = `http://localhost:5001/api/movies?${query.toString()}`;
        console.log('Fetching movies with URL:', url);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
        }
        const movies = await response.json();

        movieGrid.innerHTML = '';
        if (movies.length === 0) {
            movieGrid.innerHTML = '<p>No movies found.</p>';
            return;
        }

        movies.forEach(movie => {
            const movieCard = document.createElement('a');
            movieCard.classList.add('movie-card', 'movie-card-link');
            movieCard.href = `movie-details.html?id=${movie._id}`;
            movieCard.innerHTML = `
                <img src="${movie.poster || 'https://via.placeholder.com/200x300?text=No+Poster'}" alt="${movie.title}">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                </div>
            `;
            movieGrid.appendChild(movieCard);
        });
        console.log('Movies loaded:', movies.length);
    } catch (error) {
        console.error('Error fetching movies:', error);
        movieGrid.innerHTML = '<p>Error loading movies. Please try again.</p>';
    }
}

async function fetchUserMovieStatus(movieId) {
    const token = localStorage.getItem('token');
    if (!token) return { inWatchlist: false, watched: false, userReview: null };
    let inWatchlist = false;
    let watched = false;
    let userReview = null;
    try {
        // Fetch watchlist
        const watchlistRes = await fetch('http://localhost:5001/api/watchlist', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const watchlist = await watchlistRes.json();
        inWatchlist = watchlist.some(item => item.movieId && item.movieId._id === movieId);
        // Fetch watched
        const watchedRes = await fetch('http://localhost:5001/api/watched', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const watchedList = await watchedRes.json();
        const watchedEntry = watchedList.find(item => item.movieId && item.movieId._id === movieId);
        watched = !!watchedEntry;
        userReview = watchedEntry || null;
    } catch (e) {
        // ignore
    }
    return { inWatchlist, watched, userReview };
}

async function fetchMovieDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    if (!movieId) {
        document.getElementById('movieDetails').innerHTML = '<p>No movie ID provided.</p>';
        return;
    }
    try {
        const response = await fetch(`http://localhost:5001/api/movies/${movieId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${await response.text()}`);
        }
        const movie = await response.json();
        document.getElementById('moviePoster').src = movie.poster || 'https://via.placeholder.com/200x300?text=No+Poster';
        document.getElementById('movieTitle').textContent = movie.title;
        document.getElementById('movieYear').textContent = movie.releaseYear || 'N/A';
        document.getElementById('movieLanguage').textContent = movie.language || 'N/A';
        document.getElementById('movieGenres').textContent = movie.genres.join(', ') || 'N/A';
        document.getElementById('movieSynopsis').textContent = movie.synopsis || 'No synopsis available.';

        // --- New: Update UI for watchlist/watched state ---
        const { inWatchlist, watched, userReview } = await fetchUserMovieStatus(movieId);
        const trackingAction = document.getElementById('trackingAction');
        const watchedForm = document.getElementById('watchedForm');
        const submitWatchlist = document.getElementById('submitWatchlist');
        const submitWatched = document.getElementById('submitWatched');
        const trackingStatus = document.getElementById('trackingStatus');
        trackingStatus.innerHTML = '';
        if (watched) {
            trackingAction.value = 'watched';
            watchedForm.style.display = 'block';
            submitWatched.disabled = true;
            submitWatchlist.style.display = 'none';
            trackingStatus.innerHTML = '<div style="color:green;">You have already watched this movie.</div>';
            if (userReview) {
                document.getElementById('rating').value = userReview.rating || '';
                document.getElementById('reviewText').value = userReview.reviewText || '';
                document.getElementById('rating').disabled = true;
                document.getElementById('reviewText').disabled = true;
            }
        } else if (inWatchlist) {
            trackingAction.value = 'to-watch';
            watchedForm.style.display = 'none';
            submitWatchlist.style.display = 'none';
            submitWatchlist.disabled = true;
            submitWatched.disabled = false;
            document.getElementById('rating').disabled = false;
            document.getElementById('reviewText').disabled = false;
            trackingStatus.innerHTML = '<div style="color:blue;">In Watchlist - You can mark as watched</div>';
        } else {
            trackingAction.value = '';
            watchedForm.style.display = 'none';
            submitWatchlist.style.display = 'none';
            submitWatchlist.disabled = false;
            submitWatched.disabled = false;
            document.getElementById('rating').disabled = false;
            document.getElementById('reviewText').disabled = false;
        }
    } catch (error) {
        document.getElementById('movieDetails').innerHTML = '<p>Error loading movie details. Please try again.</p>';
    }
}

function setupTrackingActions() {
    const trackingAction = document.getElementById('trackingAction');
    const watchedForm = document.getElementById('watchedForm');
    const submitWatchlist = document.getElementById('submitWatchlist');
    const submitWatched = document.getElementById('submitWatched');

    if (!trackingAction || !watchedForm || !submitWatchlist || !submitWatched) {
        console.warn('Tracking elements missing on movie-details page');
        return;
    }

    trackingAction.addEventListener('change', () => {
        if (trackingAction.value === 'watched') {
            watchedForm.style.display = 'block';
            submitWatchlist.style.display = 'none';
        } else if (trackingAction.value === 'to-watch') {
            watchedForm.style.display = 'none';
            submitWatchlist.style.display = 'block';
        } else {
            watchedForm.style.display = 'none';
            submitWatchlist.style.display = 'none';
        }
    });

    // --- Watched Movies: Mark as watched and fetch watched movies ---

    // Update submitWatched to use /api/watched
    submitWatched.addEventListener('click', async () => {
        const movieId = new URLSearchParams(window.location.search).get('id');
        const rating = document.getElementById('rating').value;
        const reviewText = document.getElementById('reviewText').value;
        const token = localStorage.getItem('token');

        if (!token) {
            alert('Please log in to mark as watched.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/watched', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ movieId, rating, reviewText })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
            }
            alert('Movie marked as watched and moved from watchlist!');
            fetchReviews();
            fetchMovieDetails(); // Refresh UI to show updated status
        } catch (error) {
            alert('Error marking as watched. Please try again.');
        }
    });

    submitWatchlist.addEventListener('click', async () => {
        const movieId = new URLSearchParams(window.location.search).get('id');
        const token = localStorage.getItem('token');

        if (!token) {
            console.log('No token found, redirecting to login');
            alert('Please log in to add to watchlist.');
            window.location.href = 'login.html';
            return;
        }

        try {
            console.log('Adding movie to watchlist:', movieId);
            const response = await fetch('http://localhost:5001/api/watchlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ movieId })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            alert('Movie added to watchlist!');
            fetchMovieDetails(); // Refresh UI
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            alert('Error adding to watchlist. Please try again.');
        }
    });
}

async function fetchReviews() {
    const movieId = new URLSearchParams(window.location.search).get('id');
    const reviewsList = document.getElementById('reviewsList');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!reviewsList) return;
    try {
        const response = await fetch(`http://localhost:5001/api/reviews/${movieId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const reviews = await response.json();
        reviewsList.innerHTML = '';
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p>No reviews yet.</p>';
            return;
        }
        reviews.forEach(review => {
            const isUser = user && (review.userId._id === user.id || review.userId._id === user.userId);
            const reviewDiv = document.createElement('div');
            reviewDiv.classList.add('review');
            if (isUser) reviewDiv.style.background = '#e6ffe6';
            reviewDiv.innerHTML = `
                <p><strong>${review.userId.name}${isUser ? ' (You)' : ''}</strong>: ${review.rating}/10</p>
                <p>${review.reviewText || 'No review text.'}</p>
                <p><small>${new Date(review.createdAt).toLocaleDateString()}</small></p>
            `;
            reviewsList.appendChild(reviewDiv);
        });
    } catch (error) {
        reviewsList.innerHTML = '<p>Error loading reviews. Please try again.</p>';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        console.log('Attempting login with:', { email });
        const response = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
        }
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Login successful, token stored:', data.token);
        console.log('Token after login:', localStorage.getItem('token'));
        updateNavigation();
        console.log('Redirecting to movies.html');
        window.location.href = 'movies.html';
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Error logging in. Please check your credentials.');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        console.log('Attempting signup with:', { name, email });
        const response = await fetch('http://localhost:5001/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
        }
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Signup successful, token stored:', data.token);
        console.log('Token after signup:', localStorage.getItem('token'));
        updateNavigation();
        console.log('Redirecting to movies.html');
        window.location.href = 'movies.html';
    } catch (error) {
        console.error('Error signing up:', error);
        alert('Error signing up. Please try again.');
    }
}

function loadUserProfile() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        console.log('No user data found, redirecting to login');
        document.getElementById('userInfo').innerHTML = '<p>Please log in to view your profile.</p>';
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('userName').textContent = user.name || 'N/A';
    document.getElementById('userEmail').textContent = user.email || 'N/A';
    console.log('User profile loaded:', user.name);

    // Populate edit form with current user data
    const editName = document.getElementById('editName');
    const editEmail = document.getElementById('editEmail');
    if (editName && editEmail) {
        editName.value = user.name || '';
        editEmail.value = user.email || '';
    }
}

function setupProfileEdit() {
    const editProfileButton = document.getElementById('editProfileButton');
    const editProfileForm = document.getElementById('editProfileForm');
    const cancelEditButton = document.getElementById('cancelEdit');

    if (!editProfileButton || !editProfileForm || !cancelEditButton) {
        console.warn('Profile edit elements not found');
        return;
    }

    editProfileButton.addEventListener('click', () => {
        console.log('Edit Profile button clicked, showing form');
        document.getElementById('userInfo').style.display = 'none';
        editProfileForm.style.display = 'block';
    });

    cancelEditButton.addEventListener('click', () => {
        console.log('Cancel Edit button clicked, hiding form');
        document.getElementById('userInfo').style.display = 'block';
        editProfileForm.style.display = 'none';
        // Reset form
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            document.getElementById('editName').value = user.name || '';
            document.getElementById('editEmail').value = user.email || '';
            document.getElementById('editPassword').value = '';
        }
    });

    editProfileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('editName').value;
        const email = document.getElementById('editEmail').value;
        const password = document.getElementById('editPassword').value;
        const token = localStorage.getItem('token');

        if (!token) {
            console.log('No token found, redirecting to login');
            alert('Please log in to update your profile.');
            window.location.href = 'login.html';
            return;
        }

        try {
            console.log('Submitting profile update:', { name, email });
            const body = { name, email };
            if (password) body.password = password; // Only include password if provided
            const response = await fetch('http://localhost:5001/api/auth/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
            }
            const data = await response.json();
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('Profile updated successfully:', data.user);
            alert('Profile updated successfully!');
            document.getElementById('userInfo').style.display = 'block';
            editProfileForm.style.display = 'none';
            loadUserProfile(); // Refresh displayed user info
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile. Please try again.');
        }
    });
}

async function fetchWatchedMovies() {
    const watchedMovies = document.getElementById('watchedMovies');
    const token = localStorage.getItem('token');

    if (!token) {
        console.log('No token found, redirecting to login');
        watchedMovies.innerHTML = '<p>Please log in to view watched movies.</p>';
        window.location.href = 'login.html';
        return;
    }

    try {
        console.log('Fetching watched movies');
        const response = await fetch('http://localhost:5001/api/watched', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const watched = await response.json();

        watchedMovies.innerHTML = '';
        if (watched.length === 0) {
            watchedMovies.innerHTML = '<p>No watched movies. (DEBUG: List is empty)</p>';
            return;
        }

        watched.forEach(entry => {
            const movie = entry.movieId;
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');
            movieCard.innerHTML = `
                <a href="movie-details.html?id=${movie._id}">
                    <img src="${movie.poster || 'https://via.placeholder.com/200x300?text=No+Poster'}" alt="${movie.title}">
                    <h3>${movie.title}</h3>
                    <p>Rating: ${entry.rating || 'N/A'}/10</p>
                    <p>Review: ${entry.reviewText || 'No review.'}</p>
                </a>
            `;
            watchedMovies.appendChild(movieCard);
        });
    } catch (error) {
        watchedMovies.innerHTML = '<p>Error loading watched movies. Please try again.</p>';
    }
}

async function fetchWatchlist() {
    const watchlistMovies = document.getElementById('watchlistMovies');
    const token = localStorage.getItem('token');

    if (!token) {
        console.log('No token found, redirecting to login');
        watchlistMovies.innerHTML = '<p>Please log in to view your watchlist.</p>';
        window.location.href = 'login.html';
        return;
    }

    try {
        console.log('Fetching watchlist');
        const response = await fetch('http://localhost:5001/api/watchlist', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const watchlist = await response.json();

        watchlistMovies.innerHTML = '';
        if (watchlist.length === 0) {
            watchlistMovies.innerHTML = '<p>No movies in watchlist. (DEBUG: List is empty)</p>';
            return;
        }

        watchlist.forEach(item => {
            if (!item.movieId || !item.movieId.title) return; // skip invalid
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');
            movieCard.innerHTML = `
                <a href="movie-details.html?id=${item.movieId._id}">
                    <img src="${item.movieId.poster || 'https://via.placeholder.com/200x300?text=No+Poster'}" alt="${item.movieId.title}">
                    <h3>${item.movieId.title}</h3>
                </a>
            `;
            watchlistMovies.appendChild(movieCard);
        });
        console.log('Watchlist loaded:', watchlist.length);
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        watchlistMovies.innerHTML = '<p>Error loading watchlist. Please try again.</p>';
    }
}

// --- Chatbot: Call backend Gemini AI endpoint ---
function setupChatbot() {
    const chatbotButton = document.getElementById('chatbotButton');
    const chatbot = document.getElementById('chatbot');
    const chatbotSubmit = document.getElementById('chatbotSubmit');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotResponse = document.getElementById('chatbotResponse');
    const chatbotContainer = document.getElementById('chatbotContainer');

    if (!chatbotButton || !chatbot || !chatbotSubmit || !chatbotInput || !chatbotResponse || !chatbotContainer) {
        return;
    }

    chatbotButton.addEventListener('click', () => {
        chatbotContainer.classList.toggle('open');
    });

    const closeBtn = chatbot.querySelector('.close-chatbot');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            chatbotContainer.classList.remove('open');
        });
    }

    chatbotSubmit.addEventListener('click', async () => {
        chatbotResponse.innerHTML = '<p>Loading recommendations...</p>';
        const token = localStorage.getItem('token');
        if (!token) {
            chatbotResponse.innerHTML = '<p>Please log in to get recommendations.</p>';
            return;
        }
        try {
            const response = await fetch('http://localhost:5001/api/chatbot/recommendations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
            }
            const data = await response.json();
            chatbotResponse.innerHTML = `<pre>${data.recommendations}</pre>`;
        } catch (error) {
            chatbotResponse.innerHTML = '<p>Error getting recommendations. Please try again.</p>';
        }
    });
}

// Add direct review form logic for movie-details page
if (document.getElementById('movieDetails')) {
    const reviewsSection = document.querySelector('.reviews-section');
    let directReviewForm;
    if (reviewsSection && !document.getElementById('directReviewForm')) {
        const form = document.createElement('form');
        form.id = 'directReviewForm';
        form.style.display = 'none';
        form.innerHTML = `
            <h3>Add a Review</h3>
            <input type="number" id="directRating" min="1" max="10" placeholder="Rating (1-10)" required>
            <textarea id="directReviewText" placeholder="Write your review..." required></textarea>
            <button type="submit">Submit Review</button>
        `;
        reviewsSection.insertBefore(form, reviewsSection.firstChild);
        directReviewForm = form;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const movieId = new URLSearchParams(window.location.search).get('id');
            const rating = document.getElementById('directRating').value;
            const reviewText = document.getElementById('directReviewText').value;
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please log in to submit a review.');
                window.location.href = 'login.html';
                return;
            }
            try {
                const response = await fetch('http://localhost:5001/api/reviews', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ movieId, rating, reviewText })
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
                }
                alert('Review submitted successfully!');
                fetchReviews();
                form.reset();
            } catch (error) {
                alert('Error submitting review. Please try again.');
            }
        });
    } else {
        directReviewForm = document.getElementById('directReviewForm');
    }
    // Toggle review form visibility based on trackingAction
    const trackingAction = document.getElementById('trackingAction');
    if (trackingAction && directReviewForm) {
        trackingAction.addEventListener('change', () => {
            if (trackingAction.value === 'watched') {
                directReviewForm.style.display = 'block';
            } else {
                directReviewForm.style.display = 'none';
            }
        });
        // Set initial state
        if (trackingAction.value === 'watched') {
            directReviewForm.style.display = 'block';
        } else {
            directReviewForm.style.display = 'none';
        }
    }
}

// Remove debug border/background for movie-card in profile
// (No debug CSS injection)
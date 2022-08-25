const api = axios.create({
    baseURL: 'https://api.themoviedb.org/3',
    headers: {
        'Content-Type': 'application/json;charset=utf-8',
    },
    params: {
        'api_key': API_KEY
    }
});

let observer = new IntersectionObserver(images => {
    images.forEach(image => {
        
        if (image.isIntersecting) {
            let source = image.target.getAttribute('data-image');
            image.target.setAttribute('src', source);
        }
    })
});

let loadMoreMoviesObserver = new IntersectionObserver((loadMoreObjetcs) => {
    loadMoreObjetcs.forEach(loadMoreButton => {
        
        if (loadMoreButton.isIntersecting) {
            loadMoreButton.target.click();
        }
    })
})

// Utils

function createMoviesMarkup(movies, container, clean = true) {

    if (clean) {
        container.innerHTML = '';
    }

    movies.forEach(movie => {
        const movieContainer = document.createElement('div');
        movieContainer.classList.add('movie-container');

        const movieImg = document.createElement('img');
        movieImg.classList.add('movie-img');
        movieImg.setAttribute('alt', movie.title);
        movieImg.setAttribute('data-image', `https://image.tmdb.org/t/p/w300${movie.poster_path}`)

        // Evento para cuando una imagen no carga.
        movieImg.addEventListener('error', () => {
            movieImg.setAttribute(
                'src',
                'https://via.placeholder.com/200x300?text=Upss'
                );
        })

        // Observa la imagen para agregar lazy load.`
        observer.observe(movieImg);

        movieContainer.appendChild(movieImg);
        container.appendChild(movieContainer);

        movieContainer.addEventListener('click', () => {
            location.hash = `#movie=${movie.id}`;
        })
    });
}

function createCategoriesMarkup(categories, container) {
    container.innerHTML = '';

    categories.forEach(category => {
        const categoryContainer = document.createElement('div');
        categoryContainer.classList.add('category-container');

        const categoryTitle = document.createElement('h3');
        const categoryTitleText = document.createTextNode(category.name);
        
        categoryTitle.classList.add('category-title');
        categoryTitle.setAttribute('id', `id${category.id}`);
        categoryTitle.addEventListener('click', () => location.hash = `#category=${category.id}-${category.name}`)

        categoryTitle.appendChild(categoryTitleText);
        categoryContainer.appendChild(categoryTitle);
        container.appendChild(categoryContainer);

    });
}

// Llamados a la API
async function getTrendingMoviesPreview() {
    const {data} = await api('/trending/movie/day');

    const movies = data.results;

    createMoviesMarkup(movies, trendingMoviesPreviewList);
}

function loadMoreMoviesBtnHandler( url, currentPage, totalPages, container, extraParams ) {
    
    if (currentPage < totalPages) {
        const loadMoreBtn = document.createElement('button');

        loadMoreBtn.classList.add('loadMore');
        loadMoreBtn.innerText = 'Load More';
        loadMoreBtn.setAttribute('data-page', currentPage);
        loadMoreMoviesObserver.observe(loadMoreBtn);

        container.appendChild(loadMoreBtn);

        loadMoreBtn.addEventListener('click', async () => {
            let newCurrentPage = parseInt(loadMoreBtn.getAttribute('data-page')) + 1;

            const {data} = await api(url, {
                params: {
                    page: newCurrentPage,
                    ...extraParams
                }}
            );

            createMoviesMarkup(data.results, container, false);

            let lastNode = container.querySelector('.movie-container:last-child');
            lastNode.parentNode.insertBefore(loadMoreBtn, lastNode.nextSibling);
            loadMoreBtn.setAttribute('data-page', newCurrentPage);
        })
    }
    else {
        let loadMore = container.querySelectorAll('.loadMore');

        if ( loadMore.length ) {
            loadMore[0].remove();
        }
    }
}

async function getTrendingMovies() {
    const endPoint = '/trending/movie/day';
    const {data} = await api(endPoint);

    const movies = data.results;

    createMoviesMarkup(movies, genericSection);
    loadMoreMoviesBtnHandler(endPoint, data.page, data.total_pages, genericSection);
}

async function getCategoriesPreview() {
    const {data} = await api('/genre/movie/list');

    const categories = data.genres;
    
    createCategoriesMarkup(categories, categoriesPreviewList);
}

async function getMoviesByCategory(id) {
    const endPoint = '/discover/movie';
    const {data} = await api(endPoint, {
        params: {
            with_genres: id,
        }
    });

    const movies = data.results;

    createMoviesMarkup(movies, genericSection);
    loadMoreMoviesBtnHandler(endPoint, data.page, data.total_pages, genericSection, {with_genres: id});
}

async function getMoviesBySearch(query) {
    const endPoint = '/search/movie';
    const {data} = await api(endPoint, {
        params: {
            query,
        }
    });

    const movies = data.results;

    createMoviesMarkup(movies, genericSection);
    loadMoreMoviesBtnHandler(endPoint, data.page, data.total_pages, genericSection, {query});
}

async function getMovieById(id) {
    
    // Se deconstruye el objeto trayendo la clave data y se renombre movie agregandole los dos puntos {data:movie}.
    const {data: movie} = await api(`/movie/${id}`);

    const movieImgUrl = `https://image.tmdb.org/t/p/w500/${movie.poster_path}`;
    headerSection.style.background = `
        linear-gradient(180deg, rgba(0, 0, 0, 0.35) 19.27%, rgba(0, 0, 0, 0) 29.17%), 
        url(${movieImgUrl})
    `;

    movieDetailTitle.innerText = movie.title;
    movieDetailDescription.innerText = movie.overview;
    movieDetailScore.innerText = movie.vote_average;

    createCategoriesMarkup(movie.genres, movieDetailCategoriesList);
    getRelatedMoviesById(id);
}

async function getRelatedMoviesById(id) {
    const {data} = await api(`/movie/${id}/recommendations`);
    const relatedMovies = data.results;

    createMoviesMarkup(relatedMovies, relatedMoviesContainer);
}
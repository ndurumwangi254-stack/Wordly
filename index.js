//setting up the API and Dom elements
const API_BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

const elements = {
    form: document.getElementById('searchForm'),
    input: document.getElementById('searchInput'),
    error: document.getElementById('errorMessage'),
    loading: document.getElementById('loadingSpinner'),
    results: document.getElementById('resultsSection'),
    audioButton: document.getElementById('audioButton'),
    title: document.getElementById('wordTitle'),
    phonetic: document.getElementById('phonetic'),
    meanings: document.getElementById('meaningsContainer'),
    synonymsSection: document.getElementById('synonymsSection'),
    synonymsList: document.getElementById('synonymsList'),
    antonymsSection: document.getElementById('antonymsSection'),
    antonymsList: document.getElementById('antonymsList'),
    sourceSection: document.getElementById('sourceSection'),
    sourceLink: document.getElementById('sourceLink')
};

//my event handlers
elements.form.addEventListener('submit', handleSearch);
elements.audioButton.addEventListener('click', handleAudioPlayback);

//my events flow
async function handleSearch(event) {
    event.preventDefault();
    const word = elements.input.value.trim();
    if (!word) return showError('Please enter a word to search.');
    clearError();
    clearResults();
    await fetchWord(word);
}

async function fetchWord(word) {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(word.toLowerCase())}`);
        if (!response.ok) return handleApiError(response.status, word);
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return showError(`No results found for "${word}".`);
        displayResults(data[0]);
    } 
    catch (error) {
        console.log(error);
        showError('Unable to connect to the dictionary service. Please check your internet connection.');
    } 
    finally {
        showLoading(false);
    }
}

function handleApiError(status, word) {
    if (status === 404) showError(`Sorry, we couldn't find "${word}". Please try another word.`);
    else if (status === 429) showError('Too many requests. Please wait a moment and try again.');
    else showError('An error occurred while fetching data. Please try again.');
}
//Data display
function displayResults(data) {
    displayWordHeader(data);
    displayMeanings(data);
    renderWordList(data, 'synonyms');
    renderWordList(data, 'antonyms');
    displaySource(data);
    elements.results.classList.remove('hidden');
    elements.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function displayWordHeader(data) {
    elements.title.textContent = data.word || 'Unknown';
    elements.phonetic.textContent = data.phonetic ? `/${data.phonetic}/` : data.phonetics?.find(item => item.text)?.text ? `/${data.phonetics.find(item => item.text).text}/` : 'Pronunciation not available';
    const audioUrl = data.phonetics?.find(item => item.audio)?.audio || '';
    elements.audioButton.disabled = !audioUrl;
    elements.audioButton.dataset.audioUrl = audioUrl;
    elements.audioButton.title = audioUrl ? 'Play pronunciation' : 'Audio pronunciation not available';
}
//meanings
function displayMeanings(data) {
    elements.meanings.innerHTML = '';
    if (!Array.isArray(data.meanings) || data.meanings.length === 0) {
        elements.meanings.innerHTML = '<p>No definitions found.</p>';
        return;
    }
    data.meanings.forEach(meaning => {
        const meaningDiv = document.createElement('div');
        meaningDiv.className = 'meaning';

        const posHeader = document.createElement('div');
        posHeader.className = 'pos-header';
        posHeader.textContent = meaning.partOfSpeech || 'Unknown';
        meaningDiv.appendChild(posHeader);

        const definitionsDiv = document.createElement('div');
        definitionsDiv.className = 'definitions';

        const header = document.createElement('h4');
        header.textContent = 'Definitions';
        definitionsDiv.appendChild(header);

        meaning.definitions?.forEach(def => {
            const item = document.createElement('div');
            item.className = 'definition-item';

            const text = document.createElement('div');
            text.className = 'definition-text';
            text.textContent = def.definition || 'No definition available.';
            item.appendChild(text);

            if (def.example) {
                const example = document.createElement('div');
                example.className = 'example';
                example.textContent = `"${def.example}"`;
                item.appendChild(example);
            }
            definitionsDiv.appendChild(item);
        });
        meaningDiv.appendChild(definitionsDiv);
        elements.meanings.appendChild(meaningDiv);
    });
}

function renderWordList(data, type) {
    const section = type === 'synonyms' ? elements.synonymsSection : elements.antonymsSection;
    const list = type === 'synonyms' ? elements.synonymsList : elements.antonymsList;
    const words = [...new Set(data.meanings?.flatMap(m => m[type] || []) || [])];
    if (words.length === 0) return section.classList.add('hidden');
    list.innerHTML = '';
    words.forEach(word => {
        const tag = document.createElement('span');
        tag.className = type.slice(0, -1);
        tag.textContent = word;
        tag.role = 'button';
        tag.tabIndex = 0;
        tag.addEventListener('click', () => searchForWord(word));
        tag.addEventListener('keydown', e => { if (e.key === 'Enter') searchForWord(word); });
        list.appendChild(tag);
    });
    section.classList.remove('hidden');
}

function displaySource(data) {
    if (!Array.isArray(data.sourceUrls) || data.sourceUrls.length === 0) return elements.sourceSection.classList.add('hidden');
    elements.sourceLink.href = data.sourceUrls[0];
    elements.sourceLink.textContent = data.sourceUrls[0];
    elements.sourceSection.classList.remove('hidden');
}
//interactive features
function handleAudioPlayback() {
    const url = elements.audioButton.dataset.audioUrl;
    if (!url) return showError('Audio pronunciation is not available for this word.');
    new Audio(url).play().catch(() => showError('Unable to play audio right now. Please try again later.'));
}

function searchForWord(word) {
    elements.input.value = word;
    clearError();
    clearResults();
    fetchWord(word);
}
//utility functions
function showError(message) {
    elements.error.textContent = message;
    elements.error.classList.add('show');
}

function clearError() {
    elements.error.textContent = '';
    elements.error.classList.remove('show');
}

function showLoading(show) {
    elements.loading.classList.toggle('hidden', !show);
}

function clearResults() {
    elements.results.classList.add('hidden');
    elements.meanings.innerHTML = '';
    elements.synonymsList.innerHTML = '';
    elements.antonymsList.innerHTML = '';
    elements.audioButton.disabled = true;
    elements.audioButton.dataset.audioUrl = '';
}




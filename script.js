/* North Star Bakery - Touchstone 4
   Feature: "My Pre-order List" (products.html) saved in localStorage and carried to the
   pre-order form (contact.html), plus JavaScript form validation with remembered contact details. */

/* ---------- Data ---------- */
const STORAGE_KEYS = {
    favorites: 'northStarFavorites',   // array of product ids
    contact: 'northStarContact'        // object { fullname, email }
};

const PRODUCTS = [
    { id: 'country-sourdough', name: 'Country Sourdough Loaf', price: 7.50 },
    { id: 'seeded-multigrain', name: 'Seeded Multigrain Boule', price: 8.00 },
    { id: 'rosemary-garlic', name: 'Rosemary Garlic Loaf', price: 8.50 },
    { id: 'butter-croissant', name: 'All-Butter Croissant', price: 4.00 },
    { id: 'almond-croissant', name: 'Almond Frangipane Croissant', price: 5.00 },
    { id: 'berry-danish', name: 'Seasonal Berry Danish', price: 4.50 }
];

/* Validation rules: each returns an error message, or '' when the value is valid */
const FIELD_RULES = {
    fullname: (value) => {
        if (value.trim() === '') return 'Please enter your full name.';
        if (value.trim().length < 2) return 'Your name must be at least 2 characters long.';
        return '';
    },
    email: (value) => {
        if (value.trim() === '') return 'Please enter your email address.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
            return 'Please enter a valid email address, like name@example.com.';
        }
        return '';
    },
    'pickup-date': (value) => {
        if (value === '') return 'Please choose a pickup date.';
        const picked = new Date(value + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (picked < today) return 'Pickup date cannot be in the past.';
        if (picked.getDay() === 1) return 'We are closed on Mondays. Please choose Tuesday through Sunday.';
        return '';
    },
    'request-type': (value) => (value === '' ? 'Please choose a request type.' : ''),
    'item-details': (value) => {
        if (value.trim() === '') return 'Please list the items and quantities you would like.';
        if (value.trim().length < 10) return 'Please give a little more detail (at least 10 characters).';
        return '';
    },
    'allergy-notes': (value) => (value.length > 100 ? 'Allergy notes must be 100 characters or fewer.' : '')
};

/* ---------- Storage helpers (wrapped in try/catch in case storage is blocked) ---------- */
function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        /* storage unavailable: the site still works, it just will not remember anything */
    }
}

/* ---------- Pre-order list feature ---------- */
function getFavorites() {
    return readStorage(STORAGE_KEYS.favorites, []).filter((id) => PRODUCTS.some((p) => p.id === id));
}

function toggleFavorite(id) {
    const favorites = getFavorites();
    const index = favorites.indexOf(id);
    if (index === -1) {
        favorites.push(id);
    } else {
        favorites.splice(index, 1);
    }
    writeStorage(STORAGE_KEYS.favorites, favorites);
    renderFavoritesPage();
}

function clearFavorites() {
    writeStorage(STORAGE_KEYS.favorites, []);
    renderFavoritesPage();
}

function addFavoriteButtons() {
    document.querySelectorAll('li[data-id]').forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'fav-btn';
        button.dataset.id = item.dataset.id;
        button.addEventListener('click', () => toggleFavorite(item.dataset.id));
        item.appendChild(button);
    });
}

function updateButtons() {
    const favorites = getFavorites();
    document.querySelectorAll('.fav-btn').forEach((button) => {
        const saved = favorites.includes(button.dataset.id);
        const product = PRODUCTS.find((p) => p.id === button.dataset.id);
        button.setAttribute('aria-pressed', saved ? 'true' : 'false');
        button.textContent = saved ? 'Saved \u2713' : 'Add to list';
        button.setAttribute('aria-label', (saved ? 'Remove ' : 'Add ') + product.name + (saved ? ' from' : ' to') + ' my pre-order list');
    });
}

function renderFavoritesList() {
    const list = document.getElementById('favorites-list');
    const empty = document.getElementById('favorites-empty');
    const summary = document.getElementById('favorites-summary');
    const clearButton = document.getElementById('clear-favorites');
    const chosen = getFavorites().map((id) => PRODUCTS.find((p) => p.id === id));

    list.innerHTML = '';
    chosen.forEach((product) => {
        const li = document.createElement('li');
        li.textContent = product.name + ' \u2014 $' + product.price.toFixed(2);
        list.appendChild(li);
    });

    const total = chosen.reduce((sum, product) => sum + product.price, 0);
    empty.hidden = chosen.length > 0;
    summary.hidden = chosen.length === 0;
    clearButton.hidden = chosen.length === 0;
    summary.textContent = chosen.length + (chosen.length === 1 ? ' item' : ' items') + ' \u2022 Estimated total: $' + total.toFixed(2);
}

function renderFavoritesPage() {
    updateButtons();
    renderFavoritesList();
}

function initProductsPage() {
    addFavoriteButtons();
    document.getElementById('clear-favorites').addEventListener('click', clearFavorites);
    renderFavoritesPage();
}

/* ---------- Contact form: validation ---------- */
function getErrorElement(field) {
    let error = document.getElementById(field.id + '-error');
    if (!error) {
        error = document.createElement('span');
        error.id = field.id + '-error';
        error.className = 'error';
        field.parentElement.appendChild(error);
        field.setAttribute('aria-describedby', error.id);
    }
    return error;
}

function showError(field, message) {
    const error = getErrorElement(field);
    error.textContent = message ? 'Error: ' + message : '';
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    field.classList.toggle('invalid', Boolean(message));
}

function validateField(field) {
    const rule = FIELD_RULES[field.id];
    const message = rule ? rule(field.value) : '';
    showError(field, message);
    return message === '';
}

function validateForm(form) {
    let firstInvalid = null;
    Object.keys(FIELD_RULES).forEach((id) => {
        const field = form.querySelector('#' + id);
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) firstInvalid.focus();
    return firstInvalid === null;
}

/* ---------- Contact form: storage and prefill ---------- */
function loadSavedContact(form) {
    const saved = readStorage(STORAGE_KEYS.contact, {});
    if (saved.fullname) form.querySelector('#fullname').value = saved.fullname;
    if (saved.email) form.querySelector('#email').value = saved.email;
}

function saveContact(form) {
    writeStorage(STORAGE_KEYS.contact, {
        fullname: form.querySelector('#fullname').value.trim(),
        email: form.querySelector('#email').value.trim()
    });
}

function prefillItemsFromList(form) {
    const textarea = form.querySelector('#item-details');
    const chosen = getFavorites().map((id) => PRODUCTS.find((p) => p.id === id));
    if (chosen.length === 0 || textarea.value.trim() !== '') return;

    textarea.value = chosen.map((product) => '1 x ' + product.name).join('\n');
    const note = document.createElement('span');
    note.className = 'note';
    note.textContent = 'Filled in from your saved pre-order list. Change the quantities as needed.';
    textarea.parentElement.appendChild(note);
}

function setMinimumDate(form) {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    form.querySelector('#pickup-date').min = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
}

function handleSubmit(event, form) {
    event.preventDefault();
    const status = document.getElementById('form-status');
    if (!validateForm(form)) {
        status.textContent = 'Please fix the highlighted fields and try again.';
        status.className = 'status status-error';
        return;
    }
    saveContact(form);
    status.textContent = 'Thank you, ' + form.querySelector('#fullname').value.trim() + '! Your request was received. We will email you to confirm.';
    status.className = 'status status-success';
}

function initContactPage() {
    const form = document.querySelector('form');
    setMinimumDate(form);
    loadSavedContact(form);
    prefillItemsFromList(form);

    form.addEventListener('submit', (event) => handleSubmit(event, form));
    form.querySelectorAll('input, select, textarea').forEach((field) => {
        /* Errors appear on submit. After that, each field is re-checked as the user edits it, so the message
           clears as soon as the problem is fixed. (Checking on blur moved the layout and made the Submit
           button miss clicks, so it is not used.) */
        const recheck = () => {
            if (field.classList.contains('invalid')) validateField(field);
        };
        field.addEventListener('input', recheck);
        field.addEventListener('change', recheck);
    });
}

/* ---------- Start ---------- */
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('favorites-list')) initProductsPage();
    if (document.getElementById('item-details')) initContactPage();
});

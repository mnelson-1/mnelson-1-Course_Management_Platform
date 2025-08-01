let currentLanguage = 'en';

document.addEventListener('DOMContentLoaded', function() {
    // Load saved language or default to English
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
    changeLanguage(savedLanguage);
    
    // Set up language buttons
    document.getElementById('en-btn').addEventListener('click', () => changeLanguage('en'));
    document.getElementById('fr-btn').addEventListener('click', () => changeLanguage('fr'));
    document.getElementById('es-btn').addEventListener('click', () => changeLanguage('es'));
});

function changeLanguage(language) {
    // Update active button
    document.querySelectorAll('.language-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${language}-btn`).classList.add('active');
    
    // Update UI text (questions only)
    const langData = translations[language];
    for (const [key, value] of Object.entries(langData)) {
        const element = document.getElementById(key);
        if (element) element.textContent = value;
    }
    
    currentLanguage = language;
    localStorage.setItem('preferredLanguage', language);
}
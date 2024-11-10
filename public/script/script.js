// Handle Catalog Dropdown
const catalogDropdown = document.querySelector('.relative.inline-block button');
const catalogMenu = document.querySelector('.dropdown-menu');
const catalogChevron = document.querySelector('.chevron');

catalogDropdown.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event from bubbling up to the document
    catalogMenu.classList.toggle('opacity-100');
    catalogMenu.classList.toggle('translate-y-0');
    catalogChevron.classList.toggle('rotate-180');
});

// Handle Profile Dropdown
const profileDropdown = document.querySelectorAll('.relative.inline-block button')[1]; // Target second button (profile)
const profileMenu = document.getElementById("dropdownMenu");

profileDropdown.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event from bubbling up to the document
    profileMenu.classList.toggle("hidden");
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    // Close the catalog dropdown if clicking outside
    if (!catalogDropdown.contains(e.target)) {
        catalogMenu.classList.remove('opacity-100', 'translate-y-0');
        catalogChevron.classList.remove('rotate-180');
    }
    
    // Close the profile dropdown if clicking outside
    if (!profileDropdown.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.add("hidden");
    }
});

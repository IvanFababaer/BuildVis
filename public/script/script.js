// Handle Catalog Dropdown
const catalogDropdown = document.querySelector('.relative.inline-block button');
const catalogMenu = document.querySelector('.dropdown-menu');
const catalogChevron = document.querySelector('.chevron');

catalogDropdown.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event from bubbling up to the document

    // Toggle catalog dropdown
    const isVisible = catalogMenu.classList.contains('opacity-100');
    closeAllDropdowns(); // Close other dropdowns first
    if (!isVisible) {
        catalogMenu.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
        catalogMenu.classList.remove('opacity-0', '-translate-y-2', 'pointer-events-none');
        catalogChevron.classList.add('rotate-180');
    }
});

// Handle Profile Dropdown
const profileDropdown = document.querySelectorAll('.relative.inline-block button')[1]; // Target second button (profile)
const profileMenu = document.getElementById('dropdownMenu');

profileDropdown.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event from bubbling up to the document

    // Toggle profile dropdown
    const isVisible = !profileMenu.classList.contains('hidden');
    closeAllDropdowns(); // Close other dropdowns first
    if (!isVisible) {
        profileMenu.classList.remove('hidden', 'pointer-events-none');
        profileMenu.classList.add('pointer-events-auto');
    }
});

// Close all dropdowns
function closeAllDropdowns() {
    // Close Catalog
    catalogMenu.classList.add('opacity-0', '-translate-y-2', 'pointer-events-none');
    catalogMenu.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
    catalogChevron.classList.remove('rotate-180');

    // Close Profile
    profileMenu.classList.add('hidden', 'pointer-events-none');
    profileMenu.classList.remove('pointer-events-auto');
}

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
    closeAllDropdowns(); // Close all dropdowns when clicking outside
});

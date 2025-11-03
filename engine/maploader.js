// engine/maploader.js

/**
 * Loads the entity map and handles fetching errors.
 */
export function loadEntityMap() {
    return fetch('path/to/entity-map.json')
        .then(response => {
            if (!response.ok) {
                console.warn('Failed to fetch entity map:', response.statusText);
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.warn('Error fetching entity map:', error);
        });
}

/**
 * Fetches an entity by ID with error handling.
 * @param {string} id - The ID of the entity to fetch.
 * @returns {Promise} - A promise that resolves to the entity data or null.
 */
export function fetchEntityById(id) {
    return fetch(`path/to/entities/${id}.json`)
        .then(response => {
            if (!response.ok) {
                console.warn('Failed to fetch entity:', response.statusText);
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.warn(`Error fetching entity ${id}:`, error);
            return null;
        });
}

// Other exported functions and classes with similar error handling and JSDoc comments
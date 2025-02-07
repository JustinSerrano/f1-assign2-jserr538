/* modules/initialize.js 

This project has been developed with guidance and assistance from ChatGPT, a conversational AI by OpenAI.
*/

import { populateSeasons, navigateToHome } from './uiHelper.js';
import { addDialogListeners } from './eventHandlers.js';

/**
 * Initializes the application, setting up initial states and event listeners.
 */
export function initializeApp() {
    try {
        // Query necessary DOM elements
        const browseLoader = document.querySelector("#browseLoader");
        const browseSection = document.querySelector("#browse");
        const homeSection = document.querySelector("#home");
        const resultsSection = document.querySelector("#raceResults");

        // Ensure all required elements exist
        if (!browseLoader || !browseSection || !homeSection || !resultsSection) {
            throw new Error("One or more required DOM elements are missing.");
        }

        // Hide initial sections
        browseLoader.style.display = "none";
        browseSection.style.display = "none";
        resultsSection.style.display = "none";

        // Populate season dropdown
        populateSeasons();

        // Add event listener for season selection
        document.querySelector("#seasonList").addEventListener("change", async (e) => {
            const selectedSeason = e.target.value;

            try {
                // Dynamically import and handle season selection
                const { handleSeasonSelection } = await import('./dataService.js');
                handleSeasonSelection(selectedSeason, homeSection, browseLoader, browseSection);
            } catch (error) {
                console.error("Error loading dataService.js or handling season selection:", error);
            }
        });

        // Add event listener for returning to home
        document.querySelector("#homeLogo").addEventListener("click", () => {
            navigateToHome(homeSection, browseSection);
        });

        // Add dialog close and outside click listeners
        addDialogListeners();
    } catch (error) {
        console.error("Error initializing the application:", error);
    }
}

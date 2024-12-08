// Domain for APIs
const API_DOMAIN = "https://www.randyconnolly.com/funwebdev/3rd/api/f1";

// Execute script once DOM content is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    const browseLoader = document.querySelector("#browseLoader");
    const browseSection = document.querySelector("#browse");
    const homeSection = document.querySelector("#home");

    // Hide initial sections
    browseLoader.style.display = "none";
    browseSection.style.display = "none";

    // Populate season dropdown
    populateSeasons();

    // Event listener for season selection
    document.querySelector("#seasonList").addEventListener("change", (e) => {
        const selectedSeason = e.target.value;
        handleSeasonSelection(selectedSeason, homeSection, browseLoader, browseSection);
    });

    // Event listener for returning to home
    document.querySelector("#mruLogo").addEventListener("click", () => {
        navigateToHome(homeSection, browseSection);
    });

    // Event listeners for closing dialogs
    addDialogCloseListeners();

    // Event listeners for clicking outside dialogs to close
    addOutsideClickListeners();
}

// Handle season selection
function handleSeasonSelection(selectedSeason, homeSection, browseLoader, browseSection) {
    const racesKey = `races_${selectedSeason}`;
    const resultsKey = `results_${selectedSeason}`;
    const qualifyingKey = `qualifying_${selectedSeason}`;

    homeSection.style.display = "none";
    browseLoader.style.display = "flex";
    browseSection.style.display = "none";

    let racesData = localStorage.getItem(racesKey);
    let qualifyingData = localStorage.getItem(qualifyingKey);
    let resultsData = localStorage.getItem(resultsKey);

    if (!(racesData && qualifyingData && resultsData)) {
        // Fetch and cache data if not already stored
        fetchSeasonData(selectedSeason).then((data) => {
            cacheSeasonData(racesKey, resultsKey, qualifyingKey, data);
            displayRaces(data[0], data[1], data[2], selectedSeason, browseLoader, browseSection);
        }).catch((error) => {
            console.error("Data fetch failed:", error);
            alert("Failed to fetch data. Please try again.");
            browseLoader.style.display = "none";
        });
    } else {
        // Use cached data
        racesData = JSON.parse(racesData);
        qualifyingData = JSON.parse(qualifyingData);
        resultsData = JSON.parse(resultsData);
        displayRaces(racesData, qualifyingData, resultsData, selectedSeason, browseLoader, browseSection);
    }
}

// Navigate back to home
function navigateToHome(homeSection, browseSection) {
    homeSection.style.display = "block";
    browseSection.style.display = "none";

    document.querySelector("#raceResults").style.display = "none";
    document.querySelector("#qualifying").innerHTML = "";
    document.querySelector("#results").innerHTML = "";
    document.querySelector("#seasonList").value = "";
}

// Populate season dropdown
function populateSeasons() {
    const seasons = [2020, 2021, 2022, 2023];
    const select = document.querySelector("#seasonList");

    const placeholder = document.createElement("option");
    placeholder.textContent = "Select a season";
    placeholder.value = "";
    placeholder.selected = true;
    placeholder.disabled = true;
    select.appendChild(placeholder);

    seasons.forEach((season) => {
        const option = document.createElement("option");
        option.textContent = season;
        option.value = season;
        select.appendChild(option);
    });
}

// Fetch season data
function fetchSeasonData(season) {
    const racePromise = fetch(`${API_DOMAIN}/races.php?season=${season}`).then((res) => res.json());
    const resultsPromise = fetch(`${API_DOMAIN}/results.php?season=${season}`).then((res) => res.json());
    const qualifyingPromise = fetch(`${API_DOMAIN}/qualifying.php?season=${season}`).then((res) => res.json());
    return Promise.all([racePromise, resultsPromise, qualifyingPromise]);
}

// Cache season data in localStorage
function cacheSeasonData(racesKey, resultsKey, qualifyingKey, data) {
    localStorage.setItem(racesKey, JSON.stringify(data[0]));
    localStorage.setItem(resultsKey, JSON.stringify(data[1]));
    localStorage.setItem(qualifyingKey, JSON.stringify(data[2]));
}

// Display races
function displayRaces(racesData, qualifyingData, resultsData, season, loader, section) {
    loader.style.display = "none";
    section.style.display = "flex";

    const races = document.querySelector("#races");
    races.innerHTML = `<h2>${season} Races</h2>`;

    const headers = ["Round", "Race Name"];
    const rows = racesData.sort((a, b) => a.round - b.round).map((race) => [
        race.round,
        createHyperlink(race.name, () => populateRaceDetails(race, qualifyingData, resultsData))
    ]);

    const table = createTable(headers, rows);
    races.appendChild(table);
}

// Create table
function createTable(headers, rows) {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headers.forEach((header) => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach((row) => {
        const tr = document.createElement("tr");
        row.forEach((cell) => {
            const td = document.createElement("td");
            if (cell instanceof HTMLElement) td.appendChild(cell);
            else td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
}


// Populate race details
function populateRaceDetails(race, qualifyingData, resultsData) {
    const resultsSection = document.querySelector("#raceResults");
    document.querySelector("#raceResults h2").innerHTML = `Results for ${race.year} <button class="hyperlink-style" id="circuitLink">${race.name}</button>`;

    document.querySelector("#circuitLink").addEventListener("click", () => showDialog("circuit", race.circuit));

    populateTable("#qualifying", "Qualifying", qualifyingData, race, ["Position", "Driver", "Constructor", "Q1", "Q2", "Q3"]);
    populateTable("#results", "Race Results", resultsData, race, ["Position", "Driver", "Constructor", "Laps", "Points"]);

    resultsSection.style.display = "flex";
}

// Populate a table with data
function populateTable(selector, title, data, race, headers) {
    const container = document.querySelector(selector);
    container.innerHTML = `<h3>${title}</h3>`;

    // Determine rows based on header context
    const rows = data
        .filter((item) => item.race.round === race.round)
        .map((item) => {
            if (headers.includes("Q1")) {
                // For Qualifying Table
                return [
                    item.position,
                    createHyperlink(`${item.driver?.forename || ""} ${item.driver?.surname || ""}`, () => showDialog("driver", item.driver)),
                    createHyperlink(item.constructor?.name, () => showDialog("constructor", item.constructor)),
                    item.q1 || "-",
                    item.q2 || "-",
                    item.q3 || "-",
                ];
            } else {
                // For Race Results Table
                return [
                    item.position,
                    createHyperlink(`${item.driver?.forename || ""} ${item.driver?.surname || ""}`, () => showDialog("driver", item.driver)),
                    createHyperlink(item.constructor?.name, () => showDialog("constructor", item.constructor)),
                    item.laps || "-",
                    item.points || "-",
                ];
            }
        });

    container.appendChild(createTable(headers, rows));
}


// Create hyperlink
function createHyperlink(text, action) {
    const link = document.createElement("button");
    link.textContent = text;
    link.classList.add("hyperlink-style");
    link.addEventListener("click", action);
    return link;
}

// Modal class to handle dynamic rendering
class Modal {
    constructor(type, data, resultsData = [], selectedSeason = null) {
        this.type = type;
        this.data = data;
        this.resultsData = resultsData;
        this.selectedSeason = selectedSeason;
    }

    async render() {
        const dialog = document.querySelector(`#${this.type}`);
        const detailsList = dialog.querySelector(`#${this.type}Details`);

        try {
            // Fetch specific data
            const fetchedData = await this.fetchDetails();

            let content = "";
            if (this.type === "circuit") {
                content = this.renderCircuit(fetchedData);
            } else if (this.type === "driver") {
                content = this.renderDriver(fetchedData);
            } else if (this.type === "constructor") {
                content = this.renderConstructor(fetchedData);
            }

            detailsList.innerHTML = content;
            dialog.showModal();
        } catch (error) {
            console.error(`Error fetching ${this.type} data:`, error);
            detailsList.innerHTML = `<li>Error loading details. Please try again later.</li>`;
            dialog.showModal();
        }
    }

    async fetchDetails() {
        let endpoint;
        switch (this.type) {
            case "circuit":
                endpoint = `${API_DOMAIN}/circuits.php`;
                break;
            case "driver":
                endpoint = `${API_DOMAIN}/drivers.php`;
                break;
            case "constructor":
                endpoint = `${API_DOMAIN}/constructors.php`;
                break;
            default:
                throw new Error("Invalid type for fetching details");
        }

        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Failed to fetch ${this.type} details`);

        const data = await response.json();
        const matchedData = data.find(
            (item) => item.id === this.data.id || item.name === this.data.name
        );

        if (!matchedData) throw new Error(`No matching ${this.type} found`);
        return matchedData;
    }

    renderCircuit(circuitData) {
        return `
            <li><strong>Name:</strong> ${circuitData.name}</li>
            <li><strong>Location:</strong> ${circuitData.location}, ${circuitData.country}</li>
            <li><strong>URL:</strong> <a href="${circuitData.url}" target="_blank">${circuitData.url}</a></li>
        `;
    }

    renderDriver(driverData) {
        const raceResults = this.resultsData
            .filter((r) => r.driver.forename === driverData.forename && r.driver.surname === driverData.surname)
            .sort((a, b) => a.race.round - b.race.round)
            .map(
                (r) =>
                    `<li>Round ${r.race.round}: Constructor: ${r.constructor.name}, Position: ${r.position}, Points: ${r.points}</li>`
            );

        return `
            <li><strong>Name:</strong> ${driverData.forename} ${driverData.surname}</li>
            <li><strong>Date of Birth:</strong> ${driverData.dob}</li>
            <li><strong>Nationality:</strong> ${driverData.nationality}</li>
            <li><strong>URL:</strong> <a href="${driverData.url}" target="_blank">${driverData.url}</a></li>
            <h3>Race Results (${this.selectedSeason})</h3>
            ${this.createScrollableList(raceResults)}
        `;
    }

    renderConstructor(constructorData) {
        const raceResults = this.resultsData
            .filter((r) => r.constructor.name === constructorData.name)
            .sort((a, b) => a.race.round - b.race.round)
            .map(
                (r) =>
                    `<li>Round ${r.race.round}: Driver: ${r.driver.forename} ${r.driver.surname}, Position: ${r.position}, Points: ${r.points}</li>`
            );

        return `
            <li><strong>Name:</strong> ${constructorData.name}</li>
            <li><strong>Nationality:</strong> ${constructorData.nationality}</li>
            <li><strong>URL:</strong> <a href="${constructorData.url}" target="_blank">${constructorData.url}</a></li>
            <h3>Race Results (${this.selectedSeason})</h3>
            ${this.createScrollableList(raceResults)}
        `;
    }

    createScrollableList(items) {
        return `
            <ul style="max-height: 200px; overflow-y: auto; padding: 10px; border: 1px solid #ddd;">
                ${items.join("")}
            </ul>
        `;
    }
}

// Helper function to show a modal
function showDialog(type, data, resultsData = [], selectedSeason = null) {
    const modal = new Modal(type, data, resultsData, selectedSeason);
    modal.render();
}



// Add event listeners to close buttons
function addDialogCloseListeners() {
    document.querySelector("#closeCircuitDialog").addEventListener("click", () => {
        document.querySelector("#circuit").close();
    });
    document.querySelector("#closeDriverDialog").addEventListener("click", () => {
        document.querySelector("#driver").close();
    });
    document.querySelector("#closeConstructorDialog").addEventListener("click", () => {
        document.querySelector("#constructor").close();
    });
}

// Add event listeners for closing dialogs by clicking outside
function addOutsideClickListeners() {
    ["circuit", "driver", "constructor"].forEach((dialogId) => {
        const dialog = document.querySelector(`#${dialogId}`);
        dialog.addEventListener("click", (e) => {
            if (e.target === dialog) dialog.close();
        });
    });
}

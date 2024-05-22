/* ========== INITIALIZATION ========== */

const appState = {
    openedDrawer: null,
    currencies: [],
    filteredCurrencies: [],
    base: "USD",
    target: "EUR",
    rates: {},
    baseValue: 1,
}

const ui = {
    baseBtn: document.getElementById("base"),
    targetBtn: document.getElementById("target"),
    closeDrawerBtn: document.getElementById("close-drawer"),
    exchangeRate: document.getElementById("exchange-rate"),
    currencyList: document.getElementById("currency-list"),
    baseInput: document.getElementById("base-input"),
    targetInput: document.getElementById("target-input"),
    swapBtn: document.getElementById("swap-btn"),
    searchInput: document.getElementById("search"),
    drawer: document.getElementById("drawer"),
}

/* ========== FUNCTIONS ========== */

function toggleDrawer() {
    if (ui.drawer.classList.contains("show")) {
        clearSearchInput();
        ui.currencyList.scrollTop = 0
    }
    ui.drawer.classList.toggle("show");
}

function getCurrencies() {
    fetch(`https://api.freecurrencyapi.com/v1/currencies?apikey=${key}`)
    .then((response) => response.json())
    .then(({ data }) => {
        appState.currencies = Object.values(data);
        appState.filteredCurrencies = getAvailableCurrencies();
        displayCurrencies();
    })
    .catch(error => console.error("Error: ", error));
}

function getExchangeRate() {
    const { base } = appState;
    fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=${key}&base_currency=${base}`)
    .then((response) => response.json())
    .then(({ data }) => {
        appState.rates[base] = data;
        displayConversion();
    })
    .catch(error => console.error("Error: ", error));
}

function updateExchangeRate() {
    const { base, target, rates } = appState;
    const rate = rates[base][target].toFixed(4);
    ui.exchangeRate.textContent = `1 ${base} = ${rate} ${target}`
}

function updateButtons() {
    [ui.baseBtn, ui.targetBtn].forEach((btn) => {
        const code = appState[btn.id];
        btn.innerHTML = `
            <div class="currency-icon" style="--image: url(${getImageURL(code)})"></div>
            <span>${code}</span>
            <i class="uil uil-angle-down"></i>
        `;
    });
}

function updateInputs() {
    const { base, baseValue, target, rates } = appState;
    const result = baseValue * rates[base][target];
    ui.baseInput.value = parseFloat(baseValue);
    if (Math.abs(result - Math.round(result)) < 1e-10) {
        ui.targetInput.value = Math.round(result);
    } else {
        ui.targetInput.value = parseFloat(result.toFixed(4));
    }
}

function getImageURL(code) {
    const flag = "https://wise.com/public-resources/assets/flags/rectangle/{code}.png"
    return flag.replace("{code}", code.toLowerCase());
}

function displayConversion() {
    updateButtons();
    updateInputs();
    updateExchangeRate();
}

function switchConversion() {
    const { base, target } = appState;
    appState.base = target;
    appState.target = base;
    appState.baseValue = parseFloat(ui.targetInput.value) || 1;
    loadExchangeRate();
}

function loadExchangeRate() {
    const { base, rates } = appState;
    if (typeof rates[base] !== "undefined") {
        displayConversion();
    } else {
        getExchangeRate();
    }
}

function convertInput() {
    appState.baseValue = parseFloat(ui.baseInput.value) || 1;
    loadExchangeRate();
}

function displayCurrencies() {
    ui.currencyList.innerHTML = appState.filteredCurrencies
    .map(({ code, name }) => {
        return `
        <li data-code="${code}">
            <img src="${getImageURL(code)}" alt="${name}">
            <div>
                <h4>${code}</h4>
                <p>${name}</p>
            </div>
        </li>
        `;
    })
    .join("");
}

function selectPairCurrencies(event) {
    if (event.target.hasAttribute("data-code")) {
        const { openedDrawer } = appState;
        appState[openedDrawer] = event.target.dataset.code;
        loadExchangeRate();
        toggleDrawer();
    }
}

function getAvailableCurrencies() {
    return appState.currencies.filter(({ code }) => {
        return appState.base !== code && appState.target !== code;
    });
}

function filterCurrencies() {
    const keyword = ui.searchInput.value.trim().toLowerCase();
    appState.filteredCurrencies = getAvailableCurrencies().filter(
        ({ code, name }) => {
            return (
                code.toLowerCase().includes(keyword) || name.toLowerCase().includes(keyword)
            )
        }
    );
    displayCurrencies();
}

function clearSearchInput() {
    ui.searchInput.value = "";
    ui.searchInput.dispatchEvent(new Event("input"));
}

function loadConfig() {
    return fetch("./config.json")
        .then(response => response.json())
        .then(config => {
            key = config.API_KEY;
        })
        .catch(error => console.error("Error: ", error));
}

function initApp() {
    loadConfig().then(() => {
        getCurrencies();
        getExchangeRate();
    });
}

function setupEventListeners() {
    document.addEventListener("DOMContentLoaded", initApp);
    ui.baseBtn.addEventListener("click", () => {
        appState.openedDrawer = "base";
        toggleDrawer();
    });
    ui.targetBtn.addEventListener("click", () => {
        appState.openedDrawer = "target";
        toggleDrawer();
    });
    ui.closeDrawerBtn.addEventListener("click", toggleDrawer);
    ui.swapBtn.addEventListener("click", switchConversion);
    ui.currencyList.addEventListener("click", selectPairCurrencies);
    ui.searchInput.addEventListener("input", filterCurrencies);
    ui.baseInput.addEventListener("change", convertInput);
}

setupEventListeners();
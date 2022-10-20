

/*
 * PHP & jQuery Datagrid
 * Copyright (c) 2022 Chris Komus - GNU GPLv3
 * https://github.com/chriskomus/
 */

// Site wide settings provided as data attributes.
const CURRENCY = '$';
const PRICE_DECIMALS = 2;

// Filtering, sorting, and pagination
let currentPage = 1;
let startPage = 1;
let totalPages = 1;
let maxItemsPerPage = 0;
let numberOfResults = 0;



/**
 * Handles the load event.
 */
function load() {

    $('.filter-by').on('click', filterCategoryLink);
    $('.sort-by').on('click', sortItemLink);
    $('#sort-asc-desc').on('click', sortAscDesc);
    $('#page-search-input').on('keyup', waitForChangesPageSearch);
    $('#page-search-input').on('keypress', noEnter);
    $('#search-button').on('click', submitSearch);
    $('#show-archived').on('click', showHideArchived);
    $('.pagination-count').on('click', resultsPerPageDropdownLink);

    // add event handler to dynamically created elements
    $(document).on('click', '.page-link', pageNumberSelect);

    // generate items from the data set and place on the page
    generateItems(filterResults({dataSource: datagridData}));
}


/*
-------------------------------------- GENERATE DATA GRID -------------------------------------------
 */

/**
 * Generate items on the page from a data source.
 */
function generateItems(data) {
    $('.sortable-item').remove();

    let container = $('#sortable-wrapper');
    container.empty();

    data.forEach(item => {
        // Get id
        const id = item.product_id;

        // Set muted text for archived items
        let archived = '';
        if (item.enabled === 0) {
            archived = 'text-muted';
        }

        // Generate row
        const newItems = (
            $('<tr/>', {'class': 'sortable-item', 'id': 'product-' + id})
        );

        // Add td for each visible column
        datagridColumns.forEach(function (column, index) {
            let tdAttributes = {'class': archived};

            let newTdText = item[column];
            if (newTdText) {
                if (newTdText.length > 75) {
                    newTdText = newTdText.toString().substring(0, 75) + '...';
                }
            }
            if (column === 'price') {
                newItems.append($('<td/>', tdAttributes)
                    .text(getPrice(newTdText))
                );

            } else {
                newItems.append($('<td/>', tdAttributes)
                    .text(newTdText)
                );
            }
        });

        container.append(newItems);
    });

    pagination();
}

/**
 * Get price in the correct format, or return a default statement when price is not a number.
 * @param price
 * @param callForPricing
 */
function getPrice(price, callForPricing = false) {
    price = parseFloat(price);
    if (!isNaN(price) && price > 0 && price !== null) {
        return CURRENCY + (Math.round(price * 100) / 100).toFixed(PRICE_DECIMALS);
    } else {
        if (callForPricing === true) {
            return 'Call for pricing';
        } else {
            return null;
        }
    }
}

/*
-------------------------------------- DELAYED FUNCTIONS -------------------------------------------
 */

/**
 * waitForChanges* and delayProcessing allows for a period of time to pass
 * before another function is called. This delayed function is passed as
 * the parameter doAfterDelay.
 * How it works: When first keyup event happens on the input box, start the timer.
 * Every time a key is pressed the timer resets. The function parameter
 * is provided to delayProcessing() and will fire once the timer runs out.
 * @type {(function(...[*]): void)|*}
 */
var waitForChangesPageSearch = delayProcessing(processSearchFilter);

function delayProcessing(doAfterDelay, delayTime = 100) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            doAfterDelay();
        }, delayTime);
    };
}

document.addEventListener('DOMContentLoaded', load);
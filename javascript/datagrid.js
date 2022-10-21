

/*
 * Data Driven Datagrid for Bootstrap
 * Copyright (c) 2022 Chris Komus - GNU GPLv3
 * https://github.com/chriskomus/
 */

/*
-------------------------------------- SETTINGS -------------------------------------------
 */

// The datagrid can store cookies based on settings (such as sort order). Append a prefix to the cookie.
// When there are multiple datagrid pages, each datagrid page should send a different cookiePrefix.
const cookiePrefix = 'sample';

// This is the default records per page value on first page load. Subsequent page loads will use cookies instead.
const datagridDefaultPagination = 25;

// This displays the results per page dropdown.
const datagridPaginationOptions = [5, 10, 25, 50, 100];

// These are the columns that will display in the datagrid, and should match a root node of the json response. (ie: price)
const datagridColumns = sampleDatagridColumns; // sampleDatagridColumns is foiund in sample-data.js

// These columns are excluded from the search
const datagridSearchExclusion = ['price', 'quantity'];

// This column will be sorted by default on first page load. Subsequent page loads will use cookies instead.
const datagridDefaultSortBy = datagridColumns[1];

// This should point to a category column that will allow a user to filter by Category using the Filter Category dropdown.
// The datagrid will get all results from this column and then display unique values in the dropdown.
const datagridCategoryFilter = datagridColumns[6];

// This is the main data array that will populate the datagrid.
const datagridData = sampleDataGridData; // sampleDataGridData is foiund in sample-data.js

// Datagrid can format specified columns as currency.
const CURRENCY = '$';
const PRICE_DECIMALS = 2;

/*
-------------------------------------- ON LOAD -------------------------------------------
 */

// This will store the data in its current state after filtering
let currentData = [];

/**
 * Handles the load event.
 */
function load() {

    // add event handlers to page elements
    // $('.filter-by').on('click', filterCategoryLink);
    // $('.sort-by').on('click', sortItemLink);
    $('#sort-asc-desc').on('click', sortAscDesc);
    $('#page-search-input').on('keyup', waitForChangesPageSearch);
    $('#page-search-input').on('keypress', noEnter);
    $('#search-button').on('click', submitSearch);
    $('#show-archived').on('click', showHideArchived);
    // add event handler to dynamically created elements

    $(document).on('click', '.page-link', pageNumberSelect);
    $(document).on('click', '.filter-by', filterCategoryLink);
    $(document).on('click', '.sort-by', sortItemLink);
    $(document).on('click', '.pagination-count', resultsPerPageDropdownLink);

    // generate sort by and filter by dropdown menus
    generateMenuOptions()

    // generate items from the data set and place on the page
    generateItems(filterResults({dataSource: datagridData}));
}

/*
-------------------------------------- GENERATE DATA GRID -------------------------------------------
 */

/**
 * Generate sort by dropdown items based on datagridColumns
 */
function generateMenuOptions() {
    // GENERATE SORT-BY MENU AND TABLE HEADERS
    // ---------------------------------------
    let dropdownContainer = $('#sort-by-dropdown');
    dropdownContainer.empty();

    let tableHeader = $('#datagrid-table-header');
    tableHeader.empty();

    datagridColumns.forEach(item => {
        // Generate sort by menu option
        let isActive = '';
        let sortColumn = cookieManagement('get', 'sort_by_column');
        if (!sortColumn) sortColumn = datagridDefaultSortBy;
        if (item === sortColumn)isActive = ' active';

        const newSortByItem = ($('<li/>'));
        newSortByItem.append($('<a/>', {'class': 'dropdown-item sort-by' + isActive,
                                    'href': '#',
                                    'data-sort-by': item})
            .text(toTitleCase(item.replace('_', ' ')))
        );
        dropdownContainer.append(newSortByItem);

        // Generate table column header
        const newTableHeaderItem = ($('<th/>'));
        newTableHeaderItem.append($('<a/>', {'class': 'text-muted text-decoration-none sort-by',
            'href': '#',
            'data-sort-by': item})
            .text(toTitleCase(item.replace('_', ' ')))
        );
        tableHeader.append(newTableHeaderItem);
    });

    // Determine whether to sort asc or desc on page load
    sortAscDesc(false);

    // Determine the columns that are searchable
    const searchColumns = datagridColumns.filter(x => !datagridSearchExclusion.includes(x));
    $('#page-search-input').attr('data-columns', searchColumns);

    // GENERATE FILTER-BY MENU
    // -----------------------
    dropdownContainer = $('#filter-by-dropdown');
    dropdownContainer.empty();

    const filterCategoryOptions = [];
    datagridData.forEach(item => {
        const categoryName = item[datagridCategoryFilter];
        if (filterCategoryOptions.indexOf(categoryName) === -1) filterCategoryOptions.push(categoryName);
    });

    // Add Show All Filter Category
    let newItems = ($('<li/>'));
    newItems.append($('<a/>', {'class': 'dropdown-item filter-by active',
        'href': '#',
        'data-filter-by': 'Show All'})
        .text('Show All')
    );
    dropdownContainer.append(newItems);

    // Add Filter Categories
    filterCategoryOptions.forEach(item => {
        // Generate item
        newItems = ($('<li/>'));

        newItems.append($('<a/>', {'class': 'dropdown-item filter-by',
            'href': '#',
            'data-filter-by': item})
            .text(item)
        );

        dropdownContainer.append(newItems);
    });

    // GENERATE PAGINATION OPTIONS
    // ---------------------------
    dropdownContainer = $('#pagination-dropdown-menu');
    dropdownContainer.empty();

    // Add Pagination Options
    datagridPaginationOptions.forEach(item => {
        let isActive = '';
        let resultsPerPage = cookieManagement('get', 'pagination_count');
        if (!resultsPerPage) resultsPerPage = datagridDefaultPagination;

        if (!isNaN(item) && !isNaN(resultsPerPage) && parseInt(item) === parseInt(resultsPerPage)) {
            isActive = ' active';
        }

        // Generate item
        newItems = ($('<li/>'));

        newItems.append($('<a/>', {'class': 'dropdown-item pagination-count' + isActive,
            'href': '#',
            'data-count': item})
            .text(item)
        );

        dropdownContainer.append(newItems);
    });
}

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
        datagridColumns.forEach(column => {
            let tdAttributes = {'class': archived};

            let newTdText = item[column];
            if (newTdText) {
                if (newTdText.length > 75) {
                    newTdText = newTdText.toString().substring(0, 75) + '...';
                }
            }
            if (column === 'price') {
                newItems.append($('<td/>', tdAttributes)
                    .text(formatAsCurrency(newTdText))
                );

            } else {
                newItems.append($('<td/>', tdAttributes)
                    .text(newTdText)
                );
            }
        });

        container.append(newItems);
    });

    currentPage = 1;
    pagination();
}

/**
 * Get price in the correct format, or return a default statement when price is not a number.
 * @param price
 * @param callForPricing
 */
function formatAsCurrency(price, callForPricing = false) {
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

/**
 * Change a string to title case
 */
function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

/*
-------------------------------------- COOKIES -------------------------------------------
 */

/**
 * Get or set a cookie either for the user or catalog side, depending on which controller is active.
 * @param getOrSet
 * @param cookieSuffix
 * @param cookieValue
 * @param daysToExpire
 */
function cookieManagement(getOrSet, cookieSuffix, cookieValue = null, daysToExpire = 14) {
    let prefix = '';

    if(cookiePrefix) {
        prefix = cookiePrefix + '_';
    } else {
        return null;
    }

    if (getOrSet === 'get') {
        return getCookie(prefix + cookieSuffix);
    } else if (getOrSet === 'set' && cookieValue != null) {
        setCookie(prefix + cookieSuffix, cookieValue, daysToExpire);
        return null;
    } else {
        return null;
    }
}

/**
 * Set a cookie.
 * @param key
 * @param value
 * @param expireInDays
 */
function setCookie(key, value, expireInDays) {
    const d = new Date();
    d.setTime(d.getTime() + (expireInDays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = key + "=" + value + ";" + expires + ";path=/";
}

/**
 * Get a cookie.
 * @param key
 * @returns {string}
 */
function getCookie(key) {
    let name = key + "=";
    let cookies = document.cookie.split(';');
    for (const element of cookies) {
        let c = element;
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

/*
-------------------------------------- FILTERING -------------------------------------------
 */

/**
 * Filter the results from the data and return a new filtered array.
 * First get defaults from cookies. If the parameters have been set, ensure they are valid before using those instead.
 * If valid, update the cookie. Then filter by categories. Then filter for the searchString. Then finally sort the results.
 * @param dataSource - provide a data source to be filtered
 * @param categories - the categories slug
 * @param searchString - search filter by string
 * @param ascDescParam - sort by column name
 * @param SortColumnParam - asc or desc
 * @param showHideParam - show only showHideParam items (set as false to show all items)
 * @param searchColumns
 */
function filterResults({
                           dataSource, categories = null, searchString = null, ascDescParam = null,
                           sortColumnParam = null, showHideParam = null, searchColumns = []
                       }) {
    let data = dataSource;

    if (data.error) {
        return;
    }

    // get defaults from cookies
    let ascDesc = cookieManagement('get', 'asc_desc');
    let sortColumn = cookieManagement('get', 'sort_by_column');
    let showArchived = cookieManagement('get', 'show_archived');

    // override asc_desc cookie if parameter is valid
    if (ascDescParam) {
        if (ascDescParam.toLowerCase() === 'asc' || ascDescParam.toLowerCase() === 'desc') {
            ascDesc = ascDescParam.toLowerCase();
            cookieManagement('set', 'asc_desc', ascDesc);
        }
    }

    // override sort_by_column cookie if parameter is valid
    if (data.some(o => sortColumnParam in o)) {
        sortColumn = sortColumnParam;
        cookieManagement('set', 'sort_by_column', sortColumn);
    }

    // remove disabled items
    if (showHideParam) {
        if (showHideParam.toLowerCase() === 'show' || showHideParam.toLowerCase() === 'hide') {
            showArchived = showHideParam.toLowerCase();
            cookieManagement('set', 'show_archived', showArchived);
        }
    }

    // filter archived items
    if (showArchived === 'hide') {
        data = data.filter(o => o.enabled === 1);
    }


    // filter by categories
    if (categories) {
        if (typeof categories === 'string') {
            categories = [categories];
        }

        data = data.filter(o => {
            let isFound = false;
            for (const column of categories) {
                isFound = o.category.toLowerCase() === column.toLowerCase();
                if (isFound) {
                    break;
                }
            }
            return isFound;
        });
    }

    // filter by search string
    if (searchString && searchColumns) {
        if (typeof searchColumns === 'string') {
            searchColumns = [searchColumns];
        }

        const regex = new RegExp('.*' + searchString + '.*', 'gi');

        data = data.filter(o => {
            let isFound = false;
            for (const column of searchColumns) {
                isFound = regex.test(o[column]);
                if (isFound) {
                    break;
                }
            }
            return isFound;
        });
    }

    // Sort the results
    // Collator object provides much better performance than sort or localeCompare
    // it also sorts numbers correctly. However, it doesn't sort null next to 0s, so numeric fields
    // set as null will need to be validated/sanitized if that is not wanted for that field.
    const collator = new Intl.Collator('en', {numeric: true, sensitivity: 'base'});
    data.sort((a, b) => {
        if (ascDesc === 'desc') {
            return collator.compare(b[sortColumn], a[sortColumn]);
        } else {
            return collator.compare(a[sortColumn], b[sortColumn]);
        }

    });
    currentData = data;

    return data;
}

/**
 * Returns a search string from an input text-box. It uses a data attribute to determine which columns/keys
 * in the data array will be searched. Columns in the data attribute must be comma separated and will be
 * turned into an array in the filterResults() function. If includeFilterDropdown is true, the function
 * will look for Filter dropdown items that are set to active.
 * @param includeFilterDropdown - If true the function will look for Filter dropdown items that are set to active.
 */
function searchResults(includeFilterDropdown = false) {
    // get search result by input, and where to search by data attribute
    const searchInput = $('#page-search-input');
    let columns = searchInput.data('columns').split(',');
    let search = searchInput.val().trim().toUpperCase();

    // look for Filter dropdown items that are set to true
    let categories = [];
    if (includeFilterDropdown) {
        $('.filter-by').filter('.active').each(function () {
            const category = $(this).data('filter-by');
            if (category === 'Show All') {
                categories = [];
                return false;
            } else if (category) {
                categories.push(category);
            }
        });

        if (categories.length === 0) {
            categories = null;
        }
    }

    // if search is black both the search and columns should be set to null
    if (!search) {
        search = null;
        columns = null;
    }

    // return an array of search data to be sent as parameters to filterResults.
    return {searchString: search, searchColumns: columns, categoryFilter: categories};
}

/**
 * Process search data and send to the filter, then regenerate items.
 * @param categoryFilter
 */
function processSearchFilter() {
    const search = searchResults({includeFilterDropdown: true});

    generateItems(filterResults({
        dataSource: datagridData,
        categories: search['categoryFilter'],
        searchString: search['searchString'],
        searchColumns: search['searchColumns']
    }));
}

/**
 * Event occurs when clicking a Filter Category dropdown link.
 * Filter items based on the data attribute of the clicked link.
 * Also check if there is anything in the search box, and then filter using that.
 */
function filterCategoryLink(e) {
    e.preventDefault();

    // get filter item by data attribute
    let categoryFilter = $(this).data('filter-by');

    // Mark the menu item as active
    $(".filter-by").each(function () {
        if ($(this).html().toUpperCase().trim() === categoryFilter.toUpperCase().trim()) {
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
    });

    // Generate items
    processSearchFilter();
}

/*
-------------------------------------- SORTING -------------------------------------------
 */


/**
 * Event occurs when clicking a Sort By column dropdown link.
 * Items are sorted based on the data attribute of the clicked link.
 */
function sortItemLink(e) {
    e.preventDefault();

    // get sort item by data attribute
    const sortColumnName = $(this).data('sort-by');

    // Mark the menu item as active
    $(".sort-by").each(function () {
        if ($(this).html().toUpperCase().trim() === sortColumnName.toUpperCase().trim()) {
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
    });

    // Generate items
    if (sortColumnName) {
        generateItems(filterResults({
            dataSource: currentData,
            sortColumnParam: sortColumnName
        }));
    }
}

/**
 * Sort current results in either ascending or descending order.
 * @param swap - Set to true when used as a click event for the sort by asc/desc button.
 * Otherwise set to false to determine sort by asc or desc on page load.
 */
function sortAscDesc(swap = true) {
    const sortButton = $('#sort-asc-desc');

    // failsafe in case the cookie isn't set
    let ascDesc = cookieManagement('get', 'asc_desc');
    if (ascDesc !== 'asc' && ascDesc !== 'desc') {
        ascDesc = sortButton.data('asc-desc');
        cookieManagement('set', 'asc_desc', ascDesc);
    }

    if (swap) {
        // if asc swap to desc, and vice versa
        if (ascDesc === 'asc') {
            ascDesc = 'desc';
            sortButton.html('<i class="fa-solid fa-arrow-down-z-a"></i>');
        } else if (ascDesc === 'desc') {
            ascDesc = 'asc';
            sortButton.html('<i class="fa-solid fa-arrow-down-a-z"></i>');
        }

        // Generate items
        generateItems(filterResults({dataSource: currentData, ascDescParam: ascDesc}));
    } else {
        if (ascDesc === 'asc') {
            sortButton.html('<i class="fa-solid fa-arrow-down-a-z"></i>');
        } else if (ascDesc === 'desc') {
            sortButton.html('<i class="fa-solid fa-arrow-down-z-a"></i>');
        }
    }
}

/**
 * Submit search, occurs when clicking the main nav bar search button.
 */
function submitSearch(e) {
    e.preventDefault();
}

/**
 * Show or hide archived items
 */
function showHideArchived() {
    // failsafe in case the cookie isn't set
    let showHide = cookieManagement('get', 'show_archived');
    if (showHide !== 'show' && showHide !== 'hide') {
        showHide = 'show';
        cookieManagement('set', 'show_archived', showHide);
    }

    // if show swap to hide, and vice versa
    if (showHide === 'show') {
        showHide = 'hide';
        $(this).addClass('text-muted');
        $(this).removeClass('text-success');
    } else if (showHide === 'hide') {
        showHide = 'show';
        $(this).addClass('text-success');
        $(this).removeClass('text-muted');
    }

    // Generate items
    generateItems(filterResults({dataSource: datagridData, showHideParam: showHide}));
}


/**
 * Disable the enter key from being pressed
 * @param e
 * @returns {boolean}
 */
function noEnter(e) {
    if (e.which === 13) e.preventDefault();
}

/*
-------------------------------------- PAGINATION -------------------------------------------
 */

// Filtering, sorting, and pagination
let currentPage = 1;
let startPage = 1;
let totalPages = 1;
let maxItemsPerPage = 0;
let numberOfResults = 0;

/**
 * Generate the pagination buttons.
 * @param numberOfPages - Number of pages
 * @param startAtPage - Starting page. This is the first number in the series of buttons.
 */
function generatePaginationButtons(startAtPage = startPage, numberOfPages = totalPages) {
    const main = $('#pagination-container');

    main.empty();

    if (numberOfPages > 1) {
        let newButtons = '<ul class="pagination pagination-sm">';
        const newLiStart = '<li class="page-item" data-value=""><a class="page-link paginator" href="#">';
        const newLiEnd = '</a></li>';

        let displayPages = 10;

        // Prev button
        let liStart = newLiStart;
        liStart = liStart.replace('data-value=""', 'data-value="prev"');
        if (numberOfPages < 10) {
            displayPages = numberOfPages;
        }

        if (startAtPage === 1) {
            liStart = liStart.replace('class="', 'class="disabled ');
        } else if (startAtPage < 1) {
            startAtPage = 1;
        } else if (startAtPage > (numberOfPages - 9)) {
            startAtPage = numberOfPages - 9;
        }
        newButtons += liStart + '&laquo; Prev' + newLiEnd;

        // To Start Buttons (1 ... )
        if (numberOfPages > 10 && currentPage > (numberOfPages - 9)) {
            liStart = newLiStart;
            liStart = liStart.replace('data-value=""', 'data-value="start"');
            newButtons += liStart + '1' + newLiEnd;

            liStart = newLiStart;
            liStart = liStart.replace('data-value=""', 'data-value="start"');
            newButtons += liStart + '...' + newLiEnd;
        }

        // Numbered Buttons
        for (let i = startAtPage; i <= (displayPages + startAtPage - 1); i++) {
            liStart = newLiStart;
            if (i === currentPage) {
                liStart = newLiStart.replace('class="', 'class="active ');
            } else {
                // to do
            }
            liStart = liStart.replace('data-value=""', 'data-value="' + i + '"');
            newButtons += liStart + i + newLiEnd;
        }

        // To End Buttons (ie: ... 100)
        if (numberOfPages > 10 && currentPage < (numberOfPages - 9)) {
            liStart = newLiStart;
            liStart = liStart.replace('data-value=""', 'data-value="end"');
            newButtons += liStart + '...' + newLiEnd;

            liStart = newLiStart;
            liStart = liStart.replace('data-value=""', 'data-value="end"');
            newButtons += liStart + numberOfPages + newLiEnd;
        }

        // Next button
        liStart = newLiStart;
        liStart = liStart.replace('data-value=""', 'data-value="next"');

        if (startAtPage === numberOfPages - 9) {
            liStart = liStart.replace('class="', 'class="disabled ');
        }
        newButtons += liStart + 'Next &raquo;' + newLiEnd;

        // Add to page
        newButtons += '</ul>';
        main.append(newButtons);
    }
}

/**
 * Check max number of items allowed per page. Then determine how many items to paginate, and get an array of those items.
 * Then generate page number buttons, then paginate results.
 * @param count - the max number of items per page
 */
function pagination(count = null) {
    // check max number of items per page
    if (count == null) {
        // Check if the maxItemsPerPage has been set (it won't be at page load)
        if (maxItemsPerPage === 0) {
            // set max based on the cookie, or set a cookie if it doesn't exist
            count = cookieManagement('get', 'pagination_count');
            if (count === '' || count === null || count === '0') {
                cookieManagement('set', 'pagination_count', datagridDefaultPagination);
                count = datagridDefaultPagination;
            }
            maxItemsPerPage = parseInt(count);
        }
    } else {
        // if a count has been provided set maxItemsPerPage to count
        maxItemsPerPage = parseInt(count);
    }

    // set total pages
    numberOfResults = $('.sortable-item').length;
    totalPages = Math.ceil(numberOfResults / maxItemsPerPage);

    // display the number of results in the filter-sorts header bar
    $('#results-shown').text(numberOfResults);

    // generate buttons and paginate results
    generatePaginationButtons();
    paginateResults();
}

/**
 * Update the page with the new paginated results.
 */
function paginateResults() {
    const firstOnPage = ((currentPage - 1) * maxItemsPerPage) + 1;
    let lastOnPage = firstOnPage + maxItemsPerPage - 1;
    if (lastOnPage > numberOfResults) {
        lastOnPage = numberOfResults;
    }

    let results = "No items found."
    if (numberOfResults) {
        results = 'Displaying ' + firstOnPage + ' to ' + lastOnPage + ' of ' + numberOfResults + ' results.';
        $('#header-results').text('Total: ' + numberOfResults + ' results');
    }

    $('#pagination-stats').text(results);

    const itemsOnPage = $('.sortable-item');
    itemsOnPage.hide();

    for (let i = firstOnPage - 1; i < (firstOnPage + maxItemsPerPage) - 1; i++) {
        itemsOnPage.eq(i).show();
    }
}

/**
 * Set pagination cookie based on link's data attribute. Check that the data attribute of the dropdown link is numeric,
 * otherwise return the provided default. If that is not numeric either, set to 25 as a fall back.
 */
function resultsPerPageDropdownLink(e) {
    e.preventDefault();

    currentPage = 1;
    startPage = 1;
    totalPages = 1;

    let count = $(this).data('count');

    if (!isNaN(count) && parseInt(count) !== 0) {
        count = parseInt(count);
    } else {
        let defaultCount = $('#pagination-dropdown-menu').data('default');
        if (!isNaN(defaultCount)) {
            count = defaultCount;
        } else {
            count = 25;
        }
    }

    pagination(count);

    $(".pagination-count").each(function () {
        if (parseInt($(this).html()) === count) {
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
    });

    cookieManagement('set', 'pagination_count', count);
}

/**
 * Event occurs when clicking a page number button. Regenerates the paginator buttons when necessary.
 * Prev and Next buttons are disabled if the current page is at the beginning or end.
 */
function pageNumberSelect(e) {
    e.preventDefault();

    const getPage = $(this).html();
    const getData = $(this).parent('li').data("value");
    const li = $('.pagination');
    $('.page-item').removeClass('active');


    if (getData === 'start' || getData === 'end') {
        // Buttons that have start or end data attribute.
        if (getPage === '1' && getData === 'start') {
            // First page
            currentPage = 1;
            startPage = 1;
        } else if (getPage === '...' && getData === 'start') {
            // Second page
            currentPage = 2;
            startPage = 1;
        } else if (getPage === '...' && getData === 'end') {
            // Second last page
            currentPage = totalPages - 1;
            startPage = totalPages - 9;
        } else if (getPage === totalPages.toString() && getData === 'end') {
            // last page
            currentPage = totalPages;
            startPage = totalPages - 9;
        }
        generatePaginationButtons(startPage);

    } else {
        let previousStartPage = startPage;
        // Regular numeric buttons or Prev and Next buttons
        if (!isNaN(getPage)) {
            // Numeric button
            currentPage = parseInt(getPage);

        } else if (getPage === '\u00ab Prev') {
            // Prev page
            currentPage -= 1;
            startPage -= 1;

        } else if (getPage === 'Next \u00bb') {
            // Next page
            currentPage += 1;
            startPage += 1;
        } else {
            // An error occurred
            currentPage = 1;
        }

        // Find the li button based on the updated currentPage. If it doesn't exist,
        // regenerate buttons with the updated start page. Otherwise,
        // the buttons don't need to be redrawn, set the active button to the new current page,
        // and don't update the start page.
        const nextLi = li.find('[data-value="' + currentPage + '"]');
        if (nextLi.length === 0) {
            generatePaginationButtons(startPage);
        } else {
            startPage = previousStartPage;
            nextLi.addClass('active');
        }
    }

    // enable and disable the prev and next buttons
    let prevButton = li.find('[data-value="prev"]');
    let nextButton = li.find('[data-value="next"]');
    if (currentPage === 1) {
        prevButton.addClass('disabled');
        nextButton.removeClass('disabled');
    } else if (currentPage === totalPages) {
        prevButton.removeClass('disabled');
        nextButton.addClass('disabled');
    } else {
        prevButton.removeClass('disabled');
        nextButton.removeClass('disabled');
    }

    paginateResults();
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
let waitForChangesPageSearch = delayProcessing(processSearchFilter);

function delayProcessing(doAfterDelay, delayTime = 100) {
    let timer;
    return (..._args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            doAfterDelay();
        }, delayTime);
    };
}

document.addEventListener('DOMContentLoaded', load);
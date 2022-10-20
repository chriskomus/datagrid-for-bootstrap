


/*
 * PHP & jQuery Datagrid
 * Copyright (c) 2022 Chris Komus - GNU GPLv3
 * https://github.com/chriskomus/
 */


/*
-------------------------------------- FILTERING -------------------------------------------
 */

/**
 * Filter the results from the API data and return a new filtered array.
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
function processSearchFilter(categoryFilter = null) {
    const search = searchResults({includeFilterDropdown: true});
    if (!categoryFilter) {
        categoryFilter = search['categoryFilter'];
    }
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

    if (categoryFilter === "Show All") {
        categoryFilter = null;
    }

    // Generate items
    processSearchFilter(categoryFilter);
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
 */
function sortAscDesc(e) {

    // failsafe in case the cookie isn't set
    let ascDesc = cookieManagement('get', 'asc_desc');
    if (ascDesc !== 'asc' && ascDesc !== 'desc') {
        ascDesc = $(this).data('asc-desc');
        cookieManagement('set', 'asc_desc', ascDesc);
    }

    // if asc swap to desc, and vice versa
    if (ascDesc === 'asc') {
        ascDesc = 'desc';
        $(this).html('<i class="fa-solid fa-arrow-down-z-a"></i>');
    } else if (ascDesc === 'desc') {
        ascDesc = 'asc';
        $(this).html('<i class="fa-solid fa-arrow-down-a-z"></i>');
    }

    // Generate items
    generateItems(filterResults({dataSource: currentData, ascDescParam: ascDesc}));
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
function showHideArchived(e) {
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



/*
 * PHP & jQuery Datagrid
 * Copyright (c) 2022 Chris Komus - GNU GPLv3
 * https://github.com/chriskomus/
 */


/*
-------------------------------------- FILTER DATA -------------------------------------------
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
// function filterResults(dataSource, categories = null, searchString = null, ascDescParam = null, SortColumnParam = null, showHideParam = true, searchColumns = []) {
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
        dataSource: jsonControllerData,
        categories: search['categoryFilter'],
        searchString: search['searchString'],
        searchColumns: search['searchColumns']
    }));
}


/*
 * PHP & jQuery Datagrid
 * Copyright (c) 2022 Chris Komus - GNU GPLv3
 * https://github.com/chriskomus/
 */

/*
-------------------------------------- PAGINATION -------------------------------------------
 */

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
            let liStart = newLiStart;
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
                const defaultPagination = $('#pagination-dropdown-menu').data('default');
                cookieManagement('set', 'pagination_count', defaultPagination);
                count = defaultPagination;
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
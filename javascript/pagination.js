

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

/**
 * Set pagination cookie based on link's data attribute. Check that the data attribute of the dropdown link is numeric,
 * otherwise return the provided default. If that is not numeric either, set to 25 as a fall back.
 * If neither data attributes are not numeric, that likely means a non-numeric value was entered in config.php.
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
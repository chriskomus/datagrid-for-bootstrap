

/*
 * PHP & jQuery Datagrid
 * Copyright (c) 2022 Chris Komus - GNU GPLv3
 * https://github.com/chriskomus/
 */

// Site wide settings provided as data attributes.
const CURRENCY = siteInfo.data('currency');
const PRICE_DECIMALS = siteInfo.data('price-decimals');

// Filtering, sorting, and pagination
let currentPage = 1;
let startPage = 1;
let totalPages = 1;
let maxItemsPerPage = 0;
let numberOfResults = 0;


/*
-------------------------------------- PAGE LOADS & API -------------------------------------------
 */

/**
 * Handles the load event and attaches event handlers to common items across the site.
 */
function loadSite() {
    loadSiteWithData();

    // Event handlers for site wide
    $('.validate-me').on('keyup', validateFormInputs);

    // add event handler to dynamically created elements
    $(document).on('click', '#login', submitValidationCheck);
    $(document).on('keyup', '.validate-me', validateFormInputs);


    // Bootstrap validation for forms
    (function () {
        'use strict'

        // Fetch all forms to apply custom Bootstrap validation to
        let forms = document.querySelectorAll('.needs-validation')

        // Loop over them and prevent submission
        Array.prototype.slice.call(forms)
            .forEach(function (form) {
                form.addEventListener('submit', function (event) {
                    if (!form.checkValidity()) {
                        event.preventDefault()
                        event.stopPropagation()
                    }

                    form.classList.add('was-validated')
                }, false)
            })
    })();
}

/**
 * Handles the load event and attaches event handlers to common items across the site on pages with a data connection.
 */
function loadSiteWithData() {
    // jsonColumns = jsonAllData.find(x => x.name === 'columns').results;
    // jsonControllerData = jsonAllData.find(x => x.name === 'mainData').results;

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
    generateItems(filterResults({dataSource: jsonControllerData}));

    // Calculate page load time.
    pageLoadTime();
}

/*
-------------------------------------- -------------- -------------------------------------------
-------------------------------------- EVENT HANDLERS -------------------------------------------
-------------------------------------- -------------- -------------------------------------------
All site wide event handlers are in main.js.
Associated functions are in other .js files, in the public/javascript directory.
 */


/*
-------------------------------------- SITE WIDE SETTING -------------------------------------------
 */

/**
 * Toggle dark mode on or off by retrieving server side settings
 * @param e
 */
function darkModeToggle(e) {
    const darkCss = siteInfo.data('dark-css');
    const lightCss = siteInfo.data('light-css');
    const darkMode = siteInfo.data('dark-mode');

    // The .item(#) refers to the position of the main bootswatch css.
    const css = document.getElementsByTagName("link").item(3);

    if (darkMode === 'dark') {
        css.href = lightCss;
    } else if (darkMode === 'light') {
        css.href = darkCss;
    }
}

/*
-------------------------------------- FILTER AND SORT -------------------------------------------
 */

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
    generateItems(filterResults({dataSource: jsonControllerData, showHideParam: showHide}));
}

/*
-------------------------------------- PAGINATION -------------------------------------------
 */

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

/*
-------------------------------------- FORM VALIDATION -------------------------------------------
 */


/**
 * Validate a form submit button. This handles the click event of a submit button and uses checkValidity()
 * to determine if there are any input values in the form that require validation and are incorrect. These
 * inputs will have a 'validate-me' class name and data attribute to check against a regex. If it fails,
 * use Bootstrap's 'was-validated' class to apply error messages to all incorrect fields.
 */
function submitValidationCheck(e) {
    const form = $(this).closest("form");
    if (!form[0].checkValidity()) {
        form.removeClass('needs-validation');
        form.addClass('was-validated');
        e.preventDefault();
        e.stopPropagation();
    }
}

/**
 * Validate a form input value. This event handler will be attached to any inputs that have the 'validate-me' class.
 * They should have an associated data attribute that will match against the correct regex.
 * (ie: data-validate-me="email" to check against a valid email regex).
 * This uses JavaScript's Constraint validation API to use setCustomValidity, which will prevent the form from
 * being submitted when clicking the submit button, which uses checkValidity().
 * Success messages are added when the input val matches the regex. If the val changes to something incorrect,
 * the error will display. If submit is hit with errors, all errors display.
 * @param e
 */
function validateFormInputs(e) {
    // Get value and regex
    const input = $(this);
    const value = input.val();
    const regexType = input.data('validate-me');

    // Assume the value is valid. If there is a regex, test against it. Otherwise, if it's a required field and blank,
    // the field is invalid.
    let validValue = true;
    if (regexType) {
        // if it has a regex requirement.
        let regex = regExPatterns[regexType];
        // Special validation for password matching
        if ((input.attr('id') === 'new-password' && $('#match-password').val())) {
            // validate and match new password
            validValue = regex.test(value);
            validValue = (value === $('#match-password').val());
            if (!validValue) {
                input.siblings('.invalid-feedback').text('Your new password does not match.');
            }
        } else if (input.attr('id') === 'match-password') {
            // validate and match new password
            validValue = regex.test(value) && value === $('#new-password').val();

        } else {
            // validation for everything else
            validValue = regex.test(value);
        }
    }
    if (!value) {
        // if it is blank
        if ($(this).prop('required')) {
            // if it is a required field and blank its invalid
            validValue = false;
        } else {
            // if it is NOT a required field and blank the validation messages should be cleared and exit the function.
            this.setCustomValidity("");
            input.removeClass('is-valid');
            input.removeClass('is-invalid');
            return;
        }
    }

    // Get the correct regEx pattern
    if (validValue) {
        // This will return a true from checkValidity() and allow the form to submit (if there are no other errors)
        this.setCustomValidity("");
        input.removeClass('is-invalid');
        input.addClass('is-valid');
    } else {
        // This will return a false from checkValidity() and prevent the form from submitting.
        const errorMessage = $(this).siblings('.invalid-feedback').text();
        this.setCustomValidity(errorMessage);

        // This resets the input to need validation again, to prevent dual valid and invalid messages.
        $(this).addClass('needs-validation');

        input.removeClass('is-valid');
        input.addClass('is-invalid');
    }
}

/**
 * Disable the enter key from being pressed
 * @param e
 * @returns {boolean}
 */
function noEnter(e) {
    // if ( e.which == 13 ) return false;
    //or...
    if (e.which === 13) e.preventDefault();
}

/**
 * Validation debugging
 * @param e
 */
function validationDebugger(e) {
    const input = $(this);
    this.setCustomValidity("");
    input.removeClass('is-invalid');
    input.addClass('is-valid');
}

document.addEventListener('DOMContentLoaded', loadSite);
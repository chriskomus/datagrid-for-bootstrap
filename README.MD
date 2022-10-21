# Server Driven Datagrid Table for Bootstrap v5 and Javascript


# Features
* Populate datagrid table with content from a back end or API endpoint
* Live search based off any/all columns. Allows for columns to be excluded from search
* Sort by a column, ascending or descending
* Filter by category, or filter based off a specified column
* Pagination and paginated results
* Show or hide 'archived' items, if there is an archived column
* Load all content on page load for faster filtering, pagination and sorting
* Works with Bootstrap v5
* Format specified columns as currency
* Datagrid pagination and sort settings stored as cookies, so the same sort order and paginated results per page on every page load. Dynamically provide cookie key prefixes if using multiple datagrids.

# Getting Started
* Check the sample-data.js file to see how data and columns should be provided to datagrid.js.
* Provide a data set and an array of column names. Column names should match the root node of the dataset that should be displayed.
* In datagrid.js set the defaults for paginated results, columns to exclude from the search, and default column to sort on, and its sort order.

# Dependancies
* Bootstrap v5
* jQuery
* Font Awesome
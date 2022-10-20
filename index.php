<?php
	/*
	 * PHP & jQuery Datagrid
	 * Copyright (c) 2022 Chris Komus - GNU GPLv3
	 * https://github.com/chriskomus/
	 */
	
	// DATA GRID SETTINGS
	// These values are hardcoded here for the example, but should be server driven.
	
	// Using an MVC (model-controller-view) framework, provide the model and controller name for the dataset.
	// This will be used by JavaScript to get server driven data results.
    // For the example the API URL for all products is /API/Products/
    // For the example the API URL for a product is /API/Products/Product/product_id
	$model = 'Product';
	$controller = 'Products';
	
	// use either 'show' or 'hide'
	$columns = ['sku', 'title', 'price', 'quantity', 'short_description', 'bin', 'category'];
	
	// Categorize the list of items with a category title and slug.
	$categories = [
		['title' => 'Camera Parts',
			'slug' => 'camera-parts'],
		['title' => 'Cameras',
			'slug' => 'cameras'],
		['title' => 'Computer Parts',
			'slug' => 'computer-parts'],
		['title' => 'Computers',
			'slug' => 'computers'],
		['title' => 'Lenses',
			'slug' => 'lenses'],
        ['title' => 'Portable Audio',
			'slug' => 'portable-audio'],
        ['title' => 'Pro Audio Parts',
			'slug' => 'pro-audio-parts'],
		['title' => 'Stereos',
			'slug' => 'stereo'],
		['title' => 'Pro Audio Parts',
			'slug' => 'pro-audio-parts']
	];
	// use either 'show' or 'hide'
	$show_archived = 'show';
	
	// This is used when landing on a category page, rather than a main index page.
	// Set to null when landing on the main page.
	$category_details = null;
	//	$category_details = ['title' => 'Computers',
	//		'slug' => 'computers'];
	
	// Sort by one of the columns in the $columns array
	$sort_by = $columns[0];
	
	// Use either 'asc' or 'desc'
	$sort_by_order = 'asc';
	
	// default items per paginated page
	$pagination = 25;
	
	// set an array of INTs that will allow a user to choose number of items per page
	$pagination_options = [5, 10, 25, 50, 100];
	
	$exclusions = ['price', 'quantity'];
	$page_search_columns = implode(",", array_diff($columns, $exclusions));
?>

<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>Datagrid Sample</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Quicksand:wght@300;400;500&display=swap"
          rel="stylesheet">
    <link rel="stylesheet" href="bootstrap.css">
    <link rel="stylesheet" href="main.css">

    <script src="https://kit.fontawesome.com/aaa301db0b.js" crossorigin="anonymous"></script>
</head>
<body>
<main class="container mt-4 main">
    <!-- START PAGE CONTENT -->

    <div class="card mt-4 bg-light mb-3">
        <div class="card-footer">
            <div class="row">
                <ul class="nav nav-pills justify-content-end" style="font-size: 0.9em;">
                    <li class="me-4 mt-2 mb-2" id="header-results"></li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button"
                           aria-haspopup="true"
                           aria-expanded="false">Results Per Page</a>
                        <div class="dropdown-menu" id="pagination-dropdown-menu"
                             data-default="<?= (int)$pagination ?>">
							<?php foreach ($pagination_options as $count): ?>
                                <a class="dropdown-item pagination-count<?= (int)$pagination === $count ? ' active' : '' ?>"
                                   href="#" data-count="<?= $count ?>"><?= $count ?></a>
							<?php endforeach ?>
                        </div>
                    </li>
                    <li>
            <span class="col-sm-4">
                <input class="form-control input-sm" type="text" name="page-search-input" id="page-search-input"
                       onClick="this.select()" placeholder="Search..." data-columns="<?= $page_search_columns ?>">
        </span>
                    </li>

                    <li>
                        <button type="button"
                                class="btn btn-secondary text-<?= $show_archived === 'show' ? 'success' : 'muted' ?>"
                                id="show-archived" data-show-archived="<?= $show_archived ?>">
                            <i class="fa-solid fa-box-archive"></i>
                        </button>
                    </li>

                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button"
                           aria-expanded="false">Filter Category</a>
                        <ul class="dropdown-menu">
                            <li>
                                <a class="dropdown-item<?= isset($category_details) ? '' : ' active' ?><?= isset($category_details) ? '' : ' filter-by' ?>"
                                   href="<?= $controller ?>/<?= isset($category_details) ? '' : '#' ?>"
                                   data-filter-by="Show All">Show All</a>
                            </li>
							<?php foreach ($categories as $category): ?>
                                <li>
                                    <a class="dropdown-item<?= isset($category_details) ? '' : ' filter-by' ?><?= isset($category_details) && ($category['title'] === $category_details['title']) ? ' active' : '' ?>"
                                       href="<?= $controller ?>/<?= isset($category_details) ? $category['slug'] : '#' ?>"
                                       data-filter-by="<?= $category['title'] ?>"><?= $category['title'] ?></a>
                                </li>
							<?php endforeach ?>
                        </ul>
                    </li>

                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" id="main-dropdown-toggle" data-bs-toggle="dropdown"
                           data-controller="<?= strtolower($controller) ?>" data-model="<?= strtolower($model) ?>"
                           href="#"
                           role="button"
                           aria-expanded="false">Sort</a>
                        <ul class="dropdown-menu">
							<?php foreach ($columns as $sort): ?>
                                <li><a class="dropdown-item sort-by<?= $sort_by === $sort ? ' active' : '' ?>"
                                       href="#"
                                       data-sort-by="<?= $sort ?>"
                                       data-controller="<?= strtolower($controller) ?>"><?= ucwords(str_replace("_", " ", $sort)) ?></a>
                                </li>
							<?php endforeach ?>
                        </ul>
                    </li>
                    <li>
                        <button type="button" class="btn btn-secondary" id="sort-asc-desc"
                                data-asc-desc="<?= $sort_by_order ?>">
                            <i class="fa-solid fa-arrow-down-<?= $sort_by_order === 'desc' ? 'z-a' : 'a-z' ?>"></i>
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <!-- PAGINATION BUTTONS CONTAINER -->
    <div class="" id="pagination-container"></div>

    <!-- MAIN TABLE -->
    <table class="table table-striped" data-toggle="table">
        <thead class="align-middle">
        <tr>
			<?php foreach ($columns as $column): ?>
				<?php $column_name = ucwords(str_replace("_", " ", $column)) ?>
                <th>
                    <a href="#" class="text-muted text-decoration-none sort-by"
                       data-sort-by="<?= strtolower($column_name) ?>"
                       data-controller="<?= strtolower($controller) ?>"><?= $column_name ?></a>
                </th>
			<?php endforeach ?>
        </tr>
        </thead>
        <!-- START ITEM CONTENT  -->
        <tbody id="sortable-wrapper" data-api="<?= strtolower($controller) ?>"
               data-parameter="<?= $parameter ?? '' ?>">
        </tbody>
        <!-- END ITEM CONTENT  -->
    </table>

    <!-- PAGINATION STATS CONTAINER -->
    <div class="alert alert-light" id="pagination-stats"></div>
</main>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"
        crossorigin="anonymous"></script>
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<script src="javascript/test-data.js"></script>
<script src="javascript/cookies.js"></script>
<script src="javascript/filtering-sorting.js"></script>
<script src="javascript/pagination.js"></script>
<script src="javascript/main.js"></script>
</body>
</html>
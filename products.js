

/*
 * PHP & jQuery Datagrid
 * Copyright (c) 2022 Chris Komus - GNU GPLv3
 * https://github.com/chriskomus/
 */

/**
 * Generate items on the page from a data source.
 */
function generateItems(data) {
    $('.sortable-item').remove();
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
        jsonColumns.forEach(function (column, index) {
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
document.addEventListener('DOMContentLoaded', load);
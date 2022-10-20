

/*
 * PHP & jQuery Datagrid
 * Copyright (c) 2022 Chris Komus - GNU GPLv3
 * https://github.com/chriskomus/
 */

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
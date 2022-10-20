

/*
 * PHP & jQuery Datagrid
 * Copyright (c) 2022 Chris Komus - GNU GPLv3
 * https://github.com/chriskomus/
 */

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
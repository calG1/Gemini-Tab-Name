// ==UserScript==
// @name         Gemini Tab Renamer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically updates the Gemini tab title to match the active chat name.
// @author       Cal Gilbertson (with help from Antigravity)
// @match        https://gemini.google.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let lastTitle = "";

    function updateTitle() {
        try {
            // Priority 1: Accessibility Standard
            // Google often uses aria-current="page" for the active navigation item
            let activeLink = document.querySelector('a[aria-current="page"]');

            // Priority 2: URL Matching
            if (!activeLink) {
                const currentPath = window.location.pathname;
                // Avoid matching simple "/" or "/app" if we are in a specific chat
                // Typical chat path is /app/ID which is longer than 5 chars
                if (currentPath.length > 5) {
                    activeLink = document.querySelector(`a[href$="${currentPath}"]`);
                }
            }

            if (activeLink) {
                // Heuristic to find the title text within the link
                // 1. Look for a designated title element (common in material design)
                // Gemini sidebar items often have a specific class structure, but filtering trash is safer

                // Clone and remove known "trash" elements like icons (often svg or i tags) to get clean text
                const clone = activeLink.cloneNode(true);
                const trash = clone.querySelectorAll('svg, i, .icon, [role="img"]');
                trash.forEach(el => el.remove());

                // Get text and clean it up
                let newTitle = clone.textContent.trim();

                // Cleanup: specific fix for "Rename" or "Delete" menu options if they were accidentally captured
                // Taking the first non-empty line is a good safety measure against multiline garbage.
                const lines = newTitle.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                if (lines.length > 0) {
                    newTitle = lines[0];
                }

                if (newTitle && newTitle.length > 0 && newTitle !== lastTitle) {
                    document.title = newTitle;
                    lastTitle = newTitle;
                }
            }
        } catch (e) {
            // console.error("Gemini Tab Renamer error:", e);
        }
    }

    // Observer to handle SPA navigation and dynamic updates
    const observer = new MutationObserver((mutations) => {
        // Debounce or just run. DOM operations are fast enough here.
        updateTitle();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial check
    updateTitle();

    // Also listen for URL changes just in case
    window.addEventListener('popstate', updateTitle);

    // Override pushState/replaceState to detect navigation immediately
    const originalPushState = history.pushState;
    history.pushState = function () {
        originalPushState.apply(this, arguments);
        updateTitle();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        updateTitle();
    };

})();

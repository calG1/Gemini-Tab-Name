// ==UserScript==
// @name         Gemini Tab Renamer
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Automatically updates the Gemini tab title to match the active chat name.
// @author       Cal Gilbertson (with help from Antigravity)
// @match        https://gemini.google.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let lastTitle = "";

    function updateTitle() {
        try {
            let newTitle = "";

            // Priority 1: The new data-test-id selector (2026 update)
            const titleElement = document.querySelector('[data-test-id="conversation-title"]');
            
            if (titleElement) {
                newTitle = titleElement.textContent.trim();
            } else {
                // Priority 2: Accessibility Standard (Fallback for older layouts)
                let activeLink = document.querySelector('a[aria-current="page"]');

                // Priority 3: URL Matching (Fallback)
                if (!activeLink) {
                    const currentPath = window.location.pathname;
                    if (currentPath.length > 5) {
                        activeLink = document.querySelector(`a[href$="${currentPath}"]`);
                    }
                }

                if (activeLink) {
                    const clone = activeLink.cloneNode(true);
                    const trash = clone.querySelectorAll('svg, i, .icon, [role="img"]');
                    trash.forEach(el => el.remove());
                    
                    newTitle = clone.textContent.trim();
                    const lines = newTitle.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                    if (lines.length > 0) {
                        newTitle = lines[0];
                    }
                }
            }

            if (newTitle && newTitle.length > 0 && newTitle !== lastTitle) {
                document.title = newTitle;
                lastTitle = newTitle;
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
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        updateTitle();
    };
    
    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        updateTitle();
    };

})();

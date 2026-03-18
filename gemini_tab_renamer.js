// ==UserScript==
// @name         Gemini Tab Renamer
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Automatically updates the Gemini tab title to match the active chat name and removes upsell buttons.
// @author       Cal Gilbertson (with help from Antigravity)
// @match        https://gemini.google.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Inject CSS to hide the upgrade to Google AI Ultra button
    const style = document.createElement('style');
    style.textContent = `
        g1-dynamic-upsell-button,
        [data-test-id="g1-dynamic-upsell-button"],
        .g1-upsell-container {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

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

            if (newTitle && newTitle.length > 0 && document.title !== newTitle) {
                document.title = newTitle;
            } else if (!newTitle && document.title !== "Google Gemini" && document.title !== "Gemini") {
                // If we couldn't find a title (e.g. while loading a new chat) 
                // but the title is already something custom, leave it alone.
                // Otherwise, wait for the DOM to populate.
            }
        } catch (e) {
            // console.error("Gemini Tab Renamer error:", e);
        }
    }

    // Polling fallback to catch dynamic loading where mutations might be missed
    // or happen too fast/slow for the observer hook
    setInterval(() => {
        updateTitle();
    }, 1000);

    // Observer to handle SPA navigation and dynamic updates in the DOM body
    const observer = new MutationObserver((mutations) => {
        updateTitle();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Specific observer for the <title> tag to prevent Gemini from overwriting it
    const titleElementNode = document.querySelector('title');
    if (titleElementNode) {
        const titleObserver = new MutationObserver(() => {
            updateTitle();
        });
        titleObserver.observe(titleElementNode, {
            subtree: true,
            characterData: true,
            childList: true
        });
    }

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

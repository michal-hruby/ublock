// ==UserScript==
// @name         YouTube: Hide Unpopular Videos & Shorts
// @namespace    http://tampermonkey.net/
// @version      2025-12-25
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

        const minViews = 1000;

    /*
        .popular-video {
            background-color: green !important;
        }
        .unpopular-video-hidden {
            display: none !important;
            background-color: red !important;
        }
    */
    GM_addStyle(`
        .unpopular-video-hidden {
            display: none !important;
        }
    `);

    const processContent = function(item) {
        const metadataSpans = item.querySelectorAll(
            'span.yt-content-metadata-view-model__metadata-text, .shortsLockupViewModelHostOutsideMetadataSubhead span'
        );

        let viewCountElement = null;
        for (const span of metadataSpans) {
            if (span.textContent && span.textContent.includes('zhliadnutí')) {
                viewCountElement = span;
                break;
            }
        }

        if (viewCountElement) {
            console.log("yolo");
            const viewCountText = viewCountElement.textContent.trim();
            if (viewCountText.toLowerCase().includes("no views")) {
                item.classList.add('unpopular-video-hidden');
            } else {
                const viewCountMatch = viewCountText.match(/([\d,.]+)\s*(tis.|mil.|Streamované)?\s*zhliadnutí/i);
                if (viewCountMatch) {
                    let viewCount = parseFloat(viewCountMatch[1].replace(/,/g, ''));
                    const suffix = viewCountMatch[2] ? viewCountMatch[2] : null;

                    if (suffix === 'tis.') viewCount *= 1000;
                    else if (suffix === 'mil.') viewCount *= 1000000;

                    if (viewCount < minViews) {
                        item.classList.add('unpopular-video-hidden');
                    }
                }
            }
            return true;
        }
        return false;
    };

    const runCheck = () => {
        const contentSelectors = [
            'ytd-rich-item-renderer',
            'ytd-video-renderer',
            'ytd-compact-video-renderer',
            'ytd-grid-video-renderer',
            'ytd-item-section-renderer'
        ];

        const query = contentSelectors.map(selector => `${selector}:not(.views-processed)`).join(', ');
        const newContent = document.querySelectorAll(query);

        for (const item of newContent) {
            const successfullyProcessed = processContent(item);
            if (successfullyProcessed) {
                item.classList.add('views-processed');
            }
        }
    };

    const observer = new MutationObserver(runCheck);

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    window.addEventListener('yt-navigate-finish', () => {
        // wait a brief moment for the new content to settle in before running check
        setTimeout(runCheck, 500);
    });

    // Initial run for the very first page load
    setTimeout(runCheck, 1000);
})();

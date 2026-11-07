# My Journey next-action visibility

The next-action section was nested inside journeyPageContent, which remains hidden while progress loads and after a required read fails. Moved it immediately above that container so the heading and its status stay visible. Loading clears old activity links; read errors show Retry Loading Journey; sign-out replaces account-specific content with a sign-in message. Fresh successful reads restore the normal recommendation. No progression, scores or rewards changed.

The focused isolated Chrome fixture passes visible loading/error, retry, successful recommendation and late-result/sign-out checks, alongside the existing journey regressions. JavaScript syntax checks pass. The local package is build/student-web-ZbSoj0/public: 26 pages, 528 hash-verified files, no missing/rejected references. No hosted deployment occurred. The full regression suite was not repeated for this focused fix.

Restart an already running preview server to select the newest package; a running server keeps serving the package it selected at startup.

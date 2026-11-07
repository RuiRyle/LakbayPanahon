# Announcement alignment - November 6, 2026

Introduced matching semantic panel headers for the composer and saved-message library. Both columns share padding, heading placement, description spacing and aligned divider heights. Standardized the outer gutter, card radius, post padding and action spacing using page-scoped layout variables. Mobile retains full-width stacking and natural header height. Existing filter, edit, preview and reduced-motion behavior remains intact.

Validation: 45 mocked announcement checks passed at 390px and 1440px, including measured alignment of desktop panel tops and header dividers, matching panel insets, and existing workflow/animation checks. Clean build vcOW9J: 32 pages/571 files, no missing/rejected references. Updated the running localhost preview. No live Firebase records changed.

## Shorter composer

Reduced the default message area to a resizable 150px height, tightened field gaps, shortened composer copy, and paired Visibility with Preview message in one desktop row. Preview expands to full width when opened. Editing places Save and Cancel beside each other where space allows. Both panel headers retain aligned dividers; mobile controls stack naturally. All 45 mocked browser checks passed. Inspected the paired desktop layout. Clean build L84CdV has no missing/rejected references. Updated localhost preview.

# UI source components

Components downloaded from the official shadcn/ui new-york registry on 2026-10-08: button, dialog, input, badge, table, checkbox. MIT licensed. Imports adapted to local relative paths; dialog close label translated to Polish and close target enlarged. Table accepts a containerClassName so the invoice workspace uses one bounded scroll container and keeps sticky headers reliable. Sizes are increased via app CSS for readable office use.

https://ui.shadcn.com/r/styles/new-york/
https://github.com/shadcn-ui/ui/blob/main/LICENSE.md

InvoiceDataTable uses pinned @tanstack/react-table8.21.3 and official v8 documentation, not v9 APIs. Filtering, sorting, pagination and export selection are backed by the local archive.
https://tanstack.com/table/v8/docs/guide/pagination
https://tanstack.com/table/v8/docs/guide/row-selection
https://tanstack.com/table/v8/docs/guide/column-ordering

In 0.2.1 the dialog backdrop is a local static element. Radix Content still owns modal semantics, focus trapping, Escape and outside dismissal. Static stylesheet selectors lock background scrolling; this avoids the stock Overlay's injected scrollbar stylesheet under the desktop's strict style-src 'self' CSP. Recheck nested popovers/layers if introduced later; the current two dialogs contain none.

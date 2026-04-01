# UI/UX & Design Guidelines

This document defines the design standards and core principles for the Simple Quizlet project. Strict adherence to these rules ensures consistency, professionalism, and an excellent User Experience (UX).

---

## 1. Core Principles

1. **Consistency:** All typography, colors, buttons, forms, and spacing must follow predefined design tokens/variables. Do not invent new styles ad-hoc.
2. **Clarity:** Interfaces must be self-explanatory. Users should easily understand their current location and available actions.
3. **Immediate Feedback:** Every user interaction (click, hover, touch, form submission) must trigger immediate visual feedback (e.g., loaders, toast messages, hover states).
4. **Accessibility (a11y):** Maintain sufficient color contrast, legible font sizes, and support for keyboard/screen reader navigation.

---

## 2. Color Palette / Theme

Do not hardcode hex color values (`#FF0000`). Always use predefined CSS variables or framework utility classes (e.g., Tailwind CSS).

### Brand Colors
*   **Primary:** The main brand color (e.g., Royal Blue, Indigo). Used for primary Call-to-Action (CTA) buttons, important links, and main headers.
*   **Primary Hover:** A slightly darker shade of Primary for hover interactions.
*   **Secondary:** Used for secondary actions or tags that shouldn't compete with the Primary color.

### Semantic / Status Colors
*   **Success (Green):** Indicates a successful action (e.g., correct answer, saved successfully).
*   **Error / Danger (Red):** Indicates failure, destructive actions, or warnings (e.g., incorrect answer, delete item).
*   **Warning (Yellow/Orange):** Indicates caution or actions needing attention.
*   **Info (Light Blue):** Used for general informational messages.

### Neutral Colors
*   **Background (Bg-Default):** White (`#FFFFFF`) or very light gray (`#F9FAFB`) for the main application background.
*   **Surface (Bg-Surface):** White for elevated elements like Cards, Modals, and Dropdowns (often paired with drop shadows).
*   **Text Primary:** Dark Gray/Almost Black (`#111827`) for standard readability.
*   **Text Secondary:** Medium Gray (`#6B7280`) for subtler text, placeholder text, and captions.
*   **Border:** Very light gray (`#E5E7EB`) for section dividers and subtle outlines.

---

## 3. Typography & Spacing

*   **Font Family:** Use modern sans-serif fonts optimized for both web and mobile (`Inter`, `Roboto`, or `System UI`).
*   **Scale:**
    *   **H1 (Page Title):** Large and bold (e.g., 24px - 32px).
    *   **H2, H3 (Section Titles):** Medium and bold (e.g., 18px - 20px).
    *   **Body (Paragraphs):** Standard size (e.g., 16px) with line-height ranging from 1.5 to 1.6 for optimum readability.
    *   **Small / Caption:** Smaller size (e.g., 12px - 14px) with subdued color.

*   **Spacing Base:** Use a multiple of 4px (e.g., 4, 8, 12, 16, 24, 32px) for margins and padding. 
    *   *Example:* Standard button padding is `8px 16px`. Standard form field margin is `16px`.

---

## 4. Pending / Loading States

Golden Rule: **Never let the UI freeze or feel broken while waiting for an API response.**

1. **Skeleton Loaders (High Priority):**
    *   Use when rendering the initial layout or fetching large lists (e.g., dashboard, quiz lists, study sets).
    *   Display grayed-out "pulse" animated boxes that mimic the final layout structure.
2. **Spinners / Indeterminate Loaders:**
    *   Use for inline micro-interactions (e.g., form submissions, saving a setting, loading more items).
    *   **Button Rule:** When a user clicks "Save", disable the button and swap its icon or add a small spinner next to the text. *Do not resize the button*—this causes layout shift.
3. **Progress Bars:**
    *   Use for file uploads or global page transitions (like a thin top-bar progress indicator).

---

## 5. Interaction States

Interactive elements (Buttons, Links, Cards) must visibly react to user engagement:

*   **Default:** The standard resting state.
*   **Hover (Desktop):** Background becomes slightly darker/lighter, or elements elevate (e.g., a card moves up `-2px` with an increased drop shadow).
*   **Active / Pressed:** The background darkens, and the element scales down slightly (`scale: 0.95`) to mimic a physical button press.
*   **Disabled:** The element must look inactive. Reduce opacity (e.g., `opacity: 0.5`), desaturate the color, and set the cursor to `not-allowed`.
*   **Focus / Focus-visible:** Crucial for keyboard accessibility. Elements reached via the `Tab` key must have a clear outer ring or highly visible outline.

---

## 6. Specific Components & UX

*   **Flashcards (Core Quizlet UI):**
    *   Must have a smooth 3D flip animation (300ms - 500ms duration).
    *   Must visually differentiate the front and back of the card (e.g., different font weights or background shades).
    *   Support keyboard navigation on desktop (Spacebar to flip, Arrow keys to navigate) and swipe gestures on mobile.
*   **Forms & Inputs:**
    *   Every input must have a clear `<label>`.
    *   Provide helpful placeholder text.
    *   **Error State:** If validation fails, highlight the input border in red, add a red error icon, and display a helpful error message below the input field immediately.
*   **Toasts / Snackbars:**
    *   Provide brief feedback about an operation (e.g., "Study set saved", "Connection error").
    *   Position them at the edges (bottom-center or top-right) and auto-dismiss after ~3-5 seconds.
    *   Include semantic colors and icons corresponding to the status (Success/Error).

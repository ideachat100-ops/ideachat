# IdeaChat - Professional Multi-Page Website

IdeaChat is a modern, premium, responsive, and SEO-optimized business website template built strictly using **Vanilla HTML5**, **CSS3**, and **Vanilla JavaScript** (without any external libraries or frameworks like React, Tailwind, Vue, etc.).

## Key Features

1. **Premium Glassmorphic Design System**: Styled utilizing standard CSS custom variables with radial light glows, subtle card lifts, soft shadows, and clean blur backdrops.
2. **Sticky Glass Navigation & Mobile Overlay Menu**: Fully responsive navigation bar that sticks on scroll, highlighting the active page indicator depending on the current URL.
3. **Smooth Scroll Reveal Engine**: Built on JavaScript Intersection Observer API, animating elements (fade-up, slide-in) gracefully as they enter the viewport.
4. **Hero Typing Animation**: Dynamically cycles through text definitions to describe the brand mission in the Hero section.
5. **Interactive Services Modals**: Open and close dynamic overlays loaded with complete specifications, process roadmaps, deliverables, and customized WhatsApp consult actions.
6. **Portfolio Gallery with Filters, Paging, and Lightbox**: Includes 24 custom vector asset cards. Categorize images by pills, view items on split pages (8 items per page), and open a full-screen Lightbox slider supporting touch swipes and Arrow keys.
7. **LMS Course Detail Pages**: Two mock online learning platforms (Photoshop Mastery & Graphic Design Principles) featuring dynamic video player overlays, file resource download listings, and interactive lesson checklist sidebars tracking completion progress bars in the browser's LocalStorage.
8. **Contact Form Validation & WhatsApp API Redirection**: Front-end validation rules for emails and phones. On successful submit, compiles the form variables into an encoded URL template, automatically launching the WhatsApp chat window with the message.
9. **Collapsible FAQ Accordion**: Toggle questions with height changes and Chevron animations.

## Folder Directory Structure

```text
IdeaChat/
├── index.html                  # Home Page
├── about.html                  # About Page
├── services.html               # Services Page
├── portfolio.html              # Portfolio Page
├── academy.html                # Academy LMS Landing Page
├── contact.html                # Contact Page
├── README.md                   # Project Documentation
├── courses/
│   ├── photoshop-course.html   # Course Page 1
│   └── design-principles.html  # Course Page 2
├── css/
│   ├── style.css               # Global Theme, Variables & Layout
│   ├── responsive.css          # Global Breakpoint Overrides
│   ├── about.css               # About Page Styles
│   ├── services.css            # Services Page Styles
│   ├── portfolio.css            # Portfolio Page Styles
│   ├── academy.css             # Academy LMS Styles
│   └── contact.css             # Contact Page Styles
├── js/
│   ├── main.js                 # Global Animations & Interactions
│   ├── navigation.js           # Navigation menus & sticky headers
│   ├── slider.js               # Testimonial reviews slider
│   ├── popup.js                # Modals popup controls
│   ├── portfolio.js            # Filters, Lightbox, and Pagination
│   ├── academy.js              # LMS Progress calculators
│   └── contact.js              # Contact Form & FAQs Accordion
└── images/
    ├── hero/                   # Hero graphics (workspace.jpg)
    ├── portfolio/              # 24 Portfolio SVGs
    ├── services/               # 4 Services SVGs
    ├── academy/                # Course covers (photoshop.jpg, principles.jpg)
    ├── logo/                   # Brand logo marks
    └── reviews/                # 6 reviews avatars
```

## Running Locally

Since this project consists of standard vanilla files, no compilation or building is required. 

To view the website:
1. Open `index.html` directly in any web browser.
2. For testing advanced features (such as LocalStorage progress synchronizations across tabs and lazy-loaded image triggers), we recommend running a simple local development server. For example:
   - Run `npx live-server` in the `IdeaChat` folder, or
   - Use the VS Code extension **Live Server**.

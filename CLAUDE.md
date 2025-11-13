# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal site and blog for Ariel Barmat, built with Eleventy (11ty), a static site generator. The site is deployed to GitHub Pages.

## Development Commands

### Start Development Server
```bash
yarn dev
# or
yarn start
```
This starts the Eleventy dev server with live reload at http://localhost:8080

### Build Site
```bash
yarn build
```
Generates production-ready static files to the `dist/` directory.

### Format Code
```bash
yarn format
```
Formats JavaScript/JSX files in `src/` using Prettier.

### Deploy
```bash
yarn deploy
```
Builds the site and deploys to GitHub Pages (gh-pages branch → main branch). Development happens on the `dev` branch.

## Architecture

### Static Site Generation (Eleventy)

The site uses Eleventy with Nunjucks (`.njk`) as the primary templating engine. Configuration is in `.eleventy.js`.

**Key Directories:**
- `src/` - Source files (input directory)
  - `_data/meta.js` - Global site metadata (title, author, base URL, etc.)
  - `_includes/` - Nunjucks layout templates
    - `base.njk` - Base layout with minimal structure
    - `base-with-nav.njk` - Base layout with navigation
    - `post.njk` - Layout for blog posts
  - `posts/` - Blog post markdown files (format: `post-YYYY-MM-DD.md`)
  - `css/` - Stylesheets (passed through to dist)
  - `assets/` - Static assets like images (passed through to dist)
  - `index.njk` - Homepage
  - `posts.njk` - Blog listing page
  - `feed.njk`, `feed-atom.njk`, `feeds.njk` - RSS/Atom feeds
- `dist/` - Built output directory (generated, not committed)

### Content Model

**Blog Posts:**
- Located in `src/posts/`
- Named `post-YYYY-MM-DD.md` by convention
- Frontmatter structure:
  ```yaml
  ---
  layout: post.njk
  tags: post
  title: "Post Title"
  date: "YYYY-MM-DD"
  path: "https://original-publication-url"  # For external posts
  permalink: "/{{ title | slugify }}/"      # Auto-generated from title
  ---
  ```
- Posts are tagged with `post` and collected via the `posts` collection (`.eleventy.js:51-53`)
- Collection is reversed to show newest first

### Custom Filters and Transforms

**Filters** (`.eleventy.js:8-30`):
- `dateFilter` - Formats dates as "MMM DD, YYYY" (e.g., "Dec 16, 2018")
- `limit` - Limits array to first N items
- `snippet` - Creates text snippet with ellipsis (default 200 chars)

**Transforms** (`.eleventy.js:33-43`):
- `htmlmin` - Minifies HTML output using html-minifier

**Plugins:**
- `@11ty/eleventy-plugin-rss` - RSS feed generation

### Permalinks and URL Structure

Posts use slugified titles for URLs (configured in `src/_includes/post.njk:5`):
```
permalink: "/{{ title | slugify }}/"
```
This creates clean URLs like `/tuned-to-the-mood-of-the-music/` from the title.

## Important Notes

- **Branch Strategy:** Development on `dev`, deployment to `main` via GitHub Pages
- **External Posts:** Many posts reference external Medium articles via the `path` frontmatter field
- **No Tests:** The project has no test suite configured (`package.json:12`)
- **Template Engine:** All templates use Nunjucks (`.njk`), even though multiple engines are configured

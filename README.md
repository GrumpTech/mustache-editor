# Mustache Editor

Mustache Editor is a browser-based workspace for creating and previewing [Mustache](https://github.com/janl/mustache.js) templates. Edit templates, provide JSON test data, and inspect the rendered result alongside the source.

## Features

- Edit Mustache templates with syntax highlighting, validation, and partial-name completion.
- Preview rendered output using editable JSON5 test data.
- Choose from built-in document and email layouts.
- Load partial templates and optionally include them when rendering.
- Manage template files with tabs and save, rename, import, and export commands.
- Store templates in the browser's local storage.

The in-app **Help** panel describes Mustache variables, sections, inverted sections, partials, custom delimiters, and comments.

## Requirements

- Node.js and npm

## Getting started

Install dependencies and start the development server:

```bash
npm ci
npm start
```

Open [http://localhost:4200/](http://localhost:4200/) in your browser. The development server reloads when application files change.

## Available commands

| Command                | Description                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `npm start`            | Start the development server.                                                          |
| `npm run build`        | Create a production build in `dist/`.                                                  |
| `npm run build:github` | Create a production build configured for GitHub Pages under `/demos/mustache-editor/`. |
| `npm test`             | Run the unit tests.                                                                    |
| `npm run watch`        | Rebuild the development configuration when files change.                               |

## Built-in layouts

The layout selector includes a basic A4 document, a paginated document, a paginated document with a table of contents, and an email layout. Layouts are stored in [`src/assets/layouts/`](src/assets/layouts/).

## Built with

The application uses Angular, Angular Material, CodeMirror, and Mustache.js.

# Birds of Maldives

[Live Demo](https://seven-leven.github.io/bird_dash/)

A digital collection showcasing illustrations of all bird species found in the Maldives.

## Tech Stack

*   **Runtime:** [Deno](https://deno.land/)
*   **Framework:** Vue 3
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS v4

## Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/seven-leven/bird_dash.git
   cd bird_dash
   ```

2. **Install dependencies**
   ```bash
   deno install
   ```

3. **Start the dev server**
   ```bash
   deno task dev
   ```
   Open [http://localhost:5173](http://localhost:5173).

## Deployment

The project uses GitHub Actions to build and deploy to GitHub Pages automatically on push to `main`.

**Build command:**
```bash
deno task build
```

## Structure

*   `src/`: Vue components and application logic.
*   `public/`: Static assets (images, `birds.json`).
*   `deno.jsonc`: Project configuration and task definitions.
*   `vite.config.ts`: Build configuration.

## License

MIT
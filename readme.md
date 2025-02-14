[https://seven-leven.github.io/bird_dash/](https://seven-leven.github.io/bird_dash/)

# Birds of Maldives

A simple webpage dedicated to showcasing the birds of the Maldives. I created
this site to draw and celebrate these beautiful creatures.

## About

Inspired by the vibrant bird life in the Maldives, this project features
hand-drawn illustrations and basic data about each species. It's a passion
project meant to capture the beauty and diversity of the birds found in this
tropical paradise.

## Features

- **Artwork**: Explore hand-drawn birds.
- **Modern Web Technologies**: Built using React, esbuild, and Deno.
- **Responsive Design**: Enjoy a clean and simple layout on any device.

## Getting Started

### Running Locally

To run the project on your local machine:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/seven-leven/bird_dash.git
   cd your-repo-name
   ```

2. **Build the Project** Make sure you have [Deno](https://deno.land/)
   installed. Then run:
   ```bash
   deno run --allow-read --allow-write --allow-net --allow-env --allow-run build.ts
   ```

3. **Serve the Project** Start the server with:
   ```bash
   deno run --allow-read --allow-net server.ts
   ```
   Now, open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment

This project is automatically deployed to GitHub Pages on pushes to the `main`
branch. The build script compiles the source code using esbuild and Deno, and
then copies the static files to the `build/` directory.

## Project Structure

- `src/`: Contains the React source code and components.
- `public/`: Contains static assets like `birds.txt` and CSS files.
- `build.ts`: The build script using esbuild.
- `server.ts`: A simple Deno server for local development.
- `deploy.yml`: GitHub Actions workflow for deploying to GitHub Pages.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgements

- Inspired by the rich and diverse bird life of the Maldives.
- Built with love using [Deno](https://deno.land/),
  [React](https://reactjs.org/), and [esbuild](https://esbuild.github.io/).

Enjoy exploring the birds of the Maldives!

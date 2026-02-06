# Hosting on Cloudflare Pages

This application is built with React and Vite. It produces a static site in the `dist` folder which is ready to be hosted on Cloudflare Pages.

## Prerequisite

Ensure you have built the project:

```bash
npm run build
```

This will create a `dist` folder containing `index.html` (and other assets if not using single-file mode).

## Method 1: Upload via Cloudflare Dashboard

1.  Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2.  Go to **Workers & Pages** > **Create Application** > **Pages** > **Upload Assets**.
3.  Name your project (e.g., `cbt-app`).
4.  Upload the **contents** of the `dist` folder from this project.
5.  Deploy.

## Method 2: Git Integration (Recommended)

1.  Push this code to a GitHub repository.
2.  Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3.  Go to **Workers & Pages** > **Create Application** > **Pages** > **Connect to Git**.
4.  Select your repository.
5.  Configure the build settings:
    *   **Framework preset**: `Vite`
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
6.  Save and Deploy.

## Routing Support

A `public/_redirects` file has been added to the project. This file ensures that client-side routing works correctly (e.g., refreshing `/peserta` won't cause a 404 error) by telling Cloudflare to serve `index.html` for all routes.

The file content is:
```
/*  /index.html  200
```

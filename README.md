# School Youth Parliament Website

Deployable Next.js website for a school Youth Parliament event.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Main Pages

- `/ruling-party`
- `/opposition`
- `/media`
- `/table-officer`
- `/gallery`
- `/about-us`

## Edit Members

Change names, roles, ideology lines, party colors, and photo paths in:

```txt
app/data.js
```

Put real member photos in:

```txt
public/
```

Then set a member's `image` value to something like:

```js
image: "/tejas-bansal.jpg"
```

## Deploy

This project is ready for GitHub Pages. The workflow is in:

```txt
.github/workflows/deploy.yml
```

After pushing to `main`, open the GitHub repository, go to `Settings > Pages`, and set the source to `GitHub Actions` if GitHub asks.

Expected GitHub Pages URL for the current remote:

```txt
https://aoresta.github.io/Dating-App/
```

Build check:

```bash
npm run build
```

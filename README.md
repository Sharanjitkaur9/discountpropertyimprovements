# Discount Property Improvements — upgraded website

Your original Stitch design, kept intact, with a motion and interaction layer added and the broken parts fixed.

## Run it

**Quickest:** double-click `index.html`. It opens in your browser.

**Like a real website (recommended before publishing):**

```bash
cd path/to/this/folder
python3 -m http.server 8000
```

Then open http://localhost:8000. Python comes with macOS.

**To publish:** upload the whole folder (`index.html` + `assets/`) to any static host, such as Netlify Drop, Cloudflare Pages, GitHub Pages or your existing host.

## ⚠️ Do this before going live: connect the forms

The original file showed "Quote Request Received!" after a 0.6-second timer **without sending anything**. Now:

- Until you connect a form service, visitors who submit are told plainly that nothing was sent online. They get a **pre-filled WhatsApp message** with all their details, so they can still reach you in one tap.
- Once connected, the success message only appears **after the server confirms** it received the enquiry.

To connect (about 5 minutes), open `assets/js/config.js`:

1. Go to https://web3forms.com, enter the email where you want enquiries, and copy the access key.
2. Set `endpoint: 'https://api.web3forms.com/submit'` and `accessKey: 'your-key'`.
3. Submit a test quote and check your inbox.

Formspree, or your own server, works too. The options are explained in the file.
Photo uploads only go through the form if your plan supports file attachments (`uploadFiles: true`). Otherwise customers are asked to send photos on WhatsApp.

## Add real before/after photos

The "See the Transformation" slider currently shows **two drawn illustrations, clearly labelled as demonstrations**. To add a real job:

1. Put the photos in `assets/img/projects/`.
2. Add an entry in `config.js` under `transformations` with `verified: true` (there's a commented example).

Only use genuine photos of your own completed work. The "Demonstration" labels disappear automatically for verified entries.

## What changed

| Area | What it does now |
|---|---|
| Hero background | 16-second seamless loop: blueprint lines draw over a drafting grid → timber slats, felt, console, TV and LED wash assemble with a slow 3D camera move → crossfade to your real hero photo with a gentle glide → back to the drawing. Built with SVG + CSS and driven by a small script. It pauses when off-screen or in a background tab, runs lighter on phones, and shows the still photo for visitors who have "reduce motion" switched on. Labelled "Illustrative design sequence". |
| Moving background (whole page) | One fixed, always-moving world behind every section (`assets/js/bg-world.js`): your house photos drift slowly, cross-fade to a new scene as each section reaches the middle of the screen (forest house → steps at dusk → your hallway), with drifting haze, warm light sweeps and floating dust. Sections are frosted-glass panels that float and tilt over it. |
| Cinematic scroll landing | Sticky full-screen stage (`assets/js/cinema.js`, `assets/css/cinema.css`) using the reference engine's maths and timing: 0–650px headline "BUILT TO TRANSFORM." lifts away · 560–1620px timber slat walls part to reveal your finished hallway, background blurs, "Every great space starts with a vision" · 1760–2700px forest house fades in, "Crafted with care. Built to last." · 2760–3560px your six services fly in as a looping slider (arrows, click, Enter/Space; a card takes you to that service) · then "Your vision. Our craftsmanship." Layers in `assets/img/cinema/`. The two house photos were supplied by you; they're labelled "Illustrative scene"; only claim them as your work if they are. |
| Full-page 3D world (removed) | One fixed 3D scene behind the whole site (`assets/js/scene3d.js`, three.js from jsDelivr). The mirror-glass house builds itself on first load, then the camera flies around it as you scroll, while daylight turns to a golden sunset and the windows glow. Floating dust, a site grid and a reflecting pool add depth. |
| Floating sections | Every section is a frosted-glass panel that drifts in with a slight tilt, settles while you read, bobs gently and tilts away as it leaves, with a bronze edge glow on arrival (`assets/js/float.js`). |
| Headline backdrop (old) | Live 3D scene (three.js, loaded from jsDelivr) of a modern mirror-glass house built from set-out lines → slab → steel columns → floors → glass panels → timber cladding → roof, with a working crane. 20-second loop; it sits beside the text on desktop and under the buttons on phones. Pauses off-screen, shows a still finished house for reduce-motion visitors, and is skipped if the browser has no 3D support. Code: `assets/js/hero-house.js`. |
| Section backdrops | Reviews, FAQ and Quote: floor plans (walls, door swings, windows, dimensions, room names) draw themselves line by line at the edges of each section, hold, fade and redraw elsewhere (`assets/js/blueprint-motion.js`). "Transform Your Home": real photos crossfade with a slow camera drift. |
| Hero content | Word-by-word headline reveal (~850 ms), delayed buttons. New "Request a Fast Quote", "Call" and "WhatsApp" buttons. Drafting-line depth layer behind the headline. |
| Service cards | Staggered entrance, hover lift, image zoom, bronze top accent, timber sheen on material services, light parallax. |
| See the Transformation | New section: drag/tap/keyboard slider, project tabs, expandable details, "Request a Similar Renovation" (opens the quote pop-up with the service pre-selected). |
| Reviews | Text, ratings and names unchanged. Cards animate in. On phones they become a swipe carousel with arrow buttons. The "View All Reviews" button now works (it had no code behind it). |
| FAQ | One controller replaces four overlapping scripts (clicking a closed question used to leave everything closed). Plus/minus icons, bronze active state, search highlighting, soft filter transitions. |
| Quote form | Progress steps, inline validation, highlighted service choices, drag-and-drop photos with size checks, honest delivery (see above). |
| Mobile | The original file was locked to a 1280 px-wide page and the hero panel collapsed on phones. Both are fixed. A floating "Request Quote" button appears after the hero. |
| Dead links | Mobile-menu links to sections that didn't exist (#estimator, #gallery) now point to Fast Quote and Reviews. The "Services" nav link now goes to the services, not the hero. |

All motion respects the visitor's "reduce motion" setting.

## Why there's no photoreal 3D build animation

A true photoreal "walls being constructed" sequence needs a rendered video (made in Blender/Cinema 4D by a 3D artist) or real time-lapse footage of one of your jobs. Neither can be generated from the files supplied. The hero instead uses a precise vector blueprint-to-materials sequence that ends on your real photo. It loads fast and never claims to show a completed project. If you later get a suitable video, it can replace the SVG layer inside `.hm` in `index.html`.

## Photos in this version

- `hallway-slat-wall.jpg` is your own photo. It's used in the hero, the featured installation and the acoustic slat card.
- The construction-site photos (`site-*.jpg`) come from the MIT-licensed Constra template by Themefisher (licence in `assets/img/photos/`). They're used only for the moving "What We Offer" backdrop.
- The tiling, fencing, decking, flooring and vinyl card images (`svc-*.jpg`) are computer-rendered material close-ups made for this site, so there are no licence issues. Swap them for photos of your own jobs whenever you can; just keep the same file names.
- The before/after section stays hidden until you add a real before + after pair in `config.js` (`verified: true`).

## Worth checking yourself

- **Images are hot-linked from Stitch's servers** (`lh3.googleusercontent.com/aida...`). These links can stop working. Download them into `assets/img/` and update the `src` paths before launch.
- Some of those images (including the before/after pair inside the first review) may be AI-generated placeholders from Stitch. Replace any that aren't photos of your own work.
- The Google Maps link uses `?cid=discountpropertyimprovements`, which isn't a valid Maps ID. Replace it with your real Google Business Profile link.
- The hero line says "across the South East". Check that's the wording you want for Christchurch & Canterbury.
- The "Live Renovation Concierge" chat gives pre-written keyword answers. It's labelled as an AI assistant, but it isn't connected to one.

## Files

```
index.html               your page (original markup + upgrades)
assets/css/motion.css    all new styles
assets/js/config.js      ← settings you edit (forms, WhatsApp, projects)
assets/js/hero-house.js  3D house build behind the headline
assets/js/motion.js      hero loop, reveals, parallax, slider, reviews, mobile button
assets/js/faq.js         FAQ search / filters / accordion
assets/js/forms.js       validation, uploads, delivery
assets/img/demo/         labelled demonstration illustrations
```

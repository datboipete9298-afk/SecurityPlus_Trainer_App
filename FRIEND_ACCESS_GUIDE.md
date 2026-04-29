# Friend access — simple guide

**Active app folder (for you, the owner):**  
`C:\Users\Petey\Desktop\SecurityPlus_Trainer_App`

Your friend **does not install anything**. They only open a **normal website link** on their phone, tablet, or computer.

---

## 1. How you deploy the app

1. Put the project on **GitHub** (private or public).
2. Connect the repo to **Vercel** or **Netlify** (see `DEPLOYMENT_GUIDE.md`).
3. Set **build command:** `npm run build`  
4. Set **output / publish folder:** `dist`
5. Deploy. You get a URL like `https://your-app.vercel.app` or `https://your-app.netlify.app`.

You run deploy from your machine or from the host’s “Deploy” button — **your friend never runs `npm`**.

---

## 2. How your friend opens it

1. You send them **one link** (copy from Vercel/Netlify after deploy).
2. They tap or paste it in **Safari, Chrome, etc.**
3. The app loads. They can use **Menu** on phones for navigation and **Do this next** at the bottom (same queue as Home) to follow the study path.

---

## 3. What link to send

Send the **production URL** from Vercel or Netlify, for example:

- `https://<your-project>.vercel.app`
- `https://<your-site>.netlify.app`

(Replace with your real hostname after you deploy.)

---

## 4. How progress works

- Progress is saved in the **browser’s localStorage** on **that device only**.
- Phone and PC **do not** share the same storage automatically.
- **No login** — there is no cloud account for progress.

---

## 5. Clearing browser data

If your friend **clears site data** or **uninstalls the browser**, local progress on that device may be **lost**. They should use **Export** before clearing (see below).

---

## 6. Moving progress between devices (Export / Import)

1. On the **old** device: open the app → **Progress** → **Export progress (download JSON)**.
2. Send the file (email, cloud, AirDrop, etc.) to the **new** device.
3. On the **new** device: **Progress** → **Import from file** (or paste JSON) → **Import backup**.

This is the supported way to sync **manually** between phone and PC.

---

## 7. Updating the app later

1. You change code in `SecurityPlus_Trainer_App`, run `npm run build` locally to verify, then **push to GitHub**.
2. Vercel/Netlify **rebuilds** and updates the same URL (unless you change project settings).
3. Your friend **refreshes** the page; they get the new version. Their saved progress usually **remains** (same browser, same site), unless you change storage keys in a breaking way — then document it in release notes.

---

## 8. Mobile notes

The app is **responsive**: hamburger menu, large tap targets, sticky **Do this next** on small screens, and videos scale to the screen width. Works best in an up-to-date mobile browser.

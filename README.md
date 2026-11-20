# Slides Unblocked

Watch YouTube from inside a Google Slides deck. No extensions, no installs, no
separate site. Search, click, and the video plays on a slide.

Owned and maintained by [OwenCosta](https://github.com/OwenCosta). MIT licensed.

---

## What this is

Most schools block `youtube.com` but leave Google Workspace alone. Slides
Unblocked uses that gap: it lives inside the deck's own script, so if Slides
opens, this opens.

Playback uses Google's native video player rather than an embedded iframe. That
matters, because an iframe fails on videos whose uploader disabled embedding
(error 151). A native video object does not care, since Google's own player is
the one streaming it.

It also includes a small game hub and a tools panel for when a lesson gets slow.

---

## How to use it

1. Open the template deck and choose **File > Make a copy**. Make it in your own
   Drive. The script copies with it.
2. Open that copy in the **web version** of Google Slides, in a desktop browser.
3. Wait a few seconds. A **Slides Unblocked** menu appears in the menu bar, to
   the right of **Help**. Reload the tab if it does not show up.
4. Click **Slides Unblocked > Search & play**.
5. Click **Authorize**, then **select all** on the permissions screen and accept
   everything. This is a one time step per copy of the deck.
6. Type what you want and press Enter.
7. Click a result. The video loads onto a player slide and the deck jumps to it.
8. Press the present button. It plays fullscreen like any other slide.

That is it. After the first authorization, step 5 never comes back.

---

## What each menu item does

**Search & play** - search box, saved list, recent list. Clicking anything puts
it on the player slide and closes the dialog.

**Games** - 2048, Snake, Breakout, Minesweeper. Arrow keys or WASD, `n` for a new
game, `p` to pause. High scores are kept locally in your browser.

**Tools** - timer, stopwatch, notepad, random picker.

**Updates** - pulls the current HTML from this repo. **Status** shows what is
cached and where pages are being served from. **Toggle page source** switches
between the script's own files and the downloaded copy.

**Authorize / diagnose** - run this if something stops working. It prints a
pass or fail line for each thing the deck depends on.

---

## Notes

- There is one player slide, reused every time, so the deck does not fill up
  with videos. Deleting it just makes a new one next time.
- If the menu is missing, you are either in the mobile app or the script has not
  finished loading. It has to be the web version.
- The deck needs network access to Google's API and to this repo. If `diagnose`
  shows failures across the board, the school is blocking more than YouTube.
- Search results come from YouTube's public search endpoint. Nothing is proxied
  through a third party service.

---

## Troubleshooting

**No menu after a minute** - reload the tab. Still nothing: open **Extensions >
Apps Script** and check the project exists.

**"Search failed" with a permission or storage message** - close the dialog,
reopen it, try once more. If it persists, run **Authorize / diagnose**.

**Video will not play** - the uploader may have restricted it regionally. Try a
different video. The player slide is a real video object, so 151 is already
handled.

**Games will not load** - a red banner at the top of the games window names the
failing game. Report it with that text.

---

## Updating your copy

The deck pulls HTML from `OwenCosta/SlidesUnblocked` automatically on open, at
most once every five minutes. To pull immediately, use **Updates > Sync now**.

To point a copy at a fork, use **Updates > Settings**. **Reset to default repo**
puts it back.

---

## License

MIT, see [LICENSE](LICENSE).

Copyright (c) 2026 OwenCosta

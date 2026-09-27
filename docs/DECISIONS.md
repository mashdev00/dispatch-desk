# Design decisions

These are the product and design decisions behind Dispatch Desk, and why I made them.

---

## D0. Name, colour and words

**Question:** What is the app called, what is the brand colour, and which words do we use?

**My decision:** The app is called Dispatch Desk. The brand colour is the blue #1D5FD1. The words are "consignment note" (with "bilty" in the hint) and "trip".

**Why:** I wanted a professional colour that fits a work tool. The blue is calm, and it passes contrast both ways: white text on it and it on white are both 5.82:1. "Consignment note" and "trip" are clear to everyone, and "bilty" in the hint keeps the local word dispatchers use.

---

## D1. What does the dispatcher see first?

**Question:** When they open `/trips`, what's at the top?

**My decision:** A short "Needs attention" list comes first: the top five or so problems, each with a short description of what's wrong and a Review action. The full "All trips" table sits underneath and keeps the Attention column, sorting and filters. When nothing needs attention, the list is replaced by a simple "All trips are on track" message.

**Why:** The dispatcher's first question is "what needs me right now?", so the answer goes at the top. The full table is still one scroll away for finding any trip. And when everything is fine, the page should say so plainly instead of showing an empty box.

---

## D2. How loud are problems?

**Question:** How many severity levels, and how do they look in the table and on the review page?

**My decision:** Two levels for now, Critical and Warning, shown in the Attention column. Rows with a critical problem also get a red border on the left.

**Why:** Two levels are enough to separate "act now" from "keep an eye on it", and the rules only produce these two today. The red border makes critical rows stand out while scanning. It is never the only signal, because the badge always has an icon and a word as well.

---

## D3. Clicking a trip in the table

**Question:** Full page (`/trips/[id]`) or a side panel that slides over the table?

**My decision:** A full page.

**Why:** I want a good experience for the dispatcher, and I don't want anything cramped. A full page has room for the problems, the route and the details, and it keeps a link for every trip and a working back button. A side panel is a possible next step.

---

## D4. Order on the trip review page

**Question:** What comes first, and what goes in a side column on desktop?

**My decision:** The default order. The main column has the header, then the open problems, then the route timeline, then activity. The side column has cargo, vehicle, driver, documents and temperature. On phones it's one column in the same order.

**Why:** The dispatcher should catch the problem first. The route and the details are there to explain it and help fix it, so they come after.

---

## D5. Where do actions live?

**Question:** How does the dispatcher act on a problem?

**My decision:** Both (option C). Problem-specific buttons sit on each problem card, and trip-wide actions (Reassign, Add note, Cancel trip) sit in the header.

**Why:** It gives the dispatcher more ways to resolve a problem. The fix for a problem sits right next to it, and actions that affect the whole trip are always in the same place.

---

## D6. Showing the route without a map

**Question:** How do you show stops, windows, ETAs and where the truck is?

**My decision:** A vertical timeline (option A): one row per stop, with the truck's last known position between stops.

**Why:** It works well on a phone too. A vertical list fits long site names and any number of stops.

---

## D7. Creating a trip

**Question:** Four-step wizard or one long form? Can people jump back to earlier steps?

**My decision:** A four-step wizard. People can jump back to any step they've already reached, and there's a Review step at the end with "Change" links.

**Why:** Breaking the job into steps makes it easier for the person creating the trip. Being able to jump back and check everything on a Review step means they don't lose work or create a trip with a mistake.

---

## D8. Density and phones

**Question:** Row height, and what the trips table becomes on a phone.

**My decision:** 48px rows. On phones (under 640px), one card per trip.

**Why:** A wide table that scrolls sideways isn't friendly on a phone. On a phone the dispatcher needs to see the key information quickly, and cards show it at a glance.

---

## D9. Trucks that can't take the trip

**Question:** In the wizard and the Reassign dialog, do you hide trucks and drivers that are busy or too small, or show them disabled with the reason?

**My decision:** Show them in a separate group, disabled, with the reason for each (for example "On TRP-24121 until 16:00" or "Not refrigerated").

**Why:** It's relevant information. The dispatcher may need it to decide on a change, for example waiting for a truck that is free at 16:00. Hiding those trucks would hide that.

---

## The main design problem (for the README)

_To write in my own words: what problem do dispatchers have, and how does this design fix it? 3 to 5 lines._

---

## Alternatives I explored with AI (fill in after Session 8)

_To write after picking a trip review layout._

---

## What I changed after testing (fill in after Session 13)

_To write after the usability test._

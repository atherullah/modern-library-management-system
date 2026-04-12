# Design Document

## Overview

The Wishlist feature is implemented as a thin layer on top of the existing patterns used by Cart and Reservation. It introduces one new Mongoose model, new controller methods in `indexController.js`, two new routes in `indexRoutes.js`, one new EJS view, and small additions to the header partial and `authMiddleware.js`.

## Architecture

### New Files
- `models/Wishlist.js` — Mongoose schema with `user` + `book` refs and a unique compound index.
- `views/customer/wishlist.ejs` — Wishlist page view.

### Modified Files
- `controllers/indexController.js` — Add `getWishlist`, `addToWishlist`, `removeFromWishlist`.
- `routes/indexRoutes.js` — Add GET/POST/DELETE `/wishlist` routes (all behind `requireAuth`).
- `middlewares/authMiddleware.js` — Extend `checkUser` to also set `res.locals.wishlistCount`.
- `views/partials/header.ejs` — Add Wishlist nav link with count badge.

## Data Model

```js
// models/Wishlist.js
{
  user: ObjectId (ref: 'user'),
  book: ObjectId (ref: 'book'),
  timestamps: true
}
// Unique compound index: { user: 1, book: 1 }
```

## API Routes

| Method | Path       | Auth | Description                  |
|--------|------------|------|------------------------------|
| GET    | /wishlist  | Yes  | Render wishlist page         |
| POST   | /wishlist  | Yes  | Add book to wishlist         |
| DELETE | /wishlist  | Yes  | Remove book from wishlist    |

## Controller Logic

### addToWishlist
1. Read `user_id`, `book_id`, `prev_url` from `req.body`.
2. Check for existing entry — if found, flash "already in wishlist" and redirect.
3. Create new Wishlist document.
4. Flash success and redirect to `prev_url`.

### getWishlist
1. Find all Wishlist docs for `res.locals.user.id`, populate `book`.
2. Render `customer/wishlist` with results.

### removeFromWishlist
1. Find Wishlist doc by `req.body.item_id`.
2. Delete it, flash confirmation, redirect to `/wishlist`.

## UI Changes

### Header
Add a "Wishlist" nav link (visible to logged-in users) with a badge showing `wishlistCount` when > 0, matching the existing Cart badge pattern.

### Book Detail Page (`views/customer/book.ejs`)
Add an "Add to Wishlist" button alongside the existing Cart/Reserve buttons.

### Wishlist Page (`views/customer/wishlist.ejs`)
Card-based list of saved books with cover image, title, author, and a Remove button. Empty state message when list is empty.

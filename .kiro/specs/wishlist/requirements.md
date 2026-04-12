# Requirements Document

## Introduction

The Wishlist feature allows authenticated library users to save books they are interested in for later reference. Users can add books to a personal wishlist, view all saved books, remove individual entries, and see a wishlist count indicator in the navigation bar. Duplicate entries are prevented automatically.

## Glossary

- **Wishlist**: A personal collection of books saved by a user for future reference.
- **Wishlist_Controller**: The server-side component that handles wishlist CRUD operations.
- **Wishlist_Model**: The MongoDB document that stores a user–book association for the wishlist.
- **User**: An authenticated library member with role = 1.
- **Book**: A library catalogue entry stored in the Book collection.

## Requirements

### Requirement 1: Add Book to Wishlist

**User Story:** As a logged-in user, I want to add a book to my wishlist, so that I can save it for later without borrowing it immediately.

#### Acceptance Criteria

1. WHEN a logged-in user submits a POST request to `/wishlist`, THE Wishlist_Controller SHALL create a Wishlist entry associating the user with the specified book.
2. WHEN a logged-in user attempts to add a book that already exists in their wishlist, THE Wishlist_Controller SHALL return a flash message stating the book is already in the wishlist and SHALL NOT create a duplicate entry.
3. IF the user is not authenticated, THEN THE Wishlist_Controller SHALL redirect the user to the login page.

### Requirement 2: View Wishlist

**User Story:** As a logged-in user, I want to view all books in my wishlist, so that I can browse my saved books.

#### Acceptance Criteria

1. WHEN a logged-in user navigates to `/wishlist`, THE Wishlist_Controller SHALL retrieve all wishlist entries for that user and render the wishlist view with populated book details.
2. WHILE the user's wishlist is empty, THE Wishlist_Controller SHALL render the wishlist view with an empty-state message.

### Requirement 3: Remove Book from Wishlist

**User Story:** As a logged-in user, I want to remove a book from my wishlist, so that I can keep my wishlist relevant.

#### Acceptance Criteria

1. WHEN a logged-in user submits a DELETE request to `/wishlist` with a valid wishlist entry ID, THE Wishlist_Controller SHALL delete the corresponding Wishlist document and redirect to the wishlist page with a confirmation flash message.
2. IF the wishlist entry does not exist, THEN THE Wishlist_Controller SHALL redirect to the wishlist page with an error flash message.

### Requirement 4: Wishlist Count Indicator

**User Story:** As a logged-in user, I want to see how many books are in my wishlist from any page, so that I have quick visibility into my saved items.

#### Acceptance Criteria

1. WHILE a user is authenticated, THE System SHALL expose a `wishlistCount` local variable to all views containing the number of wishlist entries for that user.
2. THE Header_Partial SHALL display the wishlist count as a badge on the Wishlist navigation link when `wishlistCount` is greater than zero.

### Requirement 5: Prevent Duplicate Entries

**User Story:** As a logged-in user, I want the system to prevent me from adding the same book twice, so that my wishlist stays clean.

#### Acceptance Criteria

1. THE Wishlist_Model SHALL enforce a unique compound index on the `user` and `book` fields so that duplicate documents cannot be inserted at the database level.
2. WHEN a duplicate add is attempted, THE Wishlist_Controller SHALL catch the conflict and display a user-friendly flash message without exposing a server error.

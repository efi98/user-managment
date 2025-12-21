Below is a clear, Angular-oriented plan and lightweight documentation you can hand to a team. No code—just the
architecture, rules, and step-by-step tasks.

# Product Overview

* **Pages:**
* Home - the main page, that contains the user's data and the option to edit the editable fields. (/)
* Admin - the page with the table of users (with sort and filter). (/admin-panel)
* Login - the page with the login form. (/login)
* Sign up - the page with the sign up form. (/signup)
*
    * **Admin users** can view and manage all users + edit their own profile.
    * **Admin users** can promote other users to admin status.
    * **Regular users** see only their own profile and can edit limited fields.
* **UX highlights:** Welcome banner after login or sign up. Dynamic nav (Login/Sign Up vs. Logout).

# Roles & Permissions

* **Regular user**
    * can see the 'Home' page only and edit the editable fields. [display-name, password, age, gender].
* **Admin**
    * can see the 'Admin' page AND the 'home' page.
    * in the admin page, can edit all users' fields [display-name, password, age, gender, isAdmin].

# App Architecture

* **UI Components (high level)**

    * Dashboard:
        * `UserCard` (regular user and admin and can view/edit their own profile)
        * `AdminUserTable` (admin)
    * Admin: `UserTableToolbar` (search, filters, sort controls), `UserCard` (view/edit)

# Sorting & Filtering (Admin Table)

* **Sort by:** username, display name, age, created date, isAdmin.
* **Filter by:** text search across username/display name; age range; gender; admin status.
* **Pagination:** client-side; default page size with selector.
* **Empty/No results:** friendly empty state with tips to clear filters.

---

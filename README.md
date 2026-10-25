 BookStore

A responsive bookstore website built with **HTML, CSS, and JavaScript**. The project provides an organized interface for browsing books across different categories, with a focus on clean design and user-friendly navigation.

 Features

- **Home Page:** A landing page introducing the bookstore.
- **Book Categories:** Browse books by category:
  - Programming
  - Design
  - Business
  - Self Development
- **Authentication Pages:** Login, registration, forgot password, reset password, and verification interfaces.
- **Responsive Design:** Layouts designed to adapt to different screen sizes.
- **Book Details:** Individual book pages populated from the existing catalog.
- **Book Discovery:** Search and sorting on the home page, plus saved favorites and a browser-local cart.
- **Accessible Navigation:** A shared responsive sidebar across all pages and a keyboard-accessible scroll-to-top control.
- **Theme Preferences:** Persistent dark and light themes shared across pages and synchronized between browser tabs.
- **Organized Structure:** Separate folders for pages, authentication, styles, and assets.

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- Git & GitHub

## 📁 Project Structure

```text
BookStore/
├── assets/
│   └── Image/
├── auth/
│   ├── login.html
│   ├── register.html
│   ├── forgot-password.html
│   ├── reset-password.html
│   └── verify.html
├── css/
│   └── style.css
├── js/
│   ├── theme.js
│   └── script.js
├── pages/
│   ├── business.html
│   ├── design.html
│   ├── programming.html
│   └── self-development.html
├── details.html
└── index.html
```

##  Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/MaZenOsama72/BookStore.git
   ```

2. Open the project folder:

   ```bash
   cd BookStore
   ```

3. Open `index.html` in your browser, or use the **Live Server** extension in Visual Studio Code.

## 📝 Notes

- The authentication pages are frontend demonstrations only. Sign-in, registration, verification, and password reset require a backend or authentication service.
- Favorites and the cart are stored in the current browser. They do not submit orders or connect to a payment service.
- The selected color theme is stored as a browser-local preference.
- The contact form prepares a message in the visitor's default email application; it does not send messages directly from the site.
- Make sure the asset paths match the project's folder structure.

## 🎯 Project Goal

The goal of this project is to practice frontend development, improve website structure and styling, and build a foundation for a more complete online bookstore.

---

**Built as a frontend development project.**

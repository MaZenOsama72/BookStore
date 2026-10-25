(() => {
    const storageKeys = {
        favorites: "bookstore-favorites",
        cart: "bookstore-cart"
    };
    const announcement = document.createElement("p");
    announcement.className = "site-announcement";
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.hidden = true;
    document.body.append(announcement);

    let announcementTimer;

    const announce = (message) => {
        announcement.textContent = message;
        announcement.hidden = false;
        window.clearTimeout(announcementTimer);
        announcementTimer = window.setTimeout(() => {
            announcement.hidden = true;
        }, 4000);
    };

    const readStoredValue = (key, fallback) => {
        try {
            const stored = window.localStorage.getItem(key);
            return stored ? JSON.parse(stored) : fallback;
        } catch (error) {
            console.error(`Unable to read ${key} from local storage.`, error);
            announce("Your saved bookstore data could not be loaded.");
            return fallback;
        }
    };

    const writeStoredValue = (key, value) => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Unable to save ${key} to local storage.`, error);
            announce("Your browser could not save this bookstore change.");
            return false;
        }
    };

    const bookSlug = (title) => title.trim().toLocaleLowerCase().replace(/\s+/g, " ");
    const storedFavorites = readStoredValue(storageKeys.favorites, []);
    if (!Array.isArray(storedFavorites) || storedFavorites.some((title) => typeof title !== "string")) {
        console.error("Saved favorites have an invalid format.");
        announce("Saved favorites could not be read.");
    }
    let favoriteTitles = new Set(
        Array.isArray(storedFavorites)
            ? storedFavorites.filter((title) => typeof title === "string")
            : []
    );

    const storedCart = readStoredValue(storageKeys.cart, {});
    const cartHasValidShape = storedCart && typeof storedCart === "object" && !Array.isArray(storedCart);
    if (!cartHasValidShape) {
        console.error("Saved cart has an invalid format.");
        announce("Your saved cart could not be read.");
    }
    let cart = cartHasValidShape ? storedCart : {};
    Object.entries(cart).forEach(([slug, item]) => {
        if (
            !item ||
            typeof item.title !== "string" ||
            !Number.isFinite(item.price) ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1
        ) {
            console.error(`Saved cart item "${slug}" has an invalid format.`);
            delete cart[slug];
            announce("An invalid item was removed from your saved cart.");
        }
    });

    const getBookTitle = (card) =>
        card.dataset.bookTitle || card.querySelector("h3")?.textContent.trim() || "";

    const favoriteButtons = document.querySelectorAll(".book-card, .book-details");
    favoriteButtons.forEach((card) => {
        if (card.classList.contains("book-card") && !card.querySelector(".favorite-btn")) {
            const button = document.createElement("button");
            button.className = "favorite-btn";
            button.type = "button";
            button.textContent = "♡";
            card.append(button);
        }

        const button = card.querySelector(".favorite-btn");
        const title = getBookTitle(card);
        if (!button || !title) return;

        const isFavorite = favoriteTitles.has(bookSlug(title));
        button.type = "button";
        button.dataset.bookTitle = title;
        button.setAttribute("aria-pressed", String(isFavorite));
        button.setAttribute("aria-label", `${isFavorite ? "Remove" : "Add"} ${title} ${isFavorite ? "from" : "to"} favorites`);
        button.textContent = isFavorite ? "♥" : "♡";
    });

    const updateCartSummary = () => {
        const summary = document.querySelector(".cart-summary");
        if (!summary) return;
        const count = Object.values(cart).reduce((total, item) => total + item.quantity, 0);
        summary.textContent = `Cart: ${count}`;
        summary.setAttribute("aria-label", `${count} ${count === 1 ? "item" : "items"} in cart`);
    };

    const navigation = document.querySelector(".navbar");
    if (navigation && !navigation.querySelector(".cart-summary")) {
        const summary = document.createElement("span");
        summary.className = "cart-summary";
        summary.setAttribute("role", "status");
        navigation.append(summary);
    }
    updateCartSummary();

    document.addEventListener("click", (event) => {
        const favoriteButton = event.target.closest(".favorite-btn");
        if (favoriteButton) {
            const title = favoriteButton.dataset.bookTitle ||
                getBookTitle(favoriteButton.closest(".book-card, .book-details"));
            if (!title) return;

            const slug = bookSlug(title);
            const isFavorite = favoriteTitles.has(slug);
            if (isFavorite) favoriteTitles.delete(slug);
            else favoriteTitles.add(slug);

            if (writeStoredValue(storageKeys.favorites, [...favoriteTitles])) {
                document.querySelectorAll(".favorite-btn").forEach((button) => {
                    if (bookSlug(button.dataset.bookTitle || "") !== slug) return;
                    button.setAttribute("aria-pressed", String(!isFavorite));
                    button.setAttribute("aria-label", `${isFavorite ? "Add" : "Remove"} ${title} ${isFavorite ? "to" : "from"} favorites`);
                    button.textContent = isFavorite ? "♡" : "♥";
                });
                announce(isFavorite ? `${title} removed from favorites.` : `${title} added to favorites.`);
            }
            return;
        }

        const addButton = event.target.closest(".add-cart-btn, .book-buttons button");
        if (!addButton) return;

        const card = addButton.closest(".book-card, .book-details");
        const title = card ? getBookTitle(card) : "";
        const priceText = card?.querySelector(".price, .details-price")?.textContent || "";
        const price = Number.parseFloat(priceText.replace(/[^\d.]/g, ""));
        if (!title || !Number.isFinite(price)) {
            console.error("Could not add a book to the cart: its title or price is missing.");
            announce("This book could not be added to the cart.");
            return;
        }

        const slug = bookSlug(title);
        const item = cart[slug] || { title, price, quantity: 0 };
        cart[slug] = { ...item, quantity: item.quantity + 1 };
        if (writeStoredValue(storageKeys.cart, cart)) {
            updateCartSummary();
            announce(`${title} added to your cart.`);
        }
    });

    const booksSection = document.querySelector(".books");
    const searchInput = document.querySelector(".search-box input");
    const sortSelect = document.querySelector(".sort-box select");
    if (booksSection && searchInput && sortSelect) {
        const cards = [...booksSection.querySelectorAll(".book-card")];
        const categories = [...booksSection.querySelectorAll(".book-category")];
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "search-empty";
        emptyMessage.setAttribute("role", "status");
        emptyMessage.hidden = true;
        emptyMessage.textContent = "No books match your search.";
        booksSection.insertBefore(emptyMessage, categories[0] || null);

        cards.forEach((card, index) => {
            card.dataset.originalOrder = String(index);
        });

        const applyBookFilters = () => {
            const query = searchInput.value.trim().toLocaleLowerCase();
            const sort = sortSelect.value;
            let visibleCount = 0;

            categories.forEach((category) => {
                const container = category.querySelector(".book-container");
                const categoryCards = [...category.querySelectorAll(".book-card")];
                categoryCards.sort((left, right) => {
                    const leftTitle = getBookTitle(left);
                    const rightTitle = getBookTitle(right);
                    const leftPrice = Number.parseFloat(left.querySelector(".price")?.textContent.replace(/[^\d.]/g, "") || "0");
                    const rightPrice = Number.parseFloat(right.querySelector(".price")?.textContent.replace(/[^\d.]/g, "") || "0");
                    const leftBadge = left.querySelector(".badge")?.textContent.trim().toLocaleLowerCase();
                    const rightBadge = right.querySelector(".badge")?.textContent.trim().toLocaleLowerCase();

                    switch (sort) {
                        case "best-selling":
                            return Number(rightBadge === "popular") - Number(leftBadge === "popular") ||
                                Number(left.dataset.originalOrder) - Number(right.dataset.originalOrder);
                        case "on-sale":
                            return Number(rightBadge === "sale") - Number(leftBadge === "sale") ||
                                Number(left.dataset.originalOrder) - Number(right.dataset.originalOrder);
                        case "price-low":
                            return leftPrice - rightPrice;
                        case "price-high":
                            return rightPrice - leftPrice;
                        case "name-az":
                            return leftTitle.localeCompare(rightTitle);
                        case "name-za":
                            return rightTitle.localeCompare(leftTitle);
                        default:
                            return Number(left.dataset.originalOrder) - Number(right.dataset.originalOrder);
                    }
                });

                categoryCards.forEach((card) => {
                    const searchableText = [
                        getBookTitle(card),
                        card.querySelector(".description")?.textContent || "",
                        card.querySelector(".book-card > p:not(.description):not(.price)")?.textContent || ""
                    ].join(" ").toLocaleLowerCase();
                    const matches = searchableText.includes(query);
                    card.hidden = !matches;
                    if (matches) visibleCount += 1;
                    container.append(card);
                });
                category.hidden = categoryCards.every((card) => card.hidden);
            });

            emptyMessage.hidden = visibleCount !== 0;
        };

        searchInput.addEventListener("input", applyBookFilters);
        sortSelect.addEventListener("change", applyBookFilters);
        applyBookFilters();
    }

    const scrollButton = document.createElement("button");
    scrollButton.className = "scroll-to-top";
    scrollButton.type = "button";
    scrollButton.setAttribute("aria-label", "Scroll to top");
    scrollButton.setAttribute("aria-hidden", "true");
    scrollButton.tabIndex = -1;
    scrollButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5m0 0 6 6m-6-6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.append(scrollButton);
    const scrollFocusTarget = document.querySelector(".logo");
    if (scrollFocusTarget && !scrollFocusTarget.hasAttribute("tabindex")) {
        scrollFocusTarget.tabIndex = -1;
    }

    let scrollUpdatePending = false;
    const updateScrollButton = () => {
        scrollUpdatePending = false;
        const visible = window.scrollY > 360;
        scrollButton.classList.toggle("is-visible", visible);
        scrollButton.setAttribute("aria-hidden", String(!visible));
        scrollButton.tabIndex = visible ? 0 : -1;
    };

    window.addEventListener("scroll", () => {
        if (scrollUpdatePending) return;
        scrollUpdatePending = true;
        window.requestAnimationFrame(updateScrollButton);
    }, { passive: true });

    scrollButton.addEventListener("click", () => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
        scrollFocusTarget?.focus({ preventScroll: true });
    });
    updateScrollButton();

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const openButton = document.getElementById("open-sidebar");
    const closeButton = document.getElementById("close-sidebar");

    if (sidebar && overlay && openButton && closeButton) {
        const closeSidebar = (returnFocus = true) => {
            sidebar.classList.remove("is-open");
            overlay.classList.remove("is-visible");
            sidebar.setAttribute("aria-hidden", "true");
            sidebar.inert = true;
            openButton.setAttribute("aria-expanded", "false");
            document.body.classList.remove("sidebar-open");
            window.setTimeout(() => {
                if (!overlay.classList.contains("is-visible")) overlay.hidden = true;
            }, 280);
            if (returnFocus) openButton.focus();
        };

        openButton.addEventListener("click", () => {
            sidebar.classList.add("is-open");
            overlay.hidden = false;
            window.requestAnimationFrame(() => overlay.classList.add("is-visible"));
            sidebar.setAttribute("aria-hidden", "false");
            sidebar.inert = false;
            openButton.setAttribute("aria-expanded", "true");
            document.body.classList.add("sidebar-open");
            window.requestAnimationFrame(() => closeButton.focus());
        });
        closeButton.addEventListener("click", () => closeSidebar());
        overlay.addEventListener("click", () => closeSidebar());
        sidebar.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => closeSidebar(false));
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && sidebar.classList.contains("is-open")) closeSidebar();
            if (event.key === "Tab" && sidebar.classList.contains("is-open")) {
                const focusable = [...sidebar.querySelectorAll('a[href], button:not([disabled])')];
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
        window.addEventListener("resize", () => {
            if (window.innerWidth > 1000 && sidebar.classList.contains("is-open")) closeSidebar(false);
        });
    }

    const contactForm = document.querySelector(".contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const name = contactForm.querySelector("#name").value.trim();
            const email = contactForm.querySelector("#email").value.trim();
            const message = contactForm.querySelector("#message").value.trim();
            const subject = encodeURIComponent(`BookStore message from ${name}`);
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
            window.location.href = `mailto:mazen.os.work22@gmail.com?subject=${subject}&body=${body}`;
            announce("Your email app will open with your message ready to send.");
        });
    }

    document.querySelectorAll(".login-form").forEach((form) => {
        const feedback = document.createElement("p");
        feedback.className = "form-feedback";
        feedback.setAttribute("role", "status");
        feedback.setAttribute("aria-live", "polite");
        form.append(feedback);

        const password = form.querySelector("#register-password, #new-password");
        const confirmation = form.querySelector("#confirm-password");
        if (password && confirmation) {
            const validatePasswordMatch = () => {
                confirmation.setCustomValidity(
                    confirmation.value && confirmation.value !== password.value
                        ? "Passwords do not match."
                        : ""
                );
            };
            password.addEventListener("input", validatePasswordMatch);
            confirmation.addEventListener("input", validatePasswordMatch);
        }

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            feedback.textContent = "This frontend demo is not connected to an authentication service.";
        });
    });

    const verificationInputs = [...document.querySelectorAll(".verification-code input")];
    verificationInputs.forEach((input, index) => {
        input.inputMode = "numeric";
        input.pattern = "[0-9]";
        input.maxLength = 1;
        input.setAttribute("aria-label", `Verification code digit ${index + 1} of ${verificationInputs.length}`);
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "").slice(0, 1);
            if (input.value && verificationInputs[index + 1]) verificationInputs[index + 1].focus();
        });
        input.addEventListener("keydown", (event) => {
            if (event.key === "Backspace" && !input.value && verificationInputs[index - 1]) {
                verificationInputs[index - 1].focus();
            }
        });
    });

    const catalog = {
        1: ["Clean Code", "Robert C. Martin", "Write clean and maintainable code", 50, "Programming/Clean Code.jpeg", "programming"],
        2: ["The Pragmatic Programmer", "Andrew Hunt & David Thomas", "Practical techniques for better programming", 45, "Programming/The Pragmatic Programmer.jpeg", "programming"],
        3: ["Design Patterns", "Erich Gamma et al.", "Reusable solutions for software problems", 60, "Programming/Design Patterns.jpeg", "programming"],
        4: ["Atomic Habits", "James Clear", "Small changes create remarkable results", 25, "Self Development/Atomic Habits.jpeg", "self-development"],
        5: ["Deep Work", "Cal Newport", "Rules for focused success", 35, "Self Development/Deep Work.jpeg", "self-development"],
        6: ["How to Win Friends and Influence People", "Dale Carnegie", "Principles for better relationships", 30, "Self Development/How to Win Friends and Influence People.jpeg", "self-development"],
        7: ["Good to Great", "Jim Collins", "Ideas for improving business performance", 40, "Business/Good to Great .jpeg", "business"],
        8: ["Rich Dad Poor Dad", "Robert Kiyosaki", "Lessons about financial education", 30, "Business/Rich Dad Poor Dad.jpeg", "business"],
        9: ["Start With Why", "Simon Sinek", "Purpose that inspires organizations", 35, "Business/Start with Why.jpeg", "business"],
        10: ["About Face", "Alan Cooper", "Guide to interaction and user experience", 55, "Design/About Face jpeg.jpeg", "design"],
        11: ["Designing Interfaces", "Jenifer Tidwell", "Patterns for effective user interfaces", 50, "Design/Designing Interfaces.jpeg", "design"],
        12: ["Don't Make Me Think", "Steve Krug", "Practical guide to web usability", 45, "Design/Don't Make Me Think.jpeg", "design"],
        13: ["The Clean Coder", "Robert C. Martin", "Professional practices for software developers", 40, "Programming/The Clean Coder.jpeg", "programming"],
        14: ["Refactoring", "Martin Fowler", "Improve existing code safely", 55, "Programming/Refactoring.jpeg", "programming"],
        15: ["Head First Design Patterns", "Eric Freeman & Elisabeth Robson", "Beginner-friendly design patterns guide", 50, "Programming/Head First Design Patterns.jpg", "programming"],
        16: ["The 7 Habits of Highly Effective People", "Stephen R. Covey", "Principles for personal effectiveness", 40, "Self Development/The 7 Habits of Highly Effective People.jpg", "self-development"],
        17: ["The Power of Habit", "Charles Duhigg", "Understanding and changing habits", 30, "Self Development/The Power of Habit.jpeg", "self-development"],
        18: ["Think and Grow Rich", "Napoleon Hill", "Ideas for goals and achievement", 30, "Self Development/Think and Grow Rich.jpeg", "self-development"],
        19: ["The Lean Startup", "Eric Ries", "Build businesses through continuous learning", 40, "Business/The Lean Startup.jpg", "business"],
        20: ["Zero to One", "Peter Thiel", "Ideas about innovation and startups", 35, "Business/Zero to One.jpeg", "business"],
        21: ["The Hard Thing About Hard Things", "Ben Horowitz", "Lessons for difficult business challenges", 45, "Business/The Hard Thing About Hard Things.jpeg", "business"],
        22: ["The Design of Everyday Things", "Don Norman", "Principles of user-friendly design", 50, "Design/The Design of Everyday Things.jpeg", "design"],
        23: ["Universal Principles of Design", "William Lidwell et al.", "Essential principles for effective design", 55, "Design/Universal Principles of Design.jpeg", "design"],
        24: ["Sprint", "Jake Knapp et al.", "Process for solving problems quickly", 45, "Design/Sprint.jpeg", "design"]
    };

    const detailsSection = document.querySelector(".book-details");
    if (detailsSection) {
        const params = new URLSearchParams(window.location.search);
        const selectedBook = catalog[params.get("id")];
        if (!selectedBook) {
            detailsSection.textContent = "Book details are not available. Return to the bookstore to browse the catalog.";
        } else {
            const [title, author, description, price, image, category] = selectedBook;
            detailsSection.dataset.bookTitle = title;
            const imagePanel = document.createElement("div");
            imagePanel.className = "book-details-image";
            const cover = document.createElement("img");
            cover.src = `assets/Image/${image}`;
            cover.alt = title;
            imagePanel.append(cover);

            const info = document.createElement("div");
            info.className = "book-details-info";
            const heading = document.createElement("h2");
            heading.textContent = title;
            const authorText = document.createElement("p");
            authorText.className = "details-author";
            authorText.textContent = `by ${author}`;
            const descriptionText = document.createElement("p");
            descriptionText.className = "details-description";
            descriptionText.textContent = description;
            const priceText = document.createElement("p");
            priceText.className = "details-price";
            priceText.textContent = `$${price}`;
            const categoryInfo = document.createElement("div");
            categoryInfo.className = "book-info";
            const categoryText = document.createElement("p");
            categoryText.textContent = `Category: ${category.replace("-", " ")}`;
            categoryInfo.append(categoryText);
            const actions = document.createElement("div");
            actions.className = "details-buttons";
            const addButton = document.createElement("button");
            addButton.className = "add-cart-btn";
            addButton.type = "button";
            addButton.textContent = "Add To Cart";
            const backLink = document.createElement("a");
            backLink.className = "back-books";
            backLink.href = `pages/${category}.html`;
            backLink.textContent = "Browse this category";
            actions.append(addButton, backLink);
            info.append(heading, authorText, descriptionText, priceText, categoryInfo, actions);
            detailsSection.replaceChildren(imagePanel, info);
        }
    }
})();

(() => {
    const storageKey = "bookstore-theme";
    const icons = {
        light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
        dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.1A8.6 8.6 0 0 1 8.9 3.8 8.7 8.7 0 1 0 20.2 15.1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };

    const validTheme = (theme) => theme === "dark" || theme === "light";
    const getSavedTheme = () => {
        try {
            const savedTheme = window.localStorage.getItem(storageKey);
            if (savedTheme === null) return "dark";
            if (validTheme(savedTheme)) return savedTheme;

            window.localStorage.removeItem(storageKey);
            return "dark";
        } catch (error) {
            console.error("Unable to load the saved bookstore theme.", error);
            return "dark";
        }
    };

    const updateControls = () => {
        const theme = document.documentElement.dataset.theme;
        const nextTheme = theme === "dark" ? "light" : "dark";
        let themeColor = document.querySelector('meta[name="theme-color"]');
        if (!themeColor) {
            themeColor = document.createElement("meta");
            themeColor.name = "theme-color";
            document.head.append(themeColor);
        }
        themeColor.content = theme === "dark" ? "#0b1512" : "#f4f5f1";
        document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            button.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
            button.setAttribute("aria-pressed", String(theme === "light"));
            button.title = `Switch to ${nextTheme} mode`;
            const icon = button.querySelector("[data-theme-icon]");
            if (icon) icon.innerHTML = icons[theme];
            const label = button.querySelector("[data-theme-label]");
            if (label) label.textContent = `${theme === "light" ? "Light" : "Dark"} mode`;
        });
    };

    const setTheme = (theme, persist = false) => {
        if (!validTheme(theme)) return;
        document.documentElement.dataset.theme = theme;
        if (persist) {
            try {
                window.localStorage.setItem(storageKey, theme);
            } catch (error) {
                console.error("Unable to save the bookstore theme.", error);
            }
        }
        updateControls();
    };

    setTheme(getSavedTheme());

    document.addEventListener("click", (event) => {
        if (!event.target.closest("[data-theme-toggle]")) return;
        setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
    });

    window.addEventListener("storage", (event) => {
        if (event.key === storageKey) {
            setTheme(validTheme(event.newValue) ? event.newValue : "dark");
        }
    });

    window.BookstoreTheme = { refresh: updateControls };
})();

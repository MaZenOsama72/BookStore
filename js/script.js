(() => {
            const sidebar = document.getElementById("sidebar");
            const overlay = document.getElementById("sidebar-overlay");
            const openButton = document.getElementById("open-sidebar");
            const closeButton = document.getElementById("close-sidebar");

            if (!sidebar || !overlay || !openButton || !closeButton) return;

            const openSidebar = () => {
                sidebar.classList.add("is-open");
                overlay.hidden = false;
                requestAnimationFrame(() => overlay.classList.add("is-visible"));
                sidebar.setAttribute("aria-hidden", "false");
                sidebar.inert = false;
                openButton.setAttribute("aria-expanded", "true");
                document.body.classList.add("sidebar-open");
                closeButton.focus();
            };

            const closeSidebar = ({ returnFocus = true } = {}) => {
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

            openButton.addEventListener("click", openSidebar);
            closeButton.addEventListener("click", () => closeSidebar());
            overlay.addEventListener("click", () => closeSidebar());

            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape" && sidebar.classList.contains("is-open")) {
                    closeSidebar();
                }
            });

            sidebar.querySelectorAll("a").forEach((link) => {
                link.addEventListener("click", () => closeSidebar({ returnFocus: false }));
            });

            window.addEventListener("resize", () => {
                if (window.innerWidth > 1000 && sidebar.classList.contains("is-open")) {
                    closeSidebar({ returnFocus: false });
                }
            });
        })();
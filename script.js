/* ==================================================
   1. ELEMENTE
================================================== */

const header =
    document.getElementById("header");

const burger =
    document.getElementById("burger");

const nav =
    document.getElementById("nav-links");

const revealElemente =
    document.querySelectorAll(".reveal");

const processListe =
    document.querySelector(".process-list");

/* ==================================================
   2. HEADER BEIM SCROLLEN
================================================== */

function headerAktualisieren() {

    if (!header) {
        return;
    }

    header.classList.toggle(
        "scrolled",
        window.scrollY > 24
    );
}

window.addEventListener(
    "scroll",
    headerAktualisieren,
    { passive: true }
);

headerAktualisieren();

/* ==================================================
   3. MOBILE NAVIGATION
================================================== */

function navigationSchliessen() {

    if (
        !burger ||
        !nav
    ) {
        return;
    }

    nav.classList.remove(
        "active"
    );

    burger.setAttribute(
        "aria-expanded",
        "false"
    );
}

if (
    burger &&
    nav
) {

    burger.addEventListener(
        "click",
        function () {

            const istOffen =
                nav.classList.toggle(
                    "active"
                );

            burger.setAttribute(
                "aria-expanded",
                String(istOffen)
            );
        }
    );

    nav
        .querySelectorAll("a")
        .forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    navigationSchliessen
                );
            }
        );

    window.addEventListener(
        "resize",
        function () {

            if (
                window.innerWidth >
                800
            ) {
                navigationSchliessen();
            }
        }
    );

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {
                navigationSchliessen();
            }
        }
    );
}

/* ==================================================
   4. REVEAL ANIMATIONEN
================================================== */

if (
    "IntersectionObserver"
    in window
) {

    const revealObserver =
        new IntersectionObserver(
            function (eintraege) {

                eintraege.forEach(
                    function (eintrag) {

                        if (
                            !eintrag.isIntersecting
                        ) {
                            return;
                        }

                        eintrag.target.classList.add(
                            "visible"
                        );

                        revealObserver.unobserve(
                            eintrag.target
                        );
                    }
                );
            },
            {
                threshold: 0.1
            }
        );

    revealElemente.forEach(
        function (element) {

            revealObserver.observe(
                element
            );
        }
    );

} else {

    revealElemente.forEach(
        function (element) {

            element.classList.add(
                "visible"
            );
        }
    );
}

/* ==================================================
   5. PROZESS-FORTSCHRITT BEIM SCROLLEN
================================================== */

let processAnimationFrame =
    null;

function processFortschrittAktualisieren() {

    processAnimationFrame =
        null;

    if (!processListe) {
        return;
    }

    const rect =
        processListe.getBoundingClientRect();

    const viewportHoehe =
        window.innerHeight ||
        document.documentElement.clientHeight;

    const start =
        viewportHoehe * 0.74;

    const ende =
        viewportHoehe * 0.28;

    const strecke =
        Math.max(
            1,
            rect.height + start - ende
        );

    const fortschritt =
        Math.min(
            1,
            Math.max(
                0,
                (start - rect.top) /
                strecke
            )
        );

    processListe.style.setProperty(
        "--process-progress",
        fortschritt.toFixed(3)
    );
}

function processScrollAnfordern() {

    if (
        processAnimationFrame !==
        null
    ) {
        return;
    }

    processAnimationFrame =
        window.requestAnimationFrame(
            processFortschrittAktualisieren
        );
}

window.addEventListener(
    "scroll",
    processScrollAnfordern,
    { passive: true }
);

window.addEventListener(
    "resize",
    processScrollAnfordern
);

processFortschrittAktualisieren();

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

const navLinks =
    document.querySelectorAll(
        ".nav-links a[href^='#']"
    );

const navBereiche = [
    document.getElementById("leistungen"),
    document.getElementById("referenzen"),
    document.getElementById("ablauf"),
    document.getElementById("ueber-mich")
].filter(Boolean);


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


/* ==================================================
   6. AKTIVER NAVIGATIONSPUNKT BEIM SCROLLEN
================================================== */

let navAnimationFrame =
    null;

function aktivenNavLinkSetzen(
    bereichId
) {

    navLinks.forEach(
        function (link) {

            const ziel =
                link.getAttribute(
                    "href"
                );

            const istAktiv =
                ziel ===
                "#" + bereichId;

            link.classList.toggle(
                "active",
                istAktiv
            );

            if (istAktiv) {

                link.setAttribute(
                    "aria-current",
                    "location"
                );

            } else {

                link.removeAttribute(
                    "aria-current"
                );
            }
        }
    );
}


function navigationAktualisieren() {

    navAnimationFrame =
        null;

    if (
        navBereiche.length === 0
    ) {
        return;
    }

    const viewportHoehe =
        window.innerHeight ||
        document.documentElement.clientHeight;

    /*
       Die gedachte Aktiv-Linie liegt
       etwa bei 32 % der Bildschirmhöhe.
    */

    const aktivLinie =
        viewportHoehe * 0.32;

    let aktiverBereich =
        null;


    navBereiche.forEach(
        function (bereich) {

            const rect =
                bereich.getBoundingClientRect();

            if (
                rect.top <= aktivLinie &&
                rect.bottom > aktivLinie
            ) {

                aktiverBereich =
                    bereich;
            }
        }
    );


    /*
       Oberhalb des ersten Navi-Bereichs
       wird kein Menüpunkt markiert.
    */

    if (!aktiverBereich) {

        const ersterBereich =
            navBereiche[0]
                .getBoundingClientRect();

        if (
            ersterBereich.top >
            aktivLinie
        ) {

            navLinks.forEach(
                function (link) {

                    link.classList.remove(
                        "active"
                    );

                    link.removeAttribute(
                        "aria-current"
                    );
                }
            );

            return;
        }


        /*
           Falls wir bereits unterhalb
           des letzten Bereichs sind,
           bleibt der letzte Punkt aktiv.
        */

        aktiverBereich =
            navBereiche[
                navBereiche.length - 1
            ];
    }


    aktivenNavLinkSetzen(
        aktiverBereich.id
    );
}


function navScrollAnfordern() {

    if (
        navAnimationFrame !==
        null
    ) {
        return;
    }

    navAnimationFrame =
        window.requestAnimationFrame(
            navigationAktualisieren
        );
}


window.addEventListener(
    "scroll",
    navScrollAnfordern,
    { passive: true }
);

window.addEventListener(
    "resize",
    navScrollAnfordern
);

navigationAktualisieren();
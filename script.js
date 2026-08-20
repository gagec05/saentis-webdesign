/* ==================================================
   1. ELEMENTE
================================================== */

const header =
    document.getElementById("header");

const burger =
    document.getElementById("burger");

const nav =
    document.getElementById("nav-links");

const navigationBreakpoint = 960;

const revealElemente =
    document.querySelectorAll(".reveal");

const processListe =
    document.querySelector(".process-list");

const processSchritte =
    processListe
        ? Array.from(
            processListe.querySelectorAll(
                ".process-item"
            )
        )
        : [];

const processKnoten =
    processSchritte
        .map(
            function (schritt) {
                return schritt.querySelector(
                    ".process-node"
                );
            }
        )
        .filter(Boolean);

const processHoverAbfrage =
    typeof window.matchMedia === "function"
        ? window.matchMedia(
            "(hover: hover) and (pointer: fine)"
        )
        : null;

const processTouchLayoutAbfrage =
    typeof window.matchMedia === "function"
        ? window.matchMedia(
            "(max-width: 1100px)"
        )
        : null;

const navLinks =
    document.querySelectorAll(
        ".nav-links a[href^='#']:not(.nav-cta)"
    );

const navBereiche = [
    document.getElementById("angebot"),
    document.getElementById("webdesign-st-gallen"),
    document.getElementById("referenzen"),
    document.getElementById("ablauf"),
    document.getElementById("ueber-mich")
].filter(Boolean);

const kontaktBereich =
    document.getElementById("kontakt");


/* Formular */

const projektFormular =
    document.getElementById("project-form");

const formularStatus =
    document.getElementById("form-status");

const formularButton =
    projektFormular
        ? projektFormular.querySelector(
            'button[type="submit"]'
        )
        : null;

const turnstileContainer =
    document.getElementById(
        "turnstile-widget"
    );

let formularWirdGesendet =
    false;

let turnstileWidgetId =
    null;

let turnstileAnfrage =
    null;


/* ==================================================
   2. HEADER BEIM SCROLLEN
================================================== */

function headerAktualisieren() {

    if (!header) {
        return;
    }

    const istKompakt =
        window.scrollY > 24;

    if (
        headerIstKompakt ===
        istKompakt
    ) {
        return;
    }

    header.classList.toggle(
        "scrolled",
        istKompakt
    );

    headerIstKompakt =
        istKompakt;
}

let headerIstKompakt =
    null;


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

    burger.setAttribute(
        "aria-label",
        "Menü öffnen"
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

            burger.setAttribute(
                "aria-label",
                istOffen
                    ? "Menü schließen"
                    : "Menü öffnen"
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
                navigationBreakpoint
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

let seitenAnimationFrame =
    null;

let letzterProcessFortschritt =
    null;

let letzterAktiverProcessSchritt =
    null;


function processFortschrittAktualisieren() {

    if (
        !processListe ||
        processKnoten.length === 0
    ) {
        return;
    }

    const viewportHoehe =
        window.innerHeight ||
        document.documentElement.clientHeight;

    const ersterKnotenRect =
        processKnoten[0]
            .getBoundingClientRect();

    const letzterKnotenRect =
        processKnoten[
            processKnoten.length - 1
        ].getBoundingClientRect();

    const ersterKnotenMitte =
        ersterKnotenRect.top +
        ersterKnotenRect.height / 2;

    const letzterKnotenMitte =
        letzterKnotenRect.top +
        letzterKnotenRect.height / 2;

    const triggerStart =
        viewportHoehe * 0.90;

    const triggerEnde =
        viewportHoehe * 0.40;

    const knotenAbstand =
        Math.max(
            0,
            letzterKnotenMitte -
            ersterKnotenMitte
        );

    const fortschrittStrecke =
        Math.max(
            1,
            knotenAbstand +
            triggerStart -
            triggerEnde
        );

    const fortschritt =
        Math.min(
            1,
            Math.max(
                0,
                (triggerStart -
                    ersterKnotenMitte) /
                fortschrittStrecke
            )
        );

    const processFortschritt =
        fortschritt.toFixed(3);

    if (
        processFortschritt !==
        letzterProcessFortschritt
    ) {
        processListe.style.setProperty(
            "--process-progress",
            processFortschritt
        );

        letzterProcessFortschritt =
            processFortschritt;
    }

    const verwendetTouchLayout =
        processTouchLayoutAbfrage
            ? processTouchLayoutAbfrage.matches
            : window.innerWidth <= 1100;

    const kannHover =
        !verwendetTouchLayout &&
        processHoverAbfrage &&
        processHoverAbfrage.matches;

    const aktiverSchritt =
        !kannHover &&
        fortschritt > 0 &&
        processSchritte.length > 0
            ? Math.min(
                processSchritte.length - 1,
                Math.floor(
                    fortschritt *
                    processSchritte.length
                )
            )
            : -1;

    if (
        aktiverSchritt ===
        letzterAktiverProcessSchritt
    ) {
        return;
    }

    processSchritte.forEach(
        function (schritt, index) {

            const istAktiv =
                index === aktiverSchritt;

            schritt.classList.toggle(
                "is-active",
                istAktiv
            );

            if (istAktiv) {
                schritt.setAttribute(
                    "aria-current",
                    "step"
                );
            } else {
                schritt.removeAttribute(
                    "aria-current"
                );
            }
        }
    );

    letzterAktiverProcessSchritt =
        aktiverSchritt;
}

[
    processHoverAbfrage,
    processTouchLayoutAbfrage
]
    .filter(Boolean)
    .forEach(
        function (abfrage) {
            if (
                typeof abfrage
                    .addEventListener ===
                "function"
            ) {
                abfrage.addEventListener(
                    "change",
                    seitenzustandAnfordern
                );
            } else {
                abfrage.addListener(
                    seitenzustandAnfordern
                );
            }
        }
    );


/* ==================================================
   6. AKTIVER NAVIGATIONSPUNKT BEIM SCROLLEN
================================================== */

let letzterNavBereich;


function aktivenNavLinkSetzen(
    bereichId
) {

    if (
        letzterNavBereich ===
        bereichId
    ) {
        return;
    }

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

    letzterNavBereich =
        bereichId;
}


function navigationAktualisieren() {

    if (
        navBereiche.length === 0
    ) {
        return;
    }


    const viewportHoehe =
        window.innerHeight ||
        document.documentElement.clientHeight;


    /*
       Aktiv-Linie bei ungefähr
       32 % der Bildschirmhöhe.
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
       Im Kontaktbereich bleibt kein
       regulärer Menüpunkt aktiv.
    */

    if (kontaktBereich) {

        const kontaktPosition =
            kontaktBereich
                .getBoundingClientRect();

        if (
            kontaktPosition.top <=
            aktivLinie
        ) {

            aktivenNavLinkSetzen(null);
            return;
        }
    }


    /*
       Oberhalb des ersten Bereichs
       kein aktiver Menüpunkt.
    */

    if (!aktiverBereich) {

        const ersterBereich =
            navBereiche[0]
                .getBoundingClientRect();


        if (
            ersterBereich.top >
            aktivLinie
        ) {

            aktivenNavLinkSetzen(null);

            return;
        }


        /*
           Bis zum Kontakt bleibt der letzte
           reguläre Bereich aktiv.
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


function seitenzustandAktualisieren() {

    seitenAnimationFrame =
        null;

    navigationAktualisieren();
    processFortschrittAktualisieren();
    headerAktualisieren();
}


function seitenzustandAnfordern() {

    if (
        seitenAnimationFrame !==
        null
    ) {
        return;
    }

    seitenAnimationFrame =
        window.requestAnimationFrame(
            seitenzustandAktualisieren
        );
}


window.addEventListener(
    "scroll",
    seitenzustandAnfordern,
    { passive: true }
);

window.addEventListener(
    "resize",
    seitenzustandAnfordern
);

seitenzustandAktualisieren();


/* ==================================================
   7. FORMULAR STATUS
================================================== */

function formularStatusSetzen(
    nachricht = "",
    typ = ""
) {

    if (!formularStatus) {
        return;
    }

    formularStatus.textContent =
        nachricht;

    formularStatus.classList.remove(
        "success",
        "error"
    );


    if (typ) {

        formularStatus.classList.add(
            typ
        );
    }
}


/* ==================================================
   8. FORMULAR BUTTON
================================================== */

function formularButtonLaden(
    istLaden
) {

    if (!formularButton) {
        return;
    }


    formularButton.disabled =
        istLaden;


    const text =
        formularButton.querySelector(
            "span"
        );


    if (!text) {
        return;
    }


    if (
        !text.dataset.originalHtml
    ) {

        text.dataset.originalHtml =
            text.innerHTML;
    }


    if (istLaden) {

        text.innerHTML = `
            <small>
                WIRD GESENDET
            </small>

            Anfrage senden …
        `;

    } else {

        text.innerHTML =
            text.dataset.originalHtml;
    }
}


/* ==================================================
   9. FORMULARDATEN
================================================== */

function formularDatenErstellen(
    formular
) {

    const daten =
        new FormData(
            formular
        );


    return {

        name:
            String(
                daten.get("name") || ""
            ).trim(),

        company:
            String(
                daten.get("company") || ""
            ).trim(),

        email:
            String(
                daten.get("email") || ""
            ).trim(),

        phone:
            String(
                daten.get("phone") || ""
            ).trim(),

        website:
            String(
                daten.get("website") || ""
            ).trim(),

        project_type:
            String(
                daten.get("project_type") || ""
            ).trim(),

        message:
            String(
                daten.get("message") || ""
            ).trim(),

        website_check:
            String(
                daten.get("website_check") || ""
            ).trim(),

        privacy_consent:
            String(
                daten.get("privacy_consent") || ""
            ).trim()
    };
}


function turnstileFehlerErstellen() {
    const fehler =
        new Error(
            "Turnstile konnte kein Token erstellen."
        );

    fehler.name =
        "TurnstileError";

    return fehler;
}


function turnstileAnfrageBeenden(
    token = ""
) {
    if (!turnstileAnfrage) {
        return;
    }

    const aktuelleAnfrage =
        turnstileAnfrage;

    turnstileAnfrage =
        null;

    window.clearTimeout(
        aktuelleAnfrage.timeoutId
    );

    if (token) {
        aktuelleAnfrage.resolve(token);
    } else {
        aktuelleAnfrage.reject(
            turnstileFehlerErstellen()
        );
    }
}


function turnstileInitialisieren() {
    if (
        !turnstileContainer ||
        !window.turnstile ||
        turnstileWidgetId !== null
    ) {
        return;
    }

    const siteKey =
        String(
            turnstileContainer
                .dataset.sitekey || ""
        ).trim();

    if (!siteKey) {
        return;
    }

    try {
        turnstileWidgetId =
            window.turnstile.render(
                turnstileContainer,
                {
                    sitekey: siteKey,
                    action:
                        "contact_form",
                    execution:
                        "execute",
                    appearance:
                        "interaction-only",
                    theme:
                        "dark",
                    language:
                        "de",
                    "response-field":
                        false,
                    callback:
                        function (token) {
                            turnstileAnfrageBeenden(
                                token
                            );
                        },
                    "error-callback":
                        function () {
                            turnstileAnfrageBeenden();
                        },
                    "expired-callback":
                        function () {
                            turnstileAnfrageBeenden();
                        },
                    "timeout-callback":
                        function () {
                            turnstileAnfrageBeenden();
                        }
                }
            );
    } catch {
        turnstileWidgetId =
            null;
    }
}


function turnstileTokenErstellen() {
    turnstileInitialisieren();

    if (
        !window.turnstile ||
        turnstileWidgetId === null
    ) {
        return Promise.reject(
            turnstileFehlerErstellen()
        );
    }

    return new Promise(
        function (resolve, reject) {
            turnstileAnfrage = {
                resolve,
                reject,
                timeoutId:
                    window.setTimeout(
                        function () {
                            turnstileAnfrageBeenden();
                        },
                        120000
                    )
            };

            try {
                window.turnstile.execute(
                    turnstileWidgetId
                );
            } catch {
                turnstileAnfrageBeenden();
            }
        }
    );
}


function turnstileZuruecksetzen() {
    if (
        !window.turnstile ||
        turnstileWidgetId === null
    ) {
        return;
    }

    try {
        window.turnstile.reset(
            turnstileWidgetId
        );
    } catch {
        // Ein fehlender Reset darf die Formular-UX nicht blockieren.
    }
}


/* ==================================================
   10. FORMULAR SENDEN
================================================== */

async function projektAnfrageSenden(
    event
) {

    event.preventDefault();


    if (
        !projektFormular ||
        formularWirdGesendet
    ) {
        return;
    }


    /*
       Native Browser-Validierung
    */

    if (
        !projektFormular.checkValidity()
    ) {

        projektFormular.reportValidity();

        return;
    }


    const daten =
        formularDatenErstellen(
            projektFormular
        );


    formularStatusSetzen();

    formularWirdGesendet =
        true;

    formularButtonLaden(
        true
    );


    try {

        daten.turnstile_token =
            await turnstileTokenErstellen();

        const antwort =
            await fetch(
                "/api/contact",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            daten
                        )
                }
            );


        let ergebnis =
            null;


        try {

            ergebnis =
                await antwort.json();

        } catch {

            ergebnis =
                null;
        }


        if (!antwort.ok) {

            formularStatusSetzen(
                ergebnis?.message ||
                "Die Anfrage konnte momentan nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie direkt an info@saentiswebdesign.ch.",
                "error"
            );

            return;
        }


        formularStatusSetzen(
            ergebnis?.message ||
            "Vielen Dank. Ihre Anfrage wurde gesendet.",
            "success"
        );


        projektFormular.reset();


    } catch (fehler) {

        formularStatusSetzen(
            fehler?.name ===
                "TurnstileError"
                ? "Die Anfrage konnte nicht bestätigt werden. Bitte versuchen Sie es erneut."
                : "Die Anfrage konnte momentan nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie direkt an info@saentiswebdesign.ch.",
            "error"
        );


    } finally {

        formularWirdGesendet =
            false;

        formularButtonLaden(
            false
        );

        turnstileZuruecksetzen();
    }
}


/* ==================================================
   11. FORMULAR INITIALISIEREN
================================================== */

if (
    projektFormular
) {

    turnstileInitialisieren();

    projektFormular.addEventListener(
        "submit",
        projektAnfrageSenden
    );


    /*
       Fehlermeldung entfernen,
       sobald wieder geschrieben wird.
    */

    projektFormular.addEventListener(
        "input",
        function () {

            if (
                formularStatus &&
                formularStatus.classList.contains(
                    "error"
                )
            ) {

                formularStatusSetzen();
            }
        }
    );
}

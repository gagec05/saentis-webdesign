const ERLAUBTE_ORIGINS = new Set([
    "https://saentiswebdesign.ch",
    "https://www.saentiswebdesign.ch",
    "http://localhost:8788",
    "http://127.0.0.1:8788"
]);

const RESEND_URL =
    "https://api.resend.com/emails";

const ABSENDER =
    "Säntis Webdesign <website@saentiswebdesign.ch>";

const EMPFAENGER =
    "info@saentiswebdesign.ch";

const PROJEKTARTEN = {
    "new-website": "Neue Website",
    "redesign": "Bestehende Website modernisieren",
    "optimization": "Website optimieren",
    "other": "Anderes Projekt"
};

const MAXIMALE_REQUEST_GROESSE =
    24 * 1024;

const TURNSTILE_VERIFY_URL =
    "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const TURNSTILE_ACTION =
    "contact_form";

const TURNSTILE_PRODUKTIONSHOSTS = new Set([
    "saentiswebdesign.ch",
    "www.saentiswebdesign.ch"
]);

const TURNSTILE_LOKALE_HOSTS = new Set([
    "localhost",
    "127.0.0.1"
]);


function jsonAntwort(
    status,
    inhalt
) {
    return new Response(
        JSON.stringify(inhalt),
        {
            status,
            headers: {
                "Content-Type":
                    "application/json; charset=utf-8",
                "Cache-Control":
                    "no-store",
                "X-Content-Type-Options":
                    "nosniff"
            }
        }
    );
}


function istErlaubterOrigin(
    request
) {
    let requestOrigin;

    try {
        requestOrigin =
            new URL(request.url).origin;
    } catch {
        return false;
    }

    if (
        !ERLAUBTE_ORIGINS.has(
            requestOrigin
        )
    ) {
        return false;
    }

    const originHeader =
        request.headers.get("Origin");

    return (
        !originHeader ||
        originHeader === requestOrigin
    );
}


function contentTypeIstJson(
    request
) {
    const contentType =
        request.headers.get(
            "Content-Type"
        ) || "";

    return (
        contentType
            .split(";", 1)[0]
            .trim()
            .toLowerCase() ===
        "application/json"
    );
}


function angegebeneRequestGroesse(
    request
) {
    const rohwert =
        request.headers.get(
            "Content-Length"
        );

    if (
        !rohwert ||
        !/^\d+$/.test(
            rohwert.trim()
        )
    ) {
        return null;
    }

    const groesse =
        Number(rohwert);

    return Number.isSafeInteger(groesse)
        ? groesse
        : MAXIMALE_REQUEST_GROESSE + 1;
}


async function jsonRequestLesen(
    request
) {
    const angegebeneGroesse =
        angegebeneRequestGroesse(
            request
        );

    if (
        angegebeneGroesse !== null &&
        angegebeneGroesse >
            MAXIMALE_REQUEST_GROESSE
    ) {
        return {
            zuGross: true
        };
    }

    if (!request.body) {
        return {
            ungueltig: true
        };
    }

    const reader =
        request.body.getReader();

    const decoder =
        new TextDecoder();

    let geleseneBytes = 0;
    let text = "";

    try {
        while (true) {
            const {
                done,
                value
            } = await reader.read();

            if (done) {
                break;
            }

            geleseneBytes +=
                value.byteLength;

            if (
                geleseneBytes >
                MAXIMALE_REQUEST_GROESSE
            ) {
                try {
                    await reader.cancel();
                } catch {
                    // Das erkannte Grössenlimit bleibt massgebend.
                }

                return {
                    zuGross: true
                };
            }

            text += decoder.decode(
                value,
                {
                    stream: true
                }
            );
        }

        text += decoder.decode();
    } catch {
        return {
            ungueltig: true
        };
    }

    try {
        return {
            daten:
                JSON.parse(text)
        };
    } catch {
        return {
            ungueltig: true
        };
    }
}


function textFeldLesen(
    daten,
    feld,
    maximaleLaenge,
    mehrzeilig = false
) {
    const rohwert =
        daten[feld];

    if (
        rohwert === undefined ||
        rohwert === null
    ) {
        return "";
    }

    if (
        typeof rohwert !== "string"
    ) {
        return null;
    }

    const wert =
        rohwert.trim();

    if (
        wert.length > maximaleLaenge ||
        (
            !mehrzeilig &&
            /[\r\n]/.test(wert)
        )
    ) {
        return null;
    }

    return wert;
}


function istGueltigeEmail(
    email
) {
    return (
        email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
            email
        )
    );
}


function istGueltigeWebsite(
    website
) {
    if (!website) {
        return true;
    }

    try {
        const url =
            new URL(website);

        return (
            url.protocol === "https:" ||
            url.protocol === "http:"
        );
    } catch {
        return false;
    }
}


function istErlaubterTurnstileHostname(
    hostname,
    request
) {
    if (typeof hostname !== "string") {
        return false;
    }

    const normalisierterHostname =
        hostname
            .trim()
            .toLowerCase()
            .replace(/\.$/, "");

    if (
        TURNSTILE_PRODUKTIONSHOSTS.has(
            normalisierterHostname
        )
    ) {
        return true;
    }

    let requestHostname;

    try {
        requestHostname =
            new URL(request.url)
                .hostname
                .toLowerCase();
    } catch {
        return false;
    }

    return (
        TURNSTILE_LOKALE_HOSTS.has(
            requestHostname
        ) &&
        normalisierterHostname ===
            requestHostname
    );
}


async function turnstilePruefen(
    context,
    token
) {
    const secret =
        context.env
            ?.TURNSTILE_SECRET_KEY;

    if (!secret) {
        return {
            konfigurationsfehler: true
        };
    }

    const body =
        new URLSearchParams({
            secret,
            response: token
        });

    const clientIp =
        context.request.headers.get(
            "CF-Connecting-IP"
        );

    if (clientIp) {
        body.set(
            "remoteip",
            clientIp
        );
    }

    let antwort;

    try {
        antwort =
            await fetch(
                TURNSTILE_VERIFY_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",
                        "Accept":
                            "application/json"
                    },
                    body
                }
            );
    } catch {
        console.warn(
            "turnstile_fetch_failed"
        );

        return {
            dienstfehler: true
        };
    }

    if (!antwort.ok) {
        let fehlerErgebnis;

        try {
            fehlerErgebnis =
                await antwort.clone().json();
        } catch {
            fehlerErgebnis = null;
        }

        console.warn(
            "turnstile_http_error",
            {
                status: antwort.status,
                error_codes:
                    Array.isArray(
                        fehlerErgebnis?.[
                            "error-codes"
                        ]
                    )
                        ? fehlerErgebnis[
                            "error-codes"
                        ]
                        : []
            }
        );

        return {
            dienstfehler: true
        };
    }

    let ergebnis;

    try {
        ergebnis =
            await antwort.json();
    } catch {
        console.warn(
            "turnstile_invalid_json"
        );

        return {
            dienstfehler: true
        };
    }

    console.info(
        "turnstile_result",
        {
            success:
                ergebnis.success === true,
            error_codes:
                Array.isArray(
                    ergebnis["error-codes"]
                )
                    ? ergebnis["error-codes"]
                    : [],
            action_match:
                ergebnis.action ===
                TURNSTILE_ACTION,
            hostname_match:
                istErlaubterTurnstileHostname(
                    ergebnis.hostname,
                    context.request
                )
        }
    );

    return {
        bestaetigt:
            ergebnis.success === true &&
            ergebnis.action ===
                TURNSTILE_ACTION &&
            istErlaubterTurnstileHostname(
                ergebnis.hostname,
                context.request
            )
    };
}


function projektanfrageValidieren(
    daten
) {
    const name =
        textFeldLesen(
            daten,
            "name",
            120
        );

    const company =
        textFeldLesen(
            daten,
            "company",
            160
        );

    const email =
        textFeldLesen(
            daten,
            "email",
            254
        );

    const phone =
        textFeldLesen(
            daten,
            "phone",
            60
        );

    const website =
        textFeldLesen(
            daten,
            "website",
            500
        );

    const projectType =
        textFeldLesen(
            daten,
            "project_type",
            40
        );

    const message =
        textFeldLesen(
            daten,
            "message",
            5000,
            true
        );

    const privacyConsent =
        textFeldLesen(
            daten,
            "privacy_consent",
            20
        );

    if (!name) {
        return {
            fehler:
                "Bitte geben Sie Ihren Namen an."
        };
    }

    if (
        !email ||
        !istGueltigeEmail(email)
    ) {
        return {
            fehler:
                "Bitte geben Sie eine gültige E-Mail-Adresse an."
        };
    }

    if (
        !message ||
        message.length < 10
    ) {
        return {
            fehler:
                "Bitte schreiben Sie eine Nachricht mit mindestens 10 Zeichen."
        };
    }

    if (
        company === null ||
        phone === null ||
        website === null ||
        projectType === null ||
        message === null ||
        privacyConsent === null
    ) {
        return {
            fehler:
                "Mindestens eine Angabe ist zu lang oder ungültig."
        };
    }

    if (
        !projectType ||
        !Object.prototype.hasOwnProperty.call(
            PROJEKTARTEN,
            projectType
        )
    ) {
        return {
            fehler:
                "Bitte wählen Sie aus, was Sie umsetzen möchten."
        };
    }

    if (
        !istGueltigeWebsite(website)
    ) {
        return {
            fehler:
                "Bitte geben Sie eine gültige Website-Adresse ein."
        };
    }

    if (
        privacyConsent !== "accepted"
    ) {
        return {
            fehler:
                "Bitte stimmen Sie der Datenschutzerklärung zu."
        };
    }

    return {
        werte: {
            name,
            company,
            email,
            phone,
            website,
            projectType,
            message
        }
    };
}


function emailTextErstellen(
    werte
) {
    return [
        "Neue Projektanfrage über saentiswebdesign.ch",
        "",
        `Name: ${werte.name}`,
        `Unternehmen: ${werte.company || "Nicht angegeben"}`,
        `E-Mail: ${werte.email}`,
        `Telefon: ${werte.phone || "Nicht angegeben"}`,
        `Bestehende Website: ${werte.website || "Nicht angegeben"}`,
        `Gewünschte Umsetzung: ${PROJEKTARTEN[werte.projectType]}`,
        "",
        "Nachricht:",
        werte.message
    ].join("\n");
}


export async function onRequestPost(
    context
) {
    const request =
        context.request;

    if (!istErlaubterOrigin(request)) {
        return jsonAntwort(
            403,
            {
                ok: false,
                message:
                    "Diese Anfrage ist nicht erlaubt."
            }
        );
    }

    if (!contentTypeIstJson(request)) {
        return jsonAntwort(
            415,
            {
                ok: false,
                message:
                    "Die Formulardaten müssen als JSON gesendet werden."
            }
        );
    }

    const requestInhalt =
        await jsonRequestLesen(
            request
        );

    if (requestInhalt.zuGross) {
        return jsonAntwort(
            413,
            {
                ok: false,
                message:
                    "Die Anfrage ist zu gross."
            }
        );
    }

    if (requestInhalt.ungueltig) {
        return jsonAntwort(
            400,
            {
                ok: false,
                message:
                    "Die Formulardaten konnten nicht gelesen werden."
            }
        );
    }

    const daten =
        requestInhalt.daten;

    if (
        !daten ||
        typeof daten !== "object" ||
        Array.isArray(daten)
    ) {
        return jsonAntwort(
            400,
            {
                ok: false,
                message:
                    "Die Formulardaten sind ungültig."
            }
        );
    }

    const honeypot =
        daten.website_check;

    if (
        (
            typeof honeypot === "string" &&
            honeypot.trim()
        ) ||
        (
            honeypot !== undefined &&
            honeypot !== null &&
            typeof honeypot !== "string"
        )
    ) {
        return jsonAntwort(
            200,
            {
                ok: true,
                message:
                    "Vielen Dank. Ihre Anfrage wurde gesendet."
            }
        );
    }

    const validierung =
        projektanfrageValidieren(daten);

    if (validierung.fehler) {
        return jsonAntwort(
            400,
            {
                ok: false,
                message:
                    validierung.fehler
            }
        );
    }

    const turnstileToken =
        textFeldLesen(
            daten,
            "turnstile_token",
            2048
        );

    if (!turnstileToken) {
        return jsonAntwort(
            400,
            {
                ok: false,
                message:
                    "Die Anfrage konnte nicht bestätigt werden. Bitte versuchen Sie es erneut."
            }
        );
    }

    const turnstileErgebnis =
        await turnstilePruefen(
            context,
            turnstileToken
        );

    if (
        turnstileErgebnis
            .konfigurationsfehler
    ) {
        return jsonAntwort(
            500,
            {
                ok: false,
                message:
                    "Die Sicherheitsprüfung ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut."
            }
        );
    }

    if (turnstileErgebnis.dienstfehler) {
        return jsonAntwort(
            502,
            {
                ok: false,
                message:
                    "Die Sicherheitsprüfung ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut."
            }
        );
    }

    if (!turnstileErgebnis.bestaetigt) {
        return jsonAntwort(
            400,
            {
                ok: false,
                message:
                    "Die Anfrage konnte nicht bestätigt werden. Bitte versuchen Sie es erneut."
            }
        );
    }

    const apiKey =
        context.env
            ?.RESEND_API_KEY;

    if (!apiKey) {
        return jsonAntwort(
            500,
            {
                ok: false,
                message:
                    "Der Versand ist momentan nicht verfügbar. Bitte schreiben Sie direkt an info@saentiswebdesign.ch."
            }
        );
    }

    const werte =
        validierung.werte;

    let resendAntwort;

    try {
        resendAntwort =
            await fetch(
                RESEND_URL,
                {
                    method: "POST",
                    headers: {
                        "Authorization":
                            `Bearer ${apiKey}`,
                        "Content-Type":
                            "application/json",
                        "User-Agent":
                            "Saentis-Webdesign-Contact/1.0"
                    },
                    body:
                        JSON.stringify({
                            from: ABSENDER,
                            to: [EMPFAENGER],
                            reply_to:
                                werte.email,
                            subject:
                                `Neue Projektanfrage über saentiswebdesign.ch - ${werte.name}`,
                            text:
                                emailTextErstellen(
                                    werte
                                )
                        })
                }
            );
    } catch {
        return jsonAntwort(
            502,
            {
                ok: false,
                message:
                    "Die Anfrage konnte momentan nicht versendet werden. Bitte versuchen Sie es später erneut."
            }
        );
    }

    if (!resendAntwort.ok) {
        return jsonAntwort(
            502,
            {
                ok: false,
                message:
                    "Die Anfrage konnte momentan nicht versendet werden. Bitte versuchen Sie es später erneut."
            }
        );
    }

    return jsonAntwort(
        200,
        {
            ok: true,
            message:
                "Vielen Dank. Ihre Anfrage wurde gesendet."
        }
    );
}

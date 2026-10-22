(function () {
    "use strict";

    var consentKey = "portfolio-analytics-consent-v1";
    var trackingId = document.currentScript && document.currentScript.dataset.trackingId;
    var loaded = false;

    function readConsent() {
        try {
            var stored = window.localStorage.getItem(consentKey);
            if (!stored) return null;
            var consent = JSON.parse(stored);
            return consent && ["accepted", "rejected"].indexOf(consent.status) !== -1 ? consent.status : null;
        } catch (error) {
            return null;
        }
    }

    function saveConsent(status) {
        try {
            window.localStorage.setItem(consentKey, JSON.stringify({
                status: status,
                version: 1,
                decidedAt: new Date().toISOString()
            }));
        } catch (error) {
            // Without storage, the decision applies only to this page load.
        }
    }

    function removeAnalyticsCookies() {
        document.cookie.split(";").forEach(function (cookie) {
            var name = cookie.split("=")[0].trim();
            if (name === "_ga" || name.indexOf("_ga_") === 0) {
                document.cookie = name + "=; Max-Age=0; path=/";
            }
        });
    }

    function loadAnalytics() {
        if (loaded || !trackingId) return;
        loaded = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag("js", new Date());
        window.gtag("config", trackingId, { anonymize_ip: true });

        var script = document.createElement("script");
        script.async = true;
        script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(trackingId);
        document.head.appendChild(script);
    }

    function applyConsent(status) {
        saveConsent(status);
        if (status === "accepted") {
            loadAnalytics();
        } else {
            removeAnalyticsCookies();
            if (loaded) window.location.reload();
        }
        window.dispatchEvent(new CustomEvent("portfolio-consent-updated", { detail: status }));
    }

    function showBanner() {
        var banner = document.querySelector("[data-consent-banner]");
        if (banner) banner.hidden = false;
    }

    function hideBanner() {
        var banner = document.querySelector("[data-consent-banner]");
        if (banner) banner.hidden = true;
    }

    function initialise() {
        var banner = document.querySelector("[data-consent-banner]");
        var settings = document.querySelector("[data-cookie-settings]");
        var consent = readConsent();

        if (banner) {
            banner.querySelector("[data-consent-accept]").addEventListener("click", function () {
                applyConsent("accepted");
                hideBanner();
            });
            banner.querySelector("[data-consent-reject]").addEventListener("click", function () {
                applyConsent("rejected");
                hideBanner();
            });
        }

        if (settings) {
            settings.addEventListener("click", function () {
                showBanner();
                var accept = banner && banner.querySelector("[data-consent-accept]");
                if (accept) accept.focus();
            });
        }

        if (consent === "accepted") loadAnalytics();
        if (!consent) showBanner();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialise);
    } else {
        initialise();
    }
}());

document.getElementById("minutes").textContent =
            String(minutes).padStart(2,"0");

        document.getElementById("seconds").textContent =
            String(seconds).padStart(2,"0");

    }

    update();

    setInterval(update,1000);

}/* ========================================
   PARTICLES
======================================== */

function createParticles() {

    const container =
        document.getElementById("particles");

    if (!container) return;

    container.innerHTML = "";

    const count = 25;

    for (let i = 0; i < count; i++) {

        const p = document.createElement("div");

        p.className = "particle";

        p.style.left = Math.random() * 100 + "%";
        p.style.top = Math.random() * 100 + "%";

        p.style.animationDuration =
            10 + Math.random() * 20 + "s";

        p.style.animationDelay =
            Math.random() * 5 + "s";

        container.appendChild(p);

    }

}

/* ========================================
   FAQ
======================================== */

function toggleFAQ(button) {

    const item =
        button.parentElement;

    document
        .querySelectorAll(".faq-item")
        .forEach(el => {

            if (el !== item)
                el.classList.remove("active");

        });

    item.classList.toggle("active");

}

/* ========================================
   MODALS
======================================== */

function showLoading(text = "Processing...") {

    const modal =
        document.getElementById("loadingModal");

    const msg =
        document.getElementById("loadingText");

    if (msg)
        msg.textContent = text;

    if (modal)
        modal.classList.add("active");

}

function hideLoading() {

    const modal =
        document.getElementById("loadingModal");

    if (modal)
        modal.classList.remove("active");

}

function showSuccess(message) {

    hideLoading();

    const modal =
        document.getElementById("successModal");

    const msg =
        document.getElementById("successMessage");

    if (msg)
        msg.textContent = message;

    if (modal)
        modal.classList.add("active");

}

function showError(message) {

    hideLoading();

    const modal =
        document.getElementById("errorModal");

    const msg =
        document.getElementById("errorMessage");

    if (msg)
        msg.textContent = message;

    if (modal)
        modal.classList.add("active");

}

function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (modal)
        modal.classList.remove("active");

}/* ========================================
   EVENTS
======================================== */

document.addEventListener("click", (e) => {

    if (e.target.classList.contains("modal")) {

        e.target.classList.remove("active");

    }

});

/* ========================================
   INITIALIZATION
======================================== */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("BTW Presale Started");

    createParticles();

    startCountdown();

    updateCounters();

    updateProgress();

    calculateBTW();

    await initTonConnect();

    updateWalletUI();

    const tonInput = document.getElementById("tonInput");

    if (tonInput) {

        tonInput.addEventListener(
            "input",
            calculateBTW
        );

    }

    console.log("Initialization Complete");

});

/* ========================================
   ERROR HANDLING
======================================== */

window.addEventListener("error", (e) => {

    console.error(e.error);

});

window.addEventListener(
    "unhandledrejection",
    (e) => {

        console.error(e.reason);

    }
);

/* ========================================
   RESIZE
======================================== */

window.addEventListener("resize", () => {

    clearTimeout(window.resizeTimer);

    window.resizeTimer = setTimeout(() => {

    }, 300);

});/* ========================================
   UTILITIES
======================================== */

function closeModal(modalId) {

    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.remove("active");
    }

}

function toggleFAQ(button) {

    const item = button.parentElement;

    document.querySelectorAll(".faq-item").forEach((faq) => {
        if (faq !== item) faq.classList.remove("active");
    });

    item.classList.toggle("active");

}

function resetPurchaseForm() {

    const tonInput = document.getElementById("tonInput");
    const btwOutput = document.getElementById("btwOutput");

    if (tonInput) tonInput.value = "";

    if (btwOutput) btwOutput.value = "";

}

/* ========================================
   AUTO RESTORE CONNECTION
======================================== */

async function restoreConnection() {

    try {

        if (!STATE.tonConnectUI) return;

        const wallet = STATE.tonConnectUI.wallet;

        if (wallet) {

            handleWalletConnected(wallet);

        }

    } catch (err) {

        console.error("Restore wallet failed", err);

    }

}

window.addEventListener("load", restoreConnection);

/* ========================================
   EXPORT (OPTIONAL)
======================================== */

window.BTW = {

    connectWallet,
    buyTokens,
    calculateBTW,
    updateCounters,
    updateProgress,
    closeModal

};

console.log("BTW Presale App Loaded Successfully");

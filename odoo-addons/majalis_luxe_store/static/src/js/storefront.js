/** @odoo-module **/

import { rpc } from "@web/core/network/rpc";

function startCatalog() {
    const catalog = document.querySelector(".majalis-catalog");
    if (!catalog) {
        return;
    }

    const headerCount = catalog.querySelector("[data-majalis-cart-count]");
    const mobileCart = catalog.querySelector("[data-majalis-mobile-cart]");
    const mobileCount = mobileCart.querySelector("[data-majalis-mobile-count]");
    const status = catalog.querySelector("[data-majalis-status]");
    const buttons = [...catalog.querySelectorAll("[data-majalis-product]")];
    const cards = [...catalog.querySelectorAll("[data-majalis-template]")];
    const dialog = catalog.querySelector("[data-majalis-dialog]");
    const cartLines = dialog.querySelector("[data-majalis-cart-lines]");
    const cartRow = catalog.querySelector("[data-majalis-cart-row]");
    const cartFeedback = dialog.querySelector("[data-majalis-cart-feedback]");
    const cartLoading = dialog.querySelector("[data-majalis-cart-loading]");
    const cartEmpty = dialog.querySelector("[data-majalis-cart-empty]");
    const cartSummary = dialog.querySelector("[data-majalis-cart-summary]");
    const cartTotal = dialog.querySelector("[data-majalis-cart-total]");
    let updating = false;
    let toastTimer;

    function showStatus(message) {
        window.clearTimeout(toastTimer);
        status.textContent = message;
        toastTimer = window.setTimeout(() => { status.textContent = ""; }, 3400);
    }

    function setCount(quantity) {
        headerCount.textContent = quantity;
        mobileCount.textContent = quantity;
        mobileCart.hidden = quantity === 0;
    }

    function setBadge(card, quantity) {
        const badge = card.querySelector("[data-majalis-in-cart]");
        badge.querySelector("[data-majalis-line-count]").textContent = quantity;
        badge.hidden = quantity <= 0;
    }

    function renderCart(payload) {
        setCount(payload.quantity);
        for (const card of cards) {
            setBadge(card, payload.quantities[card.dataset.majalisTemplate] || 0);
        }
        const rows = document.createDocumentFragment();
        for (const entry of payload.lines) {
            const row = cartRow.content.cloneNode(true);
            row.querySelector("li").dataset.majalisLine = entry.id;
            row.querySelector("[data-majalis-cart-name]").textContent = entry.name;
            row.querySelector("[data-majalis-line-price]").textContent = entry.price;
            row.querySelector("[data-majalis-cart-line-quantity]").textContent = entry.quantity;
            row.querySelector("[data-majalis-stepper]").hidden = !entry.editable;
            const locked = row.querySelector("[data-majalis-cart-locked]");
            locked.hidden = entry.editable;
            locked.textContent = "× " + entry.quantity;
            rows.append(row);
        }
        cartLines.replaceChildren(rows);
        cartEmpty.hidden = payload.lines.length > 0;
        cartSummary.hidden = payload.lines.length === 0;
        cartTotal.textContent = payload.total;
        cartFeedback.textContent = payload.warning;
    }

    async function loadCart(params = {}) {
        updating = true;
        dialog.setAttribute("aria-busy", "true");
        cartFeedback.textContent = "";
        cartLoading.hidden = false;

        try {
            renderCart(await rpc("/shop/majalis/cart", params));
        } catch {
            cartLines.replaceChildren();
            cartEmpty.hidden = true;
            cartSummary.hidden = true;
            cartFeedback.textContent = catalog.dataset.cartFailed;
        } finally {
            cartLoading.hidden = true;
            dialog.removeAttribute("aria-busy");
            updating = false;
        }

        if (dialog.open && params.line_id) {
            const step = cartLines.querySelector(
                '[data-majalis-line="' + params.line_id + '"] [data-majalis-cart-delta="' + params.delta + '"]'
            );
            (step || dialog.querySelector(".majalis-cart-close")).focus();
        }
    }

    async function addDish(button) {
        updating = true;
        for (const action of buttons) {
            action.disabled = true;
        }
        button.setAttribute("aria-busy", "true");
        try {
            const result = await rpc("/shop/cart/update_json", {
                product_id: Number(button.dataset.majalisProduct),
                add_qty: 1,
                display: false,
                force_create: true,
            });
            const warning = result.notification_info?.warning || result.warning;
            if (Number.isFinite(result.cart_quantity)) {
                setCount(result.cart_quantity);
            }
            if (Number.isFinite(result.quantity)) {
                setBadge(button.closest(".majalis-card"), result.quantity);
            }
            showStatus(warning || (result.quantity > 0 ? catalog.dataset.added : catalog.dataset.failed));
        } catch {
            showStatus(catalog.dataset.failed);
        } finally {
            button.removeAttribute("aria-busy");
            for (const action of buttons) {
                action.disabled = false;
            }
            updating = false;
        }
    }

    catalog.addEventListener("click", (event) => {
        const openCart = event.target.closest("[data-majalis-open-cart]");
        if (openCart && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            if (updating || typeof dialog.showModal !== "function") {
                return;
            }
            event.preventDefault();
            cartLines.replaceChildren();
            cartEmpty.hidden = true;
            cartSummary.hidden = true;
            dialog.showModal();
            loadCart();
            return;
        }

        const step = event.target.closest("[data-majalis-cart-delta]");
        if (step && !updating) {
            loadCart({
                line_id: Number(step.closest("[data-majalis-line]").dataset.majalisLine),
                delta: Number(step.dataset.majalisCartDelta),
            });
        }

        const button = event.target.closest("[data-majalis-product]");
        if (button && !updating) {
            addDish(button);
        }
    });

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            window.location.reload();
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCatalog, { once: true });
} else {
    startCatalog();
}

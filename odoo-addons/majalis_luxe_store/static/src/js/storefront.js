/** @odoo-module **/

import { rpc } from "@web/core/network/rpc";

function startCatalog() {
    const catalog = document.querySelector(".majalis-catalog");
    if (!catalog) {
        return;
    }

    const cartCount = catalog.querySelector("[data-majalis-cart-count]");
    const status = catalog.querySelector("[data-majalis-status]");
    const buttons = [...catalog.querySelectorAll("[data-majalis-product]")];
    let updating = false;

    catalog.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-majalis-product]");
        if (!button || updating) {
            return;
        }

        updating = true;
        status.textContent = "";
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
            const quantity = result.quantity;
            const previous = Number(button.dataset.quantity);
            const warning = result.notification_info?.warning || result.warning;
            if (Number.isFinite(result.cart_quantity)) {
                cartCount.textContent = result.cart_quantity;
            }
            if (Number.isFinite(quantity)) {
                button.dataset.quantity = quantity;
                const card = button.closest(".majalis-card");
                card.querySelector("[data-majalis-line-count]").textContent = quantity;
                card.querySelector("[data-majalis-in-cart]").hidden = quantity <= 0;
            }

            status.textContent = warning || (
                quantity > previous ? catalog.dataset.added : catalog.dataset.failed
            );
        } catch {
            status.textContent = catalog.dataset.failed;
        } finally {
            button.removeAttribute("aria-busy");
            for (const action of buttons) {
                action.disabled = false;
            }
            updating = false;
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

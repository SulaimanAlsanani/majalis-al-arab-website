"use strict";

const select = (query, root = document) => root.querySelector(query);
const selectAll = (query, root = document) => [...root.querySelectorAll(query)];
const storageKey = "majalis-odoo-preview-cart-v1";
const money = new Intl.NumberFormat("ar-SA-u-nu-latn", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
});
const formatPrice = (halalas) => money.format(halalas / 100);
const normalize = (text) => text.trim().normalize("NFKC").replace(/[أإآ]/g, "ا").replace(/[ً-ْـ]/g, "");

const dishes = new Map();
const choices = new Map();
for (const card of selectAll("[data-dish-id]")) {
    const image = select("img", card);
    const name = select("h3", card).textContent.trim();
    const description = select(".majalis-description", card).textContent.trim();
    const dish = {
        card, name, description, image,
        id: card.dataset.dishId,
        category: card.dataset.dishCategory,
        price: Math.round(Number(card.dataset.price) * 100),
        configurable: card.hasAttribute("data-trial-options"),
        searchLabel: normalize(name + " " + description),
    };
    dishes.set(dish.id, dish);
    const options = dish.configurable ? { regular: "عادي", hot: "حار" } : { standard: "" };
    for (const [value, label] of Object.entries(options)) {
        choices.set(dish.id + ":" + value, { dish, label });
    }
}

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        return new Map(Object.entries(saved || {}).filter(([key, quantity]) => (
            choices.has(key) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99
        )));
    } catch {
        return new Map();
    }
}

const quantities = loadCart();
const cartDialog = select("#preview-cart");
const detailDialog = select("#preview-dish");
const cartLines = select("#preview-cart-lines");
const rowTemplate = select("#preview-cart-row");
const status = select("[data-trial-status]");
let statusTimeout;
let currentDish;
let selectedCategory = "all";

function showStatus(message) {
    window.clearTimeout(statusTimeout);
    status.textContent = message;
    statusTimeout = window.setTimeout(() => {
        status.textContent = "";
    }, 2600);
}

function renderCart() {
    let count = 0;
    let total = 0;
    const dishQuantities = new Map();
    const rows = document.createDocumentFragment();
    for (const [key, quantity] of quantities) {
        const { dish, label } = choices.get(key);
        count += quantity;
        total += dish.price * quantity;
        dishQuantities.set(dish.id, (dishQuantities.get(dish.id) || 0) + quantity);
        const row = rowTemplate.content.cloneNode(true);
        select("li", row).dataset.cartKey = key;
        select("[data-cart-title]", row).textContent = dish.name;
        const option = select("[data-cart-option]", row);
        option.textContent = label;
        option.hidden = !label;
        select("[data-cart-quantity]", row).textContent = quantity;
        select("[data-cart-subtotal]", row).textContent = formatPrice(dish.price * quantity);
        rows.append(row);
    }
    cartLines.replaceChildren(rows);
    select("[data-trial-cart-count]").textContent = count;
    const mobileCart = select("[data-majalis-mobile-cart]");
    if (mobileCart) {
        select("[data-majalis-mobile-count]", mobileCart).textContent = count;
        mobileCart.hidden = count === 0;
    }
    select("[data-cart-total]").textContent = formatPrice(total);
    select("[data-empty-cart]").hidden = count > 0;
    for (const dish of dishes.values()) {
        const quantity = dishQuantities.get(dish.id) || 0;
        const badge = select("[data-trial-badge]", dish.card);
        badge.hidden = quantity === 0;
        select("[data-majalis-line-count]", badge).textContent = quantity;
    }
}

function updateCart(key, delta) {
    if (!choices.has(key)) {
        return false;
    }
    const quantity = (quantities.get(key) || 0) + delta;
    if (quantity > 99) {
        return false;
    }
    if (quantity > 0) {
        quantities.set(key, quantity);
    } else {
        quantities.delete(key);
    }
    try {
        localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(quantities)));
    } catch {
        // Keep the demo usable for the current page session.
    }
    renderCart();
    return true;
}

function addDish(dish, option) {
    const added = updateCart(dish.id + ":" + option, 1);
    showStatus(added ? "أُضيف الطبق إلى السلة التجريبية." : "الحد التجريبي 99 قطعة للصنف.");
}

function showDish(dish) {
    currentDish = dish;
    const image = select("img", detailDialog);
    image.src = dish.image.src;
    image.alt = dish.name;
    select("#preview-dish-title").textContent = dish.name;
    select("#preview-dish-description").textContent = dish.description;
    select("[data-detail-price]").textContent = formatPrice(dish.price);
    select("#preview-dish-options").hidden = !dish.configurable;
    select("#preview-spice").value = "regular";
    detailDialog.showModal();
}

function applyFilters() {
    const query = normalize(select("#preview-search input").value);
    let matched = false;
    for (const dish of dishes.values()) {
        const visible = (selectedCategory === "all" || dish.category === selectedCategory)
            && dish.searchLabel.includes(query);
        dish.card.hidden = !visible;
        matched ||= visible;
    }
    select("#preview-empty").hidden = matched;
    for (const button of selectAll("[data-trial-category]")) {
        button.setAttribute("aria-pressed", String(selectedCategory === button.dataset.trialCategory));
    }
}

select("#preview-search").addEventListener("submit", (event) => {
    event.preventDefault();
    applyFilters();
});
select("#preview-search input").addEventListener("input", applyFilters);
select("#preview-dish-form").addEventListener("submit", (event) => {
    event.preventDefault();
    addDish(currentDish, currentDish.configurable ? select("#preview-spice").value : "standard");
    detailDialog.close();
});

document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
        return;
    }
    if (button.hasAttribute("data-open-cart")) {
        cartDialog.showModal();
    } else if (button.dataset.addDish) {
        addDish(dishes.get(button.dataset.addDish), "standard");
    } else if (button.dataset.dishDetails) {
        showDish(dishes.get(button.dataset.dishDetails));
    } else if (button.dataset.cartChange) {
        const key = button.closest("[data-cart-key]").dataset.cartKey;
        const change = button.dataset.cartChange;
        if (updateCart(key, Number(change))) {
            const row = selectAll("[data-cart-key]", cartLines).find((entry) => entry.dataset.cartKey === key);
            (row ? select('[data-cart-change="' + change + '"]', row) : select(".majalis-close", cartDialog)).focus();
        }
    } else if (button.dataset.trialCategory || button.hasAttribute("data-reset-filters")) {
        selectedCategory = button.dataset.trialCategory || "all";
        if (button.hasAttribute("data-reset-filters")) {
            select("#preview-search input").value = "";
        }
        applyFilters();
    }
});

renderCart();

/* Accessible category-driven restaurant banner carousel */
(() => {
 const slides = selectAll("[data-hero-slide]");
 const dots = selectAll("[data-hero-go]");
 const hero = select(".majalis-hero-slider");
 if (!hero || !slides.length) return;
 let active = 0;
 let timer;
 const show = (index) => {
   active = (index + slides.length) % slides.length;
   slides.forEach((slide,i) => {
     slide.classList.toggle("is-active",i===active);
     slide.setAttribute("aria-hidden",String(i!==active));
     slide.querySelectorAll("a").forEach(a=>{a.tabIndex=i===active?0:-1;});
   });
   dots.forEach((dot,i)=>dot.setAttribute("aria-current",String(i===active)));
 };
 const restart = () => {
   window.clearInterval(timer);
   if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
     timer=window.setInterval(()=>{if(!document.hidden)show(active+1);},5500);
   }
 };
 select("[data-hero-prev]").addEventListener("click",()=>{show(active-1);restart();});
 select("[data-hero-next]").addEventListener("click",()=>{show(active+1);restart();});
 dots.forEach((dot,i)=>dot.addEventListener("click",()=>{show(i);restart();}));
 const filterTo = (category) => {
   selectedCategory=category;
   select("#preview-search input").value="";
   applyFilters();
   select("#majalis-menu").scrollIntoView({behavior:"smooth",block:"start"});
 };
 selectAll("[data-category-tile]").forEach(tile=>tile.addEventListener("click",()=>filterTo(tile.dataset.categoryTile)));
 selectAll("[data-hero-category]").forEach(link=>link.addEventListener("click",()=>filterTo(link.dataset.heroCategory)));
 hero.addEventListener("mouseenter",()=>window.clearInterval(timer));
 hero.addEventListener("mouseleave",restart);
 hero.addEventListener("focusin",()=>window.clearInterval(timer));
 hero.addEventListener("focusout",e=>{if(!hero.contains(e.relatedTarget))restart();});
 show(0);restart();
})();

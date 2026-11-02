// Saved overrides use "Sheet!Cell" keys so prices can be shared across recipes.
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem("albion-inputs-v1") || "{}");
} catch {}
let category = "Swords",
  selected = DATA.recipes.find(
    (r) => r.sheet === "Swords" && r.label === "Tier 4" && r.ench === 0,
  ),
  limit = 50;
const $ = (id) => document.getElementById(id),
  esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    ),
  fmt = (x) => x.toLocaleString(undefined, { maximumFractionDigits: 2 }),
  pretty = (x) => x.replace(/([a-z])([A-Z])/g, "$1 $2");
// Keep user edits in this browser; JSON export provides a portable backup.
function persist() {
  try {
    localStorage.setItem("albion-inputs-v1", JSON.stringify(saved));
  } catch {
    $("message").textContent =
      "Browser storage unavailable. Export your inputs to keep them.";
  }
}
function get(key) {
  let [s, c] = key.split("!");
  return Object.hasOwn(saved, key) ? saved[key] : DATA.cells[s]?.[c];
}
// Track missing inputs separately from a valid calculated value of zero.
function evaluate(r) {
  let leaves = new Set(),
    missing = new Set(),
    value,
    error;
  try {
    value = FormulaEngine.calculate(r.sheet, r.cell, saved, leaves, missing);
  } catch (e) {
    error = e.message;
  }
  return { value, error, leaves, missing };
}
// Category navigation and the searchable recipe catalog.
function renderNav() {
  let cats = [...new Set(DATA.recipes.map((r) => r.sheet))];
  $("categories").innerHTML = cats
    .map(
      (c) =>
        `<button class="${c === category ? "active" : ""}" data-category="${esc(c)}">${esc(pretty(c))}</button>`,
    )
    .join("");
  $("count").textContent = fmt(DATA.recipes.length);
  $("categories")
    .querySelectorAll("button")
    .forEach(
      (b) =>
        (b.onclick = () => {
          category = b.dataset.category;
          limit = 50;
          $("search").value = "";
          renderNav();
          renderList();
        }),
    );
}
function renderList() {
  let q = $("search").value.toLowerCase(),
    e = $("ench").value;
  let rs = DATA.recipes.filter(
    (r) =>
      r.sheet === category &&
      (!q || (r.name + " " + r.label).toLowerCase().includes(q)) &&
      (e === "" || r.ench === +e),
  );
  $("categoryTitle").textContent = pretty(category);
  $("results").textContent = rs.length + " variants";
  $("recipes").innerHTML =
    rs
      .slice(0, limit)
      .map(
        (r) =>
          `<button class="recipe ${r === selected ? "selected" : ""}" data-cell="${r.cell}"><span class="tile">${r.ench}</span><span><b>${esc(r.name)}</b><small>${esc(r.label)} · Enchantment ${r.ench}</small></span><span class="arrow">↗</span></button>`,
      )
      .join("") ||
    '<p class="empty">No matching recipes. Try another search.</p>';
  $("more").hidden = rs.length <= limit;
  $("recipes")
    .querySelectorAll("button")
    .forEach(
      (b) =>
        (b.onclick = () => {
          selected = rs.find((r) => r.cell === b.dataset.cell);
          renderList();
          renderDetail();
        }),
    );
}
const controls = {
  C6: "Island",
  C8: "City",
  C10: "Bonus city",
  C12: "Use hideout rate",
  F6: "Bonus day 10%",
  F8: "Bonus day 20%",
  F10: "Use focus",
  F12: "Hideout return rate (0–1)",
  I21: "Use hearts",
  C16: "Station fee",
};
function field(key, missing) {
  let [s, c] = key.split("!"),
    v = get(key),
    control = s === selected.sheet ? controls[c] : null,
    bool =
      typeof v === "boolean" ||
      (["C6", "C8", "C10", "C12", "F6", "F8", "F10"].includes(c) &&
        s === selected.sheet);
  return `<div class="field"><label for="${esc(key)}">${esc(control || DATA.labels[key] || key)}<small>${esc(key)}</small></label><input id="${esc(key)}" data-key="${esc(key)}" type="${bool ? "checkbox" : "number"}" ${bool ? (v ? "checked" : "") : `min="0" step="any" value="${typeof v === "number" ? v : ""}" placeholder="Set price"`} class="${missing.has(key) ? "missing" : ""}"></div>`;
}
// Build the selected recipe's calculator and bind its editable inputs.
function renderDetail() {
  let r = selected,
    z = evaluate(r),
    keys = [...z.leaves];
  let config = ["C6", "C8", "C10", "C12", "F6", "F8", "F10", "F12"].map(
    (c) => r.sheet + "!" + c,
  );
  if (r.sheet.endsWith("Refining")) config.push(r.sheet + "!I21");
  if (DATA.cells[r.sheet].C16 !== undefined) config.push(r.sheet + "!C16");
  let prices = keys.filter((k) => !config.includes(k));
  let valid = !z.error && !z.missing.size;
  let qty = saved[r.sheet + "!" + r.cell + "_qty"] || 1,
    sale = saved[r.sheet + "!" + r.cell + "_sale"] || 0;
  let profit = valid ? sale - z.value : null;
  $("detail").innerHTML =
    `<span class="eyebrow">CRAFTING CALCULATOR</span><h2>${esc(r.name)}</h2><div class="sub">${esc(r.label)} · Enchantment ${r.ench} · ${esc(pretty(r.sheet))}</div><div class="cost"><small>ESTIMATED UNIT COST · SILVER</small><strong>${valid ? fmt(z.value) : "—"}</strong><p>${valid ? fmt(z.value * qty) + " silver for " + fmt(qty) + " units" : z.error ? "Source formula needs review" : z.missing.size + " required input" + (z.missing.size === 1 ? "" : "s") + " to complete"}</p></div>${z.error ? `<p class="warning">${esc(z.error)}. Review the original sheet for this recipe.</p>` : ""}<div class="field"><label for="quantity">Units to craft</label><input id="quantity" type="number" min="1" step="1" value="${qty}"></div><div class="field"><label for="sale">Net sale proceeds per unit<small>After your market taxes and fees</small></label><input id="sale" type="number" min="0" step="any" value="${sale}"></div>${sale > 0 && valid ? `<p class="${profit < 0 ? "warning" : "sub"}">Estimated profit: <b>${fmt(profit * qty)} silver</b> for ${fmt(qty)} units.</p>` : ""}<h3 class="divider">Materials & recipe inputs</h3>${prices.map((k) => field(k, z.missing)).join("") || '<p class="sub">No material inputs available for this formula.</p>'}<p class="sub">Blank means missing. Enter 0 only if the input is actually free.</p><details><summary>Crafting settings</summary>${config.map((k) => field(k, z.missing)).join("")}</details><details><summary>View original calculation</summary><p>${esc(r.sheet + "!" + r.cell)}</p><pre>${esc(DATA.cells[r.sheet][r.cell])}</pre><p>Workbook formulas are preserved. Any fees absent from the source are not added.</p></details>`;
  $("detail")
    .querySelectorAll("[data-key]")
    .forEach(
      (input) =>
        (input.onchange = () => {
          let k = input.dataset.key;
          if (input.type === "checkbox") saved[k] = input.checked;
          else if (input.value === "") saved[k] = null;
          else {
            let n = Number(input.value);
            if (!Number.isFinite(n) || n < 0 || (k.endsWith("!F12") && n > 1)) {
              input.setCustomValidity(
                "Enter a valid nonnegative value; return rates must be between 0 and 1.",
              );
              input.reportValidity();
              return;
            }
            saved[k] = n;
          }
          persist();
          renderDetail();
        }),
    );
  for (let [id, suffix] of [
    ["quantity", "qty"],
    ["sale", "sale"],
  ])
    $(id).onchange = () => {
      let n = +$(id).value;
      if (
        !Number.isFinite(n) ||
        n < (id === "quantity" ? 1 : 0) ||
        (id === "quantity" && !Number.isInteger(n))
      ) {
        $(id).reportValidity();
        return;
      }
      saved[r.sheet + "!" + r.cell + "_" + suffix] = n;
      persist();
      renderDetail();
    };
}
$("search").oninput = () => {
  limit = 50;
  renderList();
};
$("ench").onchange = () => {
  limit = 50;
  renderList();
};
$("more").onclick = () => {
  limit += 50;
  renderList();
};
$("export").onclick = () => {
  let a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" }),
  );
  a.download = "albion-inputs.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$("import").onchange = async (e) => {
  try {
    let data = JSON.parse(await e.target.files[0].text());
    if (
      !data ||
      Array.isArray(data) ||
      typeof data !== "object" ||
      Object.entries(data).some(
        ([k, v]) =>
          !/^\w+![A-Z]+\d+(?:_(?:qty|sale))?$/.test(k) ||
          !(
            v === null ||
            typeof v === "boolean" ||
            (typeof v === "number" && Number.isFinite(v) && v >= 0)
          ),
      )
    )
      throw Error();
    saved = data;
    persist();
    renderDetail();
    $("message").textContent = "Inputs imported.";
  } catch {
    $("message").textContent =
      "Could not import. Choose a valid exported inputs file.";
  }
};
renderNav();
renderList();
renderDetail();

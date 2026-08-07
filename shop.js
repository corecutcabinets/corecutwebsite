(() => {
  const shopData = window.CorecutShopData;
  if (!shopData?.categories?.length) return;

  const categories = shopData.categories || [];
  const priceRanges = shopData.priceRanges || [];
  const products = shopData.products || [];
  const fallbackCopy = shopData.fallbackProductCopy || {};
  const shopifyConfig = shopData.shopify || {};
  const priceRangeMap = new Map(priceRanges.map((priceRange) => [priceRange.id, priceRange]));
  const priceRangeRankMap = new Map(priceRanges.map((priceRange, index) => [priceRange.id, index]));
  let shopifyScriptPromise = null;
  let shopifyClientPromise = null;
  let shopifyUiPromise = null;
  const selectedProductColorOptions = new WeakMap();
  const shopifyProductComponents = new WeakMap();
  const appliedShopifyComponentVariants = new WeakMap();

  const categoryPath = (category) => `/shop-${category.slug}`;
  const productPath = (product) => `/shop-${product.slug}`;

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const createElement = (tagName, className, textContent) => {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  };

  const cloneOptions = (options) => JSON.parse(JSON.stringify(options || {}));

  const getProductName = (product) => product?.productName || product?.name || "Ready-to-Assemble Cabinet Product";

  const getProductBadge = (product) => product?.badge || "Ready-to-Assemble";

  const getCategory = (slug) => categories.find((category) => category.slug === slug);

  const getSubcategory = (product, category) => {
    const productSubcategorySlug = product?.subcategorySlug || slugify(product?.subcategoryName || "");
    return category?.subcategories?.find((subcategory) => slugify(subcategory.name) === productSubcategorySlug);
  };

  const updateMetaDescription = (content) => {
    if (!content) return;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.append(metaDescription);
    }

    metaDescription.setAttribute("content", content);
  };

  const applyProductTheme = (productPage, option = {}, index = 0, product = null) => {
    if (!(productPage instanceof HTMLElement)) return;

    const theme = option.theme || option.value || "#f3eee8";
    const surface = option.surface || option.value || theme;
    const accent = option.accent || option.value || "#4b2e19";
    const contrast = option.contrast || "#fbfaf7";

    productPage.style.setProperty("--product-theme", theme);
    productPage.style.setProperty("--product-surface", surface);
    productPage.style.setProperty("--product-accent", accent);
    productPage.style.setProperty("--product-accent-contrast", contrast);
    productPage.style.setProperty("--product-button", "var(--coffee)");
    productPage.style.setProperty("--product-button-contrast", "var(--cream)");
    document.documentElement.style.setProperty("--active-product-accent", accent);
    document.documentElement.style.setProperty("--active-product-accent-contrast", contrast);
    document.documentElement.style.setProperty("--active-product-button", "var(--coffee)");
    document.documentElement.style.setProperty("--active-product-button-contrast", "var(--cream)");
    tintProductBuyButtons(productPage, option);

    productPage.dispatchEvent(
      new CustomEvent("corecut:productColorChange", {
        bubbles: true,
        detail: {
          index,
          option,
          productSlug: product?.slug || productPage.getAttribute("data-shop-product"),
        },
      }),
    );
  };

  const tintProductBuyButtons = (productPage, option = {}) => {
    if (!(productPage instanceof HTMLElement)) return;

    const button = "#6f421b";
    const contrast = "#fbfaf7";
    const border = "#4b2e19";

    const buttonScopes = [
      productPage,
      ...getAccessibleShopifyDocuments(productPage).map((doc) => doc.body || doc.documentElement).filter(Boolean),
    ];

    buttonScopes.forEach((scope) => {
      scope
        .querySelectorAll(".product-shopify-panel .shopify-buy__btn, .shopify-buy__btn, .mobile-sticky-cart .button")
        .forEach((element) => {
          if (!(element instanceof HTMLElement)) return;

          element.style.setProperty("background", button, "important");
          element.style.setProperty("background-color", button, "important");
          element.style.setProperty("background-image", "none", "important");
          element.style.setProperty("border-color", border, "important");
          element.style.setProperty("color", contrast, "important");
        });
    });
  };

  const applyCardColorTheme = (card, option = {}) => {
    if (!(card instanceof HTMLElement)) return;

    const theme = option.theme || option.surface || option.value || "#f3eee8";
    const surface = option.surface || option.value || theme;
    const accent = option.accent || option.value || "#4b2e19";
    const contrast = option.contrast || "#fbfaf7";

    card.style.setProperty("--card-theme", theme);
    card.style.setProperty("--card-surface", surface);
    card.style.setProperty("--card-accent", accent);
    card.style.setProperty("--card-contrast", contrast);
  };

  const normalizeOptionValue = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const getColorOptionAliases = (option = {}) => {
    const preferredName = option.shopifyValue || option.shopifyName || option.name || "";
    return [
      preferredName,
      option.name,
      option.shopifyValue,
      option.shopifyName,
      String(option.name || "").replace(/\s*shaker\s*/gi, " ").trim(),
      String(preferredName || "").split(/\s+/)[0],
    ]
      .map(normalizeOptionValue)
      .filter(Boolean);
  };

  const getFinishDisplayName = (option = {}) => {
    const preferredName = option.shopifyValue || option.shopifyName || option.name || "";
    return String(preferredName || "Finish").replace(/\s*shaker\s*/gi, " ").replace(/\s+/g, " ").trim();
  };

  const findProductColorOption = (product, value) => {
    const normalizedValue = normalizeOptionValue(value);
    if (!normalizedValue) return null;

    return (
      product?.colorOptions?.find((option) => {
        const aliases = getColorOptionAliases(option);
        return aliases.some((alias) => alias === normalizedValue || alias.includes(normalizedValue) || normalizedValue.includes(alias));
      }) || null
    );
  };

  const getShopifyValueLabel = (value) => {
    if (typeof value === "string") return value;
    return value?.value || value?.name || value?.label || value?.attrs?.value || value?.attrs?.name || value?.attrs?.label || "";
  };

  const SHOPIFY_COLOUR_DEBUG = false;
  const SHOPIFY_COLOUR_VALUES = ["white", "warm wood", "grey"];

  const getSelectOptionLabels = (selectOption) =>
    [selectOption.textContent, selectOption.label, selectOption.value].map(normalizeOptionValue).filter(Boolean);

  const labelMatchesAliases = (labels = [], aliases = []) =>
    labels.some((label) => aliases.some((alias) => label === alias || label.includes(alias) || alias.includes(label)));

  const getSelectDebugOptions = (select) =>
    Array.from(select?.options || []).map((selectOption) => ({
      text: selectOption.textContent.trim(),
      label: selectOption.label,
      value: selectOption.value,
      selected: selectOption.selected,
    }));

  const getAccessibleShopifyDocuments = (productPage) => {
    if (!(productPage instanceof HTMLElement)) return [];

    return Array.from(productPage.querySelectorAll(".product-shopify-panel iframe"))
      .map((iframe) => {
        try {
          return iframe.contentDocument || iframe.contentWindow?.document || null;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  };

  const findShopifyColourSelect = (productPage, option = {}) => {
    const scope = productPage instanceof HTMLElement ? productPage : document;
    const scopedSelects = Array.from(
      scope.querySelectorAll(".product-detail-buy select, .product-shopify-panel select, [data-product-shopify] select"),
    ).filter((select) => select instanceof HTMLSelectElement);
    const selects = scopedSelects.length ? scopedSelects : Array.from(document.querySelectorAll("select"));
    const aliases = getColorOptionAliases(option);

    const colourSelect =
      selects.find((select) => {
        const optionLabels = Array.from(select.options).map((selectOption) => getSelectOptionLabels(selectOption)).flat();
        return SHOPIFY_COLOUR_VALUES.every((colour) =>
          optionLabels.some((label) => label === colour || label.includes(colour) || colour.includes(label)),
        );
      }) ||
      selects.find((select) =>
        Array.from(select.options).some((selectOption) => labelMatchesAliases(getSelectOptionLabels(selectOption), aliases)),
      );

    if (SHOPIFY_COLOUR_DEBUG) {
      if (colourSelect) {
        console.log("[Corecut Shopify colour] dropdown found:", colourSelect);
        console.log("[Corecut Shopify colour] available dropdown options:", getSelectDebugOptions(colourSelect));
      } else {
        console.warn("[Corecut Shopify colour] Shopify colour dropdown not found");
      }
    }

    return colourSelect || null;
  };

  const hideShopifyVariantSelect = (select) => {
    select.classList.add("is-shopify-variant-control-hidden");
    select.setAttribute("aria-hidden", "true");
    select.tabIndex = -1;

    const wrapper = select.closest(
      ".shopify-buy__option-select-wrapper, .shopify-buy__product__variant-selectors, .shopify-buy__product__variant-selector, label",
    );
    if (wrapper instanceof HTMLElement) {
      wrapper.classList.add("is-shopify-variant-control-hidden");
      wrapper.setAttribute("aria-hidden", "true");
    }
  };

  const findMatchingShopifyValue = (values = [], option = {}) => {
    const aliases = getColorOptionAliases(option);
    if (!aliases.length) return "";

    const normalizedValues = values.map((value) => ({
      label: getShopifyValueLabel(value),
      normalized: normalizeOptionValue(getShopifyValueLabel(value)),
    }));

    const exact = normalizedValues.find((value) => aliases.includes(value.normalized));
    if (exact) return exact.label;

    const partial = normalizedValues.find((value) =>
      aliases.some((alias) => value.normalized.includes(alias) || alias.includes(value.normalized)),
    );
    return partial?.label || "";
  };

  const findShopifyColorOption = (component, option = {}) => {
    const optionModels = component?.model?.options || component?.model?.attrs?.options || [];
    if (!optionModels.length) return null;

    return (
      optionModels.find((modelOption) => {
        const name = normalizeOptionValue(modelOption.name || modelOption.attrs?.name);
        return name === "color" || name === "colour" || name.includes("finish");
      }) ||
      optionModels.find((modelOption) => findMatchingShopifyValue(modelOption.values || modelOption.attrs?.values || [], option)) ||
      optionModels[0]
    );
  };

  const getVariantOptionValue = (variant, optionName) => {
    const normalizedName = normalizeOptionValue(optionName);
    const selectedOptions = variant?.selectedOptions || variant?.attrs?.selectedOptions || variant?.options || variant?.attrs?.options || [];

    if (Array.isArray(selectedOptions)) {
      const selectedOption = selectedOptions.find((entry) => normalizeOptionValue(entry?.name || entry?.label) === normalizedName);
      return selectedOption?.value || selectedOption?.label || "";
    }

    if (selectedOptions && typeof selectedOptions === "object") {
      const matchingKey = Object.keys(selectedOptions).find((key) => normalizeOptionValue(key) === normalizedName);
      return matchingKey ? selectedOptions[matchingKey] : "";
    }

    return "";
  };

  const getVariantColorValue = (variant, product, optionName = "") => {
    if (!variant || !product?.colorOptions?.length) return "";

    const namedValue = optionName ? getVariantOptionValue(variant, optionName) : "";
    if (findProductColorOption(product, namedValue)) return namedValue;

    const selectedOptions = variant?.selectedOptions || variant?.attrs?.selectedOptions || variant?.options || variant?.attrs?.options || [];
    const values = Array.isArray(selectedOptions)
      ? selectedOptions.map((entry) => entry?.value || entry?.label || entry?.name)
      : selectedOptions && typeof selectedOptions === "object"
        ? Object.values(selectedOptions)
        : [];

    const matchedValue = values.find((value) => findProductColorOption(product, value));
    if (matchedValue) return matchedValue;

    const title = getVariantTitle(variant);
    return findProductColorOption(product, title) ? title : "";
  };

  const getShopifyVariants = (component) => {
    const variants = component?.model?.variants || component?.model?.attrs?.variants || [];
    if (!Array.isArray(variants)) return [];

    return variants.map((variant) => variant?.node || variant).filter(Boolean);
  };

  const getVariantTitle = (variant) => variant?.title || variant?.attrs?.title || "";

  const getVariantId = (variant) => variant?.id || variant?.attrs?.id || variant?.attrs?.variantId || variant?.variantId || null;

  const findMatchingShopifyVariant = (component, optionName, optionValue) => {
    const normalizedValue = normalizeOptionValue(optionValue);
    const variants = getShopifyVariants(component);
    if (!normalizedValue || !variants.length) return null;

    return (
      variants.find((variant) => normalizeOptionValue(getVariantOptionValue(variant, optionName)) === normalizedValue) ||
      variants.find((variant) => normalizeOptionValue(getVariantTitle(variant)).includes(normalizedValue)) ||
      null
    );
  };

  const setShopifySelectedOption = (component, optionName, optionValue) => {
    if (!component || !optionName || !optionValue) return;

    if (component.selectedOptions instanceof Map) {
      component.selectedOptions.set(optionName, optionValue);
      return;
    }

    if (Array.isArray(component.selectedOptions)) {
      const selectedOption = component.selectedOptions.find((entry) => normalizeOptionValue(entry?.name || entry?.label) === normalizeOptionValue(optionName));
      if (selectedOption) {
        selectedOption.value = optionValue;
        return;
      }
    }

    if (!component.selectedOptions || typeof component.selectedOptions !== "object") {
      component.selectedOptions = {};
    }

    component.selectedOptions[optionName] = optionValue;
  };

  const setShopifySelectedVariant = (component, variant) => {
    if (!component || !variant) return;

    component.selectedVariant = variant;
    if (component.viewData && typeof component.viewData === "object") component.viewData.selectedVariant = variant;
    if (component.model && typeof component.model === "object") component.model.selectedVariant = variant;
  };

  const updateShopifyComponentVariant = (productPage, option = {}, settings = {}) => {
    if (!(productPage instanceof HTMLElement) || !option) return false;

    const { force = false } = settings;
    const component = shopifyProductComponents.get(productPage);
    const modelOption = findShopifyColorOption(component, option);
    const modelOptionName = modelOption?.name || modelOption?.attrs?.name || "";
    const optionValue = modelOption ? findMatchingShopifyValue(modelOption.values || modelOption.attrs?.values || [], option) : "";

    if (!component?.updateVariant || !modelOptionName || !optionValue) return false;
    const variantKey = `${modelOptionName}:${optionValue}`;
    const selectedVariant = findMatchingShopifyVariant(component, modelOptionName, optionValue);
    const selectedVariantValue = normalizeOptionValue(getVariantOptionValue(component.selectedVariant, modelOptionName));
    const alreadySelectedVariant = selectedVariantValue && selectedVariantValue === normalizeOptionValue(optionValue);

    if (!force && appliedShopifyComponentVariants.get(component) === variantKey && alreadySelectedVariant) return true;

    setShopifySelectedOption(component, modelOptionName, optionValue);
    setShopifySelectedVariant(component, selectedVariant);
    appliedShopifyComponentVariants.set(component, variantKey);
    component.updateVariant(modelOptionName, optionValue);
    setShopifySelectedOption(component, modelOptionName, optionValue);
    setShopifySelectedVariant(component, selectedVariant);

    if (SHOPIFY_COLOUR_DEBUG) {
      console.log("[Corecut Shopify colour] component variant forced:", {
        optionName: modelOptionName,
        optionValue,
        selectedVariantId: getVariantId(selectedVariant),
        selectedVariantTitle: getVariantTitle(selectedVariant),
      });
    }

    return true;
  };

  const syncShopifyOptionSelect = (productPage, option = {}) => {
    if (!(productPage instanceof HTMLElement)) return false;

    const aliases = getColorOptionAliases(option);
    if (!aliases.length) return false;

    const select = findShopifyColourSelect(productPage, option);
    if (!(select instanceof HTMLSelectElement)) return false;

    const matchingOption = Array.from(select.options).find((selectOption) =>
      labelMatchesAliases(getSelectOptionLabels(selectOption), aliases),
    );

    if (!matchingOption) {
      if (SHOPIFY_COLOUR_DEBUG) {
        console.warn("[Corecut Shopify colour] No matching Shopify option found for:", option.shopifyValue || option.name);
        console.log("[Corecut Shopify colour] available dropdown options:", getSelectDebugOptions(select));
      }
      return false;
    }

    Array.from(select.options).forEach((selectOption) => {
      selectOption.selected = selectOption === matchingOption;
    });
    select.value = matchingOption.value;
    select.selectedIndex = matchingOption.index;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));

    if (SHOPIFY_COLOUR_DEBUG) {
      console.log("[Corecut Shopify colour] colour clicked:", option.shopifyValue || option.name);
      console.log("[Corecut Shopify colour] dropdown value after change:", select.value);
    }

    productPage
      .querySelectorAll(
        ".product-shopify-panel [role='option'], .product-shopify-panel [data-value], .product-shopify-panel [data-option-value]",
      )
      .forEach((control) => {
        if (!(control instanceof HTMLElement) || control.closest(".product-option-group")) return;

        const labels = [
          control.textContent,
          control.getAttribute("aria-label"),
          control.getAttribute("data-value"),
          control.getAttribute("data-option-value"),
        ]
          .map(normalizeOptionValue)
          .filter(Boolean);
        if (!labelMatchesAliases(labels, aliases)) return;

        control.click();
      });

    return true;
  };

  const syncShopifyColourSelection = (productPage, option = {}, settings = {}) => {
    if (productPage instanceof HTMLElement && option?.name) {
      selectedProductColorOptions.set(productPage, option);
    }

    const didSyncSelect = syncShopifyOptionSelect(productPage, option);
    const didSyncComponent = updateShopifyComponentVariant(productPage, option, settings);
    tintProductBuyButtons(productPage, option);
    return didSyncSelect || didSyncComponent;
  };

  const scheduleShopifyOptionSync = (productPage, option = {}, settings = {}) => {
    if (!(productPage instanceof HTMLElement) || !option) return;

    syncShopifyColourSelection(productPage, option, settings);
    window.setTimeout(() => syncShopifyColourSelection(productPage, option, settings), 250);
    window.setTimeout(() => syncShopifyColourSelection(productPage, option, settings), 900);

    const panel = productPage.querySelector(".product-shopify-panel");
    if (!(panel instanceof HTMLElement) || panel.dataset.shopifyOptionObserver === "true" || typeof MutationObserver === "undefined") {
      return;
    }

    panel.dataset.shopifyOptionObserver = "true";
    const observer = new MutationObserver(() => {
      const selectedOption = selectedProductColorOptions.get(productPage);
      if (selectedOption) syncShopifyColourSelection(productPage, selectedOption);
    });
    observer.observe(panel, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 6000);
  };

  const registerShopifyProductComponent = (node, component) => {
    const productPage = node.closest("[data-shop-product]");
    if (!(productPage instanceof HTMLElement)) return;

    shopifyProductComponents.set(productPage, component);
    if (SHOPIFY_COLOUR_DEBUG) window.__corecutShopifyProductComponent = component;
    const product = products.find((entry) => entry.slug === productPage.getAttribute("data-shop-product"));
    if (product) {
      patchShopifyComponentThemeSync(productPage, product, component);
      syncProductThemeFromShopifySelection(productPage, product);
      bindShopifyDropdownThemeSync(productPage, product);
    }
  };

  const getShopifySelectedOptionValue = (component, optionName) => {
    const normalizedName = normalizeOptionValue(optionName);
    const selectedOptions = component?.selectedOptions || component?.viewData?.selectedOptions || {};

    if (selectedOptions instanceof Map) {
      return selectedOptions.get(optionName) || selectedOptions.get(normalizedName) || "";
    }

    if (Array.isArray(selectedOptions)) {
      const selectedOption = selectedOptions.find((entry) => normalizeOptionValue(entry?.name || entry?.label) === normalizedName);
      return selectedOption?.value || selectedOption?.label || "";
    }

    if (selectedOptions && typeof selectedOptions === "object") {
      const matchingKey = Object.keys(selectedOptions).find((key) => normalizeOptionValue(key) === normalizedName);
      if (matchingKey) return selectedOptions[matchingKey];
    }

    return "";
  };

  const getShopifyColourSelects = (productPage, product) => {
    if (!(productPage instanceof HTMLElement)) return [];

    const scopes = [productPage, ...getAccessibleShopifyDocuments(productPage).map((doc) => doc.body || doc.documentElement).filter(Boolean)];
    const colorOptions = product?.colorOptions || [];

    return scopes
      .flatMap((scope) => Array.from(scope.querySelectorAll("select")))
      .filter((select) => select instanceof HTMLSelectElement)
      .filter((select) => {
        const optionLabels = Array.from(select.options).map((option) => getSelectOptionLabels(option)).flat();
        return colorOptions.some((option) => labelMatchesAliases(optionLabels, getColorOptionAliases(option)));
      });
  };

  const getSelectedShopifyColourValue = (productPage, product) => {
    const component = shopifyProductComponents.get(productPage);
    const modelOption = findShopifyColorOption(component, product?.colorOptions?.[0] || {});
    const modelOptionName = modelOption?.name || modelOption?.attrs?.name || "";
    const selectedVariant = component?.selectedVariant || component?.viewData?.selectedVariant || component?.model?.selectedVariant;
    const variantValue = getVariantColorValue(selectedVariant, product, modelOptionName);
    if (variantValue) return variantValue;

    const componentValue =
      getShopifySelectedOptionValue(component, modelOptionName) || getVariantOptionValue(component?.selectedVariant, modelOptionName);

    if (componentValue) return componentValue;

    const select = getShopifyColourSelects(productPage, product)[0];
    if (!(select instanceof HTMLSelectElement)) return "";

    const selectedOption = select.options[select.selectedIndex];
    return selectedOption?.textContent || selectedOption?.label || selectedOption?.value || select.value;
  };

  const syncProductThemeFromShopifySelection = (productPage, product, explicitValue = "") => {
    if (!(productPage instanceof HTMLElement) || !product?.colorOptions?.length) return false;

    const selectedValue = explicitValue || getSelectedShopifyColourValue(productPage, product);
    const existingOption = selectedProductColorOptions.get(productPage);
    const selectedOption = findProductColorOption(product, selectedValue) || existingOption || product.colorOptions[0];
    const selectedIndex = Math.max(0, product.colorOptions.indexOf(selectedOption));

    selectedProductColorOptions.set(productPage, selectedOption);
    productPage.dataset.corecutThemeValue = normalizeOptionValue(selectedValue || getFinishDisplayName(selectedOption));
    applyProductTheme(productPage, selectedOption, selectedIndex, product);
    return Boolean(selectedValue || selectedOption);
  };

  const patchShopifyComponentThemeSync = (productPage, product, component) => {
    if (!(productPage instanceof HTMLElement) || !component || component.__corecutThemePatched) return;

    component.__corecutThemePatched = true;
    const syncSoon = () => {
      window.setTimeout(() => syncProductThemeFromShopifySelection(productPage, product), 0);
      window.setTimeout(() => syncProductThemeFromShopifySelection(productPage, product), 80);
    };

    ["updateVariant", "selectVariant"].forEach((methodName) => {
      if (typeof component[methodName] !== "function") return;

      const originalMethod = component[methodName];
      component[methodName] = function patchedShopifyVariantMethod(...args) {
        const result = originalMethod.apply(this, args);
        syncSoon();
        return result;
      };
    });

    syncSoon();
  };

  const startShopifyThemePolling = (productPage, product) => {
    if (!(productPage instanceof HTMLElement) || productPage.dataset.corecutThemePolling === "true") return;

    productPage.dataset.corecutThemePolling = "true";
    const syncIfChanged = () => {
      const selectedValue = getSelectedShopifyColourValue(productPage, product);
      const normalizedValue = normalizeOptionValue(selectedValue);
      if (!normalizedValue || normalizedValue === productPage.dataset.corecutThemeValue) return;

      syncProductThemeFromShopifySelection(productPage, product, selectedValue);
    };

    syncIfChanged();
    window.setInterval(syncIfChanged, 500);
  };

  const bindShopifyDropdownThemeSync = (productPage, product) => {
    if (!(productPage instanceof HTMLElement) || !product?.colorOptions?.length) return;

    const bindCurrentSelects = () => {
      getShopifyColourSelects(productPage, product).forEach((select) => {
        if (select.dataset.corecutThemeBound === "true") return;

        select.dataset.corecutThemeBound = "true";
        const updateFromSelect = () => {
          const selectedOption = select.options[select.selectedIndex];
          const selectedValue = selectedOption?.textContent || selectedOption?.label || selectedOption?.value || select.value;
          syncProductThemeFromShopifySelection(productPage, product, selectedValue);
        };

        select.addEventListener("input", updateFromSelect);
        select.addEventListener("change", updateFromSelect);
        updateFromSelect();
      });

      syncProductThemeFromShopifySelection(productPage, product);
    };

    [0, 250, 900, 1800, 3200].forEach((delay) => window.setTimeout(bindCurrentSelects, delay));
    startShopifyThemePolling(productPage, product);

    const panel = productPage.querySelector(".product-shopify-panel");
    if (!(panel instanceof HTMLElement) || panel.dataset.corecutThemeObserver === "true" || typeof MutationObserver === "undefined") return;

    panel.dataset.corecutThemeObserver = "true";
    const observer = new MutationObserver(bindCurrentSelects);
    observer.observe(panel, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 7000);
  };

  const renderCabinetFallback = (label = "Ready-to-Assemble Cabinet") => {
    const fallback = createElement("div", "product-visual-fallback");
    fallback.setAttribute("aria-hidden", "true");
    fallback.innerHTML = `
      <div class="product-visual-shadow"></div>
      <div class="product-visual-cabinet">
        <span class="product-visual-door"></span>
        <span class="product-visual-door"></span>
        <span class="product-visual-drawer"></span>
      </div>
      <small>${label}</small>
    `;
    return fallback;
  };

  const getFirstProductImage = (product) => product?.images?.find((image) => image.src);

  const getShopifyImageSource = (image) => image?.src || image?.transformedSrc || image?.originalSrc || image?.url || "";

  const getFrontViewLabel = (product, index, total) => {
    if (total <= 1) return "Front View";

    const colorName = product.colorOptions?.[index]?.name;
    return colorName ? `${colorName} Front` : `Front View ${index + 1}`;
  };

  const hydrateShopifyProductImages = (product) => {
    if (!product?.shopifyProductId || getFirstProductImage(product)) {
      return Promise.resolve(product?.images || []);
    }

    if (product.shopifyImagesPromise) return product.shopifyImagesPromise;

    product.shopifyImagesPromise = getShopifyClient()
      .then((client) => client.product.fetch(product.shopifyProductId))
      .then((shopifyProduct) => {
        const shopifyImages = shopifyProduct?.images || [];
        const hydratedImages = shopifyImages
          .map((image, index) => {
            const src = getShopifyImageSource(image);
            if (!src) return null;

            return {
              label: getFrontViewLabel(product, index, shopifyImages.length),
              alt: `${getProductName(product)} ${getFrontViewLabel(product, index, shopifyImages.length).toLowerCase()}`,
              src,
            };
          })
          .filter(Boolean);

        if (hydratedImages.length) product.images = hydratedImages;
        return product.images || [];
      })
      .catch(() => product.images || []);

    return product.shopifyImagesPromise;
  };

  const populateProductVisual = (visual, item, label = "Ready-to-Assemble Cabinet") => {
    visual.innerHTML = "";
    const visualBadge =
      item.type === "product" ? getProductBadge(item.product) : item.type === "placeholder" ? "Made to order" : "Ready-to-Assemble";
    const badge = createElement("span", "shop-card-image-badge", visualBadge);
    const activeImageIndex = Number.parseInt(visual.dataset.activeColorIndex || "0", 10);
    const firstImage =
      item.product?.images?.[activeImageIndex]?.src ? item.product.images[activeImageIndex] : getFirstProductImage(item.product);

    visual.append(badge);

    if (firstImage?.src) {
      const image = createElement("img");
      image.src = firstImage.src;
      image.alt = firstImage.alt || item.title || label;
      image.loading = "lazy";
      image.decoding = "async";
      visual.append(image);
    } else {
      visual.append(renderCabinetFallback(label));
    }
  };

  const renderProductVisual = (item, label = "Ready-to-Assemble Cabinet") => {
    const visual = createElement("div", "shop-card-visual shop-card-visual-product");
    if (item.product?.slug) visual.dataset.productImageTarget = item.product.slug;
    populateProductVisual(visual, item, label);

    return visual;
  };

  const syncHydratedProductVisuals = (product) => {
    if (!getFirstProductImage(product)) return;

    document.querySelectorAll("[data-product-image-target]").forEach((visual) => {
      if (!(visual instanceof HTMLElement) || visual.dataset.productImageTarget !== product.slug) return;

      populateProductVisual(
        visual,
        {
          type: "product",
          product,
        },
        getProductName(product),
      );
    });
  };

  const getSubcategoryFilterId = (category, subcategory) => `${category.slug}:${slugify(subcategory.name)}`;

  const getProductsForSubcategory = (category, subcategory) => {
    const subcategorySlug = slugify(subcategory.name);

    return products.filter((product) => {
      const productSubcategorySlug = product.subcategorySlug || slugify(product.subcategoryName || "");
      return product.categorySlug === category.slug && productSubcategorySlug === subcategorySlug;
    });
  };

  const getShopItems = (scopeCategories = categories) =>
    scopeCategories.flatMap((category) =>
      category.subcategories.flatMap((subcategory) => {
        const subcategorySlug = slugify(subcategory.name);
        const subcategoryFilterId = getSubcategoryFilterId(category, subcategory);
        const matchingProducts = getProductsForSubcategory(category, subcategory);

        if (matchingProducts.length) {
          return matchingProducts.map((product) => {
            const priceRangeId = product.priceRange || subcategory.priceRange || "250-500";

            return {
              type: "product",
              category,
              subcategory,
              subcategorySlug,
              subcategoryFilterId,
              product,
              id: product.slug || `${category.slug}-${slugify(getProductName(product))}`,
              title: getProductName(product),
              description: product.shortDescription || product.description || subcategory.description,
              priceRangeId,
              priceRange: priceRangeMap.get(priceRangeId),
            };
          });
        }

        const priceRangeId = subcategory.priceRange || "250-500";

        return {
          type: "placeholder",
          category,
          subcategory,
          subcategorySlug,
          subcategoryFilterId,
          id: `${category.slug}-${subcategorySlug}`,
          title: subcategory.name,
          description: subcategory.description,
          priceRangeId,
          priceRange: priceRangeMap.get(priceRangeId),
        };
      }),
    );

  const renderColorSwatches = (colorOptions = [], onChange) => {
    if (!colorOptions.length) return null;

    const swatches = createElement("div", "product-color-swatches", "");
    swatches.setAttribute("aria-label", "Available finish options");

    colorOptions.slice(0, 4).forEach((option, index) => {
      const swatch = createElement("span", "product-color-swatch");
      swatch.setAttribute("role", "button");
      swatch.setAttribute("tabindex", "0");
      swatch.setAttribute("aria-pressed", String(index === 0));
      swatch.style.setProperty("--swatch", option.value || "#c5a071");
      swatch.title = option.name || "Finish option";
      swatch.setAttribute("aria-label", option.name || "Finish option");
      if (index === 0) swatch.classList.add("is-active");

      const selectSwatch = (event) => {
        event.preventDefault();
        event.stopPropagation();
        swatches.querySelectorAll(".product-color-swatch").forEach((button) => {
          button.classList.remove("is-active");
          button.setAttribute("aria-pressed", "false");
        });
        swatch.classList.add("is-active");
        swatch.setAttribute("aria-pressed", "true");
        if (typeof onChange === "function") onChange(option, index);
      };

      swatch.addEventListener("click", selectSwatch);
      swatch.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        selectSwatch(event);
      });

      swatches.append(swatch);
    });

    return swatches;
  };

  const renderProductCard = (item, index = 0, variant = "catalog") => {
    const isProduct = item.type === "product" && item.product;
    const card = createElement(isProduct || item.linkUrl ? "a" : "article", "shop-product-card product-market-card");
    card.id = variant === "catalog" ? item.id : "";
    card.style.setProperty("--reveal-delay", `${Math.min(index * 30, 120)}ms`);

    if (card instanceof HTMLAnchorElement) {
      card.href = isProduct ? productPath(item.product) : item.linkUrl;
      card.setAttribute("aria-label", `View ${item.title}`);
    }

    if (isProduct) card.classList.add("has-shopify-product");
    if (variant === "related") card.classList.add("is-related-card");
    if (isProduct) applyCardColorTheme(card, item.product.colorOptions?.[0]);

    const visual = renderProductVisual(item, item.title);
    const content = createElement("div", "shop-card-copy");
    const status = null;
    const title = createElement("h3", "", item.title);
    const categoryLabel = createElement(
      "p",
      "shop-card-category",
      isProduct
        ? `${item.category?.name || "Ready-to-Assemble Cabinets"}${item.subcategory?.name ? ` / ${item.subcategory.name}` : ""}`
        : item.category?.name || "Ready-to-Assemble Cabinets",
    );
    const swatches = variant === "related" ? null : renderColorSwatches(item.product?.colorOptions || [], (option, optionIndex) => {
      if (!isProduct) return;

      visual.dataset.activeColorIndex = String(optionIndex);
      applyCardColorTheme(card, option);
      populateProductVisual(
        visual,
        {
          type: "product",
          product: item.product,
        },
        item.title,
      );
    });
    let action = null;
    if (isProduct) {
      action = null;
    } else if (item.linkUrl) {
      action = createElement("span", "button secondary shop-card-action", "View Category");
    } else {
      // Placeholder items become a frictionless quote request instead of a dead end.
      action = createElement("a", "shop-card-quote-link", "Request a quote →");
      action.href = "/contact";
      action.setAttribute(
        "aria-label",
        `Request a quote for ${item.title}${item.category?.name ? ` (${item.category.name})` : ""}`,
      );
    }

    if (isProduct) {
      if (swatches) content.append(swatches);
      content.append(categoryLabel, title);

      const priceLabel = item.product.startingPrice || item.product.price;
      if (priceLabel) content.append(createElement("p", "shop-card-price", priceLabel));
    } else {
      if (status) content.append(status);
      content.append(categoryLabel, title);
      if (swatches) content.append(swatches);
      if (action) content.append(action);
    }

    card.append(visual, content);
    if (isProduct && action) card.append(action);
    return card;
  };

  const renderFilterOptions = (container, options, selectedValues, type) => {
    if (!container) return;

    container.innerHTML = "";

    options.forEach((option) => {
      const label = createElement("label", "shop-filter-option");
      const input = createElement("input");
      input.type = "checkbox";
      input.name = type;
      input.value = option.value;
      input.checked = selectedValues.has(option.value);

      label.append(input, createElement("span", "", option.label));
      container.append(label);
    });
  };

  const renderCategoryCards = () => {
    document.querySelectorAll("[data-shop-categories]").forEach((grid) => {
      grid.innerHTML = "";

      categories.forEach((category, index) => {
        const card = createElement("a", "shop-category-card", "");
        card.href = categoryPath(category);
        card.style.setProperty("--reveal-delay", `${Math.min(index * 45, 140)}ms`);

        const content = createElement("div", "shop-card-copy");
        content.append(createElement("span", "status-pill", "Ready-to-Assemble Cabinets"));
        content.append(createElement("h3", "", category.name));
        content.append(createElement("p", "", category.description));

        const action = createElement("span", "button secondary shop-card-action", "View Category");

        card.append(renderProductVisual({ type: "category", title: category.name, category }, category.name), content, action);
        grid.append(card);
      });
    });
  };

  const setEmptyState = (emptyState, isVisible) => {
    if (!emptyState) return;
    emptyState.hidden = !isVisible;
  };

  const ensureCatalogControls = (browser, scopeCategories, scopedCategory, state, updateBrowser, renderResults) => {
    const resultsArea = browser.querySelector(".shop-results-area");
    const toolbar = browser.querySelector(".shop-results-toolbar");
    if (!resultsArea || !toolbar) return {};

    let searchInput = browser.querySelector("[data-shop-search]");
    let chipGroup = browser.querySelector("[data-shop-category-chips]");

    if (!searchInput) {
      const controls = createElement("div", "shop-catalog-controls");
      const searchLabel = createElement("label", "shop-search-control");
      const searchText = createElement("span", "", "Search products");
      searchInput = createElement("input");
      searchInput.type = "search";
      searchInput.placeholder = "Search ready-to-assemble cabinets";
      searchInput.autocomplete = "off";
      searchInput.setAttribute("data-shop-search", "");
      searchLabel.append(searchText, searchInput);

      chipGroup = createElement("div", "shop-category-chips");
      chipGroup.setAttribute("data-shop-category-chips", "");
      chipGroup.setAttribute("aria-label", scopedCategory ? "Current ready-to-assemble cabinet category" : "Ready-to-Assemble cabinet categories");

      controls.append(searchLabel, chipGroup);
      resultsArea.insertBefore(controls, toolbar);
    }

    const renderCategoryChips = () => {
      if (!chipGroup) return;
      chipGroup.innerHTML = "";

      if (scopedCategory) {
        const chip = createElement("span", "shop-category-chip is-active", scopedCategory.name);
        chipGroup.append(chip);
        return;
      }

      const allChip = createElement("button", `shop-category-chip${state.categories.size ? "" : " is-active"}`, "All");
      allChip.type = "button";
      allChip.addEventListener("click", () => {
        state.categories.clear();
        updateBrowser();
      });
      chipGroup.append(allChip);

      scopeCategories.forEach((category) => {
        const chip = createElement(
          "button",
          `shop-category-chip${state.categories.has(category.slug) ? " is-active" : ""}`,
          category.name,
        );
        chip.type = "button";
        chip.addEventListener("click", () => {
          if (state.categories.has(category.slug)) {
            state.categories.delete(category.slug);
          } else {
            state.categories.add(category.slug);
          }
          updateBrowser();
        });
        chipGroup.append(chip);
      });
    };

    searchInput.addEventListener("input", () => {
      state.search = searchInput.value.trim().toLowerCase();
      renderResults();
    });

    return { renderCategoryChips };
  };

  const initMobileFilterDisclosure = (browser, toolbar, sortControl) => {
    if (!browser || !toolbar) return;

    const filterPanel = browser.querySelector(".shop-filter-panel");
    const filterSidebar = browser.querySelector(".shop-filter-sidebar");
    if (!filterPanel || !filterSidebar) return;

    if (!filterPanel.id) {
      filterPanel.id = `shop-filter-panel-${Math.random().toString(36).slice(2, 9)}`;
    }

    let toggle = toolbar.querySelector(".shop-mobile-filter-toggle");
    if (!toggle) {
      toggle = createElement("button", "shop-mobile-filter-toggle");
      toggle.type = "button";
      toggle.setAttribute("aria-controls", filterPanel.id);
      toggle.setAttribute("aria-expanded", "false");
      const icon = createElement("span", "shop-mobile-filter-icon");
      icon.setAttribute("aria-hidden", "true");
      toggle.append(icon, createElement("span", "", "Filter & Sort"));
      toolbar.append(toggle);
    }

    let sortSlot = filterPanel.querySelector("[data-shop-mobile-sort-slot]");
    if (!sortSlot) {
      sortSlot = createElement("div", "shop-mobile-sort-slot");
      sortSlot.setAttribute("data-shop-mobile-sort-slot", "");
      filterPanel.insertBefore(sortSlot, filterPanel.querySelector(".shop-filter-group"));
    }

    let sortPlaceholder = toolbar.querySelector("[data-shop-sort-placeholder]");
    if (sortControl && !sortPlaceholder) {
      sortPlaceholder = createElement("span", "shop-sort-control-placeholder");
      sortPlaceholder.hidden = true;
      sortPlaceholder.setAttribute("data-shop-sort-placeholder", "");
      sortControl.before(sortPlaceholder);
    }

    const mobileFilters = window.matchMedia("(max-width: 760px)");
    const setExpanded = (isExpanded) => {
      browser.classList.toggle("is-filter-open", isExpanded);
      toggle.setAttribute("aria-expanded", String(isExpanded));
    };
    const syncSortPlacement = () => {
      if (!sortControl || !sortPlaceholder) return;
      if (mobileFilters.matches) {
        sortSlot.append(sortControl);
      } else {
        sortPlaceholder.after(sortControl);
        setExpanded(false);
      }
    };

    toggle.addEventListener("click", () => setExpanded(!browser.classList.contains("is-filter-open")));
    if (mobileFilters.addEventListener) {
      mobileFilters.addEventListener("change", syncSortPlacement);
    } else {
      mobileFilters.addListener(syncSortPlacement);
    }
    syncSortPlacement();
  };

  const loadShopifyScript = () => {
    if (window.ShopifyBuy?.UI) return Promise.resolve();
    if (shopifyScriptPromise) return shopifyScriptPromise;
    if (!shopifyConfig.scriptUrl) return Promise.reject(new Error("Missing Shopify script URL."));

    shopifyScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${shopifyConfig.scriptUrl}"]`);

      if (existingScript) {
        existingScript.addEventListener("load", resolve, { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.src = shopifyConfig.scriptUrl;
      script.onload = resolve;
      script.onerror = reject;
      (document.head || document.body).append(script);
    });

    return shopifyScriptPromise;
  };

  const getShopifyClient = async () => {
    if (shopifyClientPromise) return shopifyClientPromise;
    await loadShopifyScript();

    if (!window.ShopifyBuy?.buildClient) {
      throw new Error("Shopify Buy Button client is unavailable.");
    }

    shopifyClientPromise = Promise.resolve(window.ShopifyBuy.buildClient({
      domain: shopifyConfig.domain,
      storefrontAccessToken: shopifyConfig.storefrontAccessToken,
    }));

    return shopifyClientPromise;
  };

  const getShopifyUi = async () => {
    if (shopifyUiPromise) return shopifyUiPromise;

    const client = await getShopifyClient();

    if (!window.ShopifyBuy?.UI) {
      throw new Error("Shopify Buy Button is unavailable.");
    }

    shopifyUiPromise = window.ShopifyBuy.UI.onReady(client);
    return shopifyUiPromise;
  };

  const getShopifyOptionsForNode = (node) => {
    const options = cloneOptions(shopifyConfig.options);

    if (node.dataset.shopifyLayout === "purchase") {
      options.product = options.product || {};
      options.product.contents = {
        ...(options.product.contents || {}),
        img: false,
        title: false,
        price: false,
        options: true,
        quantity: true,
        quantityIncrement: true,
        quantityDecrement: true,
      };
      options.product.styles = {
        ...(options.product.styles || {}),
        product: {
          ...(options.product.styles?.product || {}),
          "max-width": "100%",
          width: "100%",
          margin: "0",
          "margin-left": "0",
          "margin-bottom": "0",
        },
        button: {
          ...(options.product.styles?.button || {}),
          "background-color": "#6f421b",
          "background-image": "none",
          border: "2px solid #4b2e19",
          "border-radius": "999px",
          "box-shadow": "0 16px 32px rgba(48, 41, 35, 0.12)",
          color: "#fbfaf7",
          "font-family": "Inter, sans-serif",
          "font-size": "16px",
          "font-weight": "900",
          "min-height": "60px",
          padding: "0 24px",
          width: "100%",
          ":hover": {
            "background-color": "#6f421b",
            "background-image": "none",
          },
          ":focus": {
            "background-color": "#6f421b",
            "background-image": "none",
          },
        },
        quantityInput: {
          ...(options.product.styles?.quantityInput || {}),
          "background-color": "transparent",
          border: "0",
          color: "#302923",
          "font-family": "Inter, sans-serif",
          "font-size": "16px",
          "font-weight": "860",
          "min-height": "54px",
          "text-align": "center",
          width: "48px",
        },
        quantityIncrement: {
          ...(options.product.styles?.quantityIncrement || {}),
          "background-color": "transparent",
          border: "0",
          color: "#302923",
          "font-family": "Inter, sans-serif",
          "font-size": "24px",
          "font-weight": "760",
          "min-height": "54px",
          width: "42px",
        },
        quantityDecrement: {
          ...(options.product.styles?.quantityDecrement || {}),
          "background-color": "transparent",
          border: "0",
          color: "#302923",
          "font-family": "Inter, sans-serif",
          "font-size": "24px",
          "font-weight": "760",
          "min-height": "54px",
          width: "42px",
        },
      };
      options.option = {
        ...(options.option || {}),
        styles: {
          ...(options.option?.styles || {}),
          label: {
            ...(options.option?.styles?.label || {}),
            display: "none",
          },
          select: {
            ...(options.option?.styles?.select || {}),
            "background-color": "rgba(255, 255, 255, 0.86)",
            border: "1px solid rgba(48, 41, 35, 0.16)",
            "border-radius": "4px",
            color: "#302923",
            "font-family": "Inter, sans-serif",
            "font-size": "16px",
            "min-height": "48px",
            padding: "0 14px",
            width: "100%",
          },
        },
      };
      options.product.events = {
        ...(options.product.events || {}),
        afterInit: (component) => registerShopifyProductComponent(node, component),
        afterRender: (component) => registerShopifyProductComponent(node, component),
      };
    }

    return options;
  };

  const initShopifyProducts = () => {
    const productNodes = document.querySelectorAll("[data-shopify-product-id]");
    if (!productNodes.length) return;

    getShopifyUi()
      .then((ui) => {
        productNodes.forEach((node) => {
          if (!(node instanceof HTMLElement) || node.dataset.shopifyInitialized === "true") return;

          node.dataset.shopifyInitialized = "true";
          node.innerHTML = "";

          ui.createComponent("product", {
            id: node.dataset.shopifyProductId,
            node,
            moneyFormat: shopifyConfig.moneyFormat,
            options: getShopifyOptionsForNode(node),
          });

          const productPage = node.closest("[data-shop-product]");
          const product = productPage
            ? products.find((entry) => entry.slug === productPage.getAttribute("data-shop-product"))
            : null;
          if (productPage instanceof HTMLElement && product) bindShopifyDropdownThemeSync(productPage, product);
        });
      })
      .catch(() => {
        productNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            node.closest(".product-shopify-panel")?.classList.add("is-shopify-error");
            node.textContent = "Product checkout is loading slowly. Refresh the page or contact Corecut Cabinets.";
          }
        });
      });
  };

  const renderGalleryFrame = (image, product) => {
    const frame = createElement("div", "product-gallery-frame");

    if (image?.src) {
      const img = createElement("img");
      img.src = image.src;
      img.alt = image.alt || product.imageAlt || getProductName(product);
      img.loading = "eager";
      img.decoding = "async";
      frame.append(img);
    } else {
      frame.append(renderCabinetFallback(image?.label || "Ready-to-Assemble Cabinet"));
    }

    return frame;
  };

  const createLightbox = (images, product, startIndex) => {
    let activeIndex = startIndex;
    const lightbox = createElement("div", "product-lightbox");
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", `${getProductName(product)} image viewer`);

    const closeButton = createElement("button", "product-lightbox-close", "Close");
    closeButton.type = "button";

    const prevButton = createElement("button", "product-lightbox-nav product-lightbox-prev", "Previous");
    prevButton.type = "button";

    const nextButton = createElement("button", "product-lightbox-nav product-lightbox-next", "Next");
    nextButton.type = "button";

    const media = createElement("div", "product-lightbox-media");
    const caption = createElement("p", "product-lightbox-caption");

    const render = () => {
      media.innerHTML = "";
      media.append(renderGalleryFrame(images[activeIndex], product));
      caption.textContent = images[activeIndex]?.label || getProductName(product);
    };

    const move = (direction) => {
      activeIndex = (activeIndex + direction + images.length) % images.length;
      render();
    };

    const close = () => {
      document.body.classList.remove("lightbox-open");
      lightbox.remove();
      document.removeEventListener("keydown", handleKeydown);
    };

    function handleKeydown(event) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    }

    closeButton.addEventListener("click", close);
    prevButton.addEventListener("click", () => move(-1));
    nextButton.addEventListener("click", () => move(1));
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) close();
    });

    lightbox.append(closeButton, prevButton, media, nextButton, caption);
    document.body.append(lightbox);
    document.body.classList.add("lightbox-open");
    document.addEventListener("keydown", handleKeydown);
    render();
    closeButton.focus({ preventScroll: true });
  };

  const renderProductGallery = (container, product) => {
    if (!container) return;

    const images = product.images?.length
      ? product.images
      : [{ label: "Product View", alt: product.imageAlt || getProductName(product), src: "" }];
    const hasUploadedImages = images.some((image) => image.src);
    let activeIndex = 0;
    container.innerHTML = "";

    const gallery = createElement("div", "product-gallery");
    const stage = createElement("div", "product-gallery-stage");
    const mainButton = createElement("button", "product-gallery-main");
    mainButton.type = "button";

    const prevButton = createElement("button", "product-gallery-arrow product-gallery-prev", "Previous image");
    prevButton.type = "button";

    const nextButton = createElement("button", "product-gallery-arrow product-gallery-next", "Next image");
    nextButton.type = "button";

    const thumbs = createElement("div", "product-gallery-thumbs");
    thumbs.setAttribute("role", "tablist");
    thumbs.setAttribute("aria-label", "Product image thumbnails");

    const renderActive = () => {
      const image = images[activeIndex];
      mainButton.innerHTML = "";
      mainButton.setAttribute("aria-label", `Open ${image?.label || getProductName(product)} image`);
      mainButton.append(renderGalleryFrame(image, product));

      thumbs.querySelectorAll("button").forEach((button, index) => {
        button.classList.toggle("is-active", index === activeIndex);
        button.setAttribute("aria-selected", String(index === activeIndex));
      });
    };

    const setActive = (index) => {
      activeIndex = (index + images.length) % images.length;
      renderActive();
    };

    images.forEach((image, index) => {
      const thumb = createElement("button", "product-gallery-thumb");
      thumb.type = "button";
      thumb.setAttribute("role", "tab");
      thumb.setAttribute("aria-label", image.label || `Image ${index + 1}`);
      thumb.append(renderGalleryFrame(image, product));
      thumb.addEventListener("click", () => setActive(index));
      thumbs.append(thumb);
    });

    prevButton.addEventListener("click", () => setActive(activeIndex - 1));
    nextButton.addEventListener("click", () => setActive(activeIndex + 1));
    mainButton.addEventListener("click", () => createLightbox(images, product, activeIndex));

    const productPage = container.closest("[data-shop-product]");
    productPage?.addEventListener("corecut:productColorChange", (event) => {
      const detail = event.detail || {};
      if (detail.productSlug !== product.slug || !Number.isInteger(detail.index)) return;
      if (images[detail.index]?.src) setActive(detail.index);
    });

    if (images.length > 1) {
      stage.append(prevButton, mainButton, nextButton);
      gallery.append(stage, thumbs);
    } else {
      stage.append(mainButton);
      gallery.append(stage);
    }

    container.append(gallery);
    renderActive();

    if (!hasUploadedImages && product.shopifyProductId && container.dataset.shopifyHydrated !== "true") {
      container.dataset.shopifyHydrated = "true";
      hydrateShopifyProductImages(product).then((hydratedImages) => {
        if (hydratedImages.some((image) => image.src)) renderProductGallery(container, product);
      });
    }
  };

  const renderOptionSelector = (label, values, type = "button", onChange, onPreview, onPreviewEnd) => {
    if (!values?.length) return null;

    const groupModifier = ["color", "size"].includes(type) ? ` is-${type}-group` : "";
    const group = createElement("div", `product-option-group${groupModifier}`);
    group.append(createElement("span", "", label));

    const selectedLabel =
      type === "color" ? createElement("strong", "product-selected-option", values[0]?.shopifyValue || values[0]?.name || "Finish") : null;
    if (selectedLabel) selectedLabel.dataset.selectedColourLabel = "";
    if (selectedLabel) group.append(selectedLabel);

    const list = createElement("div", "product-option-list");
    values.forEach((value, index) => {
      const option = createElement("button", `product-option-button${index === 0 ? " is-active" : ""}`);
      option.type = "button";
      option.setAttribute("aria-pressed", String(index === 0));

      if (type === "color") {
        const optionName = value.name || "Finish";
        option.classList.add("is-swatch-option");
        option.style.setProperty("--swatch", value.value || "#c5a071");
        option.textContent = optionName;
        option.title = optionName;
        option.setAttribute("aria-label", optionName);
        option.dataset.colourOption = value.shopifyValue || optionName;

        const previewOption = () => {
          if (typeof onPreview === "function") onPreview(value, index);
        };
        const endPreview = () => {
          if (typeof onPreviewEnd === "function") onPreviewEnd();
        };

        option.addEventListener("pointerenter", previewOption);
        option.addEventListener("focus", previewOption);
        option.addEventListener("pointerleave", endPreview);
        option.addEventListener("blur", endPreview);
      } else {
        option.textContent = value;
      }

      option.addEventListener("click", () => {
        if (type === "color" && SHOPIFY_COLOUR_DEBUG) {
          console.log("[Corecut Shopify colour] swatch clicked:", option.dataset.colourOption || value.name || value);
        }

        list.querySelectorAll(".product-option-button").forEach((button) => {
          button.classList.remove("is-active");
          button.setAttribute("aria-pressed", "false");
        });
        option.classList.add("is-active");
        option.setAttribute("aria-pressed", "true");
        if (selectedLabel && type === "color") selectedLabel.textContent = value.shopifyValue || value.name || "Finish";
        if (typeof onChange === "function") onChange(value, index);
      });

      list.append(option);
    });

    group.append(list);
    return group;
  };

  const renderProductOrderCard = (product, purchase) => {
    const card = createElement("div", "product-order-card");
    const price = product.startingPrice || product.price;

    card.append(createElement("p", "product-order-origin", "Pickup and Free Delivery in Edmonton, AB"));

    card.append(createElement("p", "product-order-note", "Assembly and installation can be coordinated with Corecut."));
    if (price) card.append(createElement("strong", "product-order-price", price));
    if (product.shopifyProductId) {
      const actionRow = createElement("div", "product-purchase-actions");
      actionRow.append(purchase);
      card.append(actionRow);
    }

    return card;
  };

  const renderProductInfoCard = (container, product, category, subcategory, priceRange) => {
    if (!container) return;

    container.innerHTML = "";

    const card = createElement("aside", "product-info-card");
    card.append(createElement("span", "status-pill", getProductBadge(product)));

    const title = createElement("h1", "", getProductName(product));
    const meta = createElement(
      "p",
      "product-info-meta",
      `${category?.name || "Ready-to-Assemble Cabinets"}${subcategory?.name ? ` / ${subcategory.name}` : ""}`,
    );
    const productPage = container.closest("[data-shop-product]");
    let selectedColorOption = product.colorOptions?.[0] || null;
    let selectedColorIndex = 0;
    if (productPage instanceof HTMLElement && selectedColorOption) {
      selectedProductColorOptions.set(productPage, selectedColorOption);
    }
    const applySelectedProductTheme = () => {
      if (selectedColorOption) applyProductTheme(productPage, selectedColorOption, selectedColorIndex, product);
    };
    const sizeOptions = renderOptionSelector("Size", product.sizeOptions || [], "size");
    const purchase = createElement("div", "product-shopify-panel");
    const shopifyNode = createElement("div", "shopify-buy-wrapper product-detail-buy");
    shopifyNode.id = `product-component-${product.shopifyComponentId || product.slug}`;
    shopifyNode.dataset.productShopify = "";
    shopifyNode.dataset.shopifyProductId = product.shopifyProductId || "";
    shopifyNode.dataset.shopifyLayout = "purchase";
    purchase.append(shopifyNode);

    card.append(title, meta);
    if (sizeOptions) card.append(sizeOptions);
    card.append(renderProductOrderCard(product, purchase));
    container.append(card);
    applySelectedProductTheme();
    bindShopifyDropdownThemeSync(productPage, product);
  };

  const renderMeasurementGrid = (product) => {
    const wrapper = createElement("div", "product-measurement-grid");
    const measurements =
      product.measurements ||
      Object.entries(product.specs || {}).map(([label, value]) => ({
        label,
        value,
      }));

    measurements.forEach((measurement) => {
      const card = createElement("div", "product-measurement-card");
      card.append(createElement("span", "", measurement.label));
      card.append(createElement("strong", "", measurement.value));
      wrapper.append(card);
    });

    return wrapper;
  };

  const renderProductAccordions = (container, product) => {
    if (!container) return;

    const sections = [
      {
        title: "Description",
        body: product.description || fallbackCopy.description,
      },
      {
        title: "Dimensions",
        body: product.dimensions || fallbackCopy.dimensions,
        measurements: true,
      },
      {
        title: "What's Included",
        body: product.whatIsIncluded || fallbackCopy.whatIsIncluded,
      },
      {
        title: "Assembly & Installation",
        body: product.assemblyInfo || fallbackCopy.assemblyInfo,
      },
    ];

    container.innerHTML = "";

    sections.forEach((section) => {
      const disclosure = createElement("details", "product-info-panel product-disclosure");
      const summary = createElement("summary", "product-disclosure-toggle", section.title);
      const body = createElement("div", "product-disclosure-body");

      if (section.measurements) body.append(renderMeasurementGrid(product));
      body.append(createElement("p", "", section.body));
      if (section.measurements && product.measurementNote) {
        body.append(createElement("p", "product-measurement-note", product.measurementNote));
      }

      disclosure.append(summary, body);
      container.append(disclosure);
    });
  };

  const renderRelatedProducts = (container, product) => {
    if (!container) return;

    const relatedItems = (product.relatedProducts || []).map((related, index) => {
      const relatedProduct = related.slug ? products.find((item) => item.slug === related.slug) : null;

      if (relatedProduct) {
        const category = getCategory(relatedProduct.categorySlug);
        const subcategory = getSubcategory(relatedProduct, category);
        const priceRangeId = relatedProduct.priceRange || subcategory?.priceRange || "250-500";
        return {
          type: "product",
          category,
          subcategory,
          product: relatedProduct,
          id: relatedProduct.slug,
          title: getProductName(relatedProduct),
          description: relatedProduct.shortDescription || relatedProduct.description,
          priceRangeId,
          priceRange: priceRangeMap.get(priceRangeId),
        };
      }

      const category = getCategory(related.categorySlug);
      const priceRangeId = related.priceRange || "under-250";
      return {
        type: "related",
        category,
        id: `${product.slug}-related-${index}`,
        title: related.title,
        description: related.description,
        priceRangeId,
        priceRange: priceRangeMap.get(priceRangeId),
        linkUrl: category ? categoryPath(category) : "/shop",
      };
    });

    container.innerHTML = "";

    relatedItems.forEach((item, index) => {
      container.append(renderProductCard(item, index, "related"));
    });
  };

  const renderMobileStickyCart = (container, product) => {
    if (!container || !product.shopifyProductId) return;

    container.innerHTML = "";
    const bar = createElement("div", "mobile-sticky-cart");

    const button = createElement("button", "button primary", "Add to cart");
    button.type = "button";
    button.addEventListener("click", () => {
      const productPage = document.querySelector("[data-shop-product]");
      const purchasePanel = productPage?.querySelector(".product-shopify-panel");
      purchasePanel?.scrollIntoView({ behavior: "smooth", block: "center" });
      purchasePanel?.querySelector("button, iframe")?.focus?.({ preventScroll: true });
    });

    bar.append(button);
    container.append(bar);
    document.body.classList.add("has-mobile-sticky-cart");
  };

  renderCategoryCards();

  const renderAvailableProducts = () => {
    document.querySelectorAll("[data-shop-available]").forEach((grid) => {
      grid.innerHTML = "";
      const productItems = getShopItems().filter((item) => item.type === "product");

      productItems.forEach((item, index) => {
        grid.append(renderProductCard(item, index));

        if (item.product?.shopifyProductId && !getFirstProductImage(item.product)) {
          hydrateShopifyProductImages(item.product).then(() => syncHydratedProductVisuals(item.product));
        }
      });

      const section = grid.closest("[data-shop-available-section]");
      if (section) section.hidden = productItems.length === 0;

      document.querySelectorAll("[data-shop-count]").forEach((counter) => {
        counter.textContent =
          productItems.length === 1
            ? "1 Product Available · More Coming Soon"
            : `${productItems.length} Products Available · More Coming Soon`;
      });
    });
  };

  renderAvailableProducts();

  document.querySelectorAll("[data-shop-browser]").forEach((browser) => {
    const categoryPage = browser.closest("[data-shop-category]");
    const scopedSlug = categoryPage?.getAttribute("data-shop-category") || "";
    const scopedCategory = scopedSlug ? getCategory(scopedSlug) : null;
    const scopeCategories = scopedCategory ? [scopedCategory] : categories;
    const allItems = getShopItems(scopeCategories);
    const state = {
      categories: new Set(),
      subcategories: new Set(),
      prices: new Set(),
      sort: "default",
      search: "",
    };

    const categoryGroup = browser.querySelector("[data-shop-category-options]");
    const categoryWrap = browser.querySelector("[data-shop-category-filter]");
    const subcategoryGroup = browser.querySelector("[data-shop-subcategory-options]");
    const priceGroup = browser.querySelector("[data-shop-price-options]");
    const toolbar = browser.querySelector(".shop-results-toolbar");
    const sortSelect = browser.querySelector("[data-shop-sort]");
    const results = browser.querySelector("[data-shop-results]");
    const resultCount = browser.querySelector("[data-shop-result-count]");
    const clearButton = browser.querySelector("[data-shop-clear-filters]");
    const emptyState = browser.querySelector("[data-shop-no-results]");
    let renderCategoryChips = () => {};

    if (categoryWrap) categoryWrap.hidden = Boolean(scopedCategory);
    if (sortSelect instanceof HTMLSelectElement) state.sort = sortSelect.value;

    const getActiveCategories = () => {
      if (scopedCategory) return new Set([scopedCategory.slug]);
      return state.categories.size ? state.categories : new Set(categories.map((category) => category.slug));
    };

    const getVisibleSubcategoryOptions = () => {
      const activeCategories = getActiveCategories();

      return scopeCategories
        .filter((category) => activeCategories.has(category.slug))
        .flatMap((category) =>
          category.subcategories.map((subcategory) => ({
            value: getSubcategoryFilterId(category, subcategory),
            label: subcategory.name,
          })),
        );
    };

    const syncSubcategoryState = () => {
      const visibleValues = new Set(getVisibleSubcategoryOptions().map((option) => option.value));
      state.subcategories.forEach((value) => {
        if (!visibleValues.has(value)) state.subcategories.delete(value);
      });
    };

    const renderFilters = () => {
      if (!scopedCategory) {
        renderFilterOptions(
          categoryGroup,
          categories.map((category) => ({
            value: category.slug,
            label: category.name,
          })),
          state.categories,
          "category",
        );
      }

      renderFilterOptions(subcategoryGroup, getVisibleSubcategoryOptions(), state.subcategories, "subcategory");
      renderFilterOptions(
        priceGroup,
        priceRanges.map((priceRange) => ({
          value: priceRange.id,
          label: priceRange.label,
        })),
        state.prices,
        "price",
      );
      renderCategoryChips();
    };

    const itemMatchesSearch = (item) => {
      if (!state.search) return true;
      const haystack = [item.title, item.description, item.category?.name, item.subcategory?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(state.search);
    };

    const getFilteredItems = () =>
      allItems.filter((item) => {
        const categoryMatch = scopedCategory || !state.categories.size || state.categories.has(item.category.slug);
        const subcategoryMatch = !state.subcategories.size || state.subcategories.has(item.subcategoryFilterId);
        const priceMatch = !state.prices.size || state.prices.has(item.priceRangeId);

        return categoryMatch && subcategoryMatch && priceMatch && itemMatchesSearch(item);
      });

    const getSortedItems = () => {
      const filteredItems = getFilteredItems();
      if (state.sort === "default") return filteredItems;

      return [...filteredItems].sort((a, b) => {
        const aRank = priceRangeRankMap.get(a.priceRangeId) ?? 0;
        const bRank = priceRangeRankMap.get(b.priceRangeId) ?? 0;
        return state.sort === "price-desc" ? bRank - aRank : aRank - bRank;
      });
    };

    const renderResults = () => {
      if (!results) return;

      const filteredItems = getSortedItems();
      results.innerHTML = "";

      filteredItems.forEach((item, index) => {
        results.append(renderProductCard(item, index));
      });

      if (resultCount) {
        const label = filteredItems.length === 1 ? "ready-to-assemble cabinet item" : "ready-to-assemble cabinet items";
        resultCount.textContent = `${filteredItems.length} ${label}`;
      }

      setEmptyState(emptyState, filteredItems.length === 0);

      filteredItems.forEach((item) => {
        if (item.product?.shopifyProductId && !getFirstProductImage(item.product)) {
          hydrateShopifyProductImages(item.product).then(() => syncHydratedProductVisuals(item.product));
        }
      });
    };

    const updateBrowser = () => {
      syncSubcategoryState();
      renderFilters();
      renderResults();
    };

    ({ renderCategoryChips } = ensureCatalogControls(
      browser,
      scopeCategories,
      scopedCategory,
      state,
      updateBrowser,
      renderResults,
    ));
    initMobileFilterDisclosure(browser, toolbar, sortSelect?.closest(".shop-sort-control"));

    browser.addEventListener("change", (event) => {
      const input = event.target;
      if (input instanceof HTMLSelectElement && input === sortSelect) {
        state.sort = input.value;
        renderResults();
        return;
      }

      if (!(input instanceof HTMLInputElement)) return;

      const targetSet =
        input.name === "category" ? state.categories : input.name === "subcategory" ? state.subcategories : state.prices;

      if (input.checked) {
        targetSet.add(input.value);
      } else {
        targetSet.delete(input.value);
      }

      updateBrowser();
    });

    clearButton?.addEventListener("click", () => {
      state.categories.clear();
      state.subcategories.clear();
      state.prices.clear();
      state.search = "";
      const searchInput = browser.querySelector("[data-shop-search]");
      if (searchInput instanceof HTMLInputElement) searchInput.value = "";
      updateBrowser();
    });

    updateBrowser();
  });

  const productPage = document.querySelector("[data-shop-product]");
  if (productPage) {
    const productSlug = productPage.getAttribute("data-shop-product");
    const product = products.find((item) => item.slug === productSlug);
    const category = product ? getCategory(product.categorySlug) : null;
    const subcategory = getSubcategory(product, category);
    const priceRange = product ? priceRangeMap.get(product.priceRange) : null;

    if (!product || !category) {
      productPage.innerHTML = `
        <section class="section">
          <div class="container section-heading">
            <p class="eyebrow">Shop Ready-to-Assemble Cabinets</p>
            <h1>Product not found</h1>
            <p class="hero-text">Return to the Shop page to browse ready-to-assemble cabinet products.</p>
            <a class="button primary" href="/shop">Shop Ready-to-Assemble Cabinets</a>
          </div>
        </section>
      `;
      return;
    }

    document.title = `${getProductName(product)} | Corecut Cabinets`;
    updateMetaDescription(`${product.shortDescription || product.description} Shop ready-to-assemble cabinets from Corecut Cabinets.`);
    applyProductTheme(productPage, product.colorOptions?.[0], 0, product);

    renderProductGallery(productPage.querySelector("[data-product-gallery]"), product);
    renderProductInfoCard(productPage.querySelector("[data-product-info-card]"), product, category, subcategory, priceRange);
    renderProductAccordions(productPage.querySelector("[data-product-accordions]"), product);
    renderRelatedProducts(productPage.querySelector("[data-related-products]"), product);
    renderMobileStickyCart(productPage.querySelector("[data-mobile-sticky-cart]"), product);

    productPage.querySelectorAll("[data-product-category-link]").forEach((element) => {
      if (element instanceof HTMLAnchorElement) element.href = "/shop";
    });

    initShopifyProducts();
    bindShopifyDropdownThemeSync(productPage, product);
    return;
  }

  const categoryPage = document.querySelector("[data-shop-category]");
  if (!categoryPage) return;

  const categorySlug = categoryPage.getAttribute("data-shop-category");
  const category = getCategory(categorySlug);

  if (!category) {
    categoryPage.innerHTML = `
      <section class="section">
        <div class="container section-heading">
          <p class="eyebrow">Shop Ready-to-Assemble Cabinets</p>
          <h1>Category not found</h1>
          <p class="hero-text">Return to the main Shop page to browse ready-to-assemble cabinet categories.</p>
          <a class="button primary" href="/shop">Shop Ready-to-Assemble Cabinets</a>
        </div>
      </section>
    `;
    return;
  }

  document.title = `${category.name} Ready-to-Assemble Cabinets | Corecut Cabinets`;
  updateMetaDescription(`${category.description} Products coming soon from Corecut Cabinets.`);

  categoryPage.querySelectorAll("[data-shop-category-name]").forEach((element) => {
    element.textContent = category.name;
  });

  categoryPage.querySelectorAll("[data-shop-category-description]").forEach((element) => {
    element.textContent = category.description;
  });
})();

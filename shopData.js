window.CorecutShopData = {
  placeholderProductMessage: "Products coming soon. Contact Corecut Cabinets for availability and pricing.",
  fallbackProductCopy: {
    description:
      "This ready-to-assemble cabinet product is designed for affordable kitchen, storage, rental, basement suite, and DIY renovation projects.",
    dimensions: "Final dimensions can be adjusted once exact supplier specifications are confirmed.",
    whatIsIncluded:
      "Product components, cabinet hardware where applicable, and assembly parts. Exact included parts may vary by product line.",
    assemblyInfo:
      "This product may ship unassembled. Customers can assemble it themselves, or contact Corecut Cabinets for assembly and installation options.",
    pickupDeliveryInfo:
      "Local pickup and delivery options are available in the Edmonton area. Contact us for availability and timing.",
    returnInfo:
      "Returns are accepted within 14 days for unused and undamaged products. Damaged or installed products are not eligible for return.",
  },
  priceRanges: [
    { id: "under-250", label: "Under $250" },
    { id: "250-500", label: "$250 – $500" },
    { id: "500-1000", label: "$500 – $1,000" },
    { id: "1000-plus", label: "$1,000+" },
  ],
  shopify: {
    scriptUrl: "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js",
    domain: "73g1xb-ma.myshopify.com",
    storefrontAccessToken: "33d82587af51e3e8463d7ebb8fd22826",
    moneyFormat: "%24%7B%7Bamount%7D%7D",
    options: {
      product: {
        contents: {
          img: true,
          title: false,
          price: false,
          quantity: true,
        },
        styles: {
          product: {
            "@media (min-width: 601px)": {
              "max-width": "100%",
              "margin-left": "0",
              "margin-bottom": "0",
            },
          },
          img: {
            "display": "block",
            "height": "auto",
            "max-height": "240px",
            "max-width": "100%",
            "object-fit": "contain",
            "margin": "0 auto",
          },
          imgWrapper: {
            "display": "inline-flex",
            "align-items": "center",
            "justify-content": "center",
            "border": "1px solid rgba(75, 46, 25, 0.12)",
            "border-radius": "8px",
            "background-color": "#fbfaf7",
            "box-shadow": "0 14px 26px rgba(75, 46, 25, 0.08)",
            "margin-bottom": "16px",
            "padding": "8px",
            "width": "fit-content",
            "max-width": "100%",
          },
          button: {
            "background-color": "#4b2e19",
            "background-image": "linear-gradient(135deg, #4b2e19, #6f421b)",
            "border-radius": "999px",
            "box-shadow": "0 14px 26px rgba(75, 46, 25, 0.18)",
            "color": "#fbfaf7",
            "font-family": "Inter, sans-serif",
            "font-size": "14px",
            "font-weight": "800",
            "letter-spacing": "0.02em",
            "min-height": "48px",
            "padding-top": "13px",
            "padding-bottom": "13px",
            "transition": "all 180ms ease",
            "width": "100%",
            ":hover": {
              "background-color": "#6b3f20",
              "background-image": "linear-gradient(135deg, #5a351d, #8a5a2c)",
              "box-shadow": "0 18px 34px rgba(75, 46, 25, 0.22)",
            },
            ":focus": {
              "background-color": "#6b3f20",
              "background-image": "linear-gradient(135deg, #5a351d, #8a5a2c)",
              "box-shadow": "0 18px 34px rgba(75, 46, 25, 0.22)",
            },
          },
          quantityInput: {
            "border-color": "rgba(75, 46, 25, 0.18)",
            "border-radius": "10px",
            "color": "#302923",
            "font-family": "Inter, sans-serif",
            "font-size": "14px",
            "font-weight": "800",
            "min-height": "42px",
          },
          quantityIncrement: {
            "border-color": "rgba(75, 46, 25, 0.18)",
            "color": "#4b2e19",
            "font-family": "Inter, sans-serif",
          },
          quantityDecrement: {
            "border-color": "rgba(75, 46, 25, 0.18)",
            "color": "#4b2e19",
            "font-family": "Inter, sans-serif",
          },
        },
        text: {
          button: "Add to cart",
        },
      },
      productSet: {
        styles: {
          products: {
            "@media (min-width: 601px)": {
              "margin-left": "0",
            },
          },
        },
      },
      modalProduct: {
        contents: {
          img: false,
          imgWithCarousel: true,
          button: false,
          buttonWithQuantity: true,
        },
        styles: {
          product: {
            "@media (min-width: 601px)": {
              "max-width": "100%",
              "margin-left": "0px",
              "margin-bottom": "0px",
            },
          },
          button: {
            "background-color": "#4b2e19",
            "background-image": "linear-gradient(135deg, #4b2e19, #6f421b)",
            "border-radius": "999px",
            "color": "#fbfaf7",
            "font-family": "Inter, sans-serif",
            "font-size": "14px",
            "font-weight": "800",
            "min-height": "48px",
            "transition": "all 180ms ease",
            ":hover": {
              "background-color": "#6b3f20",
              "background-image": "linear-gradient(135deg, #5a351d, #8a5a2c)",
            },
            ":focus": {
              "background-color": "#6b3f20",
              "background-image": "linear-gradient(135deg, #5a351d, #8a5a2c)",
            },
          },
        },
        text: {
          button: "Add to cart",
        },
      },
      option: {},
      cart: {
        styles: {
          button: {
            "background-color": "#4b2e19",
            "background-image": "linear-gradient(135deg, #4b2e19, #6f421b)",
            "border-radius": "999px",
            "box-shadow": "0 14px 26px rgba(75, 46, 25, 0.18)",
            "color": "#fbfaf7",
            "font-family": "Inter, sans-serif",
            "font-size": "14px",
            "font-weight": "800",
            "letter-spacing": "0.02em",
            "min-height": "48px",
            "transition": "all 180ms ease",
            ":hover": {
              "background-color": "#6b3f20",
              "background-image": "linear-gradient(135deg, #5a351d, #8a5a2c)",
              "box-shadow": "0 18px 34px rgba(75, 46, 25, 0.22)",
            },
            ":focus": {
              "background-color": "#6b3f20",
              "background-image": "linear-gradient(135deg, #5a351d, #8a5a2c)",
              "box-shadow": "0 18px 34px rgba(75, 46, 25, 0.22)",
            },
          },
          title: {
            color: "#302923",
            "font-family": "Inter, sans-serif",
            "font-size": "17px",
            "font-weight": "800",
          },
          header: {
            "background-color": "#fbfaf7",
            "border-bottom": "1px solid rgba(75, 46, 25, 0.12)",
          },
          footer: {
            "background-color": "#fbfaf7",
            "border-top": "1px solid rgba(75, 46, 25, 0.12)",
          },
          cart: {
            "background-color": "#fbfaf7",
            "font-family": "Inter, sans-serif",
            color: "#302923",
          },
          lineItems: {
            "border-color": "rgba(75, 46, 25, 0.12)",
          },
          lineItem: {
            "font-family": "Inter, sans-serif",
            color: "#302923",
          },
          itemTitle: {
            "font-family": "Inter, sans-serif",
            "font-size": "14px",
            "font-weight": "800",
            color: "#302923",
          },
          price: {
            "font-family": "Inter, sans-serif",
            "font-size": "14px",
            "font-weight": "800",
            color: "#4b2e19",
          },
          quantityInput: {
            "border-color": "rgba(75, 46, 25, 0.2)",
            "border-radius": "8px",
            "color": "#302923",
            "font-family": "Inter, sans-serif",
          },
          quantityButton: {
            "border-color": "rgba(75, 46, 25, 0.2)",
            color: "#4b2e19",
            "font-family": "Inter, sans-serif",
          },
          subtotalText: {
            "font-family": "Inter, sans-serif",
            "font-size": "13px",
            "font-weight": "800",
            color: "#6f421b",
          },
          subtotal: {
            "font-family": "Inter, sans-serif",
            "font-size": "16px",
            "font-weight": "900",
            color: "#302923",
          },
          notice: {
            "font-family": "Inter, sans-serif",
            color: "rgba(48, 41, 35, 0.66)",
          },
        },
        text: {
          total: "Subtotal",
          button: "Checkout",
        },
      },
      toggle: {
        styles: {
          toggle: {
            "background-color": "#4b2e19",
            "background-image": "linear-gradient(135deg, #4b2e19, #6f421b)",
            "border-radius": "18px",
            "box-shadow": "0 18px 36px rgba(75, 46, 25, 0.22)",
            "transition": "all 180ms ease",
            ":hover": {
              "background-color": "#6b3f20",
              "background-image": "linear-gradient(135deg, #5a351d, #8a5a2c)",
              "box-shadow": "0 22px 44px rgba(75, 46, 25, 0.26)",
            },
            ":focus": {
              "background-color": "#6b3f20",
              "background-image": "linear-gradient(135deg, #5a351d, #8a5a2c)",
              "box-shadow": "0 22px 44px rgba(75, 46, 25, 0.26)",
            },
          },
          count: {
            "font-family": "Inter, sans-serif",
            "font-weight": "800",
          },
          iconPath: {
            fill: "#fbfaf7",
          },
        },
      },
    },
  },
  products: [
    {
      id: "shaker-base-cabinet-18-inch-unassembled",
      name: "Shaker Base Cabinet - 18 Inch Unassembled",
      productName: "Shaker Base Cabinet - 18 Inch Unassembled",
      slug: "shaker-base-cabinet-18-inch-unassembled",
      categorySlug: "base-cabinets",
      subcategoryName: "Standard Base Cabinets",
      badge: "Ready-to-Assemble",
      price: "CA$149.99",
      startingPrice: "CA$149.99",
      shortDescription:
        "An 18 inch flat-pack shaker base cabinet for lower kitchen storage, rental upgrades, basement suites, and DIY renovation layouts.",
      description:
        "Unassembled ready-to-assemble 18 inch shaker base cabinet for lower kitchen storage, DIY projects, and renovation layouts.",
      images: [
        {
          label: "Front View",
          alt: "Shaker Base Cabinet - 18 Inch Unassembled front view",
          src: "",
        },
      ],
      imageAlt: "Shaker Base Cabinet - 18 Inch Unassembled from Corecut Cabinets",
      colorOptions: [
        {
          name: "White Shaker",
          shopifyValue: "White",
          value: "#ffffff",
          surface: "#ffffff",
          theme: "#ffffff",
          accent: "#302923",
          contrast: "#fbfaf7",
          button: "#ffffff",
          buttonContrast: "#302923",
        },
        {
          name: "Warm Wood",
          shopifyValue: "Warm Wood",
          value: "#c5a071",
          surface: "#c5a071",
          theme: "#ead6b8",
          accent: "#8a5a2c",
          contrast: "#fffaf0",
          button: "#c5a071",
          buttonContrast: "#fffaf0",
        },
        {
          name: "Grey Shaker",
          shopifyValue: "Grey",
          value: "#8f8f89",
          surface: "#8f8f89",
          theme: "#e1e1dc",
          accent: "#5f625d",
          contrast: "#fbfaf7",
          button: "#8f8f89",
          buttonContrast: "#fbfaf7",
        },
      ],
      sizeOptions: ["18 inch"],
      specs: {
        Width: "18 in",
        Height: "34.5 in",
        Depth: "24 in",
        Assembly: "Unassembled / flat-pack",
      },
      details: [
        "Ready-to-assemble base cabinet supplied unassembled for DIY projects, contractors, and renovation work.",
        "Shaker-style cabinet section intended for lower cabinet runs, storage layouts, and standard base cabinet planning.",
        "Flat-pack format makes transportation easier and lets the customer, contractor, or installer assemble on their own timeline.",
      ],
      dimensions:
        "Width: 18 in. Height: 34.5 in. Depth: 24 in. Final sizing, finish, hardware, toe kick, panels, fillers, and layout compatibility should be confirmed before ordering.",
      whatIsIncluded:
        "Flat-pack cabinet components, cabinet box parts, door and drawer parts where applicable, and assembly hardware supplied with this product line.",
      assemblyInfo:
        "This cabinet is supplied unassembled for DIY assembly. Corecut Cabinets can also discuss assembly or installation options in the Edmonton area.",
      pickupDeliveryInfo:
        "Local Edmonton pickup is available, with delivery options available depending on timing, location, and order size.",
      returnInfo:
        "Returns are accepted within 14 days for unused and undamaged products. Damaged, assembled, installed, or modified products are not eligible for return.",
      measurements: [
        {
          label: "Width",
          value: "18 in",
        },
        {
          label: "Height",
          value: "34.5 in",
        },
        {
          label: "Depth",
          value: "24 in",
        },
        {
          label: "Assembly",
          value: "Unassembled / flat-pack",
        },
      ],
      measurementNote: "Confirm final size, finish, hardware, toe kick, panels, fillers, and layout compatibility before ordering.",
      priceRange: "under-250",
      shopifyProductId: "7727924904003",
      shopifyComponentId: "1782715037788",
      relatedProducts: [
        {
          title: "Fillers",
          categorySlug: "panels-fillers",
          description: "Finish small gaps beside walls, appliances, and cabinet runs.",
          priceRange: "under-250",
        },
        {
          title: "Toe Kicks",
          categorySlug: "panels-fillers",
          description: "Complete the lower cabinet base with ready-to-assemble toe kick parts.",
          priceRange: "under-250",
        },
        {
          title: "Handles & Pulls",
          categorySlug: "hardware",
          description: "Add cabinet hardware for doors and drawers once your ready-to-assemble cabinet is assembled.",
          priceRange: "under-250",
        },
      ],
    },
  ],
  categories: [
    {
      name: "Base Cabinets",
      slug: "base-cabinets",
      description:
        "Shop ready-to-assemble base cabinets designed for lower kitchen storage, countertops, sinks, drawers, and specialty layouts.",
      subcategories: [
        {
          name: "Standard Base Cabinets",
          description: "Ready-to-assemble base cabinet sections for everyday lower kitchen storage.",
          priceRange: "under-250",
        },
        {
          name: "Drawer Base Cabinets",
          description: "Flat-pack drawer base cabinet sections for practical storage and easy access.",
          priceRange: "500-1000",
        },
        {
          name: "Sink Base Cabinets",
          description: "Ready-to-assemble sink base cabinet sections prepared for kitchen and utility sink layouts.",
          priceRange: "250-500",
        },
        {
          name: "Corner Base Cabinets",
          description: "Ready-to-assemble corner base cabinets for making lower cabinet layouts work cleanly.",
          priceRange: "500-1000",
        },
        {
          name: "Blind Corner Base Cabinets",
          description: "Ready-to-assemble blind corner cabinet sections for tight kitchen corners and storage runs.",
          priceRange: "500-1000",
        },
        {
          name: "Base End Cabinets",
          description: "Flat-pack base end cabinets for finishing the end of a cabinet layout.",
          priceRange: "250-500",
        },
        {
          name: "Microwave Base Cabinets",
          description: "Ready-to-assemble microwave base cabinets for built-in appliance planning.",
          priceRange: "500-1000",
        },
        {
          name: "Pull-Out Base Cabinets",
          description: "Ready-to-assemble pull-out base cabinet sections for organized storage and narrow spaces.",
          priceRange: "500-1000",
        },
      ],
    },
    {
      name: "Wall Cabinets",
      slug: "wall-cabinets",
      description:
        "Shop ready-to-assemble wall cabinets designed for upper kitchen storage, fridge uppers, corners, range hoods, and display options.",
      subcategories: [
        {
          name: "Standard Wall Cabinets",
          description: "Ready-to-assemble upper cabinet sections for everyday kitchen and storage layouts.",
          priceRange: "250-500",
        },
        {
          name: "Short Wall Cabinets",
          description: "Ready-to-assemble short wall cabinets for above appliances, windows, and compact upper spaces.",
          priceRange: "under-250",
        },
        {
          name: "Tall Wall Cabinets",
          description: "Flat-pack tall wall cabinet sections for extended upper storage.",
          priceRange: "250-500",
        },
        {
          name: "Fridge Wall Cabinets",
          description: "Ready-to-assemble fridge upper cabinets for finished appliance zones.",
          priceRange: "500-1000",
        },
        {
          name: "Corner Wall Cabinets",
          description: "Ready-to-assemble corner wall cabinets for clean upper cabinet transitions.",
          priceRange: "250-500",
        },
        {
          name: "Glass Door Wall Cabinets",
          description: "Ready-to-assemble wall cabinets prepared for display-style glass door layouts.",
          priceRange: "500-1000",
        },
        {
          name: "Range Hood Cabinets",
          description: "Flat-pack range hood cabinet sections for kitchen ventilation zones.",
          priceRange: "500-1000",
        },
        {
          name: "Open Shelf Wall Cabinets",
          description: "Ready-to-assemble open shelf wall sections for display, storage, and feature layouts.",
          priceRange: "250-500",
        },
      ],
    },
    {
      name: "Tall Cabinets",
      slug: "tall-cabinets",
      description:
        "Shop ready-to-assemble tall cabinets for pantry storage, utility storage, oven cabinets, broom storage, and full-height cabinet layouts.",
      subcategories: [
        {
          name: "Pantry Cabinets",
          description: "Ready-to-assemble pantry cabinet sections for food storage and tall kitchen layouts.",
          priceRange: "1000-plus",
        },
        {
          name: "Utility Cabinets",
          description: "Ready-to-assemble utility cabinets for laundry rooms, garages, storage rooms, and service areas.",
          priceRange: "1000-plus",
        },
        {
          name: "Oven Cabinets",
          description: "Flat-pack oven cabinet sections for built-in appliance planning.",
          priceRange: "1000-plus",
        },
        {
          name: "Broom Cabinets",
          description: "Ready-to-assemble broom cabinets for cleaning supplies and household storage.",
          priceRange: "500-1000",
        },
        {
          name: "Linen Cabinets",
          description: "Ready-to-assemble linen cabinet sections for bathrooms, closets, and hallway storage.",
          priceRange: "500-1000",
        },
        {
          name: "Tall Storage Cabinets",
          description: "Ready-to-assemble full-height storage cabinets for flexible cabinet layouts.",
          priceRange: "1000-plus",
        },
      ],
    },
    {
      name: "Vanities",
      slug: "vanities",
      description:
        "Shop ready-to-assemble bathroom vanity cabinets for residential bathrooms, basement suites, renovations, and rental properties.",
      subcategories: [
        {
          name: "Single Sink Vanities",
          description: "Ready-to-assemble vanity cabinets for single sink bathroom layouts.",
          priceRange: "500-1000",
        },
        {
          name: "Drawer Vanities",
          description: "Ready-to-assemble drawer vanity sections for bathrooms that need organized storage.",
          priceRange: "500-1000",
        },
        {
          name: "Door Vanities",
          description: "Flat-pack door vanity cabinets for simple, practical bathroom storage.",
          priceRange: "250-500",
        },
        {
          name: "Floating Vanities",
          description: "Ready-to-assemble floating vanity sections for modern wall-mounted layouts.",
          priceRange: "500-1000",
        },
        {
          name: "Vanity Sink Bases",
          description: "Ready-to-assemble vanity sink base cabinets prepared for plumbing and countertop planning.",
          priceRange: "500-1000",
        },
        {
          name: "Vanity Tall Cabinets",
          description: "Ready-to-assemble tall vanity cabinets for bathroom linen and storage zones.",
          priceRange: "500-1000",
        },
        {
          name: "Vanity Fillers & Panels",
          description: "Flat-pack vanity fillers and panels for finishing bathroom cabinet layouts.",
          priceRange: "under-250",
        },
      ],
    },
    {
      name: "Panels & Fillers",
      slug: "panels-fillers",
      description:
        "Shop ready-to-assemble cabinet finishing parts including fillers, panels, toe kicks, trim, moulding, and layout finishing pieces.",
      subcategories: [
        {
          name: "Fillers",
          description: "Ready-to-assemble filler pieces for closing gaps and finishing cabinet runs.",
          priceRange: "under-250",
        },
        {
          name: "Toe Kicks",
          description: "Flat-pack toe kick parts for a cleaner base cabinet finish.",
          priceRange: "under-250",
        },
        {
          name: "End Panels",
          description: "Ready-to-assemble end panels for exposed cabinet sides and finished layouts.",
          priceRange: "250-500",
        },
        {
          name: "Fridge Panels",
          description: "Ready-to-assemble fridge panels for appliance surrounds and kitchen planning.",
          priceRange: "500-1000",
        },
        {
          name: "Dishwasher Panels",
          description: "Flat-pack dishwasher panels and finishing pieces for appliance zones.",
          priceRange: "under-250",
        },
        {
          name: "Decorative Panels",
          description: "Ready-to-assemble decorative cabinet panels for custom-looking details.",
          priceRange: "250-500",
        },
        {
          name: "Crown Moulding",
          description: "Ready-to-assemble crown moulding pieces for upper cabinet finishing.",
          priceRange: "under-250",
        },
        {
          name: "Light Rail",
          description: "Ready-to-assemble light rail pieces for under-cabinet finishing.",
          priceRange: "under-250",
        },
        {
          name: "Scribe Moulding",
          description: "Flat-pack scribe moulding for small wall gaps and clean cabinet edges.",
          priceRange: "under-250",
        },
      ],
    },
    {
      name: "Doors & Drawer Fronts",
      slug: "doors-drawer-fronts",
      description:
        "Shop cabinet doors and drawer fronts for ready-to-assemble cabinet projects, replacement projects, matching cabinet styles, and future cabinet upgrades.",
      subcategories: [
        {
          name: "Shaker Doors",
          description: "Ready-to-assemble cabinet door fronts with a clean shaker profile.",
          priceRange: "250-500",
        },
        {
          name: "Slab Doors",
          description: "Flat-pack slab door fronts for modern cabinet and renovation projects.",
          priceRange: "250-500",
        },
        {
          name: "Raised Panel Doors",
          description: "Ready-to-assemble raised panel doors for more traditional cabinet styling.",
          priceRange: "500-1000",
        },
        {
          name: "Glass Ready Doors",
          description: "Cabinet doors prepared for glass inserts and display cabinet layouts.",
          priceRange: "500-1000",
        },
        {
          name: "Drawer Fronts",
          description: "Ready-to-assemble drawer fronts for new cabinets or replacement projects.",
          priceRange: "under-250",
        },
        {
          name: "Replacement Doors",
          description: "Cabinet doors for updates, repairs, and future style changes.",
          priceRange: "250-500",
        },
        {
          name: "Sample Doors",
          description: "Sample cabinet doors for reviewing style and finish direction.",
          priceRange: "under-250",
        },
      ],
    },
    {
      name: "Hardware",
      slug: "hardware",
      description:
        "Shop cabinet hardware and accessories for ready-to-assemble cabinets, including handles, pulls, hinges, drawer slides, soft-close hardware, and storage add-ons.",
      subcategories: [
        {
          name: "Handles & Pulls",
          description: "Cabinet handles and pulls for ready-to-assemble cabinet doors and drawer fronts.",
          priceRange: "under-250",
        },
        {
          name: "Hinges",
          description: "Cabinet hinges for ready-to-assemble doors and functional cabinet layouts.",
          priceRange: "under-250",
        },
        {
          name: "Drawer Slides",
          description: "Drawer slides for ready-to-assemble drawer boxes, base cabinets, and vanity sections.",
          priceRange: "under-250",
        },
        {
          name: "Lazy Susan Hardware",
          description: "Corner cabinet hardware for ready-to-assemble cabinet storage solutions.",
          priceRange: "250-500",
        },
        {
          name: "Garbage Pull-Outs",
          description: "Pull-out waste hardware for base cabinet and kitchen storage layouts.",
          priceRange: "250-500",
        },
        {
          name: "Spice Pull-Outs",
          description: "Narrow pull-out hardware for spices, oils, and organized kitchen storage.",
          priceRange: "250-500",
        },
        {
          name: "Soft-Close Hardware",
          description: "Soft-close cabinet hardware for smoother door and drawer function.",
          priceRange: "under-250",
        },
        {
          name: "Cabinet Organizers",
          description: "Cabinet accessories and organizers for making ready-to-assemble cabinet spaces more useful.",
          priceRange: "250-500",
        },
      ],
    },
  ],
};

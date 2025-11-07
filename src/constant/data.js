export const menuItems = [
  // {
  //   isHeader: true,
  //   title: "menu",
  // },

  {
    title: "Dashboard",
    icon: "heroicons-outline:home",
    isOpen: true,
    isHide: true,
    link: "dashboard",
  },
  {
    title: "Outlet Dashboard",
    isHide: true,
    icon: "heroicons-outline:chart-bar-square",
    link: "outlet_dashboard",
    permissionKey: "Outlet Dashboard",
  },
  {
    title: "Orders",
    icon: "heroicons-outline:truck",
    link: "#",
    isHide: true,
    permissionKey: "Orders",
    child: [
      {
        childtitle: "Lists",
        childlink: "orders/order_lists",
        permissionKey: "Lists",
      },
      {
        childtitle: "Pending",
        childlink: "orders/order_pending",
        permissionKey: "Pending",
      },
      {
        childtitle: "Completed",
        childlink: "orders/order_confirmed",
        permissionKey: "Confirmed",
      },
    ],
  },
  {
    title: "Topup",
    icon: "heroicons-outline:credit-card",
    link: "#",
    isHide: true,
    permissionKey: "Topup",
    child: [
      {
        childtitle: "Lists",
        childlink: "topup/topup_lists",
        permissionKey: "Lists",
      },
      {
        childtitle: "Settings",
        childlink: "topup/topup_settings",
        permissionKey: "Settings",
      },
    ],
  },
  {
    title: "Outlets",
    icon: "heroicons-outline:building-storefront",
    link: "#",
    permissionKey: "Outlets",
    child: [
      {
        childtitle: "List",
        childlink: "outlets/list",
        permissionKey: "Lists",
      },
      {
        childtitle: "Outlets Menu",
        childlink: "outlets/menu", // or just "menu" depending on your routing structure
        permissionKey: "Outlets Menu",
      }
    ],
  },
  {
    title: "Menu",
    icon: "heroicons-outline:clipboard",
    link: "#",
    permissionKey: "Menu",
    child: [
      {
        childtitle: "Item",
        childlink: "menu/item",
        permissionKey: "Item",
      },
      {
        childtitle: "Category",
        childlink: "menu/category",
        permissionKey: "Category",
      },
    ],
  },
  {
    title: "Voucher",
    icon: "heroicons-outline:ticket",
    link: "#",
    permissionKey: "Voucher",
    child: [
      {
        childtitle: "List",
        childlink: "voucher/lists",
        permissionKey: "List",
      },
      {
        childtitle: "Send Voucher",
        childlink: "voucher/send_voucher",
        permissionKey: "Send Voucher",
      },
      {
        childtitle: "Schedule",
        childlink: "voucher/schedule",
        permissionKey: "Schedule",
      },
    ],
  },
  {
    title: "Promo",
    icon: "heroicons-outline:tag",
    link: "#",
    permissionKey: "Promo",
    child: [
      {
        childtitle: "Promo Settings Lists",
        childlink: "promo/promo_lists",
        permissionKey: "Promo Settings Lists",
      },
      {
        childtitle: "PWP",
        childlink: "promo/pwp",
        permissionKey: "PWP",
      },
      {
        childtitle: "Discount List",
        childlink: "promo/discount",
        permissionKey: "Discount List",
      },
      {
        childtitle: "Promo Code List",
        childlink: "promo/promo_code",
        permissionKey: "Promo Code List",
      },
    ],
  },
  {
    title: "Member",
    isHide: true,
    icon: "heroicons-outline:user",
    link: "member",
    permissionKey: "Member",
  },
  {
    title: "Student Card",
    isHide: true,
    icon: "heroicons-outline:academic-cap",
    link: "student-card",
    permissionKey: "Student Card",
  },
  {
    title: "Excel Report",
    icon: "heroicons:document-arrow-down",
    link: "csv-export",
    permissionKey: "Excel Report",
  },
  {
    title: "Report",
    isHide: true,
    icon: "heroicons-outline:document-text",
    link: "report",
    permissionKey: "Report",
    child: [
      {
          childtitle: "Sales Report",
          childlink: "report/sales",
          permissionKey: "Sales Report",
      },
      {
          childtitle: "Promo Report",
          childlink: "report/promo",
          permissionKey: "Promo Report",
      },
      {
        childtitle: "Product Report",
        childlink: "report/product",
        permissionKey: "Product Report",
      },
      {
        childtitle: "Order Report",
        childlink: "report/order",
        permissionKey: "Order Report",
      },
      {
        childtitle: "Wallet Report",
        childlink: "report/wallet",
        permissionKey: "Wallet Report",
      },
      {
        childtitle: "Point Report",
        childlink: "report/point",
        permissionKey: "Point Report",
      },
      {
        childtitle: "Unutilized Voucher Report",
        childlink: "report/unutilized_voucher",
        permissionKey: "Unutilized Voucher Report",
      }
    ]
  },
  {
    title: "Settings",
    isHide: true,
    icon: "heroicons-outline:cog-6-tooth",
    permissionKey: "Settings",
    child: [
      {
        childtitle: "User",
        childlink: "settings/user",
        permissionKey: "User",
      },
      {
        childtitle: "Tax",
        childlink: "settings/tax",
        permissionKey: "Tax",
      },
      {
        childtitle: "Membership Tier",
        childlink: "settings/membership_tier",
        permissionKey: "Membership Tier",
      },
      {
        childtitle: "Customer Types",
        childlink: "settings/customer_type",
        permissionKey: "Customer Types",
      },
      {
        childtitle: "Delivery",
        childlink: "settings/delivery_settings",
        permissionKey: "Delivery",
      },

      {
        childtitle: "Membership Settings",
        isHide: true,
        icon: "heroicons-outline:cog-6-tooth",
        permissionKey: "Membership Settings",
        child: [
          {
            childtitle: "First time Register",
            childlink: "settings/membership/first_time_register",
          },
          {
            childtitle: "First time Purchase Bonus",
            childlink: "settings/membership/first_time_purchase_bonus",
          },
          {
            childtitle: "Referral Bonus",
            childlink: "settings/membership/referral_bonus",
          },
          {
            childtitle: "Referral First Purchase",
            childlink: "settings/membership/referral_first_purchase",
          },
          {
            childtitle: "Extra Bonus",
            childlink: "settings/membership/extra_bonus",
          },
          {
            childtitle: "Birthday Bonus",
            childlink: "settings/membership/birthday_bonus",
          },
        ]
      },
      {
        childtitle: "App Settings",
        isHide: true,
        icon: "heroicons-outline:cog-6-tooth",
        permissionKey: "App Settings",
        child: [
          {
            childtitle: "Slideshow",
            childlink: "settings/slideshow_settings",
          },
        ]
      }

    ],
  },
  // {
  //   title: "Report",
  //   isHide: true,
  //   icon: "heroicons-outline:clipboard-check",
  //   link: "report",
  // },
  {
    title: "Logout",
    isHide: true,
    icon: "heroicons-outline:arrow-right-on-rectangle",
    action: "logout",
  },
];

export const topMenu = [
  {
    title: "Dashboard",
    icon: "heroicons-outline:home",
    link: "/app/home",
    child: [
      {
        childtitle: "Analytics Dashboard",
        childlink: "dashboard",
        childicon: "heroicons:presentation-chart-line",
      },
      {
        childtitle: "Ecommerce Dashboard",
        childlink: "ecommerce",
        childicon: "heroicons:shopping-cart",
      },
      {
        childtitle: "Project  Dashboard",
        childlink: "project",
        childicon: "heroicons:briefcase",
      },
      {
        childtitle: "CRM Dashboard",
        childlink: "crm",
        childicon: "ri:customer-service-2-fill",
      },
      {
        childtitle: "Banking Dashboard",
        childlink: "banking",
        childicon: "heroicons:wrench-screwdriver",
      },
    ],
  },
  {
    title: "App",
    icon: "heroicons-outline:chip",
    link: "/app/home",
    child: [
      {
        childtitle: "Calendar",
        childlink: "calender",
        childicon: "heroicons-outline:calendar",
      },
      {
        childtitle: "Kanban",
        childlink: "kanban",
        childicon: "heroicons-outline:view-boards",
      },
      {
        childtitle: "Todo",
        childlink: "todo",
        childicon: "heroicons-outline:clipboard-check",
      },
      {
        childtitle: "Projects",
        childlink: "projects",
        childicon: "heroicons-outline:document",
      },
    ],
  },
  {
    title: "Pages",
    icon: "heroicons-outline:view-boards",
    link: "/app/home",
    megamenu: [
      {
        megamenutitle: "Authentication",
        megamenuicon: "heroicons-outline:user",
        singleMegamenu: [
          {
            m_childtitle: "Signin One",
            m_childlink: "/",
          },
          {
            m_childtitle: "Signin Two",
            m_childlink: "/login2",
          },
          {
            m_childtitle: "Signin Three",
            m_childlink: "/login3",
          },
          {
            m_childtitle: "Signup One",
            m_childlink: "/register",
          },
          {
            m_childtitle: "Signup Two",
            m_childlink: "/register/register2",
          },
          {
            m_childtitle: "Signup Three",
            m_childlink: "/register/register3",
          },
          {
            m_childtitle: "Forget Password One",
            m_childlink: "/forgot-password",
          },
          {
            m_childtitle: "Forget Password Two",
            m_childlink: "/forgot-password2",
          },
          {
            m_childtitle: "Forget Password Three",
            m_childlink: "/forgot-password3",
          },
          {
            m_childtitle: "Lock Screen One",
            m_childlink: "/lock-screen",
          },
          {
            m_childtitle: "Lock Screen Two",
            m_childlink: "/lock-screen2",
          },
          {
            m_childtitle: "Lock Screen Three",
            m_childlink: "/lock-screen3",
          },
        ],
      },

      {
        megamenutitle: "Components",
        megamenuicon: "heroicons-outline:user",
        singleMegamenu: [
          {
            m_childtitle: "typography",
            m_childlink: "typography",
          },
          {
            m_childtitle: "colors",
            m_childlink: "colors",
          },
          {
            m_childtitle: "alert",
            m_childlink: "alert",
          },
          {
            m_childtitle: "button",
            m_childlink: "button",
          },
          {
            m_childtitle: "card",
            m_childlink: "card",
          },
          {
            m_childtitle: "carousel",
            m_childlink: "carousel",
          },
          {
            m_childtitle: "dropdown",
            m_childlink: "dropdown",
          },
          {
            m_childtitle: "image",
            m_childlink: "image",
          },
          {
            m_childtitle: "modal",
            m_childlink: "modal",
          },
          {
            m_childtitle: "Progress bar",
            m_childlink: "progress-bar",
          },
          {
            m_childtitle: "Placeholder",
            m_childlink: "placeholder",
          },

          {
            m_childtitle: "Tab & Accordion",
            m_childlink: "tab-accordion",
          },
        ],
      },
      {
        megamenutitle: "Forms",
        megamenuicon: "heroicons-outline:user",
        singleMegamenu: [
          {
            m_childtitle: "Input",
            m_childlink: "input",
          },
          {
            m_childtitle: "Input group",
            m_childlink: "input-group",
          },
          {
            m_childtitle: "Input layout",
            m_childlink: "input-layout",
          },
          {
            m_childtitle: "Form validation",
            m_childlink: "form-validation",
          },
          {
            m_childtitle: "Wizard",
            m_childlink: "form-wizard",
          },
          {
            m_childtitle: "Input mask",
            m_childlink: "input-mask",
          },
          {
            m_childtitle: "File input",
            m_childlink: "file-input",
          },
          {
            m_childtitle: "Form repeater",
            m_childlink: "form-repeater",
          },
          {
            m_childtitle: "Textarea",
            m_childlink: "textarea",
          },
          {
            m_childtitle: "Checkbox",
            m_childlink: "checkbox",
          },
          {
            m_childtitle: "Radio button",
            m_childlink: "radio-button",
          },
          {
            m_childtitle: "Switch",
            m_childlink: "switch",
          },
        ],
      },
      {
        megamenutitle: "Utility",
        megamenuicon: "heroicons-outline:user",
        singleMegamenu: [
          {
            m_childtitle: "Invoice",
            m_childlink: "invoice",
          },
          {
            m_childtitle: "Pricing",
            m_childlink: "pricing",
          },

          // {
          //   m_childtitle: "Testimonial",
          //   m_childlink: "testimonial",
          // },
          {
            m_childtitle: "FAQ",
            m_childlink: "faq",
          },
          {
            m_childtitle: "Blank page",
            m_childlink: "blank-page",
          },
          {
            m_childtitle: "Blog",
            m_childlink: "blog",
          },
          {
            m_childtitle: "404 page",
            m_childlink: "/404",
          },
          {
            m_childtitle: "Coming Soon",
            m_childlink: "/coming-soon",
          },
          {
            m_childtitle: "Under Maintanance page",
            m_childlink: "/under-construction",
          },
        ],
      },
    ],
  },

  {
    title: "Widgets",
    icon: "heroicons-outline:view-grid-add",
    link: "form-elements",
    child: [
      {
        childtitle: "Basic",
        childlink: "basic",
        childicon: "heroicons-outline:document-text",
      },
      {
        childtitle: "Statistic",
        childlink: "statistic",
        childicon: "heroicons-outline:document-text",
      },
    ],
  },

  {
    title: "Extra",
    icon: "heroicons-outline:template",

    child: [
      {
        childtitle: "Basic Table",
        childlink: "table-basic",
        childicon: "heroicons-outline:table",
      },
      {
        childtitle: "Advanced table",
        childlink: "table-advanced",
        childicon: "heroicons-outline:table",
      },
      {
        childtitle: "Apex chart",
        childlink: "appex-chart",
        childicon: "heroicons-outline:chart-bar",
      },
      {
        childtitle: "Chart js",
        childlink: "chartjs",
        childicon: "heroicons-outline:chart-bar",
      },
      {
        childtitle: "Map",
        childlink: "map",
        childicon: "heroicons-outline:map",
      },
    ],
  },
];

export const colors = {
  primary: "#4669FA",
  secondary: "#A0AEC0",
  danger: "#F1595C",
  black: "#111112",
  warning: "#FA916B",
  info: "#0CE7FA",
  light: "#425466",
  success: "#50C793",
  "gray-f7": "#F7F8FC",
  dark: "#1E293B",
  "dark-gray": "#0F172A",
  gray: "#68768A",
  gray2: "#EEF1F9",
  "dark-light": "#CBD5E1",
};

export const hexToRGB = (hex, alpha) => {
  var r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  } else {
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }
};
// import blackTshirt from "@/assets/images/e-commerce/product-card/black-t-shirt.png";
// import checkShirt from "@/assets/images/e-commerce/product-card/check-shirt.png";
// import grayJumper from "@/assets/images/e-commerce/product-card/gray-jumper.png";
// import grayTshirt from "@/assets/images/e-commerce/product-card/gray-t-shirt.png";
// import pinkBlazer from "@/assets/images/e-commerce/product-card/pink-blazer.png";
// import redTshirt from "@/assets/images/e-commerce/product-card/red-t-shirt.png";
// import yellowFrok from "@/assets/images/e-commerce/product-card/yellow-frok.png";
// import yellowJumper from "@/assets/images/e-commerce/product-card/yellow-jumper.png";

// export const products = [
//   {
//     img: blackJumper,
//     category: "men",
//     name: "Classical Black T-Shirt Classical Black T-Shirt",
//     subtitle: "The best cotton black branded shirt.",
//     desc: "The best cotton black branded shirt. The best cotton black branded shirt. The best cotton black branded shirt. The best cotton black branded shirt. The best cotton black branded shirt.",
//     rating: "4.8",
//     price: 489,
//     oldPrice: "$700",
//     percent: "40%",
//     brand: "apple",
//   },
//   {
//     img: blackTshirt,
//     category: "men",
//     name: "Classical Black T-Shirt",
//     subtitle: "The best cotton black branded shirt.",
//     desc: "The best cotton black branded shirt",
//     rating: "4.8",
//     price: 20,
//     oldPrice: "$700",
//     percent: "40%",
//     brand: "apex",
//   },
//   {
//     img: checkShirt,
//     category: "women",
//     name: "Classical Black T-Shirt",
//     subtitle: "The best cotton black branded shirt.",
//     desc: "The best cotton black branded shirt",
//     rating: "4.8",
//     price: 120,
//     oldPrice: "$700",
//     percent: "40%",
//     brand: "easy",
//   },
//   {
//     img: grayJumper,
//     category: "women",
//     name: "Classical Black T-Shirt",
//     subtitle: "The best cotton black branded shirt.",
//     desc: "The best cotton black branded shirt",
//     rating: "4.8",
//     price: 70,
//     oldPrice: "$700",
//     percent: "40%",
//     brand: "pixel",
//   },
//   {
//     img: grayTshirt,
//     category: "baby",
//     name: "Classical Black T-Shirt",
//     subtitle: "The best cotton black branded shirt.",
//     desc: "The best cotton black branded shirt",
//     rating: "4.8",
//     price: 30,
//     oldPrice: "$700",
//     percent: "40%",
//     brand: "apex",
//   },
//   {
//     img: pinkBlazer,
//     category: "women",
//     name: "Classical Black T-Shirt",
//     subtitle: "The best cotton black branded shirt.",
//     desc: "The best cotton black branded shirt",
//     rating: "4.8",
//     price: 40,
//     oldPrice: "$700",
//     percent: "40%",
//     brand: "apple",
//   },
//   {
//     img: redTshirt,
//     category: "women",
//     name: "Classical Black T-Shirt",
//     subtitle: "The best cotton black branded shirt.",
//     desc: "The best cotton black branded shirt",
//     rating: "4.8",
//     price: 90,
//     oldPrice: "$700",
//     percent: "40%",
//     brand: "easy",
//   },
//   {
//     img: yellowFrok,
//     category: "women",
//     name: "Classical Black T-Shirt",
//     subtitle: "The best cotton black branded shirt.",
//     desc: "The best cotton black branded shirt",
//     rating: "4.8",
//     price: 80,
//     oldPrice: "$700",
//     percent: "40%",
//     brand: "pixel",
//   },
//   {
//     img: yellowJumper,
//     category: "furniture",
//     name: "Classical Black T-Shirt",
//     subtitle: "The best cotton black branded shirt.",
//     desc: "The best cotton black branded shirt",
//     rating: "4.8",
//     price: 20,
//     oldPrice: "$700",
//     percent: "40%",
//     brand: "samsung",
//   },
// ];

// export const categories = [
//   { label: "All", value: "all", count: "9724" },
//   { label: "Men", value: "men", count: "1312" },
//   { label: "Women", value: "women", count: "3752" },
//   { label: "Child", value: "child", count: "985" },
//   { label: "Baby", value: "baby", count: "745" },
//   { label: "Footwear", value: "footwear", count: "1280" },
//   { label: "Furniture", value: "furniture", count: "820" },
//   { label: "Mobile", value: "mobile", count: "2460" },
// ];

// export const brands = [
//   { label: "Apple", value: "apple", count: "9724" },
//   { label: "Apex", value: "apex", count: "1312" },
//   { label: "Easy", value: "easy", count: "3752" },
//   { label: "Pixel", value: "pixel", count: "985" },
//   { label: "Samsung", value: "samsung", count: "2460" },
// ];

// export const price = [
//   {
//     label: "$0 - $199",
//     value: {
//       min: 0,
//       max: 199,
//     },
//     count: "9724",
//   },
//   {
//     label: "$200 - $449",
//     value: {
//       min: 200,
//       max: 499,
//     },
//     count: "1312",
//   },
//   {
//     label: "$450 - $599",
//     value: {
//       min: 450,
//       max: 599,
//     },
//     count: "3752",
//   },
//   {
//     label: "$600 - $799",
//     value: {
//       min: 600,
//       max: 799,
//     },
//     count: "985",
//   },
//   {
//     label: "$800 & Above",
//     value: {
//       min: 800,
//       max: 1000,
//     },
//     count: "745",
//   },
// ];

// export const ratings = [
//   { name: 5, value: 5, count: "9724" },
//   { name: 4, value: 4, count: "1312" },
//   { name: 3, value: 3, count: "3752" },
//   { name: 2, value: 2, count: "985" },
//   { name: 1, value: 1, count: "2460" },
// ];

// export const selectOptions = [
//   {
//     value: "option1",
//     label: "Option 1",
//   },
//   {
//     value: "option2",
//     label: "Option 2",
//   },
//   {
//     value: "option3",
//     label: "Option 3",
//   },
// ];
// export const selectCategory = [
//   {
//     value: "option1",
//     label: "Top Rated",
//   },
//   {
//     value: "option2",
//     label: "Option 2",
//   },
//   {
//     value: "option3",
//     label: "Option 3",
//   },
// ];

// import bkash from "@/assets/images/e-commerce/cart-icon/bkash.png";
// import fatoorah from "@/assets/images/e-commerce/cart-icon/fatoorah.png";
// import instamojo from "@/assets/images/e-commerce/cart-icon/instamojo.png";
// import iyzco from "@/assets/images/e-commerce/cart-icon/iyzco.png";
// import nagad from "@/assets/images/e-commerce/cart-icon/nagad.png";
// import ngenious from "@/assets/images/e-commerce/cart-icon/ngenious.png";
// import payfast from "@/assets/images/e-commerce/cart-icon/payfast.png";
// import payku from "@/assets/images/e-commerce/cart-icon/payku.png";
// import paypal from "@/assets/images/e-commerce/cart-icon/paypal.png";
// import paytm from "@/assets/images/e-commerce/cart-icon/paytm.png";
// import razorpay from "@/assets/images/e-commerce/cart-icon/razorpay.png";
// import ssl from "@/assets/images/e-commerce/cart-icon/ssl.png";
// import stripe from "@/assets/images/e-commerce/cart-icon/stripe.png";
// import truck from "@/assets/images/e-commerce/cart-icon/truck.png";
// import vougepay from "@/assets/images/e-commerce/cart-icon/vougepay.png";

// export const payments = [
//   {
//     img: bkash,
//     value: "bkash",
//   },
//   {
//     img: fatoorah,
//     value: "fatoorah",
//   },
//   {
//     img: instamojo,
//     value: "instamojo",
//   },
//   {
//     img: iyzco,
//     value: "iyzco",
//   },
//   {
//     img: nagad,
//     value: "nagad",
//   },
//   {
//     img: ngenious,
//     value: "ngenious",
//   },

//   {
//     img: payfast,
//     value: "payfast",
//   },
//   {
//     img: payku,
//     value: "payku",
//   },
//   {
//     img: paypal,
//     value: "paypal",
//   },
//   {
//     img: paytm,
//     value: "paytm",
//   },
//   {
//     img: razorpay,
//     value: "razorpay",
//   },
//   {
//     img: ssl,
//     value: "ssl",
//   },
//   {
//     img: stripe,
//     value: "stripe",
//   },
//   {
//     img: truck,
//     value: "truck",
//   },
//   {
//     img: vougepay,
//     value: "vougepay",
//   },
// ];

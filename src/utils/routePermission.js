import { menuItems } from "../constant/data.js";
import { getRoleHomePath, normalizeRole } from "./roleHome.js";

const normalizePath = (path) =>
  String(path || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

const parsePermissions = (rawPermissions) => {
  if (!rawPermissions) {
    return {};
  }

  if (typeof rawPermissions === "string") {
    try {
      const parsed = JSON.parse(rawPermissions);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  if (typeof rawPermissions === "object") {
    return rawPermissions;
  }

  return {};
};

const getPermissionKeysForNode = (node) => {
  const candidateKeys = [
    node?.permissionKey,
    node?.title,
    node?.childtitle,
  ].filter(Boolean);

  return candidateKeys.length ? candidateKeys[0] : null;
};

const buildRouteRules = (items, topPermission = null, depth = 0) => {
  const routes = [];

  for (const item of items || []) {
    const ownPermission = getPermissionKeysForNode(item);
    const currentTopPermission = topPermission || ownPermission;
    const link = normalizePath(item?.link || item?.childlink || "");

    if (link && link !== "#") {
      routes.push({
        path: link,
        required: Array.from(
          new Set(
            depth === 0
              ? [ownPermission].filter(Boolean)
              : [currentTopPermission, ownPermission].filter(Boolean)
          )
        ),
        parentPermissionKey: depth > 0 ? currentTopPermission : null,
        permissionKey: ownPermission || null,
        actions: ["read"],
        allowAsLanding: true,
      });
    }

    if (Array.isArray(item?.child) && item.child.length > 0) {
      routes.push(
        ...buildRouteRules(item.child, currentTopPermission, depth + 1)
      );
    }
  }

  return routes;
};

const EXTRA_ROUTE_RULES = [
  {
    path: "orders/order_lists/order_overview",
    required: ["Orders", "Lists"],
    parentPermissionKey: "Orders",
    permissionKey: "Lists",
    actions: ["read"],
    allowAsLanding: false,
    alternativePermissions: [
      { parentPermissionKey: "Report", permissionKey: "Unique QR Report", actions: ["read"] },
    ],
  },
  {
    path: "orders/order_pending/order_overview",
    required: ["Orders", "Pending"],
    parentPermissionKey: "Orders",
    permissionKey: "Pending",
    actions: ["read"],
    allowAsLanding: false,
  },
  {
    path: "orders/order_confirmed/order_overview",
    required: ["Orders", "Confirmed"],
    parentPermissionKey: "Orders",
    permissionKey: "Confirmed",
    actions: ["read"],
    allowAsLanding: false,
  },
  {
    path: "orders/order_overview/editTime",
    required: ["Orders", "Lists"],
    parentPermissionKey: "Orders",
    permissionKey: "Lists",
    actions: ["update"],
    allowAsLanding: false,
  },
  {
    path: "orders/order_overview/editStatus",
    required: ["Orders", "Lists"],
    parentPermissionKey: "Orders",
    permissionKey: "Lists",
    actions: ["update"],
    allowAsLanding: false,
  },
  {
    path: "orders/order_overview/trackinglink",
    required: ["Orders", "Lists"],
    parentPermissionKey: "Orders",
    permissionKey: "Lists",
    actions: ["update"],
    allowAsLanding: false,
  },
];

const ROUTE_RULES = [...buildRouteRules(menuItems), ...EXTRA_ROUTE_RULES].sort(
  (a, b) => b.path.length - a.path.length
);

const findSubItemPermission = (permissions, key) => {
  if (!permissions || typeof permissions !== "object" || !key) {
    return null;
  }

  for (const parentValue of Object.values(permissions)) {
    const subItems = parentValue?.subItems;
    if (subItems && typeof subItems === "object" && subItems[key]) {
      return subItems[key];
    }
  }

  return null;
};

const hasRead = (permissionNode) => {
  if (typeof permissionNode === "boolean") {
    return permissionNode;
  }
  if (
    permissionNode &&
    typeof permissionNode === "object" &&
    typeof permissionNode.read === "boolean"
  ) {
    return permissionNode.read;
  }
  return false;
};

const hasAnyAction = (permissionNode, actions = ["read"]) => {
  if (typeof permissionNode === "boolean") {
    return permissionNode;
  }

  if (permissionNode && typeof permissionNode === "object") {
    return actions.some((action) => permissionNode[action] === true);
  }

  return false;
};

export const hasReadPermission = (permissions, key) => {
  if (!key) return true;

  const direct = permissions?.[key];
  if (direct !== undefined) {
    return hasRead(direct);
  }

  return hasRead(findSubItemPermission(permissions, key));
};

export const getRequiredPermissionKeysForPath = (pathname) => {
  const path = normalizePath(pathname);
  if (!path) {
    return [];
  }

  for (const rule of ROUTE_RULES) {
    if (path === rule.path || path.startsWith(`${rule.path}/`)) {
      return rule.required;
    }
  }

  return null;
};

const getRouteRuleForPath = (pathname) => {
  const path = normalizePath(pathname);
  if (!path) {
    return null;
  }

  for (const rule of ROUTE_RULES) {
    if (path === rule.path || path.startsWith(`${rule.path}/`)) {
      return rule;
    }
  }

  return null;
};

export const getUserPermissionContext = (authUser) => {
  const userData = authUser?.user || authUser || {};
  return {
    role: normalizeRole(userData?.role),
    isAdmin: normalizeRole(userData?.role) === "admin",
    permissions: parsePermissions(userData?.user_permissions),
  };
};

const checkRulePermission = (permissions, { parentPermissionKey, permissionKey, required, actions = ["read"] }) => {
  if (parentPermissionKey) {
    if (!hasReadPermission(permissions, parentPermissionKey)) {
      return false;
    }

    if (permissionKey && permissionKey !== parentPermissionKey) {
      const parentSubItem = permissions?.[parentPermissionKey]?.subItems?.[permissionKey];
      if (parentSubItem !== undefined) {
        return hasAnyAction(parentSubItem, actions);
      }

      const direct = permissions?.[permissionKey];
      if (direct !== undefined) {
        return hasAnyAction(direct, actions);
      }

      return hasAnyAction(findSubItemPermission(permissions, permissionKey), actions);
    }

    return true;
  }

  return (required || []).every((key) => {
    const direct = permissions?.[key];
    if (direct !== undefined) {
      return hasAnyAction(direct, actions);
    }

    return hasAnyAction(findSubItemPermission(permissions, key), actions);
  });
};

export const canAccessPath = (pathname, userContext) => {
  if (userContext?.isAdmin) {
    return true;
  }

  const rule = getRouteRuleForPath(pathname);
  if (!rule) {
    return false;
  }

  const permissions = userContext.permissions || {};

  if (checkRulePermission(permissions, rule)) {
    return true;
  }

  // Check alternative permissions (e.g. QR Report users accessing order overview)
  if (Array.isArray(rule.alternativePermissions)) {
    return rule.alternativePermissions.some((alt) =>
      checkRulePermission(permissions, alt)
    );
  }

  return false;
};

export const resolveAccessibleFallbackPath = (pathname, userContext) => {
  const roleHomePath = getRoleHomePath(userContext?.role);
  if (canAccessPath(roleHomePath, userContext)) {
    if (normalizePath(roleHomePath) !== normalizePath(pathname)) {
      return roleHomePath;
    }
  }

  for (const rule of ROUTE_RULES) {
    if (rule.allowAsLanding === false) {
      continue;
    }
    const candidate = `/${rule.path}`;
    if (
      normalizePath(candidate) !== normalizePath(pathname) &&
      canAccessPath(candidate, userContext)
    ) {
      return candidate;
    }
  }

  return "/404";
};

export const resolveLoginRedirectPath = (requestedPath, userContext) => {
  if (canAccessPath("/dashboard", userContext)) {
    return "/dashboard";
  }

  if (requestedPath && canAccessPath(requestedPath, userContext)) {
    return requestedPath;
  }

  const roleHomePath = getRoleHomePath(userContext?.role);
  if (canAccessPath(roleHomePath, userContext)) {
    return roleHomePath;
  }

  return resolveAccessibleFallbackPath(requestedPath || "/dashboard", userContext);
};

export const __internal = {
  normalizePath,
  ROUTE_RULES,
  parsePermissions,
};

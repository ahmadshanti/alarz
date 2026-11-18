import type { Access, FieldAccess } from "payload";

type MaybeUser = { id: number | string; role?: string | null } | null | undefined;

export const isAdminUser = (user: MaybeUser) => user?.role === "admin";

/** Anyone (the public site reads content through the Local API, but REST stays open for reads). */
export const publicRead: Access = () => true;

/** Any logged-in admin or editor. */
export const loggedIn: Access = ({ req }) => Boolean(req.user);

export const adminOnly: Access = ({ req }) => isAdminUser(req.user as MaybeUser);

/** Admins: everything. Editors: only their own user document. */
export const adminOrSelf: Access = ({ req }) => {
  const user = req.user as MaybeUser;
  if (!user) return false;
  if (isAdminUser(user)) return true;
  return { id: { equals: user.id } };
};

export const adminFieldOnly: FieldAccess = ({ req }) => isAdminUser(req.user as MaybeUser);

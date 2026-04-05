const User = require("../models/User");

/**
 * Find the root owner of a user by tracing createdBy chain.
 */
const findRootOwner = async (userId) => {
  const user = await User.findById(userId).select("role createdBy");
  if (!user) return null;
  if (user.role === "owner") return user._id;
  if (!user.createdBy) return null;
  return findRootOwner(user.createdBy);
};

/**
 * Get all employee IDs in the same org as the given user.
 * - Traces up to root owner, then gets all employees under that owner.
 */
const getOrgEmployeeIds = async (userId) => {
  const user = await User.findById(userId).select("role createdBy orgOwner");
  if (!user) return [];

  let rootOwnerId;
  if (user.role === "owner") {
    rootOwnerId = user._id;
  } else {
    rootOwnerId = user.orgOwner || (await findRootOwner(userId));
  }
  if (!rootOwnerId) return [];

  // Get all users in this org (whose orgOwner = rootOwnerId OR who IS the owner)
  const orgUsers = await User.find({
    $or: [
      { orgOwner: rootOwnerId, role: "employee" },
      { _id: rootOwnerId, role: "owner" },
    ],
    role: "employee",
  }).select("_id");

  // Also get employees directly created by owner
  const direct = await User.find({ createdBy: rootOwnerId, role: "employee" }).select("_id");

  // Get managers under owner and their employees
  const managers = await User.find({ createdBy: rootOwnerId, role: "manager" }).select("_id");
  const indirect = managers.length > 0
    ? await User.find({ createdBy: { $in: managers.map(m=>m._id) }, role: "employee" }).select("_id")
    : [];

  const all = [...direct, ...indirect, ...orgUsers];
  const unique = [...new Map(all.map(u => [u._id.toString(), u._id])).values()];
  return unique;
};

/**
 * Get all employee IDs visible to the current manager/owner for scheduling.
 * - Owner: own employees + employees of their managers
 * - Manager: only their direct employees
 */
const getMyEmployeeIds = async (userId, userRole) => {
  if (userRole === "owner") {
    const direct = await User.find({ createdBy: userId, role: "employee" }).select("_id");
    const managers = await User.find({ createdBy: userId, role: "manager" }).select("_id");
    const indirect = managers.length > 0
      ? await User.find({ createdBy: { $in: managers.map(m=>m._id) }, role: "employee" }).select("_id")
      : [];
    const all = [...direct, ...indirect];
    return [...new Map(all.map(u => [u._id.toString(), u._id])).values()];
  }
  // Manager
  const direct = await User.find({ createdBy: userId, role: "employee" }).select("_id");
  return direct.map(u => u._id);
};

/**
 * Get all org user IDs (managers + employees) under current user.
 */
const getMyOrgUserIds = async (userId, userRole) => {
  const direct = await User.find({ createdBy: userId }).select("_id role");
  const directIds = direct.map(u => u._id);
  const mgrIds    = direct.filter(u => u.role === "manager").map(u => u._id);
  if (userRole !== "owner" || !mgrIds.length) return directIds;
  const indirect = await User.find({ createdBy: { $in: mgrIds } }).select("_id");
  return [...directIds, ...indirect.map(u=>u._id)];
};

module.exports = { getMyEmployeeIds, getMyOrgUserIds, getOrgEmployeeIds, findRootOwner };
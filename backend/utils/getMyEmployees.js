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

  const orgUsers  = await User.find({ orgOwner: rootOwnerId, role: "employee" }).select("_id");
  const direct    = await User.find({ createdBy: rootOwnerId, role: "employee" }).select("_id");
  const managers  = await User.find({ createdBy: rootOwnerId, role: "manager" }).select("_id");
  const indirect  = managers.length > 0
    ? await User.find({ createdBy: { $in: managers.map(m => m._id) }, role: "employee" }).select("_id")
    : [];

  const all    = [...direct, ...indirect, ...orgUsers];
  const unique = [...new Map(all.map(u => [u._id.toString(), u._id])).values()];
  return unique;
};

/**
 * Get all employee IDs a manager/owner can act on.
 *
 * Owner  → direct employees + all employees under their managers
 * Manager → their direct employees + employees created by their org owner
 *           (so manager can schedule/attend/tip anyone in the same org)
 */
const getMyEmployeeIds = async (userId, userRole) => {
  if (userRole === "owner") {
    const direct   = await User.find({ createdBy: userId, role: "employee" }).select("_id");
    const managers = await User.find({ createdBy: userId, role: "manager" }).select("_id");
    const indirect = managers.length > 0
      ? await User.find({ createdBy: { $in: managers.map(m => m._id) }, role: "employee" }).select("_id")
      : [];
    const all = [...direct, ...indirect];
    return [...new Map(all.map(u => [u._id.toString(), u._id])).values()];
  }

  // Manager: own employees + employees created by the org owner
  const mgr          = await User.findById(userId).select("orgOwner createdBy");
  const orgOwnerId   = mgr?.orgOwner || mgr?.createdBy;
  const myEmployees  = await User.find({ createdBy: userId, role: "employee" }).select("_id");
  const ownerEmpoyees = orgOwnerId
    ? await User.find({ createdBy: orgOwnerId, role: "employee" }).select("_id")
    : [];

  const all = [...myEmployees, ...ownerEmpoyees];
  return [...new Map(all.map(u => [u._id.toString(), u._id])).values()];
};

/**
 * Get all org user IDs (managers + employees) a manager/owner can act on.
 *
 * Owner   → everyone they created + those created by their managers
 * Manager → their own employees + org owner's employees
 */
const getMyOrgUserIds = async (userId, userRole) => {
  if (userRole === "owner") {
    const direct   = await User.find({ createdBy: userId }).select("_id role");
    const directIds = direct.map(u => u._id);
    const mgrIds    = direct.filter(u => u.role === "manager").map(u => u._id);
    if (!mgrIds.length) return directIds;
    const indirect  = await User.find({ createdBy: { $in: mgrIds } }).select("_id");
    return [...directIds, ...indirect.map(u => u._id)];
  }

  // Manager: own created users + org owner's employees
  const mgr           = await User.findById(userId).select("orgOwner createdBy");
  const orgOwnerId    = mgr?.orgOwner || mgr?.createdBy;
  const myCreated     = await User.find({ createdBy: userId }).select("_id");
  const ownerEmployees = orgOwnerId
    ? await User.find({ createdBy: orgOwnerId, role: "employee" }).select("_id")
    : [];

  const all = [...myCreated, ...ownerEmployees];
  return [...new Map(all.map(u => [u._id.toString(), u._id])).values()];
};

module.exports = { getMyEmployeeIds, getMyOrgUserIds, getOrgEmployeeIds, findRootOwner };

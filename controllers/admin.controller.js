const adminService = require("../services/admin.service");
const asyncHandler = require("../utils/asyncHandler");
const ResponseHandler = require("../utils/responseHandler");

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const result = await adminService.adminLogin(email, password);
  return ResponseHandler.success(res, result, "Admin login successful", 200);
});

module.exports = { adminLogin };
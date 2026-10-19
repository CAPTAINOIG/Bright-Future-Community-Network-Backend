const dashboardService = require('../services/dashboard.service');
const logger = require('../utils/logger');
const ResponseHandler = require('../utils/responseHandler');

const DashboardController = async (req, res) => {
const result = await dashboardService.getDashboardOverview();
return ResponseHandler.success(res, result, 'Dashboard overview retrieved successfully');
}
module.exports = DashboardController;

const AdminLog = require('../models/AdminLog');

// @desc Get all admin logs
// @route GET /api/admin-logs
// @access Private (Admin)
exports.getAdminLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const { search } = req.query;

    let query = {};
    if (search) {
      query = {
        $or: [
          { adminEmail: { $regex: search, $options: 'i' } },
          { adminName: { $regex: search, $options: 'i' } },
          { command: { $regex: search, $options: 'i' } },
          { action: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const total = await AdminLog.countDocuments(query);
    const logs = await AdminLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: logs.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
